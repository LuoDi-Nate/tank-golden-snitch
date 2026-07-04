// 金色飞贼-OPUS · p1 — POISON build (skill = poison)
// Base = v17 (confirmed peak reactive core: star efficiency + predictive intercept fire
// + cover retreat + BFS star race). v17 only knew boost/teleport, so it left poison unused
// and — critically — had no escape tool. p1 rebuilds the skill layer around poison.
//
// Poison (verified in sandbox): me.poison() (no args) applies a 4-frame debuff to the
// enemy. A poisoned enemy reads status.canActThisFrame=false on slowed frames — it CANNOT
// dodge or fire. CD ~20. No aim/range/LOS requirement (works whenever enemy.tank != null),
// but casting the frame CONSUMES the action, so the combo is: cast this frame, fire next.
//
// How p1 uses it (edge = accuracy + kills; poison has NO escape value):
//   OFFENSE (primary): when the enemy is on our clear line and we're FACING them but the
//     straight shot would MISS (a crosser dodges), and they're in range & unshielded &
//     poison is ready -> POISON now, then next frame the frozen enemy eats a straight shot.
//     A poisoned enemy is always treated as a "good shot" -> we always fire on it.
//   DEFENSE (fallback): cornered at point-blank with an enemy aimed at us and no cover to
//     retreat to -> poison to deny their shot and buy a frame to counter/escape on foot.
// Everything else (star race, intercept fire, cover, patrol) is inherited from v17.

function onIdle(me, enemy, game) {
  var pos = me.tank.position;
  var dir = me.tank.direction;
  var map = game.map;

  var foeT = enemy && enemy.tank;
  var foe = foeT ? foeT.position : null;
  var foeDir = foeT ? foeT.direction : null;

  var eStatus = (enemy && enemy.status) || {};
  var shielded = !!eStatus.shielded;
  var foePoisoned = !!eStatus.poisoned;

  var mStatus = me.status || {};
  var fireLocked = !!mStatus.fireLocked;
  var haveBullet = !!me.bullet;
  var canFireNow = !haveBullet && !fireLocked;

  var skillReady = me.skill && me.skill.remainingCooldownFrames === 0;
  var canPoison = skillReady && typeof me.poison === "function";

  var myStars = (typeof me.stars === "number") ? me.stars : 0;

  var star = game.star;
  var starExists = !!star;

  // ---- 0. PREDICTIVE INTERCEPT FIRE ----
  // If a shot down our CURRENT facing will collide with the enemy given their motion,
  // take it now (guaranteed hit — no poison needed). Skip only the losing 0-star mutual.
  if (foe && canFireNow && !shielded) {
    var eAimNow = foeDir === directionTo(foe, pos) && canShoot(foe, pos, map);
    if (!(myStars === 0 && eAimNow) && interceptShot(pos, dir, foe, foeDir, map)) {
      me.fire();
      return;
    }
  }

  // ---- 1. COMBAT: enemy on a clear line ----
  if (foe && canShoot(pos, foe, map)) {
    var wantDir = directionTo(pos, foe);
    var enemyAimed = (foeDir === directionTo(foe, pos));
    var dist = manhattan(pos, foe);
    // A poisoned enemy is frozen (can't dodge) -> any aligned straight shot lands. good=true.
    var good = foePoisoned || goodShot(dist, foeDir, wantDir);

    var eSkill = enemy && enemy.skill;
    var enemyDisabler = eSkill && (eSkill.type === "freeze" || eSkill.type === "stun") &&
                        eSkill.remainingCooldownFrames === 0;
    var danger = enemyAimed || enemyDisabler;
    var insuranceLess = (myStars === 0 && enemyAimed && starExists);

    // 1) Immediate guaranteed shot: facing + good (point-blank / along-axis / already poisoned).
    if (canFireNow && !shielded && dir === wantDir && good && !insuranceLess) { me.fire(); return; }

    // 2) POISON LOCKDOWN (the core weapon): an aligned enemy in range that we can't cleanly
    //    hit *this* frame. Poison freezes them for 4 frames — they can neither dodge nor
    //    shoot — so we then turn/fire onto a stationary target for a near-guaranteed kill.
    //    This doubles as defense: it denies a point-blank enemy aimed at us their shot,
    //    covering for the teleport-escape this skill lacks. Don't waste it: skip if shielded,
    //    already poisoned, out of the reliable window (>5), or on the losing 0-star mutual.
    if (canPoison && !shielded && !foePoisoned && dist <= 5 && !insuranceLess) { me.poison(); return; }

    // 3) HIGH-PRESSURE FIRE: facing on a clear line -> shoot (refuse only the 0-star mutual).
    if (canFireNow && !shielded && dir === wantDir && !insuranceLess) { me.fire(); return; }
    // 4) Aligned but not facing, not in danger: pivot onto them to fire next frame.
    if (canFireNow && !shielded && !danger) { me.turn(turnDirection(dir, wantDir)); return; }
    // 5) Imminent lethal threat point-blank, poison unavailable: duck to cover.
    if (danger && dist <= 4) {
      if (escapeMove(me, dir, pos, foe, foeDir, star, map, canPoison, foePoisoned)) return;
    }
    // 6) No star to race for -> hunt: close to point-blank or set up the shot.
    if (!starExists) {
      if (dir === wantDir) {
        if (!shielded && dist > 2 && isOpen(add(pos, delta(dir)), map)) { me.go(); return; }
        if (canFireNow && !shielded) { me.fire(); return; }
        if (escapeMove(me, dir, pos, foe, foeDir, star, map, canPoison, foePoisoned)) return;
        me.fire();
        return;
      }
      if (danger) { if (escapeMove(me, dir, pos, foe, foeDir, star, map, canPoison, foePoisoned)) return; }
      me.turn(turnDirection(dir, wantDir));
      return;
    }
    // 7) A star exists and no urgent combat action -> fall through to grab it.
  }

  // ---- 2. DODGE an incoming enemy bullet ----
  var eb = enemy && enemy.bullet;
  if (eb && eb.position && bulletThreatens(eb, pos, map)) {
    if (stepOffLane(me, dir, pos, eb.position, map)) return;
  }

  // ---- 3. STAR RACE / APPROACH ----
  var target = star || foe;
  if (target) {
    var next = bfsFirst(pos, target, map, false);
    if (!next) next = bfsFirst(pos, target, map, true);
    if (!next) next = greedyStep(pos, target, map);

    if (next) {
      if (isOpen(next, map)) {
        // Don't walk into a tile the enemy is currently aimed at.
        if (foe && !samePos(next, foe) && enemyThreatens(foe, foeDir, next, map)) {
          var alt = safeStep(pos, target, foe, foeDir, map);
          if (alt) { moveToward(me, dir, pos, alt); return; }
          me.turn(turnDirection(dir, directionTo(pos, foe)));
          return;
        }
        moveToward(me, dir, pos, next);
        return;
      }
      // Next tile is a dirt mound blocking the path — shoot it to open the way.
      var digDir = directionTo(pos, next);
      if (dir === digDir) { me.fire(); return; }
      me.turn(turnDirection(dir, digDir));
      return;
    }
  }

  patrol(me, dir, pos, map);
}

