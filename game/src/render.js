export function render(g,s){g.fillStyle='#57a99a';g.fillRect(0,0,s.w,s.h);g.save();g.translate(s.w/2-s.x,s.h/2-s.y);s.draw(g);g.restore();s.hud(g)}
