// Overload geometry probe facing DOWN — determine which side the 2nd bullet offsets to.
function onIdle(me, enemy, game) {
  var f = game.frames;
  var dir = me.tank.direction;
  var st = me.status || {};
  var armed = !!st.overloaded;
  var ready = me.skill && me.skill.remainingCooldownFrames === 0;
  var haveBullet = !!me.bullet;

  if (dir !== "down") { me.turn(turnDirection(dir, "down")); return; }
  if (!armed && ready && !haveBullet && f >= 2) { me.overload(); return; }
  if (armed && !haveBullet) { me.fire(); return; }
  me.turn("left");
}
function turnDirection(c, t) { var d = ["up","right","down","left"]; return ((d.indexOf(t) - d.indexOf(c) + 4) % 4) === 3 ? "left" : "right"; }
