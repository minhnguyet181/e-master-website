// src/utils/studyPlanUtils.js
/**
 * Lightweight input validation for study plan requests
 */
function validatePlanInput(body) {
  const { learningGoal, currentBand, targetBand, dailyHours, purpose } = body || {};
  const errors = [];
  if (!learningGoal || typeof learningGoal !== 'string') errors.push('learningGoal is required');
  if (currentBand && typeof currentBand !== 'string') errors.push('currentBand must be a string');
  if (targetBand && typeof targetBand !== 'string') errors.push('targetBand must be a string');
  if (dailyHours && typeof dailyHours !== 'number') errors.push('dailyHours must be a number');
  if (purpose && typeof purpose !== 'string') errors.push('purpose must be a string');
  return { valid: errors.length === 0, errors };
}

/**
 * Build a prompt for the AI to generate a study plan
 */
function buildAIPrompt(data) {
  const {
    learningGoal = 'improve English',
    currentBand = 'unknown',
    targetBand = 'unknown',
    dailyHours = 1,
    purpose = ''
  } = data || {};

  return `You are an expert language teacher. Create a structured study plan as JSON only.\n
Return an object with keys: summary, duration_weeks, weekly_plan (array of weeks with goals, skills_focus, resources, assignments), recommended_materials.\n
User details:\n- Learning goal: ${learningGoal}\n- Current band: ${currentBand}\n- Target band: ${targetBand}\n- Daily study hours: ${dailyHours}\n- Purpose: ${purpose}\n\n+Return valid JSON only, no explanation.`;
}

/**
 * Given a numeric band (e.g., 5.5) return a bucket string e.g. "3.0-5.0", "5.0-7.0"
 */
function getBandBucket(bandNumber) {
  const b = parseFloat(bandNumber);
  if (isNaN(b)) return null;
  if (b <= 5.0) return '3.0-5.0';
  if (b <= 7.0) return '5.0-7.0';
  return '7.0+';
}

/**
 * Return a representative band number for a bucket to use for DB filtering (midpoint)
 */
function representativeBandForBucket(bucket) {
  if (!bucket) return null;
  if (bucket === '3.0-5.0') return 4.0;
  if (bucket === '5.0-7.0') return 6.0;
  if (bucket === '7.0+') return 8.0;
  // If given a number-like string, try parse
  const n = parseFloat(bucket);
  return isNaN(n) ? null : n;
}

module.exports = {
  validatePlanInput,
  buildAIPrompt,
  getBandBucket,
  representativeBandForBucket
};

