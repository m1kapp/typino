// node --experimental-strip-types src/music.check.ts
import assert from "node:assert/strict";
import { isSyllable, midi, noteAt, SONGS, thirdBelow, typedMore } from "./music.ts";

assert.equal(midi("C4"), 60);
assert.equal(midi("G3"), 55);
assert.equal(thirdBelow(midi("E4")), midi("C4"));
assert.equal(thirdBelow(midi("C4")), midi("A3"));
assert.equal(thirdBelow(midi("F4")), midi("D4"));

// 가사 글자 수 = 음표 수 — 하나라도 어긋나면 노래가 밀린다
for (const s of SONGS)
  for (const [lyric, notes] of s.lines) {
    const syl = [...lyric].filter(isSyllable).length;
    assert.equal(syl, notes.split(" ").length, `${s.title}: ${lyric}`);
    notes.split(" ").forEach((n) => midi(n));
  }

const first = SONGS[0].lines[0]; // "한 글자씩 쳐 보자"
assert.equal(noteAt(first, 0), midi("C4"));
assert.equal(noteAt(first, 1), null); // 공백
assert.equal(noteAt(first, 2), midi("C4"));
assert.equal(noteAt(first, 3), midi("G4"));

assert.equal(typedMore("하", "한"), true);
assert.equal(typedMore("한", "하나"), true);
assert.equal(typedMore("한", "하"), false);
assert.equal(typedMore("고", "과"), true);
assert.equal(typedMore("한", "한"), false);

console.log("music ok");
