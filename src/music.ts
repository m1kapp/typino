// 한글 → 음. 자모 하나 = 음 하나, 완성된 음절 하나 = 화음 하나.

export const SONGS = [
  // 저작권 만료(사후 70년)된 시만 싣는다
  { id: "azalea", title: "진달래꽃", by: "김소월", lines: [
    "나 보기가 역겨워", "가실 때에는", "말없이 고이 보내 드리우리다",
    "영변에 약산", "진달래꽃", "아름 따다 가실 길에 뿌리우리다",
    "가시는 걸음 걸음", "놓인 그 꽃을", "사뿐히 즈려밟고 가시옵소서",
    "나 보기가 역겨워", "가실 때에는", "죽어도 아니 눈물 흘리우리다",
  ] },
  { id: "prologue", title: "서시", by: "윤동주", lines: [
    "죽는 날까지 하늘을 우러러", "한 점 부끄럼이 없기를", "잎새에 이는 바람에도", "나는 괴로워했다",
    "별을 노래하는 마음으로", "모든 죽어 가는 것을 사랑해야지", "그리고 나한테 주어진 길을", "걸어가야겠다",
    "오늘 밤에도 별이 바람에 스치운다",
  ] },
] as const;

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];

// 두 번 눌러 만드는 겹자모 → 누른 키 순서. (ㄲ·ㅆ·ㅒ·ㅖ 는 Shift 한 번이라 쪼개지 않는다)
const KEYS: Record<string, string> = {
  ㅘ: "ㅗㅏ", ㅙ: "ㅗㅐ", ㅚ: "ㅗㅣ", ㅝ: "ㅜㅓ", ㅞ: "ㅜㅔ", ㅟ: "ㅜㅣ", ㅢ: "ㅡㅣ",
  ㄳ: "ㄱㅅ", ㄵ: "ㄴㅈ", ㄶ: "ㄴㅎ", ㄺ: "ㄹㄱ", ㄻ: "ㄹㅁ", ㄼ: "ㄹㅂ", ㄽ: "ㄹㅅ", ㄾ: "ㄹㅌ", ㄿ: "ㄹㅍ", ㅀ: "ㄹㅎ", ㅄ: "ㅂㅅ",
};
// 된소리·겹모음은 바탕 자모의 음을 쓴다
const BASE: Record<string, string> = { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ", ㅒ: "ㅐ", ㅖ: "ㅔ" };

const CONS = "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ";
const VOW = "ㅏㅐㅑㅓㅔㅕㅗㅛㅜㅠㅡㅣ";
const PENTA = [0, 2, 4, 7, 9]; // C 펜타토닉 — 아무렇게나 겹쳐도 안 어긋난다
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const penta = (root: number, i: number) => root + 12 * Math.floor((i % 10) / 5) + PENTA[i % 5];

/** 완성형 음절 → [초성, 중성, 종성]. 음절이 아니면 null */
export function split(ch: string): [string, string, string] | null {
  const i = ch.charCodeAt(0) - 0xac00;
  if (!(i >= 0 && i <= 11171)) return null;
  return [CHO[Math.floor(i / 588)], JUNG[Math.floor((i % 588) / 28)], JONG[i % 28]];
}

/** 자모 하나의 MIDI 번호. 자음은 C3~(왼손), 모음은 C4~(오른손) */
export function pitch(j: string): number | null {
  j = BASE[j] ?? KEYS[j]?.[0] ?? j;
  if (CONS.includes(j)) return penta(48, CONS.indexOf(j));
  if (VOW.includes(j)) return penta(60, VOW.indexOf(j));
  return null;
}

/** 음절 화음 — 받침은 한 옥타브 아래 베이스 */
export function chord(ch: string): number[] | null {
  const s = split(ch);
  if (!s) return null;
  const notes = [pitch(s[0])!, pitch(s[1])!];
  if (s[2]) notes.unshift(pitch(s[2])! - 12);
  return notes;
}

// 글 → 누른 키 순서. 음절이 아닌 글자(공백 등)는 그대로 한 토큰
function keys(text: string): string[] {
  return [...text].flatMap((ch) => [...(split(ch) ?? [ch])].flatMap((j) => [...(KEYS[j] ?? j)]));
}

/**
 * 입력값이 prev → cur 로 바뀔 때 새로 눌린 자모들.
 * 키 이벤트가 아니라 값을 비교해서, 한글 키를 안 알려 주는 모바일 키보드에서도 똑같이 동작한다.
 */
export function pressed(prev: string, cur: string): string[] {
  const a = keys(prev), b = keys(cur);
  let k = 0;
  while (k < a.length && a[k] === b[k]) k++;
  return b.slice(k).filter((j) => pitch(j) !== null);
}

export const noteName = (n: number) => NAMES[n % 12] + (Math.floor(n / 12) - 1);