// ---- movement ----
function moveToward(me, currentDir, from, to) {
  var dir = directionTo(from, to);
  if (currentDir === dir) me.go();
  else me.turn(turnDirection(currentDir, dir));
}

function patrol(me, currentDir, position, map) {
  var forward = add(position, delta(currentDir));
  if (isOpen(forward, map)) me.go();
  else me.turn("right");
}

// Escape a threat. Poison has no teleport-style escape, so: first, if the enemy is aimed
// at us and poison is ready, poison to deny their shot (we counter next frame). Otherwise
// fall back to on-foot cover / perpendicular sidestep.
function escapeMove(me, dir, pos, foe, foeDir, star, map, canPoison, foePoisoned) {
  if (canPoison && !foePoisoned && foe && foeDir &&
      foeDir === directionTo(foe, pos) && canShoot(foe, pos, map)) {
    me.poison(); return true;
  }
  return evade(me, dir, pos, foe, map);
}

function evade(me, dir, pos, foe, map) {
  var dirs = ["up", "right", "down", "left"];
  var turnMove = null;
  for (var i = 0; i < 4; i++) {
    var n = add(pos, delta(dirs[i]));
    if (!isOpen(n, map) || samePos(n, foe)) continue;
    var exposed = isAligned(foe, n) && canShoot(foe, n, map);
    if (exposed) continue;                        // still shootable -> not cover
    if (dir === dirs[i]) { me.go(); return true; } // covered & facing it -> go now
    if (!turnMove) turnMove = dirs[i];
  }
  if (turnMove) { me.turn(turnDirection(dir, turnMove)); return true; }
  return stepOffLane(me, dir, pos, foe, map);
}

// Step out of a horizontal/vertical lane defined by `lanePos`.
function stepOffLane(me, dir, pos, lanePos, map) {
  var horizontal = pos[1] === lanePos[1];
  var perp = horizontal ? ["up", "down"] : ["left", "right"];
  for (var i = 0; i < perp.length; i++) {
    if (dir === perp[i] && isOpen(add(pos, delta(perp[i])), map)) { me.go(); return true; }
  }
  for (var j = 0; j < perp.length; j++) {
    if (isOpen(add(pos, delta(perp[j])), map)) { me.turn(turnDirection(dir, perp[j])); return true; }
  }
  return false;
}

