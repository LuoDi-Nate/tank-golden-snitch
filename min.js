// Minimal BFS-free control bot — used only to test whether map-55 runTime is from my
// pathfinding cost or from the map itself. Greedy toward star, fire if facing foe on a line.
function onIdle(me, enemy, game) {
  var pos = me.tank.position, dir = me.tank.direction, map = game.map;
  var foe = enemy && enemy.tank ? enemy.tank.position : null;
  var star = game.star;

  if (foe && !me.bullet && (pos[0] === foe[0] || pos[1] === foe[1])) {
    var wd = dirTo(pos, foe);
    if (dir === wd) { me.fire(); return; }
    me.turn(turn(dir, wd)); return;
  }
  var t = star || foe;
  if (t) {
    var n = greedy(pos, t, map);
    if (n) { var d = dirTo(pos, n); if (dir === d) me.go(); else me.turn(turn(dir, d)); return; }
  }
  var f = add(pos, del(dir));
  if (isOpen(f, map)) me.go(); else me.turn("right");
}
function greedy(p, g, map) {
  var ds = ["up","right","down","left"], best = null, bd = 1e9;
  for (var i=0;i<4;i++){ var n=add(p,del(ds[i])); if(!isOpen(n,map))continue; var d=Math.abs(n[0]-g[0])+Math.abs(n[1]-g[1]); if(d<bd){bd=d;best=n;} }
  return best;
}
function dirTo(a,b){ if(b[0]>a[0])return"right"; if(b[0]<a[0])return"left"; if(b[1]>a[1])return"down"; return"up"; }
function turn(c,t){ var d=["up","right","down","left"]; return ((d.indexOf(t)-d.indexOf(c)+4)%4)===3?"left":"right"; }
function del(x){ if(x==="up")return[0,-1]; if(x==="right")return[1,0]; if(x==="down")return[0,1]; return[-1,0]; }
function add(p,d){ return [p[0]+d[0],p[1]+d[1]]; }
function isOpen(p,map){ return map[p[0]] && map[p[0]][p[1]] && map[p[0]][p[1]]!=="x" && map[p[0]][p[1]]!=="m"; }
