#!/usr/bin/env python3
"""AgenTank ranked challenge loop (金色飞贼-OPUS, id 5199).
Usage: challenge.py <count> [mapId]
Plays <count> real ranked battles vs random opponents (affects rank!),
respects the 2s rate limit, prints rank progression, and logs losses.
"""
import sys, json, subprocess, time

KEY = "agtk_bb7e4f2afad2bce6e98c393aba428068f8d8"
CH = "https://agentank.ai/api/agent/tank/challenge"
TANK = "https://agentank.ai/api/agent/tank"
ME = 5199
TARGET_RS = 3500

def challenge_once(mapid="random"):
    body = {"randomOpponent": True, "mapId": mapid}
    p = subprocess.run(
        ["curl", "-s", "-X", "POST", "-H", f"Authorization: Bearer {KEY}",
         "-H", "Content-Type: application/json", "-d", json.dumps(body), CH],
        capture_output=True, text=True)
    try:
        return json.loads(p.stdout)
    except Exception:
        return {"_error": p.stdout[:200]}

def challenge(mapid="random", tries=8):
    d = {}
    for t in range(tries):
        d = challenge_once(mapid)
        if "winnerTankId" in d:
            return d
        time.sleep(2.6)
    return d

def tier_str(d, prefix="challenger"):
    return f"{d.get(prefix+'RankTier')} {d.get(prefix+'RankDivision')}"

def main():
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    mapid = sys.argv[2] if len(sys.argv) > 2 else "random"
    w = l = dr = 0
    losses = []
    matches = []
    last_tier = None
    for i in range(count):
        if i: time.sleep(2.9)
        d = challenge(mapid)
        if "winnerTankId" not in d:
            print(f"[{i}] ERR {d.get('_error') or json.dumps(d)[:160]}")
            continue
        win = d.get("winnerTankId") == ME
        draw = d.get("winnerTankId") in (None, 0)
        res = "WIN " if win else ("DRAW" if draw else "LOSS")
        if win: w += 1
        elif draw: dr += 1
        else: l += 1
        rs = d.get("challengerRankScore")
        tier = tier_str(d)
        last_tier = tier
        defn = d.get("defenderTankName") or "?"
        dtier = tier_str(d, "defender")
        dver = d.get("defenderCodeVersion")
        delta = 0
        for rc in (d.get("rankChanges") or []):
            if rc.get("tankId") == ME: delta = rc.get("delta")
        mark = ("  <-- " + str(d.get("challengerRankTier")).upper() + "!") if (d.get("challengerRankTier") in ("master", "champion")) else ""
        print(f"[{i:2}] {res} vs {defn[:20]:20} ({dtier} v{dver}) {str(d.get('mapId')):12} {str(d.get('resultReason')):8} | RS={rs} ({'+' if delta>=0 else ''}{delta}) {tier}{mark}")
        matches.append(("W" if win else ("D" if draw else "L")) + ":" + str(d.get("urlId")))
        dskill = d.get("defenderSkillType") or d.get("defenderSkill") or "?"
        rec = {"res": res, "defender": defn, "ver": dver, "map": d.get("mapId"),
               "reason": d.get("resultReason"), "matchUrl": d.get("urlId"),
               "defTankUrlId": d.get("defenderTankUrlId"), "skill": dskill, "rs": rs}
        try:
            with open("match_history.jsonl", "a") as fh:
                fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
        except Exception:
            pass
        if not win and not draw:
            losses.append({"defender": defn, "tier": dtier, "ver": dver,
                           "map": d.get("mapId"), "reason": d.get("resultReason"),
                           "matchUrl": d.get("urlId"), "defTankUrlId": d.get("defenderTankUrlId")})
        if isinstance(rs, (int, float)) and rs >= TARGET_RS:
            print(f"\n*** REACHED RS {rs} (target {TARGET_RS}) ***")
            break
    print(f"\nSUMMARY: {w}W {l}L {dr}D  final={last_tier}")
    print("MATCHES: " + " ".join(matches))
    if losses:
        print("LOSSES:")
        for x in losses:
            print("  ", json.dumps(x, ensure_ascii=False))

if __name__ == "__main__":
    main()
