#!/usr/bin/env python3
"""Run sims (cooldown-aware) and report result + our poison casts/bullets per match.
Usage: castcheck.py <codeFile> <mapId> [opp1 opp2 ...]"""
import sys, time
from sim import run_retry, _replay

def analyze(d):
    r = _replay(d)
    if r is None:
        return None
    recs = r["records"]; me = r["meta"]["players"][0]["tank"]["id"]; res = r["meta"]["result"]
    casts = [i for i, fr in enumerate(recs) for e in fr
             if e.get("type") == "skill" and e.get("action") == "cast" and e.get("sourceObjectId") == me]
    mybul = sum(1 for fr in recs for e in fr
                if e.get("type") == "bullet" and e.get("action") == "created" and (e.get("tank") or {}).get("id") == me)
    foebul = sum(1 for fr in recs for e in fr
                 if e.get("type") == "bullet" and e.get("action") == "created" and (e.get("tank") or {}).get("id") != me and e.get("type") == "bullet")
    w = res.get("winner")
    win = "WIN " if w == 0 else ("LOSS" if w == 1 else "DRAW")
    return win, res.get("reason"), len(recs), mybul, len(casts), casts

def main():
    cf = sys.argv[1]; mp = sys.argv[2]
    opps = sys.argv[3:] or ["nova-scout", "azure-hunter", "crimson-bastion"]
    for i, opp in enumerate(opps):
        if i: time.sleep(3.4)
        d = run_retry(opp, mp, cf)
        a = analyze(d)
        if not a:
            print(f"{opp:16} ERR {d.get('resultReason') or d.get('error')}")
            continue
        win, reason, frames, mybul, ncast, casts = a
        print(f"{opp:16} {win} {str(reason):8} on {mp:14} frames={frames:3} myBullets={mybul} poisonCasts={ncast} @{casts}")

if __name__ == "__main__":
    main()
