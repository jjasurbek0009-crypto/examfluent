/**
 * TALAFFUZNI BAHOLASH.
 *
 * Web Speech API mikrofondagi ovozni MATNGA aylantiradi. Biz esa
 * o'sha matnni asl jumla bilan solishtiramiz.
 *
 * Mantiq: agar tanigich (recognizer) so'zni to'g'ri eshitgan bo'lsa —
 * demak siz uni tushunarli talaffuz qilgansiz. Eshitmagan bo'lsa —
 * o'sha so'z ustida ishlash kerak.
 *
 * Bu professional fonetik tahlil emas (u pullik xizmat talab qiladi),
 * lekin amaliy foyda beradi va MUTLAQO BEPUL.
 */

/** So'zni solishtirishga tayyorlaydi: kichik harf, tinish belgilarisiz */
function normalise(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z']/g, "")
    .replace(/^'+|'+$/g, "");
}

export function toWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalise)
    .filter((w) => w.length > 0);
}

export interface WordResult {
  word: string;
  matched: boolean;
}

export interface ComparisonResult {
  /** 0-100 % */
  accuracy: number;
  /** Har bir so'z to'g'ri eshitildimi */
  words: WordResult[];
  /** Noto'g'ri eshitilgan so'zlar (asl ko'rinishida) */
  problemWords: string[];
}

/**
 * Asl jumla va eshitilgan matnni solishtiradi.
 *
 * LCS (Longest Common Subsequence) usuli ishlatiladi — u so'z tushib
 * qolganda ham qolganlarini to'g'ri moslashtiradi. Oddiy "indeks bo'yicha
 * solishtirish" esa bitta so'z tushsa, undan keyingi hammasini
 * "xato" deb belgilab yuborardi.
 */
export function comparePronunciation(target: string, transcript: string): ComparisonResult {
  const targetRaw = target.split(/\s+/).filter((w) => normalise(w).length > 0);
  const targetWords = toWords(target);
  const heardWords = toWords(transcript);

  if (targetWords.length === 0) {
    return { accuracy: 0, words: [], problemWords: [] };
  }

  // ---- LCS jadvalini quramiz ----
  const n = targetWords.length;
  const m = heardWords.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] =
        targetWords[i - 1] === heardWords[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // ---- Orqaga qaytib, qaysi so'zlar mos kelganini aniqlaymiz ----
  const matchedIndices = new Set<number>();
  let i = n;
  let j = m;

  while (i > 0 && j > 0) {
    if (targetWords[i - 1] === heardWords[j - 1]) {
      matchedIndices.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const words: WordResult[] = targetWords.map((_, index) => ({
    // Asl ko'rinishini ko'rsatamiz (bosh harflar va tinish belgilari bilan)
    word: targetRaw[index] ?? targetWords[index],
    matched: matchedIndices.has(index),
  }));

  const problemWords = words.filter((w) => !w.matched).map((w) => w.word);
  const accuracy = Math.round((matchedIndices.size / targetWords.length) * 100);

  return { accuracy, words, problemWords };
}

/** Ballga qarab qisqa xulosa rangi */
export function accuracyTone(accuracy: number): "good" | "ok" | "poor" {
  if (accuracy >= 85) return "good";
  if (accuracy >= 60) return "ok";
  return "poor";
}
