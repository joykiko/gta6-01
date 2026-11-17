import { TILE, ROAD, COLS, ROWS, WORLD_W, WORLD_H, ROAD_X, ROAD_Y, DISTRICTS } from './config.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const carColors = ['#d9654f','#e3bc63','#5b8d9c','#e8e0c7','#657d69','#a77f8b','#39484d'];

export function createWorld(random) {
  const buildings = [], props = [], cars = [], peds = [], bullets = [], particles = [], marks = [], enemies = [];
  const districts = [];
  for (let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    districts.push({x:c*TILE+ROAD/2,y:r*TILE+ROAD/2,name:DISTRICTS[(Math.floor(r/3)*5+Math.floor(c/3))%DISTRICTS.length]});
    const bx=c*TILE+ROAD+10, by=r*TILE+ROAD+10, bw=TILE-ROAD-20, bh=TILE-ROAD-20;
    buildings.push({x:bx,y:by,w:bw,h:bh,hue:Math.floor(random()*4),variant:Math.floor(random()*4), label:random()>.6?['CAFE','MOTEL','MARKET','STORAGE'][Math.floor(random()*4)]:''});
    if(random()>.35) props.push({x:bx+random()*bw,y:by+random()*bh,type:random()>.5?'palm':'planter'});
    props.push({x:c*TILE+TILE/2,y:r*TILE+18,type:'lamp'});
  }
  // A wide open southern coast and blue water beyond the seawall.
  for(let x=ROAD/2;x<WORLD_W;x+=TILE) props.push({x,y:WORLD_H-64,type:'palm'});
  const player={x:ROAD_X(1)+ROAD/2,y:ROAD_Y(1)+ROAD/2,angle:0,vx:0,vy:0,health:100,cash:480,weapon:'9mm',inCar:null,face:0,invuln:0};
  function makeCar(x,y,angle=0,police=false) { return {x,y,angle,speed:0,color:police?'#e9e8de':carColors[Math.floor(random()*carColors.length)],police,health:100,ai:!police,axis:random()>.5?'h':'v',dir:random()>.5?1:-1,wait:random()*1.5,flash:random()*10}; }
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    if(random()>.38) cars.push(makeCar(ROAD_X(c)+ROAD/2+(random()-.5)*25,ROAD_Y(r)+ROAD/2+31,0));
    if(random()>.5) cars.push(makeCar(ROAD_X(c)+ROAD/2-31,ROAD_Y(r)+ROAD/2+(random()-.5)*25,Math.PI/2));
  }
  for(let i=0;i<94;i++) {
    const c=Math.floor(random()*COLS),r=Math.floor(random()*ROWS),side=Math.floor(random()*4);
    peds.push({x:c*TILE+ROAD+(side%2?random()*(TILE-ROAD):side===0?4:TILE-ROAD-4),y:r*TILE+ROAD+(side%2?side===1?4:TILE-ROAD-4:random()*(TILE-ROAD)),angle:random()*Math.PI*2,speed:18+random()*18,panic:0,color:['#ec805e','#406b72','#e4c46f','#eadfd0','#765d51'][i%5],alive:true});
  }
  const mission={index:0,active:false,done:false,stage:0,timer:0,marker:null,objective:'',enemies:[],message:'',messageTime:0};
  const state={player,cars,peds,bullets,particles,marks,buildings,props,districts,enemies,mission,wanted:0,heat:0,clock:0,day:0.18,camera:{x:player.x,y:player.y},shake:0,screen:'title',muted:false,freeMessage:'',freeTime:0,policeTimer:0,missionStart:false};
  const jobs=[
    {title:'A SMALL FAVOR',text:'Collect the envelope from Palm Heights.',marker:{x:ROAD_X(4)+37,y:ROAD_Y(3)+37},type:'visit',reward:350},
    {title:'LAST MILE',text:'Deliver the parcel to the Old Port warehouse.',marker:{x:ROAD_X(12)+37,y:ROAD_Y(2)+37},type:'visit',reward:500},
    {title:'NO QUESTIONS',text:'Lose the tail and reach the Cypress Point safehouse.',marker:{x:ROAD_X(2)+37,y:ROAD_Y(8)+37},type:'escape',reward:650},
    {title:'MARKET PRESSURE',text:'Take out the crew guarding Sunset Market.',marker:{x:ROAD_X(8)+37,y:ROAD_Y(6)+37},type:'fight',reward:850},
    {title:'COAST TO COAST',text:'Reach the Bayfront before the clock runs out.',marker:{x:ROAD_X(13)+37,y:ROAD_Y(10)+37},type:'race',reward:1200,time:100},
  ];
  function startMission() { const m=jobs[mission.index]; if(!m){mission.done=true;mission.active=false;mission.objective='Story complete. San Verano is yours.';return;} mission.active=true;mission.stage=0;mission.timer=m.time||0;mission.marker={...m.marker};mission.objective=m.text;mission.title=m.title;mission.type=m.type;mission.message=m.title;mission.messageTime=3; if(m.type==='fight'){ mission.enemies=[]; for(let i=0;i<5;i++) mission.enemies.push({x:m.marker.x+(random()-.5)*140,y:m.marker.y+(random()-.5)*120,health:50,angle:0,fire:1+random()*2,alive:true}); } }
  function completeMission(){ const m=jobs[mission.index]; player.cash+=m.reward;mission.message=`${m.title}  +$${m.reward}`;mission.messageTime=4;mission.index++;mission.active=false;mission.objective=mission.index===jobs.length?'Story complete. Free roam is open.':'Press E at the gold marker to start the next job.'; }
  function beginStory(){state.screen='play';mission.objective='Head to the gold marker. Press E to begin.';mission.marker={x:ROAD_X(2)+37,y:ROAD_Y(2)+37};state.missionStart=true;}
  function loadSave(save){ if(!save)return false; player.x=clamp(save.x,30,WORLD_W-30);player.y=clamp(save.y,30,WORLD_H-90);player.cash=save.cash||0;player.health=save.health||100;mission.index=clamp(save.index||0,0,jobs.length);mission.objective='Continue your story. Head to the gold marker.';mission.marker=jobs[mission.index]?.marker||null;state.screen='play';return true; }
  function save(){try{localStorage.setItem('san-verano.save.v1',JSON.stringify({x:player.x,y:player.y,cash:player.cash,health:player.health,index:mission.index}));}catch{}}
  function hitCrime(amount=1){state.wanted=clamp(state.wanted+amount,0,5);state.heat=18;}
  function closestCar(){let best=null,d=54;for(const c of cars){if(c.police)continue;const q=dist(player,c);if(q<d){d=q;best=c;}}return best;}
  function enterCar(car){if(car){player.inCar=car;car.ai=false;car.speed=0;player.x=car.x;player.y=car.y;player.angle=car.angle; if(state.wanted<1&&Math.random()<.65)hitCrime(1);}}
  function exitCar(){const c=player.inCar;if(!c)return;player.x=c.x+Math.cos(c.angle+Math.PI/2)*44;player.y=c.y+Math.sin(c.angle+Math.PI/2)*44;player.inCar=null;player.vx=player.vy=0;}
  function shoot(targetX,targetY){const p=player,origin=p.inCar?{x:p.x,y:p.y}:p; if(p.inCar)return; const a=Math.atan2(targetY-origin.y,targetX-origin.x);bullets.push({x:origin.x+Math.cos(a)*20,y:origin.y+Math.sin(a)*20,vx:Math.cos(a)*580,vy:Math.sin(a)*580,life:.8,owner:'player'});p.face=a;hitCrime(1);for(let i=0;i<6;i++)particles.push({x:origin.x,y:origin.y,vx:(Math.random()-.5)*90,vy:(Math.random()-.5)*90,life:.22,color:'#ffd283'});}
  function addPolice(){let a=Math.random()*Math.PI*2,d=520+Math.random()*200;let c=makeCar(clamp(player.x+Math.cos(a)*d,ROAD/2,WORLD_W-ROAD/2),clamp(player.y+Math.sin(a)*d,ROAD/2,WORLD_H-ROAD/2),a,true);c.ai=false;c.speed=75;cars.push(c);}
  function update(dt,input){state.clock+=dt;state.day=(state.day+dt/210)%1;state.shake=Math.max(0,state.shake-dt*20);mission.messageTime=Math.max(0,mission.messageTime-dt);state.freeTime=Math.max(0,state.freeTime-dt);if(player.invuln>0)player.invuln-=dt;
    if(input.toggleMute)state.muted=!state.muted;
    if(state.screen==='title'){if(input.confirm)state.screen='play';return;}
    if(state.screen==='pause'){if(input.pause||input.confirm)state.screen='play';return;}
    if(state.screen==='busted'||state.screen==='wasted'){if(input.confirm){player.x=ROAD_X(1)+ROAD/2;player.y=ROAD_Y(1)+ROAD/2;player.health=100;player.inCar=null;state.wanted=0;state.heat=0;state.screen='play';save();}return;}
    if(input.pause){state.screen='pause';save();return;}
    if(input.enter){if(player.inCar)exitCar();else if(state.missionStart&&dist(player,mission.marker)<60){state.missionStart=false;startMission();}else if(!mission.active&&!mission.done&&mission.index>0&&mission.marker&&dist(player,mission.marker)<60)startMission();else enterCar(closestCar());}
    if(input.shoot)shoot(input.worldX,input.worldY);
    const p=player;
    if(p.inCar){let c=p.inCar;const accel=(input.up?1:0)-(input.down?1:0);c.speed+=accel*(input.handbrake?150:235)*dt;c.speed*=Math.pow(input.handbrake?.965:.987,dt*60);c.speed=clamp(c.speed,-145,365);c.angle+=input.turn*(input.handbrake?2.6:1.75)*dt*Math.sign(c.speed||1);c.x+=Math.cos(c.angle)*c.speed*dt;c.y+=Math.sin(c.angle)*c.speed*dt;const oldx=c.x,oldy=c.y; c.x=clamp(c.x,30,WORLD_W-30);c.y=clamp(c.y,30,WORLD_H-90); if(c.x!==oldx||c.y!==oldy){c.speed*=-.25;state.shake=4;} p.x=c.x;p.y=c.y;p.angle=c.angle;if(Math.abs(c.speed)>130){for(const ped of peds){if(ped.alive&&dist(c,ped)<30){ped.alive=false;hitCrime(1);state.shake=8;player.health-=2;}}for(const other of cars){if(other!==c&&dist(c,other)<34){other.speed*=.35;c.speed*=-.28;state.shake=7;if(other.police)hitCrime(2);}}}if(Math.abs(c.speed)>95&&Math.random()<dt*2)marks.push({x:c.x-Math.cos(c.angle)*25,y:c.y-Math.sin(c.angle)*25,a:c.angle,life:8});}
    else {const ax=input.right-input.left,ay=input.down-input.up,mag=Math.hypot(ax,ay)||1;const speed=input.run?205:128;p.x+=ax/mag*speed*dt;p.y+=ay/mag*speed*dt;p.x=clamp(p.x,14,WORLD_W-14);p.y=clamp(p.y,14,WORLD_H-90);if(ax||ay)p.face=Math.atan2(ay,ax);}
    for(const c of cars){c.flash+=dt;if(c===p.inCar)continue;if(c.ai){if(c.wait>0)c.wait-=dt;else{const sp=48+(c.police?20:0)+(Math.random()-.5)*9;c.x+=c.axis==='h'?c.dir*sp*dt:0;c.y+=c.axis==='v'?c.dir*sp*dt:0;if(c.x<ROAD_X(0)||c.x>WORLD_W-ROAD_X(0)){c.dir*=-1;c.x=clamp(c.x,ROAD_X(0),WORLD_W-ROAD_X(0));}if(c.y<ROAD_Y(0)||c.y>WORLD_H-ROAD_Y(0)){c.dir*=-1;c.y=clamp(c.y,ROAD_Y(0),ROAD_Y(ROWS-1));}c.angle=c.axis==='h'?(c.dir>0?0:Math.PI):(c.dir>0?Math.PI/2:-Math.PI/2);}}
      if(c.police){const a=Math.atan2(p.y-c.y,p.x-c.x),d=dist(p,c);c.angle=a;c.x+=Math.cos(a)*Math.min(118,35+d*.11)*dt;c.y+=Math.sin(a)*Math.min(118,35+d*.11)*dt;if(d<45){if(p.inCar){p.inCar.speed*=.92;p.inCar.health-=dt*7;}else if(p.invuln<=0){p.health-=dt*12;if(p.health<=0)state.screen='busted';}}}}
    for(const ped of peds){if(!ped.alive)continue;ped.panic=Math.max(0,ped.panic-dt);const near=dist(p,ped);if(near<125&&(p.inCar&&Math.abs(p.inCar.speed)>60||input.shoot))ped.panic=3;if(ped.panic>0){const flee=Math.atan2(ped.y-p.y,ped.x-p.x);ped.angle=flee;ped.x+=Math.cos(flee)*ped.speed*2.7*dt;ped.y+=Math.sin(flee)*ped.speed*2.7*dt;}else{if(Math.random()<dt*.8)ped.angle+=(Math.random()-.5)*1.5;ped.x+=Math.cos(ped.angle)*ped.speed*dt;ped.y+=Math.sin(ped.angle)*ped.speed*dt;}ped.x=clamp(ped.x,8,WORLD_W-8);ped.y=clamp(ped.y,8,WORLD_H-95);}
    for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let consumed=b.life<=0||b.x<0||b.y<0||b.x>WORLD_W||b.y>WORLD_H;for(const e of mission.enemies){if(e.alive&&b.owner==='player'&&Math.hypot(e.x-b.x,e.y-b.y)<15){e.health-=35;consumed=true;if(e.health<=0)e.alive=false;break;}}if(consumed)bullets.splice(i,1);}
    for(const e of mission.enemies){if(!e.alive)continue;let a=Math.atan2(p.y-e.y,p.x-e.x),d=dist(p,e);e.angle=a;e.fire-=dt;if(d<420&&e.fire<=0){bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*265,vy:Math.sin(a)*265,life:1.5,owner:'enemy'});e.fire=1.3+Math.random()*.9;}if(d<480){e.x-=Math.cos(a)*10*dt;e.y-=Math.sin(a)*10*dt;}}
    for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];if(b.owner==='enemy'&&Math.hypot(b.x-p.x,b.y-p.y)<15&&p.invuln<=0){p.health-=12;p.invuln=.3;bullets.splice(i,1);state.shake=3;if(p.health<=0)state.screen='wasted';}}
    if(state.wanted>0){state.policeTimer-=dt;if(state.policeTimer<=0&&cars.filter(c=>c.police).length<state.wanted+1){addPolice();state.policeTimer=Math.max(1.1,4-state.wanted*.4);}if(state.heat>0)state.heat-=dt;else if(!cars.some(c=>c.police&&dist(c,p)<430)){state.wanted=Math.max(0,state.wanted-dt*.045);}}
    if(mission.active){if(mission.type==='race'){mission.timer-=dt;if(mission.timer<=0){mission.active=false;mission.objective='The delivery window closed. Press E to retry.';}}if(mission.type==='escape'&&state.wanted===0&&mission.stage===1)completeMission();if(mission.type==='fight'&&!mission.enemies.some(e=>e.alive))completeMission();if(mission.type==='visit'&&dist(p,mission.marker)<52)completeMission();if(mission.type==='race'&&dist(p,mission.marker)<55)completeMission();}
    if(mission.active&&mission.type==='escape'&&mission.stage===0&&state.wanted>0)mission.stage=1;
    state.camera.x+=(p.x-state.camera.x)*Math.min(1,dt*4.5);state.camera.y+=(p.y-state.camera.y)*Math.min(1,dt*4.5);
    for(let i=particles.length-1;i>=0;i--){let q=particles[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;if(q.life<=0)particles.splice(i,1);}for(let i=marks.length-1;i>=0;i--){marks[i].life-=dt;if(marks[i].life<=0)marks.splice(i,1);}
    if(state.screen==='play'&&p.health<=0)state.screen='wasted';
  }
  function hurt(amount){player.health-=amount;player.invuln=.5;state.shake=5;if(player.health<=0)state.screen='wasted';}
  function catchPlayer(){state.screen='busted';player.cash=Math.max(0,player.cash-250);player.health=100;player.inCar=null;state.wanted=0;save();}
  function setMissionMarker(){if(mission.active&&mission.type==='escape')mission.marker={x:ROAD_X(2)+37,y:ROAD_Y(8)+37};}
  return {state,update,save,loadSave,startMission,beginStory,completeMission,catchPlayer,hurt,hitCrime,shoot,setMissionMarker,jobs};
}
