/**
 * Resource JSON Schema Validation Module
 * Feature: learning-resource-library
 */

const RESOURCE_TYPES = [
  'grammar_rule',
  'vocabulary',
  'ielts_tip',
  'toeic_tip',
  'reference',
  'example',
  'template',
  'article',
];

const SKILLS = [
  'reading',
  'listening',
  'writing',
  'speaking',
  'vocabulary',
  'grammar',
  'general',
];

const EXAM_TYPES = ['IELTS', 'TOEIC', 'general'];

/**
 * Validates a Resource JSON object.
 * @param {object} obj - The resource object to validate
 * @returns {{ valid: true } | { valid: false, errors: string[] }}
 */
function validateResourceJSON(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['resource must be an object'] };
  }

  // Required field: title (string)
  if (obj.title === undefined || obj.title === null) {
    errors.push('title is required');
  } else if (typeof obj.title !== 'string') {
    errors.push('title must be a string');
  }

  // Required field: resource_type (enum)
  if (obj.resource_type === undefined || obj.resource_type === null) {
    errors.push('resource_type is required');
  } else if (!RESOURCE_TYPES.includes(obj.resource_type)) {
    errors.push(`resource_type must be one of: ${RESOURCE_TYPES.join(', ')}`);
  }

  // Required field: skill (enum)
  if (obj.skill === undefined || obj.skill === null) {
    errors.push('skill is required');
  } else if (!SKILLS.includes(obj.skill)) {
    errors.push(`skill must be one of: ${SKILLS.join(', ')}`);
  }

  // Required field: language (string)
  if (obj.language === undefined || obj.language === null) {
    errors.push('language is required');
  } else if (typeof obj.language !== 'string') {
    errors.push('language must be a string');
  }

  // Required field: content (object with bilingual structure)
  if (obj.content === undefined || obj.content === null) {
    errors.push('content is required');
  } else if (typeof obj.content !== 'object' || Array.isArray(obj.content)) {
    errors.push('content must be an object');
  } else {
    // content.en must be a non-empty string
    if (obj.content.en === undefined || obj.content.en === null) {
      errors.push('content.en is required');
    } else if (typeof obj.content.en !== 'string') {
      errors.push('content.en must be a string');
    } else if (obj.content.en.trim() === '') {
      errors.push('content.en must not be empty');
    }

    // content.vi must be string or null
    if (obj.content.vi !== undefined && obj.content.vi !== null && typeof obj.content.vi !== 'string') {
      errors.push('content.vi must be a string or null');
    }
  }

  // Optional taxonomy validation
  if (obj.taxonomy !== undefined && obj.taxonomy !== null) {
    if (typeof obj.taxonomy !== 'object' || Array.isArray(obj.taxonomy)) {
      errors.push('taxonomy must be an object');
    } else {
      // taxonomy.exam_type (enum, if present)
      if (obj.taxonomy.exam_type !== undefined && obj.taxonomy.exam_type !== null) {
        if (!EXAM_TYPES.includes(obj.taxonomy.exam_type)) {
          errors.push(`taxonomy.exam_type must be one of: ${EXAM_TYPES.join(', ')}`);
        }
      }

      // taxonomy.resource_type (enum, if present)
      if (obj.taxonomy.resource_type !== undefined && obj.taxonomy.resource_type !== null) {
        if (!RESOURCE_TYPES.includes(obj.taxonomy.resource_type)) {
          errors.push(`taxonomy.resource_type must be one of: ${RESOURCE_TYPES.join(', ')}`);
        }
      }

      // taxonomy.skill (enum, if present)
      if (obj.taxonomy.skill !== undefined && obj.taxonomy.skill !== null) {
        if (!SKILLS.includes(obj.taxonomy.skill)) {
          errors.push(`taxonomy.skill must be one of: ${SKILLS.join(', ')}`);
        }
      }

      // taxonomy.tags max 20 elements
      if (obj.taxonomy.tags !== undefined && obj.taxonomy.tags !== null) {
        if (!Array.isArray(obj.taxonomy.tags)) {
          errors.push('taxonomy.tags must be an array');
        } else if (obj.taxonomy.tags.length > 20) {
          errors.push('taxonomy.tags must have at most 20 elements');
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

module.exports = { RESOURCE_TYPES, SKILLS, EXAM_TYPES, validateResourceJSON };
