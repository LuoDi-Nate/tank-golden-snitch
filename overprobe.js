// Overload geometry probe: face right, arm overload, fire one shot, then idle.
// We trace the two bullets' trajectories to learn if they share a line or offset/spread.
function onIdle(me, enemy, game) {
  var f = game.frames;
  var dir = me.tank.direction;
  var st = me.status || {};
  var armed = !!st.overloaded;
  var ready = me.skill && me.skill.remainingCooldownFrames === 0;
  var haveBullet = !!me.bullet;

  // 1) Face right (a clear open axis on most maps from spawn).
  if (dir !== "right") { me.turn(turnDirection(dir, "right")); return; }

  // 2) Arm overload once (only after we're settled, and no live bullet).
  if (!armed && ready && !haveBullet && f >= 2) { me.overload(); return; }

  // 3) Fire the armed overloaded shot exactly once.
  if (armed && !haveBullet) { me.fire(); return; }

  // 4) Idle harmlessly (bullets already launched); keep facing right.
  if (dir !== "right") { me.turn(turnDirection(dir, "right")); return; }
  // no-op-ish: nudge if open, else turn
  var f2 = add(me.tank.position, [1, 0]);
  if (isOpen(f2, game.map) && f < 6) { return me.turn("left"); }
  me.turn("left");
}
function turnDirection(c, t) { var d = ["up","right","down","left"]; return ((d.indexOf(t) - d.indexOf(c) + 4) % 4) === 3 ? "left" : "right"; }
function add(p, d) { return [p[0]+d[0], p[1]+d[1]]; }
function isOpen(p, map) { return map[p[0]] && map[p[0]][p[1]] && map[p[0]][p[1]] !== "x" && map[p[0]][p[1]] !== "m"; }
