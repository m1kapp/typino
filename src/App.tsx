import { useRef, useState } from "react";
import { AppShell, AppShellContent, AppShellHeader, Section, SegmentedControl, Watermark } from "@m1kapp/kit";
import { noteName, parse, solfa, SONGS, thirdBelow, typedMore } from "./music";
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
  const [songId, setSongId] = useState<SongId>(SONGS[0].id);
  const [row, setRow] = useState(0);
  const [value, setValue] = useState("");
  const [started, setStarted] = useState(false);
  const [last, setLast] = useState<{ ch: string; note: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const song = SONGS.find((s) => s.id === songId)!;
  const line = song.lines[row] ? parse(song.lines[row]) : null;
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
    input.current?.focus();
  };

  // 선율 음 + 3도 아래 음을 같이 — 피아노 오른손 두 손가락
  const ding = (ch: string, note: number) => {
    play(note, 0, 0.24);
    play(thirdBelow(note), 0.01, 0.1);
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
      if (note != null) ding(ch, note);
    }

    // 줄을 다 치고 스페이스 → 다음 줄. 스페이스로 조합이 끝난 뒤라 비워도 글자가 안 남는다
    if (line && v === lyric + " ") {
      setRow((r) => r + 1);
      setValue("");
    } else {
      setValue(v);
    }
  };

  return (
    <Section className="flex flex-col gap-6 pt-4 pb-8">
      <SegmentedControl
        value={songId}
        onChange={(id) => restart(id)}
        options={SONGS.map((s) => ({ value: s.id, label: s.title }))}
      />

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

      {line ? (
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
          {!started && (
            <button
              onClick={start}
              className="absolute inset-0 rounded-2xl bg-[var(--kit-accent)] text-lg font-bold text-white"
            >
              ▶ 연주 시작
            </button>
          )}
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
