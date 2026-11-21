import { useRef, useState } from "react";
import { AppShell, AppShellContent, AppShellHeader, Section, SegmentedControl, Watermark } from "@m1kapp/kit";
import { chord, noteName, pitch, pressed, split, SONGS } from "./music";
import { play, unlock, untilBeat } from "./audio";

const ACCENT = "#c2410c";
type SongId = (typeof SONGS)[number]["id"];

export default function App() {
  return (
    <Watermark trackSlug={import.meta.env.VITE_M1K_SLUG} color={ACCENT} text="typino">
      <AppShell accent={ACCENT}>
        <AppShellHeader>
          <span className="text-lg font-black tracking-tight text-zinc-900">typino</span>
          <span className="text-xs text-zinc-400">치면 시가 노래가 된다</span>
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
  const [last, setLast] = useState<{ ch: string; notes: number[] } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const song = SONGS.find((s) => s.id === songId)!;
  const line: string | undefined = song.lines[row];
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // 자모 하나 = 음 하나 (작게, 바로)
    for (const j of pressed(value, v)) play(pitch(j)!, 0, 0.08, 0.6);

    // 다음 글자가 붙는 순간 앞 글자가 확정된다 → 맞았으면 화음
    if (line && v.length > value.length) {
      const i = (e.target.selectionStart ?? v.length) - 2;
      const ch = v[i];
      if (ch && split(ch)) {
        if (ch === line[i]) {
          const notes = chord(ch)!;
          const w = untilBeat();
          notes.forEach((n, k) => play(n, w + k * 0.012, 0.2)); // 살짝 굴려서
          setLast({ ch, notes });
        } else {
          play(37, 0, 0.15, 0.25); // 틀리면 낮고 짧게
        }
      }
    }

    // 줄을 다 치고 스페이스 → 다음 줄. 스페이스로 조합이 끝난 뒤라 비워도 글자가 안 남는다
    if (line && v === line + " ") {
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
            [...line].map((c, i) => (
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
            <span className="text-zinc-900">끝 — 잘 들었어요</span>
          )}
        </div>
        <div className="min-h-6 text-base text-zinc-300">{song.lines[row + 1] ?? ""}</div>
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
            placeholder="따라 치세요 · 줄 끝에서 스페이스"
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
            {split(last.ch)!.filter(Boolean).join(" ")} → {last.notes.map(noteName).join(" · ")}
          </>
        )}
      </div>

      <p className="text-xs leading-relaxed text-zinc-400">
        자모 하나 = 음 하나. 글자가 완성되면 초성·중성·종성이 한 화음으로 울리고, 받침은 베이스가 됩니다. 음계는 C 펜타토닉이라
        틀려도 안 어긋나고, 화음은 8분음표 박자에 맞춰 떨어져요.
      </p>
    </Section>
  );
}
