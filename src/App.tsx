import { useRef, useState } from "react";
import { AppShell, AppShellContent, AppShellHeader, Section, SegmentedControl, Watermark } from "@m1kapp/kit";
import { chord, fitChord, noteName, parse, solfa, SOLFA, SONGS } from "./music";
import { play, unlock } from "./audio";

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
  const cur = useRef<string | null>(null); // 자유 모드: 지금 깔린 반주 코드
  const timers = useRef<number[]>([]); // 들어보기 예약
  const [demo, setDemo] = useState(false);

  const free = songId === "free";
  const song = SONGS.find((s) => s.id === songId);
  const line = song?.lines[row] ? parse(song.lines[row]) : null;
  const lyric = line?.text ?? "";

  const start = () => {
    unlock();
    setStarted(true);
  };
  const restart = (id = songId) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setDemo(false);
    setSongId(id);
    setRow(0);
    setPos(0);
    setMiss(false);
    setLast(null);
    setPlayed([]);
    cur.current = null;
  };

  // 오른손 선율 + 코드가 바뀌는 자리면 왼손 반주
  const ding = (label: string, note: number, c: string | null) => {
    play(note, 0, 0.24);
    if (c) chord(c).forEach((n, k) => play(n, 0.01, k ? 0.06 : 0.16, 2.4));
    setLast({ label, note });
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
        timers.current.push(window.setTimeout(() => {
          ding(p.text[i], n, p.chords[i]);
          setRow(r);
          setPos(i);
        }, t));
        t += p.beats[i] * BEAT;
      });
    });
    timers.current.push(window.setTimeout(() => restart(), t + 600));
  };

  const hit = (label: string, note: number) => {
    if (demo) return;
    if (free) {
      // 악보 없이: 높이는 내가 정하고, 반주는 그 음을 품는 코드로 알아서
      const c = fitChord(note, cur.current);
      ding(label, note, c !== cur.current ? c : null);
      cur.current = c;
      setPlayed((p) => [...p.slice(-11), { label, note }]);
      return;
    }
    if (!line) return;
    const want = line.notes[pos]!;
    if (note % 12 !== want % 12) {
      // 틀려도 누른 음은 난다 — 건반처럼. 자리는 그대로
      ding(label, solfa(label, want)!, null);
      setMiss(true);
      return;
    }
    // 맞으면 곡에 적힌 높이로. 계이름엔 옥타브가 없으니 높은 솔·낮은 솔은 곡이 안다
    ding(label, want, line.chords[pos]);
    setMiss(false);
    const next = lyric[pos + 1] === " " ? pos + 2 : pos + 1;
    if (next < lyric.length) return setPos(next);
    setRow((r) => r + 1);
    setPos(0);
  };

  return (
    <Section className="flex flex-col gap-6 px-4 pt-4 pb-8">
      <SegmentedControl
        value={songId}
        onChange={(id) => restart(id)}
        options={[{ value: "free", label: "자유" }, ...SONGS.map((s) => ({ value: s.id, label: s.title }))]}
      />

      {free ? (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-zinc-400">악보 없이 · 외운 계이름을 눌러 보세요 · 반주는 알아서</div>
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
      ) : (
        song && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>
                {song.by} · {Math.min(row + 1, song.lines.length)}/{song.lines.length}
              </span>
              <button onClick={demo ? () => restart() : listen} className="font-bold text-[var(--kit-accent)]">
                {demo ? "■ 멈춤" : "♪ 들어보기"}
              </button>
            </div>
            <div className="min-h-10 text-[26px] leading-snug font-semibold break-keep">
              {line ? (
                [...lyric].map((c, i) => (
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
                  </span>
                ))
              ) : (
                <span className="text-zinc-900">끝 — 한 곡 완주!</span>
              )}
            </div>
            <div className="min-h-6 text-base text-zinc-300">{song.lines[row + 1] ? parse(song.lines[row + 1]).text : ""}</div>
          </div>
        )
      )}

      {!started ? (
        <StartButton onClick={start} />
      ) : free || line ? (
        <Keypad free={free} hint={line ? lyric[pos] : undefined} onNote={hit} />
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

function StartButton({ onClick, label = "▶ 연주 시작" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-[var(--kit-accent)] py-3.5 text-lg font-bold text-white">
      {label}
    </button>
  );
}

// 색은 둘 중 하나만 — 같이 주면 클래스 순서가 아니라 CSS 순서로 이겨서 불이 안 켜진다
const BEAT = 450; // 들어보기 한 박 (ms)

const KEY = "touch-manipulation select-none rounded-2xl border py-4 text-2xl font-bold ";
const tone = (lit: boolean) => KEY + (lit ? "border-[var(--kit-accent)] bg-orange-50 text-[var(--kit-accent)]" : "border-zinc-200 bg-white text-zinc-900");

/** 전화 키패드처럼 계이름 7개. 자유 모드엔 샵·내림(한 번만)과 옥타브 오르내림까지 */
function Keypad({ free, hint, onNote }: { free: boolean; hint?: string; onNote: (label: string, note: number) => void }) {
  const [oct, setOct] = useState(4);
  const [acc, setAcc] = useState(0);
  // 누르는 순간 소리 — 손을 뗄 때(click)까지 기다리면 건반 같지 않다. 키보드 Enter 는 click 으로
  const press = (fn: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      fn();
    },
    onClick: (e: React.MouseEvent) => {
      if (e.detail === 0) fn();
    },
  });
  const key = (s: string) => (
    <button key={s} className={tone(s === hint)} {...press(() => {
      onNote(s + (acc > 0 ? "♯" : acc < 0 ? "♭" : ""), 12 * (oct + 1) + SOLFA.indexOf(s) + acc);
      setAcc(0);
    })}>
      {s}
    </button>
  );
  const mod = (a: number, sign: string, name: string) => (
    <button className={tone(acc === a)} aria-label={name} {...press(() => setAcc((x) => (x === a ? 0 : a)))}>
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
          <button className={tone(false) + " !text-base"} {...press(() => setOct((o) => Math.max(2, o - 1)))}>▼ 낮게</button>
          <div className="flex items-center justify-center text-sm text-zinc-400">옥타브 {oct}</div>
          <button className={tone(false) + " !text-base"} {...press(() => setOct((o) => Math.min(6, o + 1)))}>▲ 높게</button>
        </>
      )}
    </div>
  );
}
