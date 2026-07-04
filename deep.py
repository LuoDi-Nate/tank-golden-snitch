#!/usr/bin/env python3
"""逐帧深度复盘:对每场比赛,定位我(金色飞贼-OPUS),打印击杀前若干帧的双方位置、对手技能、
对手所在地形(是否草丛=我看不见)、以及致命枪来源。用于提炼确定规则。
用法: deep.py <matchUrlId> ..."""
import sys, json, subprocess

KEY = "agtk_bb7e4f2afad2bce6e98c393aba428068f8d8"
MYNAME = "金色飞贼-OPUS"

def fetch(mid):
    p = subprocess.run(["curl","-s","-H",f"Authorization: Bearer {KEY}",
        f"https://agentank.ai/api/matches/{mid}/agent.json?view=raw"], capture_output=True, text=True)
    return json.loads(p.stdout)

def cell(mp, x, y):
    try: return mp[x][y]
    except Exception: return "?"

def review(mid):
    d = fetch(mid)
    rep = d["replayData"]["replay"]; recs = rep["records"]; meta = rep["meta"]
    mp = None
    for k in ("map","grid","tiles"):
        if k in meta: mp = meta[k]; break
    players = meta["players"]
    ids = [p["tank"]["id"] for p in players]
    # 我是谁:靠 summary 里名字对不上id，改用"发子弹数为0或更少"启发 + 名字
    names = {p["tank"]["id"]: (p["tank"].get("name") or "") for p in players}
    # 谁是我:summary.tanks 有我的名字，但没id；用"哪个id的bullet更少"通常是我(败局常0射击)
    bul = {i:0 for i in ids}
    for fr in recs:
        for e in fr:
            if e.get("type")=="bullet" and e.get("action")=="created":
                tk=(e.get("tank") or {}).get("id")
                if tk in bul: bul[tk]+=1
    # 用 summary 判定我方id：summary.tanks[MYNAME] 的 shotsFired 对比 bullet 计数
    myshots = ((d.get("summary",{}).get("tanks",{}) or {}).get(MYNAME,{}) or {}).get("shotsFired")
    me = None
    if myshots is not None:
        for i in ids:
            if bul[i]==myshots: me=i; break
    if me is None: me = min(ids, key=lambda i: bul[i])
    foe = [i for i in ids if i!=me][0]
    pos = {i: list(next(p for p in players if p["tank"]["id"]==i)["tank"]["position"]) for i in ids}
    fdir = {i: next(p for p in players if p["tank"]["id"]==i)["tank"].get("direction") for i in ids}
    fskill = names.get(foe,"?")
    # 追踪对手技能类型
    foeskill = "?"
    for fr in recs:
        for e in fr:
            if e.get("type")=="skill" and e.get("sourceObjectId")==foe:
                foeskill = e.get("skillType") or foeskill
    print(f"\n{'='*66}\n{mid}  我={me[:6]}(bul{bul[me]})  敌={names.get(foe) or foe[:6]}(bul{bul[foe]}) 敌技能≈{foeskill}  帧数={len(recs)}")
    # 逐帧更新位置，打印最后8帧
    frame_lines=[]
    for i,fr in enumerate(recs):
        note=[]
        for e in fr:
            t=e.get("type");a=e.get("action");oid=e.get("objectId")
            if t=="tank" and a=="go" and e.get("position"): pos[oid]=e["position"]
            if t=="tank" and a=="turn": fdir[oid]=e.get("direction")
            if t=="bullet" and a=="created":
                tk=(e.get("tank") or {}).get("id"); who="我" if tk==me else "敌"
                bp=(e.get("tank") or {}).get("position")
                terr = cell(mp,bp[0],bp[1]) if (mp and bp) else "?"
                note.append(f"{who}开火@{bp}向{e.get('direction')}[地形{terr}]")
            if t=="skill" and a=="cast":
                note.append(f"{'我' if e.get('sourceObjectId')==me else '敌'}技能{e.get('skillType')}")
            if t=="tank" and a=="crashed":
                note.append(f"{'我' if oid==me else '敌'}被击毁")
        # 敌所在地形(是否草丛=我看不见)
        et = cell(mp,pos[foe][0],pos[foe][1]) if mp else "?"
        aligned = (pos[me][0]==pos[foe][0] or pos[me][1]==pos[foe][1])
        frame_lines.append((i, list(pos[me]), list(pos[foe]), et, aligned, note))
    for (i,mp_,fp_,et,aligned,note) in frame_lines[-9:]:
        tag = f" 敌地形={et}{'(草!隐身)' if et=='o' else ''}" + (" 同线" if aligned else "")
        print(f"[{i:3}] 我{mp_} 敌{fp_}{tag}" + ("  " + "; ".join(note) if note else ""))

if __name__ == "__main__":
    for mid in sys.argv[1:]:
        try: review(mid)
        except Exception as ex:
            import traceback; print(mid,"ERR",ex); traceback.print_exc()
