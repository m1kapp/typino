import { useEffect, useRef, useState } from "react";
import { AppShell, AppShellContent, AppShellHeader, Section, Watermark } from "@m1kapp/kit";
import { chord, fitChord, fromSolfa, noteName, parse, solfa, SOLFA, SONGS } from "./music";
import { drum, hold, pad, play, quiet, unlock } from "./audio";

const ACCENT = "#c2410c";

export default function App() {
  return (
    <Watermark trackSlug={import.meta.env.VITE_M1K_SLUG} color={ACCENT} text="typino">
      <AppShell accent={ACCENT}>
        <AppShellHeader>
          <span className="text-lg font-black tracking-tight text-zinc-900">typino</span>
          <span className="text-xs text-zinc-400">타자 치면 노래가 된다</span>
        </AppShellHeader>
        <AppShellContent>
          <Player />
        </AppShellContent>
      </AppShell>
    </Watermark>
  );
}

function Player() {
  const [songId, setSongId] = useState("free");
  const [row, setRow] = useState(0);
  const [pos, setPos] = useState(0); // 줄 안에서 다음에 누를 글자 자리
  const [miss, setMiss] = useState(false);
  const [started, setStarted] = useState(false);
  const [last, setLast] = useState<{ label: string; note: number } | null>(null);
  const [played, setPlayed] = useState<{ label: string; note: number }[]>([]);
  const cur = useRef<string | null>(null); // 지금 깔린 반주 코드
  const [drumOn, setDrumOn] = useState(true);
  const step8 = useRef(0); // 코드가 바뀐 뒤 몇 번째 음인지 — 왼손 쿵·짝 차례
  const timers = useRef<number[]>([]); // 들어보기 예약
  const [demo, setDemo] = useState(false);
  const [ringing, setRinging] = useState(false); // 방금 맞힌 음이 아직 제 길이만큼 울리는 중
  const ring = useRef(0);

  // 내 곡: 직접 적은 계이름. 이 브라우저에만 남는다
  const [mine, setMine] = useState(() => {
    try {
      return localStorage.getItem(MINE) ?? NABI;
    } catch {
      return NABI;
    }
  });
  const [draft, setDraft] = useState(mine); // 적는 중인 글 — 치기를 눌러야 곡이 된다
  const [editing, setEditing] = useState(false);
  const mineLines = fromSolfa(mine);

  const free = songId === "free";
  const edit = songId === "mine" && (editing || !mineLines.length);
  const song =
    songId === "mine"
      ? mineLines.length
        ? { id: "mine", title: "내 곡", by: mine === NABI ? "예시 · 나비야" : "직접 적은 곡", lines: mineLines }
        : undefined
      : SONGS.find((s) => s.id === songId);
  const line = song?.lines[row] ? parse(song.lines[row]) : null;
  const lyric = line?.text ?? "";

  const start = () => {
    unlock();
    setStarted(true);
  };
  const restart = (id = songId) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearTimeout(ring.current);
    ring.current = 0;
    setRinging(false);
    setDemo(false);
    setEditing(false);
    setSongId(id);
    setRow(0);
    setPos(0);
    setMiss(false);
    setLast(null);
    setPlayed([]);
    cur.current = null;
    step8.current = 0;
    quiet();
    if (id !== songId) setDrumOn(id === "free" || id === "mine" || id === "magic" || !!SONGS.find((s) => s.id === id)?.drums); // 곡을 바꿀 때만 — 들어보기로 내 선택이 풀리지 않게
  };

  // 오른손 선율 + 왼손 반주. 누르는 동안 이어지는 소리 — 떼는 함수를 돌려준다
  // c: 이 음에서 새로 시작하는 코드(없으면 깔린 코드 그대로). left=false 면 왼손 없이(틀린 음)
  const ding = (label: string, note: number, c: string | null, left = true) => {
    const release = hold(note, 0.24);
    if (left) {
      if (c) {
        cur.current = c;
        step8.current = 0;
      } else step8.current++;
      const k = step8.current;
      if (cur.current) {
        comp(cur.current, k);
        const [, r, t, f] = chord(cur.current);
        pad([r, t, f, r + 12]);
      }
      if (drumOn) drum(k % 4 === 0 ? "kick" : k % 4 === 2 ? "snare" : "hat");
    }
    setLast({ label, note });
    return release;
  };

  // 한 번 들려주기 — 건반에 불을 켜 가며 곡을 끝까지. 타이머로 울려야 탭을 바꾸면 바로 멈춘다
  const listen = () => {
    if (!song) return;
    unlock();
    setStarted(true);
    restart();
    setDemo(true);
    let t = 300;
    song.lines.forEach((l, r) => {
      const p = parse(l);
      p.notes.forEach((n, i) => {
        if (n == null) return;
        const len = p.beats[i] * BEAT;
        timers.current.push(window.setTimeout(() => {
          window.setTimeout(ding(p.text[i], n, p.chords[i]), len * 0.9); // 길이만큼 누르고 뗀다
          setRow(r);
          setPos(i);
        }, t));
        t += len;
      });
    });
    timers.current.push(window.setTimeout(() => restart(), t + 600));
  };

  const hit = (label: string, note: number): (() => void) | undefined => {
    if (demo) return;
    if (free) {
      // 악보 없이: 높이는 내가 정하고, 반주는 그 음을 품는 코드로 알아서
      const c = fitChord(note, cur.current);
      const release = ding(label, note, c !== cur.current ? c : null);
      setPlayed((p) => [...p.slice(-11), { label, note }]);
      return release;
    }
    if (!song) return;
    // 앞 음이 아직 울리는 중에 눌렀으면 그 음은 여기서 끝난 셈 — 다음 자리로 넘기고 판정
    let [r, p] = [row, pos];
    if (ring.current) {
      clearTimeout(ring.current);
      ring.current = 0;
      [r, p] = step(song.lines, r, p);
      setRow(r);
      setPos(p);
      setRinging(false);
    }
    const l = song.lines[r] ? parse(song.lines[r]) : null;
    if (!l) return;
    const want = l.notes[p]!;
    if (note % 12 !== want % 12) {
      // 틀려도 누른 음은 난다 — 건반처럼. 자리는 그대로
      setMiss(true);
      return ding(label, solfa(label, want)!, null, false);
    }
    // 맞으면 곡에 적힌 높이로. 계이름엔 옥타브가 없으니 높은 솔·낮은 솔은 곡이 안다
    const release = ding(label, want, l.chords[p]);
    setMiss(false);
    // 다음 건반은 이 음의 길이가 다 지나야 켜진다 — 불이 곧 박자
    setRinging(true);
    ring.current = window.setTimeout(() => {
      ring.current = 0;
      setRinging(false);
      const [a, b] = step(song.lines, r, p);
      setRow(a);
      setPos(b);
    }, l.beats[p] * BEAT);
    return release;
  };

  return (
    <Section className="flex flex-col gap-6 px-4 pt-4 pb-8">
      {/* 곡이 늘어 한 줄에 다 안 들어간다 — 옆으로 넘긴다 */}
      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">
        {[{ id: "free", title: "자유", by: "악보 없이" }, { id: "magic", title: "같이 치기", by: "두 건반 같이" }, { id: "mine", title: "내 곡", by: "직접 적기" }, ...SONGS].map((t) => (
          <button
            key={t.id}
            onClick={() => restart(t.id)}
            className={`flex shrink-0 flex-col items-start rounded-2xl px-4 py-2 text-left leading-tight ${songId === t.id ? "bg-[var(--kit-accent)] text-white" : "bg-zinc-100 text-zinc-700"}`}
          >
            <span className="text-sm font-bold">{t.title}</span>
            <span className="text-[11px] opacity-70">{t.by}</span>
          </button>
        ))}
      </div>

      {songId === "magic" ? (
        <Magic drumOn={drumOn} setDrumOn={setDrumOn} />
      ) : free ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>악보 없이 · 외운 계이름을 눌러 보세요</span>
            <DrumToggle on={drumOn} set={setDrumOn} />
          </div>
          <div className="min-h-10 text-[26px] leading-snug font-semibold break-all">
            {played.length ? (
              played.map((p, i) => (
                <span key={i} className={i === played.length - 1 ? "text-[var(--kit-accent)]" : "text-zinc-900"}>
                  {p.label}
                  <sub className="mr-1 text-xs font-normal text-zinc-400">{Math.floor(p.note / 12) - 1}</sub>
                </span>
              ))
            ) : (
              <span className="text-zinc-300">솔솔라라 솔솔미</span>
            )}
          </div>
        </div>
      ) : edit ? (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-zinc-400">계이름으로 적기 · ㅡ 는 한 박 더 · 높도·낮시 · 줄바꿈은 다음 줄</div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder={"도도솔솔 라라솔ㅡ\n파파미미 레레도ㅡ"}
            className="rounded-2xl border border-zinc-200 p-3 text-xl leading-relaxed outline-none focus:border-[var(--kit-accent)]"
          />
          <StartButton
            label="이걸로 치기"
            onClick={() => {
              if (!fromSolfa(draft).length) return;
              setMine(draft);
              try {
                localStorage.setItem(MINE, draft);
              } catch {
                /* 저장이 막혀도 이번엔 친다 */
              }
              restart("mine");
              start();
            }}
          />
        </div>
      ) : (
        song && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>
                {song.by} · {Math.min(row + 1, song.lines.length)}/{song.lines.length}
              </span>
              <span className="flex gap-4">
                <DrumToggle on={drumOn} set={setDrumOn} />
                {songId === "mine" && (
                  <button
                    onClick={() => {
                      restart();
                      setDraft(mine);
                      setEditing(true);
                    }}
                    className="font-bold text-zinc-500"
                  >
                    고치기
                  </button>
                )}
                <button onClick={demo ? () => restart() : listen} className="font-bold text-[var(--kit-accent)]">
                  {demo ? "■ 멈춤" : "♪ 들어보기"}
                </button>
              </span>
            </div>
            <div className="min-h-10 text-[26px] leading-snug font-semibold break-keep">
              {line ? (
                [...lyric].map((c, i) =>
                  i === pos && ringing ? (
                    // 울리는 중: 글자는 켜지고 작대기는 한 박마다 하나씩 차오른다
                    <span key={`${row}-${i}`} className="text-[var(--kit-accent)]">
                      {c}
                      {[...holds(line.beats[i])].map((d, k) => (
                        <span key={k} className="text-zinc-300" style={{ animation: `fill 80ms ${(k + 1) * BEAT}ms forwards` }}>
                          {d}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span
                      key={i}
                      className={
                        i < pos
                          ? "text-zinc-900"
                          : i === pos
                            ? `border-b-2 ${miss ? "border-red-500 text-red-500" : "border-[var(--kit-accent)] text-[var(--kit-accent)]"}`
                            : "text-zinc-300"
                      }
                    >
                      {c}
                      {holds(line.beats[i])}
                    </span>
                  ),
                )
              ) : (
                <span className="text-zinc-900">끝 — 한 곡 완주!</span>
              )}
            </div>
            <div className="min-h-6 text-base text-zinc-300">{song.lines[row + 1] ? withHolds(parse(song.lines[row + 1])) : ""}</div>
          </div>
        )
      )}

      {edit || songId === "magic" ? null : !started ? (
        <StartButton onClick={start} />
      ) : free || line ? (
        <Keypad free={free} lit={line && !ringing ? lyric[pos] : undefined} onNote={hit} />
      ) : (
        <StartButton onClick={() => restart()} label="다시 치기" />
      )}

      <div className="min-h-8 font-mono text-sm text-zinc-400">
        {last && (
          <>
            <b className="mr-2 font-sans text-2xl text-[var(--kit-accent)]">{last.label}</b>
            {noteName(last.note)}
          </>
        )}
      </div>

      <p className="text-xs leading-relaxed text-zinc-400">
        계이름 건반을 누르면 그 음이 나고, 누르는 빠르기가 곧 노래의 박자가 됩니다. 곡에선 다음에 누를 건반이 주황으로
        표시돼요. 반주는 알아서 깔려요.
      </p>
    </Section>
  );
}

