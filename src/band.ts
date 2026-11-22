// 일정한 박자로 혼자 굴러가는 반주 — 피아노 왼손 8분 아르페지오 + 현악 + 드럼.
// 내가 쉬어도 음악은 흐르고, 나는 그 위에 손가락 하나로 얹는다.
import { chord } from "./music";
import { drum, now, pad, play, quiet } from "./audio";

/** prog 를 한 마디씩 돌린다. 마디가 시작할 때 onBar(몇 번째 마디). 멈출 함수를 돌려준다 */
export function band(prog: string[], bpm: number, drums: () => boolean, onBar: (bar: number) => void) {
  const eighth = 30 / bpm;
  let t = now() + 0.15;
  let step = 0;
  const timers: number[] = [];
  // 소리는 0.2초 앞까지 소리 시계로 예약한다 — setTimeout 만 믿으면 박이 흔들린다
  const tick = () => {
    while (t < now() + 0.2) {
      const bar = Math.floor(step / 8);
      const s = step % 8;
      const [bass, r, th, f] = chord(prog[bar % prog.length]);
      const at = t - now();
      play([bass, f - 12, r, th, f, th, r, f - 12][s], at, s ? 0.07 : 0.13, eighth * 3);
      if (drums()) {
        if (s % 2 === 0) drum(s % 4 ? "snare" : "kick", at);
        drum("hat", at);
      }
      if (s === 0)
        timers.push(
          window.setTimeout(() => {
            pad([r, th, f, r + 12], 4000);
            onBar(bar);
          }, at * 1000),
        );
      t += eighth;
      step++;
    }
  };
  tick();
  const id = window.setInterval(tick, 25);
  return () => {
    clearInterval(id);
    timers.forEach(clearTimeout);
    quiet();
  };
}
