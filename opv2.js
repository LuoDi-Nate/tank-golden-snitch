// 金色飞贼-OPUS · opv2 —— 超载(overload)版 + 保优避战
// 基础 = opv1(超载两车道射击)。opv2 新增「保优避战」:领先2星以上时遇威胁一律闪避、不恋战对枪,
// 只打敌没瞄我的绝对安全干净杀 —— 修复钻石段"领先还去换命被反杀"的送头败因(尤诺4-0、Moming 2-0)。
//
// 只重写「技能层」为 overload。
//
// 【overload 几何——沙盒实测】me.overload() 给下一发子弹装填「两颗子弹」。施放消耗当帧动作
// (本帧装填、下帧开火);装填最多保持10帧;冷却32帧。两颗子弹相隔一条车道:
//   - 朝向 左/右(横向):覆盖「我这一行 y」和「下面一行 y+1」。
//   - 朝向 上/下(纵向):覆盖「我这一列 x」和「右边一列 x+1」。
//   => 超载射击 = 「两条车道宽」的射击。能打中在我这条线上、或偏 +垂直方向一条车道的敌人
//      (「跨行/跨列」击杀),并能补到一个侧移躲进那条车道的敌人。
//
// opv1 的用法:
//   - 敌在我「正线」上:开火前若技能就绪先装填 overload,让子弹顺带覆盖相邻车道、封住其闪避;然后开火。
//   - 敌在「+垂直相邻车道」(普通坦克打不到的角度):转向到可覆盖方向、装填、发一发两车道射击跨行打死它。
// 抢星 / 闪避 / 劣势换命 / 缓存寻路 全部沿用 p4。

