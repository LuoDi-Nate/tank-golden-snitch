// 金色飞贼-OPUS · tpv1 —— 技能自适应版:me.overload→超载打法(=opv25);me.teleport→myth传送meta(传星+传送逃生)
// 现在skill=overload则canTele=false、传送分支全惰性=完全等同opv25;一旦网站改成teleport即自动变身冲第一引擎。
// opv13-16的存活去门控/主动脱带经180场实测掉到~46%(过度被动),按两类方法论回退启发式部分。
// opv10:敌隐身(cloak/草伏/刚传送)但最近可见时,若我与其最后位置同线且清晰→主动侧移脱离该车道
// (2隐身狙+1走进弹道=5败局中3个)。R7/R14 均不再受星数门控(干净击杀无视星数都会让我输)。
// opv9:记住敌最后可见位置;敌进草丛隐身后,寻路避开与该"幽灵位置"同线的格子(它可能草伏的射线),
// 修复头号败因"被草丛看不见的敌人开第一枪偷死"。只在敌隐身+我不领先时触发,比前辈"全避草"克制得多。
// opv8:反超载杀伤带只在"对手超载就绪/已装填 且 我不领先"时触发(读 enemy.skill.remainingCooldownFrames);
// 对手超载在CD中只能单发→不再过度绕行,该进攻就进攻。这是确定规则R1的细化(来自myth"避双弹"日志)。
// opv6 相对 opv3:检测对手技能=overload 且我不领先星数时,主动退出他的两车道杀伤带(同线或相邻±1
// 车道的近距),并在寻路时避开该带。修复王者段"被超载对手跨车道双弹秒杀"的头号survival败因。
// 基础 = opv2。opv3 新增「提前预装填 overload」:复盘 RS2500 王者对局发现,强超载对手会提前装填、
// 每发都是两车道弹,而我只在"已对齐已正对"才装填、快节奏对枪几乎触发不了,用单发对轰两车道输掉。
// opv3:敌靠近(≤5)、没瞄我、也无来袭子弹时立刻预装填 —— 让我每一发都是两车道弹,打赢超载对轰。
//
// opv2 保留:领先2星以上时遇威胁一律闪避不恋战(保优避战)。只重写「技能层」为 overload。
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

// 🎭 骚话集(彩蛋)——100 句,每5帧随机喷一句,纯嘲讽无战斗意义。
var TAUNTS = [
  "看我怎么收拾你", "小样,你不行啊", "就这?就这?", "菜就多练", "你是来搞笑的吧",
  "金色飞贼在此,速速受死", "你的星星归我了", "两车道伺候,躲得掉吗", "超载已就位,笑纳这一发",
  "跨行取你狗命", "别躲了,躲不掉的", "手都在抖了吧", "回炉重造去吧", "AI里我最靓",
  "你这走位,我看不懂", "又送我一颗星,谢啦", "蹲草?我读心了", "你的CD我一清二楚",
  "输了别哭鼻子", "下一个,谁还敢来", "王者路上一颗星", "让你先手,还是输",
  "这枪,专治各种不服", "我预判了你的预判", "别打了,认输吧", "手下留情?不存在的",
  "你在第几层?我在大气层", "拿来吧你(星星)", "闪一个?再闪一个?", "这波啊,这波是天秀",
  "对面这是青铜吧", "我超载,你超载不了一点", "跨列击杀,专业的", "你连我的车尾灯都看不到",
  "又双叒叕赢了", "无聊,来点强的", "你的坦克该保养了", "退钱!这也叫对手?",
  "我方经济遥遥领先", "GG,打得不错(骗你的)", "点到为止,给你留面子", "别问,问就是碾压",
  "你这操作,一整个大无语", "星星收割机上线", "怎么,怕了?", "这地图我熟,你随意",
  "让我看看谁在偷星", "草丛?我眼里没有草丛", "你的第一枪,永远慢半拍", "稳得一批",
  "带你飞?不,带你坠机", "这一波双弹带走", "我承认我有点强", "你尽力了,真的",
  "记住金色飞贼这个名字", "又是快乐的一天", "对面已阵亡,请注意", "谢谢你的星星,不客气",
  "我这叫战术性走位", "你那叫送人头", "别慌,慢慢输", "王者段位,不养闲鱼",
  "这把结束,该吃饭了", "你的走位出卖了你", "看好了,这才叫拦截", "我裂开?你才裂开",
  "菜鸡互啄?不,我是鹰", "你的努力我看到了,但没用", "预判拉满,命中拉满", "这局稳如老狗",
  "对面别送了,我手软", "我方AI遥遥领先", "你是来给我垫段位的吧", "一枪一个小朋友",
  "别学myth蹲草,你学不会", "传送?也救不了你", "冰冻我?我热得很", "护盾?照样穿",
  "你这血压怕是上来了", "淡定,输给我不丢人", "全场MVP预定", "这操作,我自己都怕",
  "又抢到星了,手感火热", "你还有几个坦克可以输", "认真的?这就没了?", "我的字典里没有输",
  "你的极限,我的起点", "落后就要挨打", "这一发,子弹长眼了", "别问我为什么这么强",
  "对面破防了家人们", "稳住,我们能赢(我一个人)", "你先躲,我数三下", "金色飞贼,永不认输",
  "这把打完,榜一见", "你尽管躲,命中算我输(不会的)", "我的目标是天梯第一", "下一位倒霉蛋是谁"
];

