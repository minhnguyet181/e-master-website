const {
  stripEmbeddedPromoFooters,
  sanitizeBilingualContent,
  sanitizeStoredContentField,
} = require('../utils/strip-resource-promo');

describe('strip-resource-promo', () => {
  test('removes trailing IELTS Fighter contact block', () => {
    const body = `Task 2 introduction tips.\n\nParaphrase the question.\n\nIELTS Fighter – Tiên phong phổ cập IELTS cho người Việt\nWebsite: ielts-fighter.com | Hotline: 0903 411 666\nFanpage: www.facebook.com/ielts.fighter/\nGroup: www.facebook.com/groups/ieltsfighter.support/`;
    const out = stripEmbeddedPromoFooters(body);
    expect(out).not.toMatch(/IELTS Fighter/i);
    expect(out).not.toMatch(/ielts-fighter/i);
    expect(out).toMatch(/Paraphrase/);
  });

  test('sanitizeStoredContentField parses JSON content', () => {
    const raw = JSON.stringify({
      en: 'Hello\n\nIELTS Fighter – test\nWebsite: ielts-fighter.com',
      vi: null,
    });
    const s = sanitizeStoredContentField(raw);
    const o = JSON.parse(s);
    expect(o.en).not.toMatch(/IELTS Fighter/);
  });

  test('sanitizeBilingualContent strips both languages', () => {
    const o = sanitizeBilingualContent({
      en: 'A\n\nIELTS Fighter – x',
      vi: 'B\n\nIELTS Fighter – y',
    });
    expect(o.en).not.toMatch(/IELTS Fighter/);
    expect(o.vi).not.toMatch(/IELTS Fighter/);
  });
});
