export function createAudio(){
  let ctx=null,master=null,engine=null,osc=null,muted=false,lastSiren=0;
  function boot(){if(ctx)return;ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.14;master.connect(ctx.destination);osc=ctx.createOscillator();engine=ctx.createGain();osc.type='sawtooth';osc.frequency.value=48;engine.gain.value=0;osc.connect(engine);engine.connect(master);osc.start();}
  function tone(freq,duration,wave='sine',volume=.18){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.value=freq;g.gain.setValueAtTime(volume,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+duration);}
  function event(name){boot();if(ctx.state==='suspended')ctx.resume();if(name==='gun'){tone(105,.09,'square',.28);tone(48,.13,'sawtooth',.16);}else if(name==='hit'){tone(75,.2,'triangle',.3);}else if(name==='pickup'){tone(650,.12);setTimeout(()=>tone(880,.22),100);}else if(name==='mission'){tone(440,.15);setTimeout(()=>tone(660,.18),130);setTimeout(()=>tone(880,.25),280);}else if(name==='siren'){tone(500+Math.sin(Date.now()/170)*170,.14,'square',.035);}else if(name==='skid'){tone(160,.16,'sawtooth',.045);}}
  function update(car,wanted){if(!ctx)return;if(engine){engine.gain.setTargetAtTime(car?Math.min(.075,.012+Math.abs(car.speed)/5200):0,ctx.currentTime,.12);osc.frequency.setTargetAtTime(car?48+Math.abs(car.speed)*.25:48,ctx.currentTime,.12);}if(wanted>0&&Date.now()-lastSiren>760){lastSiren=Date.now();event('siren');}}
  function setMuted(value){muted=value;if(master)master.gain.setTargetAtTime(muted?0:.14,ctx.currentTime,.04);}
  return {event,update,setMuted,boot};
}
