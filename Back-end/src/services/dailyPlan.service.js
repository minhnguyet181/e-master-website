// src/services/dailyPlan.service.js
const UserDailyPlan = require('../models/userDailyPlan.model');
const WeeklyProgress = require('../models/weeklyProgress.model');
const User = require('../models/user.model');
const TestService = require('./test.service');
const ResourceService = require('./resource.service');

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function pickSkillForToday(dayIndex) {
  // deterministic rotation: Mon..Sun
  const skills = ['reading', 'listening', 'writing', 'speaking', 'reading', 'listening', 'writing'];
  return skills[dayIndex % skills.length] || 'reading';
}

async function buildTasksForUser(userId) {
  const user = await User.findByPk(userId);
  const now = new Date();
  const dayIndex = (now.getDay() + 6) % 7; // Monday=0
  const skill = pickSkillForToday(dayIndex);

  const tests = await TestService.getTestsByType(skill);
  const test = tests?.[0] || null;

  let resource = null;
  try {
    const r = await ResourceService.getResourcesForUser(
      userId,
      { useTargetBand: true },
      { page: 1, limit: 1, sortBy: 'featured' }
    );
    resource = r?.resources?.[0] || null;
  } catch {
    // ignore
  }

  // Light personalization: if user has tests_done this week, encourage weakest follow-up.
  let focusHint = '';
  try {
    const week = now.getFullYear(); // dummy to reduce full scan; we'll just read latest weekly_progress row
    // WeeklyProgress has week_number; easiest is pick most recent row.
    const latest = await WeeklyProgress.findOne({ where: { user_id: userId }, order: [['week_number', 'DESC']] });
    const done = latest?.tests_done || [];
    if (Array.isArray(done) && done.length) {
      const last = done[done.length - 1];
      if (last?.score != null) {
        focusHint = `Based on your last attempt score (${Number(last.score).toFixed(1)}), keep your daily practice short and consistent.`;
      }
    }
  } catch {
    // ignore
  }

  const tasks = [
    {
      id: 'practice_test',
      type: 'practice_test',
      skill,
      title: test ? `Practice ${skill} test: ${test.name || `Test #${test.id}`}` : `Practice ${skill} (test not available)`,
      test_id: test?.id || null,
      est_minutes: skill === 'speaking' ? 15 : skill === 'listening' ? 30 : 45,
    },
    {
      id: 'resource',
      type: 'resource',
      title: resource ? `Study resource: ${resource.title}` : 'Study a resource (no resource available)',
      resource_id: resource?.id || null,
      est_minutes: 10,
    },
    {
      id: 'ai_checkin',
      type: 'ai_checkin',
      title: 'Ask AI Coach for a 3-step improvement plan',
      prompt_suggestion: user?.goal
        ? `My goal is "${user.goal}". In 3 steps, what should I do today to improve ${skill}?`
        : `In 3 steps, what should I do today to improve ${skill}?`,
      est_minutes: 5,
      note: focusHint || null,
    },
  ];

  return tasks;
}

async function getOrCreateTodayPlan(userId) {
  const today = isoDate();
  let row = await UserDailyPlan.findOne({ where: { user_id: userId, plan_date: today } });
  if (row) return row;

  const tasks = await buildTasksForUser(userId);
  row = await UserDailyPlan.create({
    user_id: userId,
    plan_date: today,
    tasks,
    completed_task_ids: [],
    is_completed: false,
    completed_at: null,
  });
  return row;
}

function normalizeCompletedIds(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [];
}

async function completeTask(userId, planDate, taskId) {
  const date = planDate || isoDate();
  const row = await UserDailyPlan.findOne({ where: { user_id: userId, plan_date: date } });
  if (!row) throw new Error('Daily plan not found');

  const tasks = Array.isArray(row.tasks) ? row.tasks : [];
  const exists = tasks.some((t) => t?.id === taskId);
  if (!exists) throw new Error('Task not found in daily plan');

  const completed = new Set(normalizeCompletedIds(row.completed_task_ids));
  completed.add(taskId);

  const allDone = tasks.length > 0 && tasks.every((t) => completed.has(t.id));
  row.completed_task_ids = Array.from(completed);
  if (allDone && !row.is_completed) {
    row.is_completed = true;
    row.completed_at = new Date();
  }
  await row.save();
  return row;
}

async function getStreakSummary(userId) {
  const rows = await UserDailyPlan.findAll({
    where: { user_id: userId },
    order: [['plan_date', 'DESC']],
    limit: 120,
  });

  const completedDates = new Set(
    rows.filter((r) => r.is_completed).map((r) => String(r.plan_date))
  );

  // current streak: consecutive days ending today
  let current = 0;
  let d = new Date();
  for (let i = 0; i < 120; i += 1) {
    const key = isoDate(d);
    if (!completedDates.has(key)) break;
    current += 1;
    d.setDate(d.getDate() - 1);
  }

  // best streak within window
  const sorted = Array.from(completedDates).sort(); // asc
  let best = 0;
  let run = 0;
  let prev = null;
  for (const dateStr of sorted) {
    if (!prev) {
      run = 1;
    } else {
      const a = new Date(prev);
      const b = new Date(dateStr);
      a.setDate(a.getDate() + 1);
      run = isoDate(a) === isoDate(b) ? run + 1 : 1;
    }
    best = Math.max(best, run);
    prev = dateStr;
  }

  return { current_streak: current, best_streak: best };
}

module.exports = {
  getOrCreateTodayPlan,
  completeTask,
  getStreakSummary,
};