/** 왼손: 누를 때마다 쿵(베이스)·짝(화음)을 번갈아 — 내 손 빠르기가 곧 반주 빠르기.
 *  코드가 바뀌는 첫 음은 베이스와 화음을 같이, 두 번째 쿵은 5음으로 */
function comp(name: string, k: number) {
  const [bass, r, t, f] = chord(name);
  if (k === 0) {
    play(bass, 0.01, 0.15, 2);
    [r, t, f].forEach((n) => play(n, 0.02, 0.04, 1.2));
  } else if (k % 2) [r, t, f].forEach((n) => play(n, 0.01, 0.045, 0.8));
  else play(k % 4 ? f - 12 : bass, 0.01, 0.12, 1.4);
}

/** 줄 r 의 p 자리 다음 음 자리. 줄 끝이면 다음 줄 처음 */
function step(lines: string[], r: number, p: number): [number, number] {
  const t = parse(lines[r]).text;
  const n = t[p + 1] === " " ? p + 2 : p + 1;
  return n < t.length ? [r, n] : [r + 1, 0];
}

const MINE = "typino.mine";
// 내 곡을 아직 안 적었을 때 보여 줄 예시 — 나비야(독일 민요 Hänschen klein). 8분음표 = 1박
const NABI = "솔미미ㅡ 파레레ㅡ 도레미파 솔솔솔ㅡ\n솔미미ㅡ 파레레ㅡ 도미솔솔 도ㅡㅡㅡ\n레레레레 레미파ㅡ 미미미미 미파솔ㅡ\n솔미미ㅡ 파레레ㅡ 도미솔솔 도ㅡㅡㅡ";

