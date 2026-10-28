export type HideStyle = "all" | "alternate" | "first" | "letters";

export const HIDE_STYLES: readonly HideStyle[] = [
  "all",
  "alternate",
  "first",
  "letters",
];

export interface HiddenWord {
  word: string;
  hidden: boolean;
  /** First letter (with its marks) shown as a hint in "letters" style. */
  hint?: string;
}

const FIRST_LETTER = /^[\u0621-\u064A\u0671-\u06D3][\u064B-\u065F\u0670\u06D6-\u06ED]*/;

export function firstLetterOf(word: string): string {
  return FIRST_LETTER.exec(word)?.[0] ?? word.slice(0, 1);
}

export function splitVerse(verse: string): string[] {
  return verse.split(" ").filter((word) => word.length > 0);
}

export function applyHideStyle(verse: string, style: HideStyle): HiddenWord[] {
  return splitVerse(verse).map((word, index) => {
    const hidden =
      style === "all" || style === "letters"
        ? true
        : style === "alternate"
          ? index % 2 === 1
          : index > 0;

    return {
      word,
      hidden,
      hint: hidden && style === "letters" ? firstLetterOf(word) : undefined,
    };
  });
}
