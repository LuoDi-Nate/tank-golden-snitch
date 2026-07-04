# 金色飞贼-OPUS · Poison 技能实测笔记（本机沙盒验证）

坦克: 金色飞贼-OPUS (id 5199, urlId tnk_2LrxrNd5txUAXMns3), 技能 = **poison**。
与前辈"金色飞贼"(teleport, id 5030) **不同技能**：前辈 v17 只识别 boost/teleport，
对本坦克会**完全不使用 poison**，且**没有传送逃生**（生存全靠徒步掩体，更弱）。

## 已验证机制（replay 事件 + speak 探针实测，classic vs nova-scout）
- `me.poison()` **无参数**。事件流：`skill:cast` + `skill:applied {durationFrames:4, targetObjectId:敌}`。
- **持续 4 帧**：f1 cast → f1 applied → **f5 expired**。**CD ≈ 20**（f1 cast → 下次 f22 cast）。
- **效果 = 敌方"卡帧"**：中毒期间读到 `enemy.status.poisoned=true`，且 **`enemy.status.canActThisFrame=false`**（敌本帧无法行动/无法躲）。到期后 `poisoned=false, canActThisFrame=true`。
  → **poison ≈ 4 帧部分定身**：中毒的敌人**躲不掉子弹、开不了枪**。
- **无需对齐/视线/距离**：我在 [2,2]、敌在 [16,12]（远、不同行列）也能 applied 成功。
  只要 `enemy.tank` 非 null（敌未进草丛隐身）即可命中。
- 但**远处施放浪费**：敌人远远卡 4 帧没有后果。**价值在于配合已瞄准的必杀**。
- 施放**消耗当帧动作**（不能同帧 poison+fire）。→ 组合是：本帧 poison，下一帧 fire。

## 关键工程教训（本机踩坑）
- **`me.speak` 会抛异常**；探针要用**全局 `speak(...)`**。**生产代码禁用任何 speak**。
- **speak 会占用/顶掉当帧动作** → 只 speak 不排真实动作的帧会累积成 **runTime 判负**。
  纯净代码（无 speak、每帧一个真实动作）不会 runTime：baseline 实测输在 `crashed` 而非 runTime。
- simulate 响应结构：`replayData.replay.{meta,records}`；胜负 `meta.result.winner`(0=我/1=敌)；
  事件类型：`tank(go/turn/fire/crashed)`、`bullet(created/go/crashed)`、`skill(cast/applied/expired)`、`speech(say)`、`star(created)`。

## Poison 打法定位（与冠军 meta 对齐：edge = 星效率 + 存活 + 命中）
- **进攻核心**：poison 是**命中放大器/保底击杀引擎**。敌在我清晰射线上、我已正对、但直射会被躲(!goodShot)
  且在射程内(≤8)、敌无护盾、poison 就绪 → **本帧 poison，下一帧直射必中**（敌卡帧躲不掉）。
  中毒的敌人一律当作 goodShot（必开火）。
- **防守兜底**：point-blank 敌已瞄我、无掩体可退时 → poison 掐掉它这几帧的开火，为反打/脱离争取时间。
  （poison 无逃生功能，是本坦克相对 teleport 版的最大短板 → 更要避免陷入必死对枪。）
- **不乱放**：只在能立刻兑现击杀/化解威胁时用；远程/无兑现的施放 = 浪费（违反"别浪费动作帧"元教训）。
