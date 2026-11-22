// Web Audio 로 피아노 비슷한 소리. 샘플 파일 없이 삼각파 + 배음 하나.

let ctx: AudioContext | null = null;

/** 탭 같은 사용자 동작 안에서 불러야 iOS 가 소리를 연다 */
export function unlock() {
  // 아이폰 무음 스위치가 켜져 있어도 소리 나게 (Safari 17+)
  const s = (navigator as { audioSession?: { type: string } }).audioSession;
  if (s) s.type = "playback";
  ctx ??= new AudioContext();
  void ctx.resume();
}

function voice(c: AudioContext, midi: number, g: GainNode, t: number, end: number) {
  const f = 440 * 2 ** ((midi - 69) / 12);
  return (
    [["triangle", 1, 1], ["sine", 2, 0.3]] as const
  ).map(([type, mul, amp]) => {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = type;
    o.frequency.value = f * mul;
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(end);
    return o;
  });
}

export function play(midi: number, when = 0, gain = 0.25, len = 1.6) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  g.connect(ctx.destination);
  voice(ctx, midi, g, t, t + len + 0.1);
}

/** 누르고 있는 동안 이어지는 소리. 뗄 때 부를 함수를 돌려준다 */
export function hold(midi: number, gain = 0.25): () => void {
  const c = ctx;
  if (!c) return () => {};
  const t = c.currentTime;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.005);
  // 피아노처럼 누르고 있어도 서서히 준다 — 떼는 걸 놓쳐도 음이 영영 남지 않게
  g.gain.setTargetAtTime(0, t + 0.005, 1.2);
  g.connect(c.destination);
  const os = voice(c, midi, g, t, t + 8);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const now = c.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.setTargetAtTime(0, now, 0.08);
    os.forEach((o) => o.stop(now + 0.6));
  };
}
