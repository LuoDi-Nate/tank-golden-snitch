#!/usr/bin/env python3
"""AgenTank simulation helper (金色飞贼-OPUS, skill=poison).
Modes:
  sim.py one <opponentId> <mapId> [codeFile] [--trace]
  sim.py batch [codeFile] [--reps=N] [--maps=m1,m2,...]
Outcome is read from replay meta.result.winner (0=us, 1=enemy).
Published code is used when codeFile is omitted or == "published".
"""
import sys, json, subprocess, time

KEY = "agtk_bb7e4f2afad2bce6e98c393aba428068f8d8"
URL = "https://agentank.ai/api/agent/tank/simulate"
BOTS = ["nova-scout", "azure-hunter", "crimson-bastion"]

def run(opponent, mapid, code=None):
    body = {"opponentId": opponent, "mapId": mapid}
    if code and code != "published":
        body["code"] = open(code).read()
    p = subprocess.run(
        ["curl", "-s", "-X", "POST",
         "-H", f"Authorization: Bearer {KEY}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps(body), URL],
        capture_output=True, text=True)
    try:
        return json.loads(p.stdout)
    except Exception:
        return {"_error": p.stdout[:300]}

def run_retry(opponent, mapid, code=None, gap=4.3, tries=8):
    """One request per `gap` seconds; retry only when the server reports cooldown."""
    d = {}
    for t in range(tries):
        d = run(opponent, mapid, code)
        if "cooldown" not in str(d.get("resultReason") or ""):
            return d
        time.sleep(gap)
    return d

def _replay(d):
    # Response may nest as replayData.replay or replay directly.
    if "replayData" in d and "replay" in d["replayData"]:
        return d["replayData"]["replay"]
    if "replay" in d:
        return d["replay"]
    return None

def outcome(d):
    """Return (result, reason). We are player 0."""
    r = _replay(d)
    if r is None:
        return "ERR", d.get("_error") or d.get("error") or json.dumps(d)[:200]
    w = r["meta"]["result"].get("winner")
    reason = d.get("resultReason") or r["meta"]["result"].get("reason")
    if w == 0: return "WIN", reason
    if w == 1: return "LOSS", reason
    return "DRAW", reason

def trace(d):
    r = _replay(d)
    recs = r["records"]; meta = r["meta"]
    me = meta["players"][0]["tank"]["id"]; foe = meta["players"][1]["tank"]["id"]
    mepos = list(meta["players"][0]["tank"]["position"])
    foepos = list(meta["players"][1]["tank"]["position"])
    for i, frame in enumerate(recs):
        ev = []
        says = []
        for e in frame:
            t = e.get("type"); a = e.get("action"); oid = e.get("objectId")
            if t == "star" and a == "created": ev.append(f"STAR@{e.get('position')}")
            elif t == "tank":
                who = "ME" if oid == me else ("FOE" if oid == foe else str(oid))
                if a == "go":
                    pos = e.get("position")
                    if pos:
                        if oid == me: mepos = pos
                        elif oid == foe: foepos = pos
                    ev.append(f"{who}.go->{pos}")
                elif a == "turn": ev.append(f"{who}.turn.{e.get('direction')}")
                elif a == "fire": ev.append(f"{who}.FIRE")
                elif a == "crashed": ev.append(f"{who}.CRASHED")
                elif a == "skill": ev.append(f"{who}.SKILL:{e.get('skill') or e.get('skillType') or ''}")
                elif a == "say": says.append(f"{who}:{e.get('message') or e.get('text')}")
                else: ev.append(f"{who}.{a}")
            elif t == "bullet":
                tk = (e.get("tank") or {}).get("id")
                who = "ME" if tk == me else "FOE"
                if a == "created": ev.append(f"{who}bul.new@{e.get('position')}{e.get('direction')}")
                elif a == "crashed": ev.append(f"{who}bul.X@{e.get('position')}")
        line = ""
        if ev: line = " | " + " ; ".join(ev)
        if says: line += "  SAY[" + " ".join(says) + "]"
        if ev or says: print(f"[{i:2}] me={mepos} foe={foepos}{line}")

def main():
    argv = sys.argv[1:]
    mode = argv[0] if argv else "batch"
    flags = [a for a in argv if a.startswith("--")]
    pos = [a for a in argv if not a.startswith("--")]
    reps = 1
    maps = ["classic", "arena"]
    for f in flags:
        if f.startswith("--reps"): reps = int(f.split("=")[1]) if "=" in f else 1
        if f.startswith("--maps"): maps = f.split("=")[1].split(",")

    if mode == "one":
        opp, mp = pos[1], pos[2]
        cf = pos[3] if len(pos) > 3 else None
        d = run_retry(opp, mp, cf)
        r, reason = outcome(d)
        print(f"{r} vs {opp} on {mp} | reason={reason}")
        if "--trace" in flags and _replay(d) is not None: trace(d)
        return

    # batch
    cf = pos[1] if len(pos) > 1 else "published"
    tally = {}
    total_w = total = 0
    first = True
    for mp in maps:
        for bot in BOTS:
            for _ in range(reps):
                if not first: time.sleep(3.3)
                first = False
                d = run_retry(bot, mp, cf)
                r, reason = outcome(d)
                k = f"{bot}@{mp}"
                tally.setdefault(k, []).append(f"{r}({reason})")
                total += 1
                if r == "WIN": total_w += 1
                print(f"  {r:4} {bot:16} {mp:10} {reason}")
    print(f"\nSUMMARY code={cf}: {total_w}/{total} wins")
    for k, v in tally.items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
