/**
 * Property-based tests for resource-import.js
 * Feature: learning-resource-library
 */

const fc = require('fast-check');
const { buildSummary, buildCompositeKey, buildDbRecord } = require('../../scripts/resource-import');

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const RESOURCE_TYPES = [
  'grammar_rule', 'vocabulary', 'ielts_tip', 'toeic_tip',
  'reference', 'example', 'template', 'article',
];
const SKILLS = [
  'reading', 'listening', 'writing', 'speaking',
  'vocabulary', 'grammar', 'general',
];
const EXAM_TYPES = ['IELTS', 'TOEIC', 'general'];

/** Arbitrary for a valid Resource_JSON object */
const validResourceArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }),
  language: fc.constantFrom('en', 'vi', 'both'),
  content: fc.record({
    en: fc.string({ minLength: 1, maxLength: 5000 }),
    vi: fc.oneof(fc.string({ minLength: 0, maxLength: 5000 }), fc.constant(null)),
  }),
  taxonomy: fc.record({
    resource_type: fc.constantFrom(...RESOURCE_TYPES),
    skill: fc.constantFrom(...SKILLS),
    exam_type: fc.constantFrom(...EXAM_TYPES),
    level: fc.oneof(fc.string({ minLength: 1, maxLength: 50 }), fc.constant(null)),
    topic: fc.oneof(fc.string({ minLength: 1, maxLength: 100 }), fc.constant(null)),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 20 }),
  }),
  summary: fc.oneof(fc.string({ minLength: 1, maxLength: 1000 }), fc.constant(null)),
  metadata: fc.oneof(
    fc.record({
      source: fc.string({ minLength: 0, maxLength: 100 }),
      author: fc.string({ minLength: 0, maxLength: 100 }),
    }),
    fc.constant(null)
  ),
});

// ─── P4: Import idempotence ───────────────────────────────────────────────────

// Feature: learning-resource-library, Property 4: Import idempotence
describe('P4: Import idempotence', () => {
  /**
   * Validates: Requirements 3.1, 3.2
   *
   * The composite key (title + resource_type + skill) must be deterministic:
   * given the same Resource_JSON, buildCompositeKey always returns the same key.
   * This guarantees that findOrCreate will find the existing record on the second
   * import, preventing duplicates.
   */
  test('same Resource_JSON always produces the same composite key', () => {
    fc.assert(
      fc.property(validResourceArb, (resource) => {
        const key1 = buildCompositeKey(resource);
        const key2 = buildCompositeKey(resource);

        return (
          key1.title === key2.title &&
          key1.resource_type === key2.resource_type &&
          key1.skill === key2.skill
        );
      }),
      { numRuns: 100 }
    );
  });

  test('composite key contains title, resource_type, and skill from taxonomy', () => {
    fc.assert(
      fc.property(validResourceArb, (resource) => {
        const key = buildCompositeKey(resource);

        return (
          key.title === resource.title &&
          key.resource_type === resource.taxonomy.resource_type &&
          key.skill === resource.taxonomy.skill
        );
      }),
      { numRuns: 100 }
    );
  });

  test('same Resource_JSON always produces the same DB record (deterministic mapping)', () => {
    fc.assert(
      fc.property(validResourceArb, (resource) => {
        const rec1 = buildDbRecord(resource);
        const rec2 = buildDbRecord(resource);

        return (
          rec1.title === rec2.title &&
          rec1.content === rec2.content &&
          rec1.resource_type === rec2.resource_type &&
          rec1.skill === rec2.skill &&
          rec1.exam_type === rec2.exam_type
        );
      }),
      { numRuns: 100 }
    );
  });
});

// ─── P6: Auto-summary length constraint ──────────────────────────────────────

// Feature: learning-resource-library, Property 6: Auto-summary length constraint
describe('P6: Auto-summary length constraint', () => {
  /**
   * Validates: Requirements 8.3
   *
   * When summary is null/absent, buildSummary generates one from content.en.
   * The generated summary must be at most 500 characters.
   */
  test('auto-generated summary is at most 500 chars for any content.en', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (contentEn) => {
          const summary = buildSummary(null, { en: contentEn });
          return summary !== null && summary.length <= 500;
        }
      ),
      { numRuns: 200 }
    );
  });

  test('auto-generated summary is a prefix of content.en', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (contentEn) => {
          const summary = buildSummary(null, { en: contentEn });
          return contentEn.startsWith(summary);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('when content.en is <= 500 chars, summary equals content.en exactly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        (contentEn) => {
          const summary = buildSummary(null, { en: contentEn });
          return summary === contentEn;
        }
      ),
      { numRuns: 200 }
    );
  });

  test('when content.en is > 500 chars, summary is exactly 500 chars', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 2000 }),
        (contentEn) => {
          const summary = buildSummary(null, { en: contentEn });
          return summary.length === 500;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('existing summary is preserved unchanged (not overwritten)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 1000 }),
        fc.string({ minLength: 1 }),
        (existingSummary, contentEn) => {
          const result = buildSummary(existingSummary, { en: contentEn });
          return result === existingSummary;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('auto-summary via buildDbRecord is at most 500 chars', () => {
    fc.assert(
      fc.property(
        validResourceArb.map(r => ({ ...r, summary: null })),
        (resource) => {
          const rec = buildDbRecord(resource);
          return rec.summary === null || rec.summary.length <= 500;
        }
      ),
      { numRuns: 100 }
    );
  });
});