// 2박 이상인 음 뒤에 작대기 — 그만큼 쭉 누르라는 표시
const holds = (b: number) => "ㅡ".repeat(Math.max(0, Math.round(b) - 1));
const withHolds = (p: { text: string; beats: number[] }) => [...p.text].map((c, i) => c + holds(p.beats[i])).join("");

function DrumToggle({ on, set }: { on: boolean; set: (f: (b: boolean) => boolean) => void }) {
  return (
    <button onClick={() => set((b) => !b)} className={`font-bold ${on ? "text-zinc-700" : "text-zinc-300 line-through"}`}>
      드럼
    </button>
  );
}

function StartButton({ onClick, label = "▶ 연주 시작" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-[var(--kit-accent)] py-3.5 text-lg font-bold text-white">
      {label}
    </button>
  );
}

// 색은 둘 중 하나만 — 같이 주면 클래스 순서가 아니라 CSS 순서로 이겨서 불이 안 켜진다
const BEAT = 450; // 들어보기 한 박 (ms)

// 아래 그림자가 건반 두께 — 누르면 그만큼 내려앉는다
const KEY = "touch-manipulation select-none rounded-2xl border py-4 text-2xl font-bold transition-[transform,box-shadow] duration-75 ";
const tone = (lit: boolean, down = false) =>
  KEY +
  (down ? "translate-y-1 shadow-none " : lit ? "shadow-[0_4px_0_#fdba74] " : "shadow-[0_4px_0_#e4e4e7] ") +
  (lit || down ? "border-[var(--kit-accent)] bg-orange-50 text-[var(--kit-accent)]" : "border-zinc-200 bg-white text-zinc-900");

