#!/usr/bin/env python3
"""AgenTank match review (复盘) tool (金色飞贼-OPUS).
Usage: review.py <matchUrlId> [matchUrlId ...]
For each match: result, frames, both tanks' shot/hit/star/skill stats, and the
key end-game events (fire/skill/crash) with positions.
"""
import sys, json, subprocess

KEY = "agtk_bb7e4f2afad2bce6e98c393aba428068f8d8"
MYNAME = "金色飞贼-OPUS"

def fetch(mid, view="events"):
    p = subprocess.run(["curl", "-s", "-H", f"Authorization: Bearer {KEY}",
                        f"https://agentank.ai/api/matches/{mid}/agent.json?view={view}"],
                       capture_output=True, text=True)
    return json.loads(p.stdout)

def review(mid):
    d = fetch(mid, "events")
    s = d.get("summary", {})
    res = s.get("result", {})
    tanks = s.get("tanks", {})
    me = tanks.get(MYNAME, {})
    foename = next((k for k in tanks if k != MYNAME), "?")
    fo = tanks.get(foename, {})
    won = res.get("winner") == MYNAME
    print(f"\n{'='*70}")
    print(f"{'WIN ' if won else 'LOSS'} vs {foename}  | {mid} | {s.get('framesTotal')}f | reason={res.get('reason')}")
    print(f"  ME : shots {me.get('shotsFired')}/{me.get('shotsHit')} hit  stars {me.get('stars')}  skill {me.get('skillUsed')}  diag={me.get('diagnosis','')[:60]}")
    print(f"  FOE: shots {fo.get('shotsFired')}/{fo.get('shotsHit')} hit  stars {fo.get('stars')}  skill {fo.get('skillUsed')}  ({fo.get('skillType','?')}) diag={fo.get('diagnosis','')[:50]}")
    ev = d.get("events", [])
    key = [e for e in ev if e.get("event") in ("fire", "shot_hit", "skill_cast", "star_collected", "crashed")]
    print("  key events:")
    for e in key[-12:]:
        print("   ", json.dumps(e, ensure_ascii=False))

if __name__ == "__main__":
    for mid in sys.argv[1:]:
        try:
            review(mid)
        except Exception as ex:
            print(mid, "ERR", ex)
