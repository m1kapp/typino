// Web Audio 로 피아노 비슷한 소리. 샘플 파일 없이 삼각파 + 배음 하나.

let ctx: AudioContext | null = null;
let t0 = 0;
const STEP = 60 / 96 / 2; // 96 BPM 8분음표

/** 탭 같은 사용자 동작 안에서 불러야 iOS 가 소리를 연다 */
export function unlock() {
  // 아이폰 무음 스위치가 켜져 있어도 소리 나게 (Safari 17+)
  const s = (navigator as { audioSession?: { type: string } }).audioSession;
  if (s) s.type = "playback";
  ctx ??= new AudioContext();
  void ctx.resume();
  t0 = ctx.currentTime;
}

/** 다음 박자 칸까지 남은 초 — 치는 손이 흔들려도 화음은 박자에 떨어진다 */
export function untilBeat() {
  if (!ctx) return 0;
  const e = ctx.currentTime - t0;
  return Math.ceil(e / STEP) * STEP - e;
}

export function play(midi: number, when = 0, gain = 0.25, len = 1.6) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const f = 440 * 2 ** ((midi - 69) / 12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  g.connect(ctx.destination);
  for (const [type, mul, amp] of [["triangle", 1, 1], ["sine", 2, 0.3]] as const) {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = type;
    o.frequency.value = f * mul;
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + len + 0.1);
  }
}