function onIdle(me, enemy, game) {
  var pos = me.tank.position;
  var dir = me.tank.direction;
  var map = game.map;

  // 每局开局清空缓存路径(globalThis 跨帧保留)。
  if (game.frames === 0 && typeof globalThis !== "undefined") globalThis.__nav = null;

  var foeT = enemy && enemy.tank;
  var foe = foeT ? foeT.position : null;
  var foeDir = foeT ? foeT.direction : null;

  var eStatus = (enemy && enemy.status) || {};
  var shielded = !!eStatus.shielded;

  var mStatus = me.status || {};
  var fireLocked = !!mStatus.fireLocked;
  var haveBullet = !!me.bullet;
  var canFireNow = !haveBullet && !fireLocked;

  var skillReady = me.skill && me.skill.remainingCooldownFrames === 0;
  var canOverload = skillReady && typeof me.overload === "function";
  var overloaded = !!mStatus.overloaded;

  var myStars = (typeof me.stars === "number") ? me.stars : 0;
  var enemyStars = (enemy && typeof enemy.stars === "number") ? enemy.stars : 0;

  var star = game.star;
  var starExists = !!star;

  // ---- 0. 预判拦截射击 ----
  // 若沿当前朝向开火、结合敌人运动会撞上敌人,立即开火。只跳过「劣势换命」:敌也瞄着我
  // 且我方星数不占优,双亡会按星数判负。
  if (foe && canFireNow && !shielded) {
    var eAimNow = foeDir === directionTo(foe, pos) && canShoot(foe, pos, map);
    var lm0 = eAimNow && (myStars <= enemyStars);
    if (!lm0 && interceptShot(pos, dir, foe, foeDir, map)) {
      me.fire();
      return;
    }
  }

  // ---- 1. 交战:敌在我「正线」上(同行/同列) ----
  if (foe && canShoot(pos, foe, map)) {
    var wantDir = directionTo(pos, foe);
    var enemyAimed = (foeDir === directionTo(foe, pos));
    var dist = manhattan(pos, foe);
    var good = goodShot(dist, foeDir, wantDir);

    var eSkill = enemy && enemy.skill;
    var enemyDisabler = eSkill && (eSkill.type === "freeze" || eSkill.type === "stun") &&
                        eSkill.remainingCooldownFrames === 0;
    var danger = enemyAimed || enemyDisabler;
    // 劣势换命:敌瞄着我且我方星数不占优 —— 对射双亡会按星数判负。干净击杀(敌没瞄我)无论星数都赢。
    var losingMutual = enemyAimed && (myStars <= enemyStars);

    // 0) 保优避战:领先2星以上时不必冒险对枪。遇到威胁(敌瞄我/控制技能就绪)一律闪避脱离,
    //    只留给下面"敌没瞄我"的绝对安全干净杀。复盘发现"领先还去换命"被反杀是可修的送头败因。
    var bigLead = myStars >= enemyStars + 2;
    if (bigLead && danger) { if (escapeMove(me, dir, pos, foe, map)) return; }

    // 1) 装填 overload:即将射击一个正线上的敌人、技能就绪、且我有主动权(敌没瞄我,花一帧安全)
    //    -> 先装填,让子弹顺带覆盖相邻车道、封住其闪避。下一帧开火。
    if (canOverload && !overloaded && !shielded && dir === wantDir && !danger && !losingMutual && canFireNow) {
      me.overload(); return;
    }
    // 2) 开火(已装填则为两车道射击):已正对 + (稳中 或 已超载) + 非劣势换命。
    if (canFireNow && !shielded && dir === wantDir && (good || overloaded) && !losingMutual) { me.fire(); return; }

    // 3) 劣势换命 -> 不对射,侧移脱离其车道。
    if (losingMutual && dist <= 6) { if (escapeMove(me, dir, pos, foe, map)) return; }

    // 4) 高压射击:正对清晰射线就开火(只拒绝劣势换命)。
    if (canFireNow && !shielded && dir === wantDir && !losingMutual) { me.fire(); return; }
    // 5) 同线但没正对、且无威胁:转向瞄准,下帧开火。
    if (canFireNow && !shielded && !danger) { me.turn(turnDirection(dir, wantDir)); return; }
    // 6) 贴脸致命威胁:闪避到掩体。
    if (danger && dist <= 4) { if (escapeMove(me, dir, pos, foe, map)) return; }
    // 7) 场上无星可抢 -> 追猎:贴近到近身或摆好射击位。
    if (!starExists) {
      if (dir === wantDir) {
        if (!shielded && dist > 2 && isOpen(add(pos, delta(dir)), map)) { me.go(); return; }
        if (canFireNow && !shielded) { me.fire(); return; }
        if (escapeMove(me, dir, pos, foe, map)) return;
        me.fire();
        return;
      }
      if (danger) { if (escapeMove(me, dir, pos, foe, map)) return; }
      me.turn(turnDirection(dir, wantDir));
      return;
    }
    // 8) 场上有星、且无紧急交战动作 -> 落到下面去抢星。
  }
  // ---- 1c. 跨行超载:敌不在我正线上、但在「+垂直相邻车道」,超载两车道射击能打到(普通坦克
  //     打不到的角度)。此时敌不在我轴线上、本帧无法直射我 -> 绝对安全。转向到可覆盖方向、
  //     装填、发一发两车道射击。
  else if (foe && !shielded && (overloaded || canOverload)) {
    var cdir = overloadDir(pos, foe, map);
    if (cdir) {
      if (dir === cdir) {
        if (overloaded && canFireNow) { me.fire(); return; }
        if (canOverload && canFireNow) { me.overload(); return; }
      } else {
        me.turn(turnDirection(dir, cdir)); return;
      }
    }
  }

  // ---- 2. 躲避来袭子弹 ----
  var eb = enemy && enemy.bullet;
  if (eb && eb.position && bulletThreatens(eb, pos, map)) {
    if (stepOffLane(me, dir, pos, eb.position, map)) return;
  }

  // ---- 3. 抢星/接近(缓存路径 -> 避免每帧BFS导致runTime) ----
  var target = star || foe;
  if (target) {
    // 只对「静止的星」跑BFS并缓存;移动的敌人用廉价的贪心步进 —— 对移动目标每帧全寻路是迷宫图runTime的元凶。
    var next = star ? planStep(pos, star, map) : null;
    if (!next) next = greedyStep(pos, target, map);

    if (next) {
      if (isOpen(next, map)) {
        // 别走进敌人当前正瞄准的格子。
        if (foe && !samePos(next, foe) && enemyThreatens(foe, foeDir, next, map)) {
          var alt = safeStep(pos, target, foe, foeDir, map);
          if (alt) { moveToward(me, dir, pos, alt); return; }
          me.turn(turnDirection(dir, directionTo(pos, foe)));
          return;
        }
        moveToward(me, dir, pos, next);
        return;
      }
      // 下一格是可摧毁的土堆挡路 —— 开火轰开。
      var digDir = directionTo(pos, next);
      if (dir === digDir) { me.fire(); return; }
      me.turn(turnDirection(dir, digDir));
      return;
    }
  }

  patrol(me, dir, pos, map);
}

// ---- 移动 ----
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

