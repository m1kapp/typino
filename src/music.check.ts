// node --experimental-strip-types src/music.check.ts
import assert from "node:assert/strict";
import { midi, parse, solfa, SONGS, thirdBelow, typedMore } from "./music.ts";

assert.equal(midi("C4"), 60);
assert.equal(thirdBelow(midi("E4")), midi("C4"));
assert.equal(thirdBelow(midi("C4")), midi("A3"));

const first = parse(SONGS[0].lines[0]);
assert.equal(first.text, "도도솔솔 라라솔");
assert.deepEqual(first.notes, [60, 60, 67, 67, null, 69, 69, 67]);
assert.equal(parse("G4 G4 G5").text, "솔솔솔"); // 옥타브는 글에 안 보이고 음에만

// 곡 데이터가 전부 C장조 흰건반 — 계이름으로 칠 수 없는 음이 있으면 안 된다
for (const s of SONGS) for (const l of s.lines) assert.ok(!parse(l).text.includes("_"), `${s.title}: ${l}`);

// 틀린 계이름도 목표 음 근처 옥타브로 난다
assert.equal(solfa("레", 60), 62);
assert.equal(solfa("시", 60), 59);
assert.equal(solfa("솔", 72), 67);
assert.equal(solfa("가", 60), null);

assert.equal(typedMore("소", "솔"), true);
assert.equal(typedMore("솔", "소"), false);

console.log("music ok");
