// Poison probe v2: always queue exactly one real action; use global speak() defensively;
// cast poison on its own frame; report enemy debuff status on non-cast frames.
function onIdle(me, enemy, game) {
  var f = game.frames;
  var foeT = enemy && enemy.tank;
  var foe = foeT ? foeT.position : null;
  var pos = me.tank.position, dir = me.tank.direction;
  var map = game.map;
  var ready = me.skill && me.skill.remainingCooldownFrames === 0;
  var msg = null;

  if (f === 0) {
    msg = "INIT skill=" + jstr(me.skill) + " status=" + jstr(me.status) +
          " poisonFn=" + (typeof me.poison) + " speakFn=" + (typeof speak);
  }

  if (foe && ready && typeof me.poison === "function") {
    // Cast on its own frame (skill consumes the action). Log intent via speak too.
    say("CAST@f" + f + " ePre=" + jstr(enemy.status) + " eEffPre=" + jstr(enemy.effects));
    me.poison();
    return;
  }

  if (foe) {
    say("SEE@f" + f + " ePois=" + (enemy.status && enemy.status.poisoned) +
        " eAS=" + (enemy.status && enemy.status.actionSpeed) +
        " eCanAct=" + (enemy.status && enemy.status.canActThisFrame) +
        " eDbf=" + jstr(enemy.effects && enemy.effects.debuff));
    var want = directionTo(pos, foe);
    if (dir === want) me.go(); else me.turn(turnDirection(dir, want));
    if (msg) say(msg);
    return;
  }

  if (msg) say(msg);
  var fwd = add(pos, delta(dir));
  if (isOpen(fwd, map)) me.go(); else me.turn("right");
}

function say(s) { try { speak(s); } catch (e) { try { me.speak(s); } catch (e2) {} } }
function jstr(o) { try { return JSON.stringify(o); } catch (e) { return "?"; } }
function directionTo(a, b) {
  if (b[0] > a[0]) return "right";
  if (b[0] < a[0]) return "left";
  if (b[1] > a[1]) return "down";
  return "up";
}
function turnDirection(c, t) {
  var d = ["up", "right", "down", "left"];
  var ci = d.indexOf(c), ti = d.indexOf(t);
  if (ci < 0 || ti < 0) return "right";
  return ((ti - ci + 4) % 4) === 3 ? "left" : "right";
}
function delta(dir) {
  if (dir === "up") return [0, -1];
  if (dir === "right") return [1, 0];
  if (dir === "down") return [0, 1];
  return [-1, 0];
}
function add(p, d) { return [p[0] + d[0], p[1] + d[1]]; }
function isOpen(p, map) {
  return map[p[0]] && map[p[0]][p[1]] && map[p[0]][p[1]] !== "x" && map[p[0]][p[1]] !== "m";
}
