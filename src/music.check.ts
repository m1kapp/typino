// node --experimental-strip-types src/music.check.ts
import assert from "node:assert/strict";
import { chord, pitch, pressed, split } from "./music.ts";

assert.deepEqual(split("한"), ["ㅎ", "ㅏ", "ㄴ"]);
assert.equal(split("a"), null);
assert.equal(pitch("ㄲ"), pitch("ㄱ"));
assert.equal(pitch("ㅘ"), pitch("ㅗ"));
assert.equal(chord("한")!.length, 3);
assert.equal(chord("하")!.length, 2);

// IME 가 값을 바꾸는 모양 그대로 — 매번 새로 눌린 자모 하나
const steps: [string, string, string[]][] = [
  ["", "ㅎ", ["ㅎ"]],
  ["ㅎ", "하", ["ㅏ"]],
  ["하", "한", ["ㄴ"]],
  ["한", "하나", ["ㅏ"]], // 받침이 다음 음절로 넘어가도 새 키는 ㅏ 하나
  ["고", "과", ["ㅏ"]], // 겹모음
  ["달", "닭", ["ㄱ"]], // 겹받침
  ["닭", "달가", ["ㅏ"]],
  ["한", "한 ", []], // 공백은 음 없음
  ["한글", "한그", []], // 지우기는 음 없음
];
for (const [a, b, want] of steps) assert.deepEqual(pressed(a, b), want, `${a} → ${b}`);

console.log("music ok");
