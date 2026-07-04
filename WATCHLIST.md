# 强敌观察名单(WATCHLIST)——定期挖他们的比赛逆向分析

> 用法:`python3 deep.py <matchUrl>` 逐帧复盘;顶尖对手常把决策树 speak 出来,可直接逆向其策略。
> 挖到的确定规则 → 记入 RULES.md(只增不删);启发式 → STRATEGY_POOL.md(可A/B)。

## 🏆 顶尖对手(全服前列,重点研究)
| 坦克 | 技能 | 打法特征 | tankUrlId |
|---|---|---|---|
| **myth-tank001** | teleport | ⭐制胜核心。**原地蹲死(did not move)草伏首杀** + 传星 + 脱双弹。反复击杀我。 | tnk_HYqry6Nlvvj0qOfLe |
| **myth-tank005/002/003/008/010** | teleport | myth家族,同套路(蹲草/传星/避双弹) | — |
| **Fei-Fei** | teleport | 耐心 Aim→Wait→Lead→Bang,打提前量;传星;Hide | tnk_FVb6gJUUXP98hBppn |
| **小虾吃大虾** v120 | cloak | 隐身沿共享行/列远程狙杀 | tnk_LwlLgzXJiBoJ065pI |
| **履带痒了** v73 | cloak | 隐身偷袭 | tnk_19zdzBmA3sGCQgS3E |
| **occupation-a** v270 | overload | 超载对轰/跨列 | tnk_7HFONsMASmXLj1jD5 |
| **XDB** v528 | ? | 高迭代 | tnk_9arhtgIxusOKvbI5s |
| **aNewHand** v173 | ? | 高迭代 | tnk_DeuJDE9Aeh6K0nfa2 |

## 📖 顶尖决策树(逆向自 speak 日志)——全服最强的完整战术手册
- **传星!**:用 teleport 瞬移抢星(高效星经济)。
- **Wait(耐心)**:大量"Wait"——不乱动不乱开枪,等最佳时机。**顶端核心=耐心**,不是激进。
- **Aim→Wait→Lead→Bang**:瞄准→等→**打提前量(Lead,预判敌移动落点)**→开火。纪律性预判射击。
- **Hide**:交战间隙藏进掩体/草丛(隐身重置)。
- **守星(guard star)**:吃到星后守住、按星数拖赢。
- **拦截(intercept)**:预判拦截射击(我已有 interceptShot)。
- **伏击(ambush)/do-bush-hold(蹲草)**:蹲草(隐身)守株待兔,敌进车道被首杀。
- **脱双弹(避双弹)**:读对手是 overload+CD,就绪时躲其2车道带。
- **do-aim-dodge**:同帧"瞄+躲"结合。
- **对拼(trade)**:必要时换命。

## 💡 关键认知(震撼点)
连顶尖对手命中率都很低(0/6、1/7,多数打墙)→ **击杀稀有,游戏主要由"星经济 + 谁少送头"决定。** 我"从不输星"已占优,**真正的 edge = 反伏击(别被那稀有的草伏第一枪偷到)+ 耐心不送头。**

## 待挖(TODO)
- 定期 `deep.py` 挖 myth-tank001 / Fei-Fei 的新比赛,更新其决策树。
- 重点破解:**从开局就蹲死不动的草伏杀手**(我从没见过它→无幽灵位置→R7/R14失效→瞎撞被秒)。
