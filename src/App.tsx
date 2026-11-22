import { useRef, useState } from "react";
import { AppShell, AppShellContent, AppShellHeader, Section, SegmentedControl, Watermark } from "@m1kapp/kit";
import { chord, fitChord, noteName, parse, solfa, SOLFA, SONGS, typedMore } from "./music";
import { play, unlock } from "./audio";

const ACCENT = "#c2410c";
type SongId = string;

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
  const [songId, setSongId] = useState<SongId>("free");
  const [row, setRow] = useState(0);
  const [value, setValue] = useState("");
  const [started, setStarted] = useState(false);
  const [last, setLast] = useState<{ ch: string; note: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const cur = useRef<string | null>(null); // 자유 모드: 지금 깔린 반주 코드
  const [played, setPlayed] = useState<{ label: string; note: number }[]>([]);

  const free = songId === "free";
  const song = SONGS.find((s) => s.id === songId);
  const line = song?.lines[row] ? parse(song.lines[row]) : null;
  const lyric = line?.text ?? "";
  const done = value.length - 1; // 마지막 글자는 아직 조합 중일 수 있어 판정하지 않는다

  const start = () => {
    unlock();
    setStarted(true);
    input.current?.focus();
  };
  const restart = (id: SongId = songId) => {
    setSongId(id);
    setRow(0);
    setValue("");
    setLast(null);
    cur.current = null;
    setPlayed([]);
    input.current?.focus();
  };

  // 오른손 선율 + 코드가 바뀌는 자리면 왼손 반주
  const ding = (ch: string, note: number, c: string | null) => {
    play(note, 0, 0.24);
    if (c) chord(c).forEach((n, k) => play(n, 0.01, k ? 0.06 : 0.16, 2.4));
    setLast({ ch, note });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // 계이름 한 글자를 다 치는 순간 그 음이 바로 난다. 틀린 계이름도 친 대로 — 건반처럼
    const i = (e.target.selectionStart ?? v.length) - 1;
    const ch = v[i];
    if (line && typedMore(value, v) && ch) {
      const near = line.notes.slice(0, i + 1).filter((n) => n != null).pop() ?? 60;
      const note = ch === lyric[i] && line.notes[i] != null ? line.notes[i] : solfa(ch, near);
      if (note != null) ding(ch, note, line.chords[i]);
    }

    // 줄을 다 치고 스페이스 → 다음 줄. 스페이스로 조합이 끝난 뒤라 비워도 글자가 안 남는다
    if (line && v === lyric + " ") {
      setRow((r) => r + 1);
      setValue("");
    } else {
      setValue(v);
    }
  };

  // 악보 없이 키패드로: 높이는 내가 정하고, 반주는 그 음을 품는 코드로 알아서
  const hit = (label: string, note: number) => {
    const c = fitChord(note, cur.current);
    ding(label, note, c !== cur.current ? c : null);
    cur.current = c;
    setPlayed((p) => [...p.slice(-11), { label, note }]);
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
      ) : song && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-zinc-400">
            {song.by} · {Math.min(row + 1, song.lines.length)}/{song.lines.length}
          </div>
          <div className="min-h-10 text-[26px] leading-snug font-semibold break-keep">
            {line ? (
              [...lyric].map((c, i) => (
                <span
                  key={i}
                  className={
                    i < done
                      ? value[i] === c ? "text-zinc-900" : "text-red-500 underline"
                      : i === done ? "text-zinc-900 border-b-2 border-[var(--kit-accent)]" : "text-zinc-300"
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
      )}

      {free ? (
        started ? <Keypad onNote={hit} /> : <StartButton onClick={start} className="py-3.5" />
      ) : line ? (
        <div className="relative">
          <input
            ref={input}
            value={value}
            onChange={onChange}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="계이름을 치면 그 음이 나요 · 줄 끝에서 스페이스"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-xl outline-none focus:border-[var(--kit-accent)]"
          />
          {!started && <StartButton onClick={start} className="absolute inset-0" />}
        </div>
      ) : (
        <button onClick={() => restart()} className="rounded-2xl bg-[var(--kit-accent)] py-3.5 text-lg font-bold text-white">
          다시 치기
        </button>
      )}

      <div className="min-h-8 font-mono text-sm text-zinc-400">
        {last && (
          <>
            <b className="mr-2 font-sans text-2xl text-[var(--kit-accent)]">{last.ch}</b>
            {noteName(last.note)}
          </>
        )}
      </div>

      <p className="text-xs leading-relaxed text-zinc-400">
        자판이 건반이에요. 도·레·미를 치면 도·레·미가 나고, 치는 빠르기가 곧 노래의 박자가 됩니다.
        틀린 계이름도 친 대로 울려요.
      </p>
    </Section>
  );
}

function StartButton({ onClick, className }: { onClick: () => void; className: string }) {
  return (
    <button onClick={onClick} className={`rounded-2xl bg-[var(--kit-accent)] text-lg font-bold text-white ${className}`}>
      ▶ 연주 시작
    </button>
  );
}

const KEY = "touch-manipulation select-none rounded-2xl border border-zinc-200 bg-white py-4 text-2xl font-bold text-zinc-900 active:bg-orange-50";

/** 전화 키패드처럼 계이름 7개 + 샵·내림(한 번만) + 옥타브 오르내림 */
function Keypad({ onNote }: { onNote: (label: string, note: number) => void }) {
  const [oct, setOct] = useState(4);
  const [acc, setAcc] = useState(0);
  // 누르는 순간 소리 — 손을 뗄 때(click)까지 기다리면 건반 같지 않다. 키보드 Enter 는 click 으로
  const press = (fn: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); fn(); },
    onClick: (e: React.MouseEvent) => { if (e.detail === 0) fn(); },
  });
  const note = (s: string) =>
    press(() => {
      onNote(s + (acc > 0 ? "♯" : acc < 0 ? "♭" : ""), 12 * (oct + 1) + SOLFA.indexOf(s) + acc);
      setAcc(0);
    });
  const mod = (a: number) => press(() => setAcc((x) => (x === a ? 0 : a)));
  const on = (a: number) => (acc === a ? " border-[var(--kit-accent)] text-[var(--kit-accent)]" : "");

  return (
    <div className="grid grid-cols-3 gap-2">
      {["도", "레", "미", "파", "솔", "라"].map((s) => (
        <button key={s} className={KEY} {...note(s)}>{s}</button>
      ))}
      <button className={KEY + on(-1)} {...mod(-1)} aria-label="내림">♭</button>
      <button className={KEY + on(1)} {...mod(1)} aria-label="올림">♯</button>
      <button className={KEY} {...note("시")}>시</button>
      <button className={KEY + " text-base"} {...press(() => setOct((o) => Math.max(2, o - 1)))}>▼ 낮게</button>
      <div className="flex items-center justify-center text-sm text-zinc-400">옥타브 {oct}</div>
      <button className={KEY + " text-base"} {...press(() => setOct((o) => Math.min(6, o + 1)))}>▲ 높게</button>
    </div>
  );
}