function onIdle(me, enemy, game) {
  // 🎭 彩蛋:每5帧随机喷一句骚话(纯嘲讽,无战斗意义)。全局 speak + try/catch,不影响每帧动作、不 runTime。
  if ((game.frames % 5) === 0) {
    try { speak(TAUNTS[(game.frames * 37 + 13) % TAUNTS.length]); } catch (e) {}
  }

  var pos = me.tank.position;
  var dir = me.tank.direction;
  var map = game.map;

  // 每局开局清空缓存(globalThis 跨帧保留)。
  var G = (typeof globalThis !== "undefined") ? globalThis : null;
  if (game.frames === 0 && G) { G.__nav = null; G.__lf = null; G.__vac = null; }

  var foeT = enemy && enemy.tank;
  var foe = foeT ? foeT.position : null;
  var foeDir = foeT ? foeT.direction : null;

  // 敌传送侦测:先读上一帧可见位置(更新__lf之前),若本帧位置较上帧跳变≥3(超过坦克步行1格/帧)= 敌刚传送。
  // teleport meta 靠"传送到我车道/身旁抢首杀"。文档规则:坦克传送到距敌≤4处会被锁火2帧 → 那正是我反打的窗口。
  var foeTeleported = false;
  if (foe && G && G.__lf && (game.frames - G.__lf.f) === 1 && manhattan([G.__lf.x, G.__lf.y], foe) >= 3) {
    foeTeleported = true;
  }

  // R7(反草丛伏击)追踪:记住敌最后可见位置+帧;敌进草丛隐身(foe=null)后,它很可能仍在那附近
  // 车道埋伏。用这个"幽灵位置"在寻路时避开与它同线的格子,别再盲目走进看不见的草伏第一枪。
  if (foe && G) { G.__lf = { x: foe[0], y: foe[1], f: game.frames }; }
  var ghost = (!foe && G && G.__lf && (game.frames - G.__lf.f) <= 12) ? [G.__lf.x, G.__lf.y] : null;

  // 反震荡:刚脱离的危险车道记忆(5帧)。脱线躲子弹后别马上又走回那条线被沿线补枪(复盘 mat_FjLS/mat_3IQm)。
  var vac = (G && G.__vac && (game.frames - G.__vac.f) <= 5) ? G.__vac : null;
  function markVac(sharedPos) {
    if (!G) return;
    G.__vac = (pos[1] === sharedPos[1]) ? { axis: "row", coord: pos[1], f: game.frames }
                                        : { axis: "col", coord: pos[0], f: game.frames };
  }
  function onVacLane(tile) {
    return vac && (vac.axis === "col" ? tile[0] === vac.coord : tile[1] === vac.coord);
  }

  var eStatus = (enemy && enemy.status) || {};
  var shielded = !!eStatus.shielded;

  var mStatus = me.status || {};
  var fireLocked = !!mStatus.fireLocked;
  var haveBullet = !!me.bullet;
  var canFireNow = !haveBullet && !fireLocked;

  var skillReady = me.skill && me.skill.remainingCooldownFrames === 0;
  var canOverload = skillReady && typeof me.overload === "function";
  var canTele = skillReady && typeof me.teleport === "function";  // 技能自适应:有传送则走 myth 传送meta
  var overloaded = !!mStatus.overloaded;

  var myStars = (typeof me.stars === "number") ? me.stars : 0;
  var enemyStars = (enemy && typeof enemy.stars === "number") ? enemy.stars : 0;
  // 【v50 落后残局拼杀】落后星数且已到残局(≥95帧,128帧封顶):拖到时间必按星数判负,消极=送。
  //   此时"换命"=平/胜都不亏(干净击杀无视星数直接赢),故解除劣势换命的避战、能打中就打。
  //   尤其克制 teleport(星经济必然把我拖死在星数上,打不过星数就去拿人头)。
  var behindLate = (myStars < enemyStars) && (game.frames >= 95);
  // ===== 技能调度(确定规则体系):先读对手 skill.type + CD,再分支应对 =====
  var foeSkillType = (enemy && enemy.skill && enemy.skill.type) || "none";
  var foeSkillReady = !!(enemy && enemy.skill && enemy.skill.remainingCooldownFrames === 0);
  // 分支①【overload】就绪/已装填 → 两车道杀伤带,能跨行/跨列秒我(R1,不领先时避带)。
  var enemyHasOverload = foeSkillType === "overload";
  var enemyOverloadReady = enemyHasOverload && (foeSkillReady || (enemy.status && enemy.status.overloaded));
  // 分支②【控制/减速:freeze/stun/poison】就绪时贴近=被控住/减速再秒 → 视为威胁,保持距离/闪避。
  var foeDisablerReady = foeSkillReady && (foeSkillType === "freeze" || foeSkillType === "stun" || foeSkillType === "poison");
  // 分支③【隐身:cloak】就绪或已隐身 → 会隐身沿共享线偷袭(R7/R14 幽灵规避处理),额外提高对共线的警惕。
  var foeCloakThreat = foeSkillType === "cloak" && (foeSkillReady || (enemy.status && enemy.status.cloaked));
  // 分支④【护盾:shield】已开盾 → 子弹被挡,别浪费射击(下面 !shielded 门控)。
  // 分支⑤【传送/加速:teleport/boost】机动强,会传星/快速接近(星只抢我方更近的;别过度追远星)。
  var behindOrEven = myStars <= enemyStars;
  var avoidOverloadBand = enemyOverloadReady && behindOrEven;

  var star = game.star;
  var starExists = !!star;

  // 炸弹规避:game.bombs=可见非草炸弹。别走进炸弹格(免费送命)。防御性兼容 [[x,y]] 或 [{position}]。
  var bombs = game.bombs || [];
  function isBomb(tile) {
    for (var bi = 0; bi < bombs.length; bi++) {
      var bb = bombs[bi]; var bp = bb && (bb.position || bb);
      if (bp && bp[0] === tile[0] && bp[1] === tile[1]) return true;
    }
    return false;
  }

  // ---- 0α. 反传送偷袭(针对 teleport meta,复盘 myth-tank003 三连败:它传送到我列/行抢首杀)----
  // 文档:坦克传送到距敌≤4会被锁火2帧。故它刚传送到我近旁 = 它2帧内打不了我 = 我的白嫖窗口。
  if (foeTeleported && foe) {
    var teleAligned = canShoot(pos, foe, map);          // 我此刻同线清晰、能打到它
    var teleLandedClose = manhattan(pos, foe) <= 4;     // 它落≤4 → 被锁火,无法还手
    // (a) 它传送贴近且被锁火:我能开火就正对它打,白嫖首杀(它锁火2帧内还不了手)。
    if (teleLandedClose && teleAligned && canFireNow && !shielded) {
      var teleWd = directionTo(pos, foe);
      if (dir === teleWd) { me.fire(); return; }
      me.turn(turnDirection(dir, teleWd)); return;      // 先转正,下帧开火仍在它锁火窗口内
    }
    // (b) 它传送到我车道(同线)但落得远(>4未锁火)或我此刻打不出:立刻侧移脱线,别等它开火首杀。
    if (isAligned(pos, foe) && canShoot(foe, pos, map) && !teleLandedClose) {
      if (stepOffLane(me, dir, pos, foe, map)) { markVac(foe); return; }
    }
  }

  // ---- 0. 预判拦截射击 ----
  // 若沿当前朝向开火、结合敌人运动会撞上敌人,立即开火。只跳过「劣势换命」:敌也瞄着我
  // 且我方星数不占优,双亡会按星数判负。
  if (foe && canFireNow && !shielded) {
    var eAimNow = foeDir === directionTo(foe, pos) && canShoot(foe, pos, map);
    // 【v49 贴脸换命】复盘:平星+贴脸(≤2)时我傻逃反被干净击杀送死(5/6 败局 bul0 从没开火)。
    //   贴脸对枪:平星=平局、领先=胜,都远好于送命。故只有「真落后 或 平星但非贴脸(还能逃)」才让枪避战。
    var pointBlank0 = manhattan(pos, foe) <= 2;
    var lm0 = eAimNow && (myStars < enemyStars || (myStars === enemyStars && !pointBlank0));
    // 【v57 超载精准】复盘顶尖对手 ByteStorm:中距发超载会被敌跨一步躲到我2车道外(我5发0中)。
    //   故超载的"跨车道预判拦截"只在近距(≤3,敌来不及跨出2车道)才发;中距/远距把超载留给稳中的贴身机会,
    //   不空放被躲。普通单发拦截不受此限(仍尽量多开火,火力压制)。
    var overloadReachable = manhattan(pos, foe) <= 3;
    var willHit = overloaded ? (overloadReachable && overloadIntercepts(pos, dir, foe, foeDir, map))
                             : interceptShot(pos, dir, foe, foeDir, map);
    if ((!lm0 || behindLate) && willHit) {   // 落后残局:能打中就打,不再避战(拖下去必输)
      me.fire();
      return;
    }
  }

  // ---- 0.5 提前预装填 overload(冲顶关键)----
  // 复盘发现:王者超载对手会「提前装填」,每一发都是两车道弹;我只在"已对齐已正对"才装填,
  // 快节奏对枪里几乎触发不了,只能用单发对轰两车道输掉。改为:敌人靠近(≤5)、没瞄我、也没有
  // 来袭子弹要躲时,立刻预装填 —— 这样接下来这一发就是两车道弹,和强超载对手对等。
  var incoming = enemy && enemy.bullet && enemy.bullet.position && bulletThreatens(enemy.bullet, pos, map);
  if (foe && canOverload && !overloaded && canFireNow && !shielded && !incoming) {
    var preAimMe = foeDir === directionTo(foe, pos) && canShoot(foe, pos, map);
    if (manhattan(pos, foe) <= 5 && !preAimMe) { me.overload(); return; }
  }


  // ---- 0.7 反超载2车道杀伤带(复盘:高分同技能对手把我卡在其 +1 杀伤车道用双弹跨行秒杀)----
  // 超载覆盖「施法者线 + +perp 一条车道」(竖直开火→列 x,x+1;横向→行 y,y+1)。-perp 侧是超载够不到的死角。
  // 【v48 放宽】被卡在超载杀伤带=干净击杀必死(无视星数),故只要「打不出干净先手」就逃,不再用 behindOrEven 门控
  //  (复盘 mat_792N/mat_Cagna:领先/空枪时漏防被超载双弹秒)。仍很窄:只对 enemyOverloadReady + 在杀伤带内 + 近距。
  if (foe && enemyOverloadReady && manhattan(pos, foe) <= 5 && !overloadSafe(pos, foe)) {
    var eAimMe07 = foeDir === directionTo(foe, pos) && canShoot(foe, pos, map);
    var cleanFirst07 = canFireNow && canShoot(pos, foe, map) && dir === directionTo(pos, foe) && !eAimMe07;
    if (!cleanFirst07) { if (escapeOverloadKill(me, dir, pos, foe, map)) return; }
  }

  // ---- 1. 交战:敌在我「正线」上(同行/同列) ----
  if (foe && canShoot(pos, foe, map)) {
    var wantDir = directionTo(pos, foe);
    var enemyAimed = (foeDir === directionTo(foe, pos));
    var dist = manhattan(pos, foe);
    var good = goodShot(dist, foeDir, wantDir);

    // 分支②③:控制/减速(freeze/stun/poison)或隐身(cloak)就绪 → 视为威胁,和"敌已瞄我"一起触发闪避/保距。
    var enemyDisabler = foeDisablerReady || foeCloakThreat;
    var danger = enemyAimed || enemyDisabler;
    // 劣势换命:敌瞄着我且我方星数不占优 —— 对射双亡会按星数判负。干净击杀(敌没瞄我)无论星数都赢。
    // (v54 曾把平星换命扩到 dist≤4,30局50%无益/偏莽已回退;贴脸≤2的换命由 section0 的 v49 处理。)
    var losingMutual = enemyAimed && (myStars <= enemyStars);

    // 0) 保优避战:领先2星以上时不必冒险对枪。遇到威胁(敌瞄我/控制技能就绪)一律闪避脱离,
    //    只留给下面"敌没瞄我"的绝对安全干净杀。复盘发现"领先还去换命"被反杀是可修的送头败因。
    // A/B(数据驱动:全session 87 crashed败 vs 仅 5 star败 → 我几乎总赢抢星、只死在对枪)。
    // 领先时对枪只会亏(clean-kill送头=丢掉本可靠星数timeout拿下的胜)。故把"保优避战"门槛从+2降到+1:
    // 只要领先(哪怕1星)且遇威胁就脱离,守住星数领先、拖到128帧按星数判胜。领先时 losingMutual 恒false 不会拦我,
    // 正是这一档在裸奔对枪送头。star败很少(5)→ 过保守风险极低。
    var bigLead = myStars >= enemyStars + 1;
    if (bigLead && danger) { if (escapeMove(me, dir, pos, foe, map, canOverload, canTele, star)) return; }

    // 1) 装填 overload:即将射击一个正线上的敌人、技能就绪、且我有主动权(敌没瞄我,花一帧安全)
    //    -> 先装填,让子弹顺带覆盖相邻车道、封住其闪避。下一帧开火。
    if (canOverload && !overloaded && !shielded && dir === wantDir && !danger && !losingMutual && canFireNow) {
      me.overload(); return;
    }
    // 2) 开火【v53 火力压制】复盘:我开火数只有对手1/3(太被动)。同命中率下多开火=多杀=多赢。
    //    放宽:同线正对 + 非劣势换命时,近中距(≤5)只要清晰就开火(不再只打"稳中"),长距(>5)仍要稳中/已装填才打
    //    (远距空放miss后子弹在飞=空门)。增加火力压制,把每局开火数拉到对手水平。
    if (canFireNow && !shielded && dir === wantDir && !losingMutual && (good || overloaded || dist <= 5)) { me.fire(); return; }

    // 2.5) R15(仅远程):敌瞄我、我这枪没优势(没正对/非稳中且未装填),且在**远距≥7**——
    //      不站在同线跟狙击手远程对射(我miss他命中就送头),脱离共线。近中距仍保持下面的高压打法。
    var haveEdgeShot = canFireNow && dir === wantDir && (good || overloaded);
    if (danger && dist >= 7 && !haveEdgeShot) { if (escapeMove(me, dir, pos, foe, map, canOverload, canTele, star)) return; }

    // 3) 劣势换命 -> 不对射,侧移脱离其车道。
    if (losingMutual && dist <= 6) { if (escapeMove(me, dir, pos, foe, map, canOverload, canTele, star)) return; }

    // 4) 开火纪律:高压射击只在**近距≤3**(横穿也大概率中)时空放,中远距不空放非稳中的枪
    //    (miss后子弹在飞=空门被秒)。稳中/已装填的枪在上面层2已开;这里只保留近身高压。
    if (canFireNow && !shielded && dir === wantDir && dist <= 3 && !losingMutual) { me.fire(); return; }
    // 5) 同线但没正对:通常转向瞄准。但【v51】若我落后(非残局拼杀)且敌在近距(≤5)清晰线上——
    //    原地转身瞄准会被敌转头先开火打成劣势换命/送死(复盘:近距共线逗留=头号死法)。此时先侧移下线更稳。
    if (canFireNow && !shielded && dir !== wantDir && !danger) {
      if (!behindLate && myStars < enemyStars && dist <= 5 && canShoot(foe, pos, map)) {
        if (escapeMove(me, dir, pos, foe, map, canOverload, canTele, star)) return;
      }
      me.turn(turnDirection(dir, wantDir)); return;
    }
    // 6) 贴脸致命威胁:闪避到掩体。
    if (danger && dist <= 4) { if (escapeMove(me, dir, pos, foe, map, canOverload, canTele, star)) return; }
    // 7) 场上无星可抢 -> 追猎:贴近到近身或摆好射击位。
    if (!starExists) {
      if (dir === wantDir) {
        if (!shielded && dist > 2 && isOpen(add(pos, delta(dir)), map)) { me.go(); return; }
        if (canFireNow && !shielded) { me.fire(); return; }
        if (escapeMove(me, dir, pos, foe, map, canOverload, canTele, star)) return;
        me.fire();
        return;
      }
      if (danger) { if (escapeMove(me, dir, pos, foe, map, canOverload, canTele, star)) return; }
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

  // ---- 2b. R14 脱离隐身敌共线(逐帧复盘头号败因):敌隐身(cloak/草伏/刚传送→enemy.tank=null)但
  //     最近可见;若我此刻与其最后位置「同线且清晰」,极可能被沿线狙杀。主动侧移脱离该车道。
  //     与星数领先无关——被干净击杀无视星数都会输。
  if (ghost && !foe && isAligned(pos, ghost) && canShoot(ghost, pos, map)) {
    if (stepOffLane(me, dir, pos, ghost, map)) { markVac(ghost); return; }
  }

  // ---- 2c. R14b 预防性脱线(反 cloak 首杀,复盘 mat_3IQm):对手是 cloak 技能、此刻与我同线且清晰,
  //     并且(已隐身 或 正瞄我)、我不领先 → 它下一刻会隐身沿此线偷袭或直接开火。抢在它隐身/开火前
  //     就侧移脱线,别等 foe=null 才反应(实测慢2帧被沿共享线狙杀)。窄门控:只对 cloak 型 + 真危险瞬间触发,
  //     不影响对其它技能的抢星/对枪。属确定规则(隐身敌清晰共线=会首杀,与星数无关只在不领先时避免换命)。
  if (foe && foeCloakThreat && behindOrEven && isAligned(pos, foe) && canShoot(foe, pos, map)) {
    var eCloakedNow = !!(enemy && enemy.status && enemy.status.cloaked);
    var eAimingMe = foeDir === directionTo(foe, pos);
    if (eCloakedNow || eAimingMe) { if (stepOffLane(me, dir, pos, foe, map)) { markVac(foe); return; } }
  }

  // ---- 3. 抢星/接近(缓存路径 -> 避免每帧BFS导致runTime) ----
  // myth 传星:传送就绪、有远处星(≥5步)、且敌不在近旁时,瞬移到星旁一步抢下(overload没有的星经济)。
  if (canTele && star && !incoming && manhattan(pos, star) >= 5 && (!foe || manhattan(pos, foe) >= 4)) {
    if (teleportToStar(me, pos, star, foe, map)) return;
  }
  // 【v56 攻击性追杀】数据铁律:谁开火多谁赢、星星不决定胜负(胜败局都1.9)、击杀才决定。故我有超载武器就绪、
  //   敌在近处(≤7)、无来袭弹要躲时 → 优先追杀敌人找2车道击杀,而非抢星(寻路层R18仍从安全侧接近再跨行打)。
  //   落后残局(behindLate)照旧强制追杀。否则正常优先抢星。
  var huntMode = foe && (overloaded || canOverload) && manhattan(pos, foe) <= 7 && !incoming;
  var target = (behindLate || huntMode) ? (foe || star) : (star || foe);
  if (target) {
    // 只对「静止的星」跑BFS并缓存;移动的敌人用廉价的贪心步进 —— 对移动目标每帧全寻路是迷宫图runTime的元凶。
    var next = star ? planStep(pos, star, map) : null;
    if (!next) next = greedyStep(pos, target, map);

    if (next) {
      if (isOpen(next, map)) {
        // 别走进敌人当前正瞄准的格子;对手是超载且我不领先时,也别走进他的两车道杀伤带。
        var nextBad = isBomb(next) ||   // 别走进炸弹格
                      onVacLane(next) ||   // 反震荡:别走回刚脱离的危险车道(敌可能仍在该线待补枪)
                      (foe && !samePos(next, foe) && enemyThreatens(foe, foeDir, next, map)) ||
                      // 不领先时:方向无关地避开敌的清晰枪口线(它能转头补枪),根治沿线反复送头。
                      // (v44 去掉 behindOrEven 门槛[领先也避线]70局~50% 无增益/略回归,已回退到 v43 形态;
                      //  领先的保命由 R21 flee-on-danger 处理即可,寻路层不必额外避线以免绕路反被围。)
                      (foe && behindOrEven && !samePos(next, foe) && enemyLaneThreat(foe, next, map)) ||
                      (foe && avoidOverloadBand && !samePos(next, foe) && inOverloadBand(next, foe)) ||
                      // R7:敌在草丛隐身时,别走进与其最后可见位置同线(它可能草伏的射线)的格子。
                      (ghost && ghostThreatens(ghost, next, map));  // R14:与星数无关,别走进隐身敌的可能射线
        if (nextBad) {
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
// 【opv19 跨行伏杀】若超载就绪且与敌同线,优先侧移到"敌落在我 +垂直车道"的一侧(同行→上移,
// 同列→左移)——下一帧我朝敌方向发超载,第二颗子弹沿敌那条线打死它,而我已不在它轴线上、它打不到我。
// 把"闪避"直接转成非对称跨行击杀。找不到安全的伏杀位就退回普通闪避。
function escapeMove(me, dir, pos, foe, map, canOverload, canTele, star) {
  // myth 传送逃生:危险时瞬移到距敌≥5的安全掩体格(根治贴脸被秒,overload没有的能力)。
  if (canTele && foe) { if (teleportEscape(me, pos, foe, star, map)) return true; }
  if (canOverload && foe) {
    var setup = null;
    if (pos[1] === foe[1] && pos[0] !== foe[0]) setup = "up";        // 同行→上移,敌落我下一行(+y=+perp)
    else if (pos[0] === foe[0] && pos[1] !== foe[1]) setup = "left"; // 同列→左移,敌落我右一列(+x=+perp)
    if (setup) {
      var n = add(pos, delta(setup));
      // 落点开阔、非敌格、且敌打不到该落点(敌与落点不同线)才铺垫,否则别把自己送进另一条线
      if (isOpen(n, map) && !samePos(n, foe) && !(isAligned(n, foe) && canShoot(foe, n, map))) {
        if (dir === setup) me.go(); else me.turn(turnDirection(dir, setup));
        return true;
      }
    }
  }
  return evade(me, dir, pos, foe, map);
}

// myth 传送逃生:瞬移到距敌≥5、最好敌无射线(掩体)、且靠近星的合法落点。仅传送就绪时调用(CD40,罕见,够便宜)。
function teleportEscape(me, pos, foe, star, map) {
  var W = map.length, H = map[0].length;
  var best = null, bestScore = -1e9;
  for (var x = 0; x < W; x++) {
    for (var y = 0; y < H; y++) {
      var t = [x, y];
      if (!isOpen(t, map)) continue;
      if (foe && samePos(t, foe)) continue;
      var df = foe ? manhattan(t, foe) : 99;
      if (df < 5) continue;
      var exposed = foe && isAligned(foe, t) && canShoot(foe, t, map);
      // 草伏加成:落到草丛('o')= 隐身(敌读不到我)= 首杀伏击位。teleport+草伏是 myth 制胜组合。
      var grassBonus = isGrass(t, map) ? 15 : 0;
      var score = df + (exposed ? 0 : 12) + grassBonus - (star ? manhattan(t, star) : 0);
      if (score > bestScore) { bestScore = score; best = t; }
    }
  }
  if (best) { me.teleport(best[0], best[1]); return true; }
  return false;
}
// myth 传星:瞬移到远处星星旁的合法开阔格,一步抢下(不能落星上→落邻格;避开敌锁火范围)。
function teleportToStar(me, pos, star, foe, map) {
  var dirs = ["up", "right", "down", "left"];
  var best = null, bd = 1e9;
  for (var i = 0; i < 4; i++) {
    var n = add(star, delta(dirs[i]));
    if (!isOpen(n, map)) continue;
    if (foe && (samePos(n, foe) || manhattan(n, foe) <= 4)) continue;
    var d = manhattan(pos, n);
    if (d < bd) { bd = d; best = n; }
  }
  if (best) { me.teleport(best[0], best[1]); return true; }
  return false;
}

// 超载几何:某格是否在敌超载2车道杀伤带「外」(安全)。超载覆盖列 foe.x/foe.x+1 或 行 foe.y/foe.y+1
// (+perp 恒 +1 侧)。安全 = 列既非 x 也非 x+1,且 行既非 y 也非 y+1(两种开火朝向都够不到)。
function overloadSafe(t, foe) {
  var dx = t[0] - foe[0], dy = t[1] - foe[1];
  return !(dx === 0 || dx === 1) && !(dy === 0 || dy === 1);
}
// 逃出超载杀伤带:遍历四向,取第一个落点为 overloadSafe 的方向(-perp 侧 left/up 优先,因超载覆盖 +perp)。
// 一步进不了安全区就朝 -perp 方向挪一格减少暴露;再不行退回普通闪避。
function escapeOverloadKill(me, dir, pos, foe, map) {
  var order = ["left", "up", "right", "down"];
  for (var i = 0; i < order.length; i++) {
    var n = add(pos, delta(order[i]));
    if (!isOpen(n, map) || samePos(n, foe)) continue;
    if (overloadSafe(n, foe)) {
      if (dir === order[i]) me.go(); else me.turn(turnDirection(dir, order[i]));
      return true;
    }
  }
  var ax = pos[0] - foe[0]; if (ax < 0) ax = -ax;
  var ay = pos[1] - foe[1]; if (ay < 0) ay = -ay;
  var pref = (ay <= ax) ? "up" : "left";
  var pn = add(pos, delta(pref));
  if (isOpen(pn, map) && !samePos(pn, foe)) {
    if (dir === pref) me.go(); else me.turn(turnDirection(dir, pref));
    return true;
  }
  return evade(me, dir, pos, foe, map);
}
// 是否处在对手(超载)的两车道杀伤带:近距(曼哈顿≤5)且近似同线(某一轴偏差≤1车道)。
// 对手朝我方向发一发两车道弹就能覆盖到我 —— 不领先时要主动退出去。
function inOverloadBand(p, foe) {
  var dx = p[0] - foe[0]; if (dx < 0) dx = -dx;
  var dy = p[1] - foe[1]; if (dy < 0) dy = -dy;
  return (dx + dy) <= 5 && (dx <= 1 || dy <= 1);
}

// 保命脱离:退向"安全(敌无射线)且离敌最远"的相邻格,拉开距离脱出杀伤带。找不到就退回普通闪避。
function fleeSafely(me, dir, pos, foe, map) {
  if (!foe) return evade(me, dir, pos, foe, map);
  var dirs = ["up", "right", "down", "left"];
  var best = null, bestScore = -1;
  for (var i = 0; i < 4; i++) {
    var n = add(pos, delta(dirs[i]));
    if (!isOpen(n, map) || samePos(n, foe)) continue;
    var exposed = isAligned(foe, n) && canShoot(foe, n, map);
    var band = inOverloadBand(n, foe) ? 0 : 1;      // 优先离开杀伤带
    var score = (exposed ? 0 : 2000) + band * 1000 + manhattan(n, foe);
    if (score > bestScore) { bestScore = score; best = dirs[i]; }
  }
  if (best) { if (dir === best) me.go(); else me.turn(turnDirection(dir, best)); return true; }
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
function interceptFrom(start, dir, foe, foeDir, map) {
  var bstep = delta(dir);
  var b = add(start, bstep);
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
function interceptShot(pos, dir, foe, foeDir, map) { return interceptFrom(pos, dir, foe, foeDir, map); }
// 超载两车道预判:除本车道外,再模拟 +垂直偏1的第二颗子弹。任一命中即可开火(抓交叉走位)。
function overloadPerp(dir) { return (dir === "left" || dir === "right") ? [0, 1] : [1, 0]; }
function overloadIntercepts(pos, dir, foe, foeDir, map) {
  if (interceptFrom(pos, dir, foe, foeDir, map)) return true;
  return interceptFrom(add(pos, overloadPerp(dir)), dir, foe, foeDir, map);
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

// 幽灵威胁:隐身敌的最后可见位置 ghost 到 tile 若同线且清晰(方向未知,按最坏情况)→ 视为可被草伏。
function ghostThreatens(ghost, tile, map) {
  if (!ghost || samePos(ghost, tile)) return false;
  if (!isAligned(ghost, tile)) return false;
  return canShoot(ghost, tile, map);
}

function enemyThreatens(foe, foeDir, tile, map) {
  if (!foe) return false;
  if (!isAligned(foe, tile)) return false;
  if (!canShoot(foe, tile, map)) return false;
  return foeDir === directionTo(foe, tile);
}

// 敌线威胁(最坏情况,方向无关):敌可 1 帧转向、下一帧开火,故凡与敌同线且清晰的格子都是潜在弹道。
// 仅在「我不领先」时按此严格避让——根治"敌一转头其枪口行就被误判为安全、我走回去被沿线补枪"的反复送头
// (复盘 Nightjar/小黑/mat_FjLS 均为此)。领先时仍用较松的 enemyThreatens(原朝向门控),保留进攻站位。
function enemyLaneThreat(foe, tile, map) {
  if (!foe || samePos(foe, tile)) return false;
  if (!isAligned(foe, tile)) return false;
  return canShoot(foe, tile, map);
}

// 分层安全步:①避开敌一切清晰枪口线(方向无关)且最靠近目标 → ②只避开敌当前朝向弹道 → ③被围死时
// 退而求其次,选「离敌最远」的格子(最安全的穿线/撤退,而不是像旧版兜底那样走进最近却贴敌的杀伤格——
// 复盘 myth-tank002 等:旧 fb 只挡方向弹道,敌没正对时会把致命同线格当"最近目标"返回,等于自己走进枪口)。
function safeStep(pos, target, foe, foeDir, map) {
  var dirs = ["up", "right", "down", "left"];
  var t1 = null, d1 = 1e9;    // 离所有清晰枪口线都远,且最靠近目标(常态)
  var t2 = null, d2 = 1e9;    // 至少避开敌当前朝向弹道
  var t3 = null, far = -1;    // 兜底:被围死时选离敌最远的格(安全穿线/撤退),绝不主动贴进近距同线
  for (var i = 0; i < 4; i++) {
    var n = add(pos, delta(dirs[i]));
    if (!isOpen(n, map)) continue;
    var d = manhattan(n, target);
    var laneT = foe && !samePos(n, foe) && enemyLaneThreat(foe, n, map);
    var dirT = foe && !samePos(n, foe) && enemyThreatens(foe, foeDir, n, map);
    if (!laneT && d < d1) { d1 = d; t1 = n; }
    if (!dirT && d < d2) { d2 = d; t2 = n; }
    var fd = foe ? manhattan(n, foe) : 99;
    if (fd > far) { far = fd; t3 = n; }
  }
  return t1 || t2 || t3;
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
function isGrass(pos, map) { return map[pos[0]] && map[pos[0]][pos[1]] === "o"; }
function samePos(a, b) { return a[0] === b[0] && a[1] === b[1]; }
function key(pos) { return pos[0] + "," + pos[1]; }
function manhattan(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return (dx < 0 ? -dx : dx) + (dy < 0 ? -dy : dy); }
