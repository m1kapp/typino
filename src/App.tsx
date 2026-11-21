import { useRef, useState } from "react";
import { AppShell, AppShellContent, AppShellHeader, Section, SegmentedControl, Watermark } from "@m1kapp/kit";
import { chord, noteName, pressed, split, SONGS } from "./music";
import { play, unlock } from "./audio";

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

  const ding = (ch: string) => {
    const notes = chord(ch)!;
    notes.forEach((n, k) => play(n, k * 0.012, 0.22)); // 살짝 굴려서 한 덩어리로
    setLast({ ch, notes });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // 글자 하나 = 띵 하나. 치는 글자가 그 자리 글자와 같아지는 순간 바로 울린다
    // (다 → 띵, 리 → 띵). 다음 글자로 넘어가길 기다리지 않는다.
    const i = (e.target.selectionStart ?? v.length) - 1;
    const ch = v[i];
    if (line && pressed(value, v).length && ch && split(ch)) {
      if (ch === line[i]) ding(ch);
      // 목표와 다른 채로 다음 글자로 넘어가면 그 글자는 틀린 것 — 낮게 툭
      else if (v.length > value.length && v[i - 1] && v[i - 1] !== line[i - 1]) play(37, 0, 0.15, 0.25);
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
        글자 하나 = 띵 하나. 글자를 다 치는 순간 초성·중성·종성이 한 화음으로 울리고, 받침은 베이스가 됩니다. 음계는 C 펜타토닉이라
        어떤 글자든 안 어긋나요.
      </p>
    </Section>
  );
}