/** 누르는 순간 소리, 떼는 순간 끝 — 쭉 누르면 길게. 손가락마다 따로라 여러 건반을 같이 누를 수 있다.
 *  키보드 Enter 는 click 으로 짧게 */
function usePress() {
  const held = useRef(new Map<number, { id: string; release: () => void }>()); // 손가락(pointerId)마다
  const [down, setDown] = useState<string[]>([]);
  const sync = () => setDown([...held.current.values()].map((h) => h.id));
  const up = (e: React.PointerEvent) => {
    const h = held.current.get(e.pointerId);
    if (!h) return;
    h.release();
    held.current.delete(e.pointerId);
    sync();
  };
  const press = (id: string, fn: () => (() => void) | void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      up(e);
      navigator.vibrate?.(8); // 안드로이드만 — 아이폰 사파리는 진동 API 가 없다
      held.current.set(e.pointerId, { id, release: fn() ?? (() => {}) });
      sync();
    },
    onPointerUp: up,
    onPointerLeave: up,
    onPointerCancel: up,
    onClick: (e: React.MouseEvent) => {
      if (e.detail === 0) window.setTimeout(fn() ?? (() => {}), 400);
    },
  });
  return { down, press };
}

/** 전화 키패드처럼 계이름 7개. 자유 모드엔 샵·내림(한 번만)과 옥타브 오르내림까지. lit 에 든 계이름은 불이 켜진다 */
function Keypad({ free, lit, oct0 = 4, onNote }: { free: boolean; lit?: string; oct0?: number; onNote: (label: string, note: number) => (() => void) | undefined }) {
  const [oct, setOct] = useState(oct0);
  const [acc, setAcc] = useState(0);
  const { down, press } = usePress();
  const key = (s: string) => (
    <button key={s} className={tone(!!lit && lit.includes(s), down.includes(s))} {...press(s, () => {
      setAcc(0);
      return onNote(s + (acc > 0 ? "♯" : acc < 0 ? "♭" : ""), 12 * (oct + 1) + SOLFA.indexOf(s) + acc);
    })}>
      {s}
    </button>
  );
  const mod = (a: number, sign: string, name: string) => (
    <button className={tone(acc === a, down.includes(name))} aria-label={name} {...press(name, () => setAcc((x) => (x === a ? 0 : a)))}>
      {sign}
    </button>
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      {["도", "레", "미", "파", "솔", "라"].map(key)}
      {free ? mod(-1, "♭", "내림") : <div />}
      {key("시")}
      {free && mod(1, "♯", "올림")}
      {free && (
        <>
          <button className={tone(false, down.includes("low")) + " !text-base"} {...press("low", () => setOct((o) => Math.max(2, o - 1)))}>▼ 낮게</button>
          <div className="flex items-center justify-center text-sm text-zinc-400">옥타브 {oct}</div>
          <button className={tone(false, down.includes("high")) + " !text-base"} {...press("high", () => setOct((o) => Math.min(6, o + 1)))}>▲ 높게</button>
        </>
      )}
    </div>
  );
}

