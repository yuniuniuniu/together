const CJK_CHAR_REGEX = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const NON_CJK_WORD_REGEX = /[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu;

export function countWords(text: string): number {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return 0;
  }

  const cjkCount = normalizedText.match(CJK_CHAR_REGEX)?.length ?? 0;
  const nonCjkText = normalizedText.replace(CJK_CHAR_REGEX, ' ');
  const nonCjkCount = nonCjkText.match(NON_CJK_WORD_REGEX)?.length ?? 0;

  return cjkCount + nonCjkCount;
}