// ---- aiming ----
function interceptShot(pos, dir, foe, foeDir, map) {
  var bstep = delta(dir);
  var b = add(pos, bstep);
  var e = [foe[0], foe[1]];
  var estep = foeDir ? delta(foeDir) : [0, 0];
  for (var f = 0; f < 12; f++) {
    for (var sub = 0; sub < 2; sub++) {           // bullet advances two tiles per frame
      if (!isOpen(b, map)) return false;
      if (samePos(b, e)) return true;
      b = add(b, bstep);
    }
    var en = add(e, estep);
    if (isOpen(en, map)) e = en;
    if (samePos(b, e)) return true;
  }
  return false;
}

function goodShot(dist, foeDir, shotDir) {
  if (dist <= 2) return true;
  if (!foeDir) return dist <= 4;
  var shotHoriz = (shotDir === "left" || shotDir === "right");
  var foeHoriz = (foeDir === "left" || foeDir === "right");
  return shotHoriz === foeHoriz;
}

// ---- threat model ----
function bulletThreatens(eb, pos, map) {
  var bp = eb.position;
  if (!isAligned(bp, pos)) return false;
  if (samePos(bp, pos)) return true;
  if (eb.direction && eb.direction !== directionTo(bp, pos)) return false;
  return canShoot(bp, pos, map);
}

function enemyThreatens(foe, foeDir, tile, map) {
  if (!foe) return false;
  if (!isAligned(foe, tile)) return false;
  if (!canShoot(foe, tile, map)) return false;
  return foeDir === directionTo(foe, tile);
}

function safeStep(pos, target, foe, foeDir, map) {
  var dirs = ["up", "right", "down", "left"];
  var best = null, bestd = 1e9;
  for (var i = 0; i < 4; i++) {
    var n = add(pos, delta(dirs[i]));
    if (!isOpen(n, map)) continue;
    if (foe && !samePos(n, foe) && enemyThreatens(foe, foeDir, n, map)) continue;
    var d = manhattan(n, target);
    if (d < bestd) { bestd = d; best = n; }
  }
  return best;
}

// ---- pathfinding (bounded BFS) ----
var MAX_NODES = 600;
function bfsFirst(start, goal, map, allowDirt) {
  var queue = [{ pos: start, first: null }];
  var seen = {};
  seen[key(start)] = true;
  var dirs = ["up", "right", "down", "left"];
  var expanded = 0;
  for (var head = 0; head < queue.length && expanded < MAX_NODES; head++) {
    var item = queue[head];
    expanded++;
    if (samePos(item.pos, goal)) return item.first;
    for (var i = 0; i < 4; i++) {
      var next = add(item.pos, delta(dirs[i]));
      var k = key(next);
      if (seen[k]) continue;
      var pass = allowDirt ? isPassable(next, map) : isOpen(next, map);
      if (!pass) continue;
      seen[k] = true;
      queue.push({ pos: next, first: item.first || next });
    }
  }
  return null;
}

function greedyStep(pos, goal, map) {
  var dirs = ["up", "right", "down", "left"];
  var best = null, bd = 1e9;
  for (var i = 0; i < 4; i++) {
    var n = add(pos, delta(dirs[i]));
    if (!isOpen(n, map)) continue;
    var d = manhattan(n, goal);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

// ---- line of sight / aiming ----
function canShoot(a, b, map) {
  if (a[0] !== b[0] && a[1] !== b[1]) return false;
  var dir = directionTo(a, b);
  var step = delta(dir);
  var pos = add(a, step);
  while (!samePos(pos, b)) {
    if (!isOpen(pos, map)) return false;
    pos = add(pos, step);
  }
  return true;
}

function isAligned(a, b) { return a && b && (a[0] === b[0] || a[1] === b[1]); }

function directionTo(a, b) {
  if (b[0] > a[0]) return "right";
  if (b[0] < a[0]) return "left";
  if (b[1] > a[1]) return "down";
  return "up";
}

function turnDirection(currentDir, targetDir) {
  var dirs = ["up", "right", "down", "left"];
  var current = dirs.indexOf(currentDir);
  var target = dirs.indexOf(targetDir);
  if (current < 0 || target < 0) return "right";
  var diff = (target - current + 4) % 4;
  return diff === 3 ? "left" : "right";
}

// ---- grid utils ----
function delta(dir) {
  if (dir === "up") return [0, -1];
  if (dir === "right") return [1, 0];
  if (dir === "down") return [0, 1];
  return [-1, 0];
}
function add(pos, d) { return [pos[0] + d[0], pos[1] + d[1]]; }
function isOpen(pos, map) {
  return map[pos[0]] && map[pos[0]][pos[1]] && map[pos[0]][pos[1]] !== "x" && map[pos[0]][pos[1]] !== "m";
}
function isPassable(pos, map) {
  return map[pos[0]] && map[pos[0]][pos[1]] && map[pos[0]][pos[1]] !== "x";
}
function samePos(a, b) { return a[0] === b[0] && a[1] === b[1]; }
function key(pos) { return pos[0] + "," + pos[1]; }
function manhattan(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return (dx < 0 ? -dx : dx) + (dy < 0 ? -dy : dy); }
