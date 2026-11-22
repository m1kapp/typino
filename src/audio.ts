// 피아노 소리. 그랜드 피아노 녹음(Salamander, CC BY 3.0)을 단3도마다 한 장 받아 두고 사이 음은 속도를 바꿔 낸다.
// 받기 전·못 받으면 삼각파 + 배음으로 대신 낸다. 모든 소리는 방 울림(잔향)을 살짝 지난다.

let ctx: AudioContext | null = null;
let out: AudioNode; // 모든 소리가 들어가는 곳 — 원음 + 잔향 → 압축기 → 스피커
const bufs = new Map<number, AudioBuffer>();
const SAMPLE = ["C", "Ds", "Fs", "A"]; // 3반음 간격, 1~6옥타브
const LOUD = 4; // 녹음은 최고 -10dB 쯤이라 삼각파 때와 크기를 맞춘다

/** 탭 같은 사용자 동작 안에서 불러야 iOS 가 소리를 연다 */
export function unlock() {
  // 아이폰 무음 스위치가 켜져 있어도 소리 나게 (Safari 17+)
  const s = (navigator as { audioSession?: { type: string } }).audioSession;
  if (s) s.type = "playback";
  if (!ctx) {
    ctx = new AudioContext();
    out = room(ctx);
    load(ctx);
  }
  void ctx.resume();
}

function room(c: AudioContext) {
  const comp = c.createDynamicsCompressor(); // 화음 + 선율이 겹쳐도 깨지지 않게
  comp.connect(c.destination);
  const dry = c.createGain();
  dry.connect(comp);
  // 잔향: 점점 작아지는 잡음을 울림 모양으로 쓴다
  const len = c.sampleRate * 2.2;
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  const rev = c.createConvolver();
  rev.buffer = ir;
  const wet = c.createGain();
  wet.gain.value = 0.25;
  dry.connect(rev).connect(wet).connect(comp);
  return dry;
}

function load(c: AudioContext) {
  for (let o = 1; o <= 6; o++)
    SAMPLE.forEach((n, k) => {
      fetch(`/piano/${n}${o}.mp3`)
        .then((r) => r.arrayBuffer())
        .then((a) => c.decodeAudioData(a))
        .then((b) => bufs.set(12 * (o + 1) + k * 3, b))
        .catch(() => {}); // 못 받은 음은 삼각파로
    });
}

/** 가장 가까운 녹음 */
function near(midi: number) {
  for (let d = 0; d < 8; d++) for (const m of [midi - d, midi + d]) if (bufs.has(m)) return m;
  return null;
}

// 한 음을 g 로 보낸다. 녹음이 있으면 녹음, 없으면 삼각파. 멈출 소리들을 돌려준다
function voice(c: AudioContext, midi: number, g: GainNode, t: number, end: number): AudioScheduledSourceNode[] {
  const s = near(midi);
  if (s != null) {
    const src = c.createBufferSource();
    src.buffer = bufs.get(s)!;
    src.playbackRate.value = 2 ** ((midi - s) / 12);
    src.connect(g);
    src.start(t);
    src.stop(end);
    return [src];
  }
  const f = 440 * 2 ** ((midi - 69) / 12);
  return ([["triangle", 1, 1], ["sine", 2, 0.3]] as const).map(([type, mul, amp]) => {
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

// 녹음은 소리가 저절로 줄어드니 크기만 주고, 삼각파는 피아노처럼 줄어들게 만든다
function envelope(g: GainNode, t: number, gain: number, sampled: boolean, decay: number) {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(sampled ? gain * LOUD : gain, t + 0.005);
  if (!sampled) g.gain.setTargetAtTime(0, t + 0.005, decay);
}

export function play(midi: number, when = 0, gain = 0.25, len = 1.6) {
  const c = ctx;
  if (!c) return;
  const t = c.currentTime + when;
  const g = c.createGain();
  const sampled = near(midi) != null;
  envelope(g, t, gain, sampled, len / 4);
  g.gain.setTargetAtTime(0, t + len, 0.15); // 손을 뗀다
  g.connect(out);
  voice(c, midi, g, t, t + len + 1);
}

/** 누르고 있는 동안 이어지는 소리. 뗄 때 부를 함수를 돌려준다 */
export function hold(midi: number, gain = 0.25): () => void {
  const c = ctx;
  if (!c) return () => {};
  const t = c.currentTime;
  const g = c.createGain();
  const sampled = near(midi) != null;
  // 누르고 있어도 서서히 준다 — 떼는 걸 놓쳐도 음이 영영 남지 않게 (녹음은 6초에서 끝난다)
  envelope(g, t, gain, sampled, 1.2);
  g.connect(out);
  const os = voice(c, midi, g, t, t + 8);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const now = c.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.setTargetAtTime(0, now, 0.1);
    os.forEach((o) => o.stop(now + 0.6));
  };
}
