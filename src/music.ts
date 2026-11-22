// 화면에 나온 계이름을 치면 그 음이 난다. 도레미를 치면 도레미가 — 자판이 건반이다.

/** 음표는 "G4" 처럼, 띄어쓰기는 "/", 반주 코드는 음 앞에 "[F]". 화면에 보일 계이름은 여기서 만든다 */
export type Song = { id: string; title: string; by: string; lines: string[] };

// 선율은 저작권이 끝난 것만
export const SONGS: Song[] = [
  { id: "star", title: "작은 별", by: "프랑스 민요", lines: [
    "[C]C4 C4 G4 G4 / [F]A4 A4 [C]G4", "[F]F4 F4 [C]E4 E4 / [G]D4 D4 [C]C4",
    "[C]G4 G4 [F]F4 F4 / [C]E4 E4 [G]D4", "[C]G4 G4 [F]F4 F4 / [C]E4 E4 [G]D4",
    "[C]C4 C4 G4 G4 / [F]A4 A4 [C]G4", "[F]F4 F4 [C]E4 E4 / [G]D4 D4 [C]C4",
  ] },
  { id: "lamb", title: "어린 양", by: "미국 민요", lines: [
    "[C]E4 D4 C4 D4 / E4 E4 E4", "[G]D4 D4 D4 / [C]E4 G4 G4",
    "[C]E4 D4 C4 D4 / E4 E4 E4", "[G]D4 D4 E4 D4 / [C]C4",
  ] },
  { id: "joy", title: "환희", by: "베토벤", lines: [
    "[C]E4 E4 F4 G4 / [G]G4 F4 E4 D4 / [C]C4 C4 D4 E4 / [G]E4 D4 D4",
    "[C]E4 E4 F4 G4 / [G]G4 F4 E4 D4 / [C]C4 C4 D4 E4 / [G]D4 [C]C4 C4",
    "[G]D4 D4 E4 [C]C4 / [G]D4 E4 F4 E4 [C]C4 / [G]D4 E4 F4 E4 D4 / [C]C4 D4 [G]G3",
    "[C]E4 E4 F4 G4 / [G]G4 F4 E4 D4 / [C]C4 C4 D4 E4 / [G]D4 [C]C4 C4",
  ] },
  { id: "birthday", title: "생일", by: "힐 자매", lines: [
    "G4 G4 [C]A4 G4 / C5 [G]B4", "G4 G4 [G]A4 G4 / D5 [C]C5",
    "G4 G4 [C]G5 E5 / C5 [F]B4 A4", "[F]F5 F5 [C]E5 C5 / [G]D5 [C]C5",
  ] },
  // 원곡 D장조 → C장조. 변주가 갈수록 빨라져 뒤로 갈수록 어렵다
  { id: "canon", title: "캐논", by: "파헬벨", lines: [
    "[C]E5 [G]D5 / [Am]C5 [Em]B4 / [F]A4 [C]G4 / [F]A4 [G]B4",
    "[C]C5 [G]B4 / [Am]A4 [Em]G4 / [F]F4 [C]E4 / [F]F4 [G]G4",
    "[C]C4 E4 [G]G4 F4 / [Am]E4 C4 [Em]E4 D4",
    "[F]C4 A3 [C]C4 G4 / [F]F4 A4 [G]G4 F4",
    "[C]E5 C5 D5 E5 C5 D5 E5 E4 / [G]F4 G4 A4 B4 C5 D5 E5 F5",
  ] },
];

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** "G4" → 67 */
export function midi(name: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  if (!m) throw new Error(`음 이름이 이상하다: ${name}`);
  return NAMES.indexOf(m[1]) + 12 * (Number(m[2]) + 1);
}
export const noteName = (n: number) => NAMES[n % 12] + (Math.floor(n / 12) - 1);

/** "Am" → [베이스, 3화음] — 코드가 바뀌는 음을 칠 때 왼손처럼 깐다 */
export function chord(name: string): number[] {
  const m = /^([A-G])(m?)$/.exec(name);
  if (!m) throw new Error(`코드 이름이 이상하다: ${name}`);
  const r = NAMES.indexOf(m[1]) + 48; // C3 위
  return [r - 12, r, r + (m[2] ? 3 : 4), r + 7];
}

export const isSyllable = (ch: string | undefined) => !!ch && ch >= "가" && ch <= "힣";

export const SOLFA = "도_레_미파_솔_라_시"; // 반음 자리는 _ — C장조 흰건반만

/** 줄 데이터 → 화면에 칠 계이름 글과 글자 자리별 음 */
export function parse(line: string) {
  let text = "";
  const notes: (number | null)[] = [];
  const chords: (string | null)[] = [];
  for (const tok of line.split(" ")) {
    if (tok === "/") { text += " "; notes.push(null); chords.push(null); continue; }
    const [, c, name] = /^(?:\[(\w+)\])?(.+)$/.exec(tok)!;
    const n = midi(name);
    text += SOLFA[n % 12];
    notes.push(n);
    chords.push(c ?? null);
  }
  return { text, notes, chords };
}

/** 친 계이름 글자 → 음. 옥타브는 그 자리 목표 음에 가장 가까운 쪽 */
export function solfa(ch: string, near: number): number | null {
  const pc = SOLFA.indexOf(ch);
  if (pc < 0 || ch === "_") return null;
  return near + ((((pc - (near % 12)) % 12) + 18) % 12) - 6;
}

/** 선율 음을 품는 코드. 지금 코드가 품고 있으면 그대로 — 반주가 너무 자주 바뀌지 않게 */
export function fitChord(note: number, cur: string | null): string | null {
  const has = (c: string) => chord(c).some((n) => n % 12 === note % 12);
  return cur && has(cur) ? cur : ["C", "F", "G", "Am", "Dm", "Em"].find(has) ?? cur; // 샵·내림은 품는 코드가 없어 그대로
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