// 같이 치기: 마디 첫 음은 두 건반을 같이(코드의 뼈대), 나머지는 한 건반씩. 누를 때만 나아가고 반주는 그 손을 따라온다
const MAGIC = [
  { c: "Am", steps: ["라미", "솔", "미", "솔"] },
  { c: "F", steps: ["파도", "솔", "라", "솔"] },
  { c: "C", steps: ["도솔", "미", "솔", "미"] },
  { c: "G", steps: ["레솔", "시", "레", "시"] },
];

function Magic({ drumOn, setDrumOn }: { drumOn: boolean; setDrumOn: (f: (b: boolean) => boolean) => void }) {
  const [on, setOn] = useState(false);
  const [at, setAt] = useState(0); // 처음부터 몇 번째 걸음
  const [miss, setMiss] = useState(false);
  const got = useRef(""); // 이번 걸음에서 이미 누른 계이름 — 두 손가락이 같은 순간에 와도 놓치지 않게 ref
  const [, redraw] = useState(0); // got 이 바뀌면 남은 건반 불을 다시 그린다
  useEffect(() => () => quiet(), []);

  const bar = MAGIC[Math.floor(at / 4) % MAGIC.length];
  const s = at % 4;
  const need = bar.steps[s];

  const onNote = (label: string, note: number) => {
    const release = hold(note, 0.22);
    if (!need.includes(label)) {
      setMiss(true); // 틀려도 소리는 난다. 자리는 그대로
      return release;
    }
    setMiss(false);
    if (!got.current.includes(label)) got.current += label;
    redraw((x) => x + 1);
    if ([...need].every((ch) => got.current.includes(ch))) {
      comp(bar.c, s); // 왼손: 마디 첫 걸음은 베이스+화음, 다음부터 쿵짝
      const [, r, t, f] = chord(bar.c);
      pad([r, t, f, r + 12]);
      if (drumOn) drum(s === 0 ? "kick" : s === 2 ? "snare" : "hat");
      got.current = "";
      setAt((a) => a + 1);
    }
    return release;
  };
  const show = (st: string) => [...st].join("+");

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>불 켜진 건반을 누르세요 · 두 개면 같이</span>
          <DrumToggle on={drumOn} set={setDrumOn} />
        </div>
        <div className="flex items-baseline gap-4 text-[30px] leading-snug font-black">
          {bar.steps.map((st, k) => (
            <span
              key={k}
              className={
                k < s
                  ? "text-zinc-900"
                  : k === s
                    ? `border-b-2 ${miss ? "border-red-500 text-red-500" : "border-[var(--kit-accent)] text-[var(--kit-accent)]"}`
                    : "text-zinc-300"
              }
            >
              {show(st)}
            </span>
          ))}
          <span className="text-sm font-normal text-zinc-400">{bar.c}</span>
        </div>
        <div className="text-base text-zinc-300">{MAGIC[(Math.floor(at / 4) + 1) % MAGIC.length].steps.map(show).join("  ")}</div>
      </div>
      {on ? (
        <Keypad free={false} lit={[...need].filter((ch) => !got.current.includes(ch)).join("")} oct0={5} onNote={onNote} />
      ) : (
        <StartButton
          onClick={() => {
            unlock();
            setOn(true);
          }}
        />
      )}
    </>
  );
}
