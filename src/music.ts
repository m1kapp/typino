// 화면에 나온 계이름을 치면 그 음이 난다. 도레미를 치면 도레미가 — 자판이 건반이다.

/** 음표는 "G4" 처럼, 길이는 박 수로 "G4:2"(없으면 1박), 띄어쓰기는 "/", 반주 코드는 음 앞에 "[F]". 화면에 보일 계이름은 여기서 만든다 */
export type Song = { id: string; title: string; by: string; lines: string[] };

// 선율은 저작권이 끝난 것만
export const SONGS: Song[] = [
  { id: "star", title: "작은 별", by: "프랑스 민요", lines: [
    "[C]C4 C4 G4 G4 / [F]A4 A4 [C]G4:2", "[F]F4 F4 [C]E4 E4 / [G]D4 D4 [C]C4:2",
    "[C]G4 G4 [F]F4 F4 / [C]E4 E4 [G]D4:2", "[C]G4 G4 [F]F4 F4 / [C]E4 E4 [G]D4:2",
    "[C]C4 C4 G4 G4 / [F]A4 A4 [C]G4:2", "[F]F4 F4 [C]E4 E4 / [G]D4 D4 [C]C4:2",
  ] },
  { id: "birthday", title: "생일 축하", by: "힐 자매", lines: [
    "G4:0.75 G4:0.25 [C]A4 G4 / C5 [G]B4:2", "G4:0.75 G4:0.25 [G]A4 G4 / D5 [C]C5:2",
    "G4:0.75 G4:0.25 [C]G5 E5 / C5 [F]B4 A4:2", "[F]F5:0.75 F5:0.25 [C]E5 C5 / [G]D5 [C]C5:3",
  ] },
  // 원곡 D장조 → C장조. 제1바이올린 첫 세 변주(2분음표 둘, 4분음표 하나)
  { id: "canon", title: "캐논", by: "파헬벨", lines: [
    "[C]E5:2 [G]D5:2 / [Am]C5:2 [Em]B4:2 / [F]A4:2 [C]G4:2 / [F]A4:2 [G]B4:2",
    "[C]C5:2 [G]B4:2 / [Am]A4:2 [Em]G4:2 / [F]F4:2 [C]E4:2 / [F]F4:2 [G]D4:2",
    "[C]C4 E4 [G]G4 F4 / [Am]E4 C4 [Em]E4 D4",
    "[F]C4 A3 [C]C4 G4 / [F]F4 A4 [G]G4 F4",
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

export const SOLFA = "도_레_미파_솔_라_시"; // 반음 자리는 _ — C장조 흰건반만

/** 줄 데이터 → 화면에 칠 계이름 글과 글자 자리별 음 */
export function parse(line: string) {
  let text = "";
  const notes: (number | null)[] = [];
  const chords: (string | null)[] = [];
  const beats: number[] = [];
  for (const tok of line.split(" ")) {
    if (tok === "/") { text += " "; notes.push(null); chords.push(null); beats.push(0); continue; }
    const [, c, name, b] = /^(?:\[(\w+)\])?([^:]+)(?::([\d.]+))?$/.exec(tok)!;
    const n = midi(name);
    text += SOLFA[n % 12];
    notes.push(n);
    chords.push(c ?? null);
    beats.push(b ? Number(b) : 1);
  }
  return { text, notes, chords, beats };
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

/** 직접 친 계이름 글 → 곡 줄 데이터. "솔솔라ㅡ 높도" — 높이는 도4~시4, 앞에 높·낮을 붙이면 한 옥타브씩,
 *  ㅡ 는 한 박 더, 띄어쓰기는 쉼, 줄바꿈은 다음 줄, 반주는 fitChord */
export function fromSolfa(src: string): string[] {
  let cur: string | null = null;
  return src.split("\n").map((line) => {
    const toks: ({ c: string; n: number; b: number } | "/")[] = [];
    let oct = 0;
    for (const ch of line.trim()) {
      const last = toks[toks.length - 1];
      if (ch === "높") { oct++; continue; }
      if (ch === "낮") { oct--; continue; }
      if (ch === " ") { if (last && last !== "/") toks.push("/"); continue; }
      if (ch === "ㅡ" || ch === "-") { if (last && last !== "/") last.b++; continue; }
      const pc = SOLFA.indexOf(ch);
      if (pc < 0 || ch === "_") continue; // 계이름 말고는 건너뜀
      const n = 60 + pc + 12 * oct;
      oct = 0;
      const c = fitChord(n, cur);
      toks.push({ c: c !== cur ? `[${c}]` : "", n, b: 1 });
      cur = c;
    }
    if (toks[toks.length - 1] === "/") toks.pop();
    return toks.map((t) => (t === "/" ? "/" : t.c + noteName(t.n) + (t.b > 1 ? `:${t.b}` : ""))).join(" ");
  }).filter(Boolean);
}
