// 화면에 나온 계이름을 치면 그 음이 난다. 도레미를 치면 도레미가 — 자판이 건반이다.

/** 음표는 "G4" 처럼, 길이는 박 수로 "G4:2"(없으면 1박), 띄어쓰기는 "/", 반주 코드는 음 앞에 "[F]". 화면에 보일 계이름은 여기서 만든다 */
export type Song = { id: string; title: string; by: string; lines: string[]; drums?: boolean }; // drums: 드럼이 어울리는 곡

// 선율은 저작권이 끝난 것만
export const SONGS: Song[] = [
  { id: "star", title: "작은 별", by: "프랑스 민요", lines: [
    "[C]C4 C4 G4 G4 / [F]A4 A4 [C]G4:2", "[F]F4 F4 [C]E4 E4 / [G]D4 D4 [C]C4:2",
    "[C]G4 G4 [F]F4 F4 / [C]E4 E4 [G]D4:2", "[C]G4 G4 [F]F4 F4 / [C]E4 E4 [G]D4:2",
    "[C]C4 C4 G4 G4 / [F]A4 A4 [C]G4:2", "[F]F4 F4 [C]E4 E4 / [G]D4 D4 [C]C4:2",
  ] },
  { id: "birthday", title: "생일 축하", by: "힐 자매", drums: true, lines: [
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
  // 피어폰트 1857. 4분음표 = 1박
  { id: "jingle", title: "징글벨", by: "피어폰트", drums: true, lines: [
    "[C]E4 E4 E4:2 / E4 E4 E4:2", "E4 G4 C4:1.5 D4:0.5 / E4:4",
    "[F]F4 F4 F4:1.5 F4:0.5 / F4 [C]E4 E4 E4:0.5 E4:0.5", "E4 [G]D4 D4 E4 / D4:2 G4:2",
    "[C]E4 E4 E4:2 / E4 E4 E4:2", "E4 G4 C4:1.5 D4:0.5 / E4:4",
    "[F]F4 F4 F4:1.5 F4:0.5 / F4 [C]E4 E4 E4:0.5 E4:0.5", "[G]G4 G4 F4 D4 / [C]C4:4",
  ] },
  // 베토벤 9번 4악장 주제. 4분음표 = 1박
  { id: "joy", title: "환희의 송가", by: "베토벤", drums: true, lines: [
    "[C]E4 E4 F4 G4 / [G]G4 F4 E4 D4", "[C]C4 C4 D4 E4 / [G]E4:1.5 D4:0.5 D4:2",
    "[C]E4 E4 F4 G4 / [G]G4 F4 E4 D4", "[C]C4 C4 D4 E4 / [G]D4:1.5 [C]C4:0.5 C4:2",
    "[G]D4 D4 E4 C4 / D4 E4:0.5 F4:0.5 [C]E4 C4", "[G]D4 E4:0.5 F4:0.5 E4 D4 / C4 D4 G3:2",
    "[C]E4 E4 F4 G4 / [G]G4 F4 E4 D4", "[C]C4 C4 D4 E4 / [G]D4:1.5 [C]C4:0.5 C4:2",
  ] },
  // 그루버 1818. 6/8 박자, 8분음표 = 1박
  { id: "silent", title: "고요한 밤", by: "그루버", lines: [
    "[C]G4:1.5 A4:0.5 G4 E4:3 / G4:1.5 A4:0.5 G4 E4:3", "[G]D5:2 D5 B4:3 / [C]C5:2 C5 G4:3",
    "[F]A4:2 A4 C5:1.5 B4:0.5 A4 / [C]G4:1.5 A4:0.5 G4 E4:3", "[F]A4:2 A4 C5:1.5 B4:0.5 A4 / [C]G4:1.5 A4:0.5 G4 E4:3",
    "[G]D5:2 D5 F5:1.5 D5:0.5 B4 / [C]C5:3 E5:3", "C5:1.5 G4:0.5 E4 [G]G4:1.5 F4:0.5 D4 / [C]C4:6",
  ] },
  // 모차르트 K.525 1악장 첫 네 마디. 원곡 G장조 → C장조, 쉼표는 앞 음에 붙임
  { id: "nacht", title: "작은 밤의 음악", by: "모차르트", lines: [
    "[C]C5:1.5 G4:0.5 C5:1.5 G4:0.5 / C5:0.5 G4:0.5 C5:0.5 E5:0.5 G5:2",
    "[G]F5:1.5 D5:0.5 F5:1.5 D5:0.5 / F5:0.5 D5:0.5 B4:0.5 D5:0.5 G4:2",
  ] },
  // 베토벤 5번 1악장 동기. 원곡 다단조 → 가단조(흰건반)
  { id: "fate", title: "운명", by: "베토벤", lines: [
    "[Am]E4:0.5 E4:0.5 E4:0.5 C4:3", "[G]D4:0.5 D4:0.5 D4:0.5 B3:3",
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

// ---- 글 노래: 아무 문장이나 그 글자로 노래가 된다. 같은 글은 언제나 같은 노래 ----
// 모음(가운뎃소리) = 멜로디 높이(밝은 ㅏ·ㅣ 는 높게, 어두운 ㅜ·ㅡ 는 낮게), 첫소리 = 높이를 살짝 흔듦,
// 받침 = 길게, 첫 글자 = 코드 진행. 음은 5음계라 어떤 글을 쳐도 듣기 좋다.
// 감정 키: ㅠ·ㅜㅜ 는 단조로 느리게, ㅋㅋ·ㅎㅎ·! 는 통통 빠르게, ! 는 쾅, . 는 쉼, ~ 는 길게, ? 는 올라감

// 중성 21개 차례대로 ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ → 5음계 몇 번째 칸
const VOWEL_DEG = [5, 6, 7, 7, 4, 6, 5, 6, 3, 5, 6, 4, 4, 2, 4, 5, 3, 2, 1, 3, 8];
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const PROGS = {
  major: [["C", "G", "Am", "F"], ["C", "Am", "F", "G"], ["F", "G", "Em", "Am"], ["C", "F", "G", "C"]],
  minor: [["Am", "F", "C", "G"], ["Am", "Dm", "G", "C"], ["Am", "Em", "F", "G"]],
};

export type Tone = { ch: string; midi: number | null; beats: number; chord: string | null; accent?: boolean; short?: boolean };

export function compose(text: string) {
  const minor = /ㅠ|ㅜㅜ/.test(text);
  const bouncy = /ㅋㅋ|ㅎㅎ|!/.test(text);
  const bpm = minor ? 72 : bouncy ? 132 : 100;
  const first = text.trim().charCodeAt(0) || 0;
  const pool = minor ? PROGS.minor : PROGS.major;
  const prog = pool[first % pool.length];
  // 장조는 도 5음계(도레미솔라), 단조는 라 5음계(라도레미솔) — 같은 흰건반 다섯 개를 다르게 센다
  const base = minor ? 57 : 60;
  const steps = minor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9];
  const deg = (d: number) => base + 12 * Math.floor(d / 5) + steps[((d % 5) + 5) % 5];

  const tones: Tone[] = [];
  let beat = 0; // 지금까지 흐른 박 — 4박마다 다음 코드
  let bar = -1;
  let k = 0; // ㅋ·ㅎ 웃음이 이어질 때 한 칸씩 오르게
  for (const ch of text) {
    const t: Tone = { ch, midi: null, beats: 0.5, chord: null };
    const code = ch.charCodeAt(0) - 0xac00;
    if (code >= 0 && code < 11172) {
      // 완성된 한글 한 글자
      const cho = Math.floor(code / 588);
      const jung = Math.floor((code % 588) / 28);
      const jong = code % 28;
      t.midi = deg(VOWEL_DEG[jung] + (cho % 3) - 1);
      t.beats = jong ? 1 : 0.5;
      k = 0;
    } else if (ch === "ㅋ" || ch === "ㅎ") {
      t.midi = deg(10 + (k++ % 5)); // 키득키득 높고 짧게
      t.beats = 0.25;
      t.short = true;
    } else if (JUNG.includes(ch)) {
      t.midi = deg(VOWEL_DEG[JUNG.indexOf(ch)] - 3); // ㅠㅠ 는 낮게 길게
      t.beats = 1;
    } else if (ch === "!") {
      t.accent = true; // 쾅 — 화음을 세게
    } else if (ch === ".") {
      t.beats = 1;
    } else if (ch === "~") {
      const prev = tones[tones.length - 1];
      if (prev) prev.beats += 1;
      t.beats = 0;
    } else if (ch === "?") {
      const prev = [...tones].reverse().find((x) => x.midi != null)?.midi ?? deg(4);
      t.midi = prev + (minor ? 3 : 2);
      t.beats = 1;
    } else if (ch === " " || ch === "\n") {
      t.beats = 0.25;
    } else if (/\p{L}|\p{N}/u.test(ch)) {
      t.midi = deg(ch.toLowerCase().charCodeAt(0) % 9); // 영어·숫자도 노래가 된다
    } else t.beats = 0.25;

    // 새 마디의 첫 음엔 코드를 바꾸고, 그 음은 코드 안의 음으로 맞춘다 — 반주와 부딪히지 않게
    const b = Math.floor(beat / 4);
    if (b !== bar && (t.midi != null || t.accent)) {
      bar = b;
      t.chord = prog[b % prog.length];
      if (t.midi != null) t.midi = snap(t.midi, t.chord);
    }
    beat += t.beats;
    tones.push(t);
  }
  return { tones, minor, bouncy, bpm, prog };
}

/** 코드 안의 가장 가까운 음 */
function snap(midi: number, name: string) {
  const pcs = chord(name).map((n) => n % 12);
  for (let d = 0; d < 6; d++) for (const m of [midi + d, midi - d]) if (pcs.includes(m % 12)) return m;
  return midi;
}
