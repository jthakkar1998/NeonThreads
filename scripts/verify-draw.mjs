import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';

function randomDraw(members) {
  // This reproduces the SQL draw's algorithm, not the database transaction.
  const order = [...members];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return new Map(order.map((m,i)=>[m,order[(i+1)%order.length]]));
}

function verify(members, draw) {
  assert.equal(draw.size,members.length,'everyone gives once');
  assert.equal(new Set(draw.values()).size,members.length,'everyone receives once');
  for (const [giver,receiver] of draw) {
    assert.notEqual(giver,receiver,'no self assignment');
    assert.notEqual(draw.get(receiver),giver,'no reciprocal pair');
    assert(members.includes(receiver),'recipients must belong to group');
  }
}

let checks=0;
for (const size of [3,4,5,10,11,20,100,200]) {
  const members=Array.from({length:size},(_,i)=>`member-${i}`);
  for (let iteration=0;iteration<250;iteration++) {
    verify(members,randomDraw(members));checks++;
  }
}
console.log(`PASSED: ${checks} randomized circular-draw cases across groups of 3–200.`);
console.log('Note: this checks the draw invariant, not live Supabase RPC or RLS behavior.');
