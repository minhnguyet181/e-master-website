/**
 * Property-based tests for pdf-to-resource.js
 * Feature: learning-resource-library
 */

const fc = require('fast-check');
const { splitIntoChunks, CHUNK_SIZE } = require('../../scripts/pdf-to-resource');

// Feature: learning-resource-library, Property 18: Chunking threshold
describe('P18: Chunking threshold', () => {
  // For any PDF text longer than CHUNK_SIZE chars, parser splits into at least 2 chunks
  test('text longer than CHUNK_SIZE is split into at least 2 chunks', () => {
    fc.assert(
      fc.property(
        // Generate strings longer than CHUNK_SIZE (28000 chars)
        fc.string({ minLength: CHUNK_SIZE + 1, maxLength: CHUNK_SIZE * 3 }),
        (longText) => {
          const chunks = splitIntoChunks(longText);
          return chunks.length >= 2;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('text at or below CHUNK_SIZE produces exactly 1 chunk', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: CHUNK_SIZE }),
        (shortText) => {
          const chunks = splitIntoChunks(shortText);
          return chunks.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('chunks cover the full original text without data loss', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: CHUNK_SIZE + 1, maxLength: CHUNK_SIZE * 3 }),
        (longText) => {
          const chunks = splitIntoChunks(longText);
          return chunks.join('') === longText;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('each chunk is at most CHUNK_SIZE characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: CHUNK_SIZE * 4 }),
        (text) => {
          const chunks = splitIntoChunks(text);
          return chunks.every(c => c.length <= CHUNK_SIZE);
        }
      ),
      { numRuns: 100 }
    );
  });
});
