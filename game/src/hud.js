import { COLORS, FONT, WORLD_W, WORLD_H, ROAD, TILE } from './config.js';

export function createHud(){
  function panel(ctx,x,y,w,h,alpha=.9){ctx.fillStyle=`rgba(26,38,39,${alpha})`;ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(242,232,198,.38)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);}
  function text(ctx,s,x,y,size=14,color=COLORS.text,align='left'){ctx.font=`${size}px ${FONT}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(s,x,y);}
  function minimap(ctx,state,w,h){const x=w-206,y=18,mw=188,mh=148;panel(ctx,x,y,mw,mh,.94);const ix=x+8,iy=y+8,iw=mw-16,ih=mh-16,sx=iw/WORLD_W,sy=ih/WORLD_H;ctx.save();ctx.beginPath();ctx.rect(ix,iy,iw,ih);ctx.clip();ctx.fillStyle='#82a27a';ctx.fillRect(ix,iy,iw,ih);ctx.fillStyle='#4c9ba2';ctx.fillRect(ix,iy+ih*.91,iw,ih*.09);ctx.fillStyle='#d9c48a';ctx.fillRect(ix,iy+ih*.87,iw,ih*.04);ctx.fillStyle='#4a5552';for(let c=0;c<15;c++)ctx.fillRect(ix+c*240*sx,iy,74*sx,ih);for(let r=0;r<12;r++)ctx.fillRect(ix,iy+r*240*sy,iw,74*sy);ctx.fillStyle='#d5c9a7';for(const b of state.buildings)ctx.fillRect(ix+b.x*sx,iy+b.y*sy,b.w*sx,b.h*sy);for(const c of state.cars){ctx.fillStyle=c.police?'#f4f1dd':'#dd775d';ctx.fillRect(ix+c.x*sx-1,iy+c.y*sy-1,3,3);}if(state.mission.marker){ctx.fillStyle='#ffd56d';ctx.beginPath();ctx.arc(ix+state.mission.marker.x*sx,iy+state.mission.marker.y*sy,4,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ix+state.player.x*sx,iy+state.player.y*sy,4,0,Math.PI*2);ctx.fill();ctx.restore();text(ctx,'SAN VERANO',x+10,y+mh-6,9,'#c3d0c5');}
  function draw(ctx,state,w,h){const p=state.player;panel(ctx,18,18,262,90,.92);text(ctx,'RIO CALLES',32,36,12,'#f1c875');text(ctx,`$${Math.floor(p.cash).toLocaleString()}`,32,61,23);text(ctx,p.inCar?'SEDAN  /  '+Math.round(Math.abs(p.inCar.speed))+' KM/H':'ON FOOT  /  9MM',32,88,11,'#b8c3b9');panel(ctx,18,118,180,28,.86);ctx.fillStyle='#514846';ctx.fillRect(29,128,148,9);ctx.fillStyle=p.health>35?'#80b78e':'#df6956';ctx.fillRect(29,128,148*Math.max(0,p.health)/100,9);text(ctx,`HEALTH ${Math.max(0,Math.ceil(p.health))}`,30,124,10);
    text(ctx,'WANTED',18,174,10,'#ded8c7');for(let i=0;i<5;i++){text(ctx,i<state.wanted?'★':'☆',67+i*21,174,18,i<state.wanted?'#f2c96d':'#9aa29a');}
    const district=state.districts.find(d=>Math.abs(d.x-p.x)<120&&Math.abs(d.y-p.y)<120)?.name||'San Verano';panel(ctx,w/2-120,16,240,29,.72);text(ctx,district.toUpperCase(),w/2,31,11,'#f2e5bd','center');
    minimap(ctx,state,w,h);
    if(state.mission.objective){panel(ctx,18,h-92,Math.min(560,w-36),70,.93);text(ctx,state.mission.title||'FIELD NOTE',32,h-73,11,'#f1c875');text(ctx,state.mission.objective,32,h-49,14);if(state.mission.active&&state.mission.type==='race')text(ctx,`${Math.ceil(state.mission.timer)}s`,w-34,h-58,20,'#f1c875','right');}
    if(state.mission.messageTime>0){panel(ctx,w/2-190,68,380,50,.93);text(ctx,state.mission.message,w/2,93,17,'#f2d17a','center');}
    text(ctx,'WASD move / drive   SHIFT run   E enter / interact   SPACE handbrake   CLICK fire   P pause   M mute',w/2,h-14,10,'#f5f0db','center');
  }
  return {draw};
}
