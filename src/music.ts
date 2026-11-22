// 곡의 음정은 정해져 있다. 가사를 한 글자 칠 때마다 다음 음이 나간다 — 피아노 치듯 타자 치면 노래가 된다.

type Line = [lyric: string, notes: string];
export type Song = { id: string; title: string; by: string; lines: Line[] };

// 선율은 저작권이 끝난 것만. 가사는 typino 가 새로 붙였다(음표 하나 = 한글 한 글자).
export const SONGS: Song[] = [
  { id: "star", title: "작은 별", by: "프랑스 민요 · 가사 typino", lines: [
    ["한 글자씩 쳐 보자", "C4 C4 G4 G4 A4 A4 G4"],
    ["손끝에서 노래가", "F4 F4 E4 E4 D4 D4 C4"],
    ["자판 위에 피아노", "G4 G4 F4 F4 E4 E4 D4"],
    ["톡톡 치면 울려요", "G4 G4 F4 F4 E4 E4 D4"],
    ["한 글자씩 쳐 보자", "C4 C4 G4 G4 A4 A4 G4"],
    ["노래 되는 타자기", "F4 F4 E4 E4 D4 D4 C4"],
  ] },
  { id: "joy", title: "환희의 송가", by: "베토벤 · 가사 typino", lines: [
    ["오늘 하루 수고했어 내 손가락 고마워", "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4 D4 D4"],
    ["자판 위로 춤을 추면 한 곡조가 흐르네", "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4 C4 C4"],
    ["틀려도 괜찮아 다시 또 치면 되니까 천천히", "D4 D4 E4 C4 D4 E4 F4 E4 C4 D4 E4 F4 E4 D4 C4 D4 G3"],
    ["마지막 한 글자까지 우리 같이 노래해", "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4 C4 C4"],
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

/** 가사 i 번째 글자에 붙은 음. 글자가 아니면(공백 등) null */
export function noteAt(line: Line, i: number): number | null {
  if (!isSyllable(line[0][i])) return null;
  const k = [...line[0].slice(0, i)].filter(isSyllable).length;
  return midi(line[1].split(" ")[k]);
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