// 脱险:overload 没有逃生功能,只能靠徒步走位到掩体/侧移求生。
function escapeMove(me, dir, pos, foe, map) {
  return evade(me, dir, pos, foe, map);
}

// 计算「跨行超载」应朝向的方向:当敌在 +垂直相邻车道(不在我正线)时,朝该方向的两车道射击能命中。
// 横向朝向覆盖 y+1 行;纵向朝向覆盖 x+1 列。
function overloadDir(pos, foe, map) {
  if (foe[1] === pos[1] + 1) {                       // foe one row below -> horizontal shot
    if (foe[0] > pos[0] && clearRow(pos[0], foe[0], foe[1], map)) return "right";
    if (foe[0] < pos[0] && clearRow(foe[0], pos[0], foe[1], map)) return "left";
  }
  if (foe[0] === pos[0] + 1) {                       // foe one col right -> vertical shot
    if (foe[1] > pos[1] && clearCol(pos[1], foe[1], foe[0], map)) return "down";
    if (foe[1] < pos[1] && clearCol(foe[1], pos[1], foe[0], map)) return "up";
  }
  return null;
}
function clearRow(x0, x1, y, map) {
  var lo = x0 < x1 ? x0 : x1, hi = x0 < x1 ? x1 : x0;
  for (var x = lo + 1; x < hi; x++) if (!isOpen([x, y], map)) return false;
  return true;
}
function clearCol(y0, y1, x, map) {
  var lo = y0 < y1 ? y0 : y1, hi = y0 < y1 ? y1 : y0;
  for (var y = lo + 1; y < hi; y++) if (!isOpen([x, y], map)) return false;
  return true;
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

// 从 lanePos 所在的横/纵车道垂直侧移出去。
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

// ---- 瞄准 ----
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

// ---- 威胁模型 ----
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

// ---- 寻路(有节点上限的BFS) ----
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

// 用带父指针的有界BFS求 start..goal 的完整最短路径(含端点),失败返回 null。
function bfsPath(start, goal, map, allowDirt) {
  var queue = [start];
  var parent = {};
  var seen = {};
  seen[key(start)] = true;
  var dirs = ["up", "right", "down", "left"];
  var expanded = 0;
  for (var head = 0; head < queue.length && expanded < MAX_NODES; head++) {
    var cur = queue[head];
    expanded++;
    if (samePos(cur, goal)) {
      var path = [cur];
      var k = key(cur);
      while (parent[k]) { var p = parent[k]; path.unshift(p); k = key(p); }
      return path;
    }
    for (var i = 0; i < 4; i++) {
      var nx = add(cur, delta(dirs[i]));
      var kk = key(nx);
      if (seen[kk]) continue;
      var pass = allowDirt ? isPassable(nx, map) : isOpen(nx, map);
      if (!pass) continue;
      seen[kk] = true;
      parent[kk] = cur;
      queue.push(nx);
    }
  }
  return null;
}

// 朝目标的缓存下一步。只在目标改变或离开缓存路径时才重算BFS;
// 否则只是 O(路径长) 的下标推进。关键:失败也缓存 ——
// 当无路可达(如星被传送缺口隔断)时,退避 COOL 帧再重试,
// 而不是每帧都跑一次600节点搜索 —— 那种无节制重试正是 runTime 自动判负的真凶。
// 返回 null 时调用方改为贪心游走。
function planStep(pos, goal, map) {
  var g = (typeof globalThis !== "undefined") ? globalThis : null;
  var gk = goal[0] + "," + goal[1];
  var c = g ? g.__nav : null;

  // 仍在该目标的有效缓存路径上 -> 廉价的下标推进。
  if (c && c.gk === gk && c.path) {
    for (var j = c.i; j < c.path.length; j++) {
      if (samePos(c.path[j], pos)) { c.i = j; return c.path[c.i + 1] || null; }
    }
  }
  // 最近对该目标寻路失败 -> 退避(别每帧猛跑BFS)。
  if (c && c.fail && c.gk === gk && c.cool > 0) { c.cool--; return null; }

  var path = bfsPath(pos, goal, map, false);
  if (!path) path = bfsPath(pos, goal, map, true);
  if (!path || path.length < 2) {
    if (g) g.__nav = { gk: gk, fail: true, cool: 8 };
    return null;
  }
  if (g) g.__nav = { gk: gk, path: path, i: 0 };
  return path[1] || null;
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

// ---- 视线/瞄准 ----
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

// ---- 网格工具 ----
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
