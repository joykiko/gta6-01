let ctx=null,muted=false;
export function sound(kind='tap'){if(muted)return;ctx??=new AudioContext();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g).connect(ctx.destination);o.frequency.value=kind==='gun'?180:kind==='siren'?720:90;g.gain.value=.025;o.start();g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);o.stop(ctx.currentTime+.13)}
export function toggleMute(){muted=!muted}
