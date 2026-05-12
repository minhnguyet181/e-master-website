const { Op } = require('sequelize');
const User = require('../models/user.model');
const TestAttempt = require('../models/testAttempt.model');
const WeeklyProgress = require('../models/weeklyProgress.model');
const Resource = require('../models/resource.model');

function parseBandNumber(value) {
  if (value === null || value === undefined) return null;
  const match = String(value).match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  return Number(match[1]);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function avg(items) {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + item, 0) / items.length;
}

function getTrend(attempts) {
  if (attempts.length < 4) return 0;
  const sorted = [...attempts].sort((a, b) => new Date(a.graded_at) - new Date(b.graded_at));
  const split = Math.floor(sorted.length / 2);
  const older = sorted.slice(0, split).map((a) => Number(a.score_numeric || 0));
  const newer = sorted.slice(split).map((a) => Number(a.score_numeric || 0));
  return avg(newer) - avg(older);
}

function toBandFromScore(score, testType) {
  const normalized = clamp(Number(score || 0), 0, 1);
  if (testType === 'writing' || testType === 'speaking') {
    return clamp(normalized, 0, 9);
  }
  return clamp(normalized * 9, 0, 9);
}

async function buildSkillRecommendations(weakSkills) {
  if (!weakSkills.length) return [];
  const resources = await Resource.findAll({
    where: {
      is_active: true,
      skill: { [Op.in]: weakSkills },
    },
    order: [['is_featured', 'DESC'], ['view_count', 'DESC'], ['created_at', 'DESC']],
    limit: 8,
  });

  const grouped = new Map();
  for (const skill of weakSkills) grouped.set(skill, []);
  for (const resource of resources) {
    if (!grouped.has(resource.skill)) continue;
    if (grouped.get(resource.skill).length >= 2) continue;
    grouped.get(resource.skill).push({
      id: resource.id,
      title: resource.title,
      skill: resource.skill,
      type: resource.resource_type,
    });
  }

  return weakSkills.map((skill) => ({
    skill,
    resources: grouped.get(skill) || [],
  }));
}

async function getCopilotInsights(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const attempts = await TestAttempt.findAll({
    where: {
      user_id: userId,
      status: 'graded',
      score_numeric: { [Op.ne]: null },
    },
    order: [['graded_at', 'DESC']],
    limit: 40,
  });

  const bySkill = {
    reading: [],
    listening: [],
    writing: [],
    speaking: [],
  };
  for (const attempt of attempts) {
    if (!bySkill[attempt.test_type]) continue;
    bySkill[attempt.test_type].push(attempt);
  }

  const skillSummary = Object.entries(bySkill).map(([skill, skillAttempts]) => {
    const scores = skillAttempts.map((a) => Number(a.score_numeric || 0));
    const scoreAvg = avg(scores);
    const band = toBandFromScore(scoreAvg, skill);
    const trend = getTrend(skillAttempts);
    return {
      skill,
      attempts: skillAttempts.length,
      estimated_band: Number(band.toFixed(2)),
      trend: Number(trend.toFixed(3)),
    };
  });

  const validBands = skillSummary.filter((s) => s.attempts > 0).map((s) => s.estimated_band);
  const estimatedOverallBand = validBands.length ? Number(avg(validBands).toFixed(2)) : 0;
  const targetBand = parseBandNumber(user.band_target);
  const currentBand = parseBandNumber(user.current_band);

  const weeklyRows = await WeeklyProgress.findAll({
    where: { user_id: userId },
    order: [['week_number', 'DESC']],
    limit: 4,
  });
  const completionRate = weeklyRows.length
    ? Number((avg(weeklyRows.map((r) => Number(r.completion_rate || 0))) * 100).toFixed(1))
    : 0;

  const bandGap = targetBand ? Number((targetBand - estimatedOverallBand).toFixed(2)) : null;
  const riskLevel = bandGap === null
    ? 'unknown'
    : bandGap <= 0.3
      ? 'low'
      : bandGap <= 1
        ? 'medium'
        : 'high';

  const weakSkills = skillSummary
    .filter((s) => s.attempts > 0)
    .sort((a, b) => a.estimated_band - b.estimated_band)
    .slice(0, 2)
    .map((s) => s.skill);
  const recommendations = await buildSkillRecommendations(weakSkills);

  const nextActions = [];
  for (const rec of recommendations) {
    nextActions.push({
      type: 'targeted_practice',
      priority: 'high',
      skill: rec.skill,
      message: `Focus 30-45 minutes on ${rec.skill} with curated resources and one mini test.`,
      resources: rec.resources,
    });
  }
  nextActions.push({
    type: 'consistency',
    priority: completionRate < 60 ? 'high' : 'medium',
    message: `Your 4-week completion consistency is ${completionRate}%. Keep it above 70% for faster band growth.`,
  });

  const projectedBand2Weeks = Number((estimatedOverallBand + 0.1 + (completionRate / 100) * 0.15).toFixed(2));
  const projectedBand4Weeks = Number((estimatedOverallBand + 0.2 + (completionRate / 100) * 0.3).toFixed(2));
  const projectedBand8Weeks = Number((estimatedOverallBand + 0.35 + (completionRate / 100) * 0.55).toFixed(2));

  return {
    success: true,
    profile: {
      user_id: user.id,
      current_band: currentBand,
      target_band: targetBand,
      study_hours_per_day: user.study_hours_per_day || null,
    },
    forecast: {
      estimated_overall_band: estimatedOverallBand,
      projected_band_2w: clamp(projectedBand2Weeks, 0, 9),
      projected_band_4w: clamp(projectedBand4Weeks, 0, 9),
      projected_band_8w: clamp(projectedBand8Weeks, 0, 9),
      confidence: attempts.length >= 16 ? 'high' : attempts.length >= 8 ? 'medium' : 'low',
      risk_level: riskLevel,
      band_gap: bandGap,
    },
    skill_summary: skillSummary,
    engagement: {
      completion_rate_4w: completionRate,
      weeks_tracked: weeklyRows.length,
    },
    next_actions: nextActions,
    generated_at: new Date().toISOString(),
  };
}

module.exports = {
  getCopilotInsights,
};
