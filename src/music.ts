// 화면에 나온 계이름을 치면 그 음이 난다. 도레미를 치면 도레미가 — 자판이 건반이다.

/** 음표는 "G4" 처럼, 마디 사이 띄어쓰기는 "/" 로. 화면에 보일 계이름은 여기서 만든다 */
export type Song = { id: string; title: string; by: string; lines: string[] };

// 선율은 저작권이 끝난 것만
export const SONGS: Song[] = [
  { id: "star", title: "작은 별", by: "프랑스 민요", lines: [
    "C4 C4 G4 G4 / A4 A4 G4", "F4 F4 E4 E4 / D4 D4 C4",
    "G4 G4 F4 F4 / E4 E4 D4", "G4 G4 F4 F4 / E4 E4 D4",
    "C4 C4 G4 G4 / A4 A4 G4", "F4 F4 E4 E4 / D4 D4 C4",
  ] },
  { id: "lamb", title: "메리의 어린 양", by: "미국 민요", lines: [
    "E4 D4 C4 D4 / E4 E4 E4", "D4 D4 D4 / E4 G4 G4",
    "E4 D4 C4 D4 / E4 E4 E4", "D4 D4 E4 D4 / C4",
  ] },
  { id: "joy", title: "환희의 송가", by: "베토벤", lines: [
    "E4 E4 F4 G4 / G4 F4 E4 D4 / C4 C4 D4 E4 / E4 D4 D4",
    "E4 E4 F4 G4 / G4 F4 E4 D4 / C4 C4 D4 E4 / D4 C4 C4",
    "D4 D4 E4 C4 / D4 E4 F4 E4 C4 / D4 E4 F4 E4 D4 / C4 D4 G3",
    "E4 E4 F4 G4 / G4 F4 E4 D4 / C4 C4 D4 E4 / D4 C4 C4",
  ] },
  { id: "birthday", title: "생일 축하", by: "힐 자매", lines: [
    "G4 G4 A4 G4 / C5 B4", "G4 G4 A4 G4 / D5 C5",
    "G4 G4 G5 E5 / C5 B4 A4", "F5 F5 E5 C5 / D5 C5",
  ] },
];

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

/** "G4" → 67 */
export function midi(name: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  if (!m) throw new Error(`음 이름이 이상하다: ${name}`);
  return NAMES.indexOf(m[1]) + 12 * (Number(m[2]) + 1);
}
export const noteName = (n: number) => NAMES[n % 12] + (Math.floor(n / 12) - 1);

/** C장조 안에서 3도 아래 음 — 선율 밑에 깔아 화음을 만든다 */
export function thirdBelow(n: number): number {
  const deg = MAJOR.indexOf(n % 12);
  if (deg < 0) return n - 3;
  const oct = Math.floor(n / 12);
  const d = deg - 2;
  return (d < 0 ? oct - 1 : oct) * 12 + MAJOR[(d + 7) % 7];
}

export const isSyllable = (ch: string | undefined) => !!ch && ch >= "가" && ch <= "힣";

const SOLFA = "도_레_미파_솔_라_시"; // 반음 자리는 _ — C장조 흰건반만

/** 줄 데이터 → 화면에 칠 계이름 글과 글자 자리별 음 */
export function parse(line: string): { text: string; notes: (number | null)[] } {
  let text = "";
  const notes: (number | null)[] = [];
  for (const tok of line.split(" ")) {
    if (tok === "/") { text += " "; notes.push(null); continue; }
    const n = midi(tok);
    text += SOLFA[n % 12];
    notes.push(n);
  }
  return { text, notes };
}

/** 친 계이름 글자 → 음. 옥타브는 그 자리 목표 음에 가장 가까운 쪽 */
export function solfa(ch: string, near: number): number | null {
  const pc = SOLFA.indexOf(ch);
  if (pc < 0 || ch === "_") return null;
  return near + ((((pc - (near % 12)) % 12) + 18) % 12) - 6;
}

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];
function jamo(text: string): string[] {
  return [...text].flatMap((ch) => {
    if (!isSyllable(ch)) return [ch];
    const i = ch.charCodeAt(0) - 0xac00;
    return [CHO[Math.floor(i / 588)], JUNG[Math.floor((i % 588) / 28)], JONG[i % 28]].filter(Boolean);
  });
}
/** 지운 게 아니라 새로 친 건지 — 지우다 목표 글자를 지나갈 때 다시 울리지 않게 */
// 고→과 처럼 자모 수가 그대로여도 새로 친 것. 지운 경우만 지금 값이 이전 값의 앞부분이 된다
export function typedMore(prev: string, cur: string) {
  const a = jamo(prev).join(""), b = jamo(cur).join("");
  return a !== b && !a.startsWith(b);
}
