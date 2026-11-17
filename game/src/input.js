export function createInput(canvas){
  const held=new Set();let actions={confirm:false,pause:false,enter:false,shoot:false,toggleMute:false};let mouse={x:0,y:0,down:false,pressed:false};
  const map={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',ShiftLeft:'run',ShiftRight:'run',Space:'handbrake',KeyE:'enter',KeyM:'toggleMute',Escape:'pause',KeyP:'pause',Enter:'confirm'};
  window.addEventListener('keydown',e=>{const k=map[e.code];if(!k)return;e.preventDefault();if(k==='confirm'||k==='pause'||k==='enter'||k==='toggleMute'){if(!e.repeat)actions[k]=true;}else held.add(k);});
  window.addEventListener('keyup',e=>{const k=map[e.code];if(k)held.delete(k);});window.addEventListener('blur',()=>held.clear());
  canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width;mouse.y=(e.clientY-r.top)/r.height;});
  canvas.addEventListener('pointerdown',e=>{if(e.button===0){mouse.down=true;mouse.pressed=true;actions.confirm=true;}});window.addEventListener('pointerup',()=>{mouse.down=false;});
  return {read(){const a={up:held.has('up'),down:held.has('down'),left:held.has('left'),right:held.has('right'),run:held.has('run'),handbrake:held.has('handbrake'),turn:(held.has('right')?1:0)-(held.has('left')?1:0),confirm:actions.confirm||mouse.pressed,pause:actions.pause,enter:actions.enter,shoot:mouse.pressed,toggleMute:actions.toggleMute,mouseX:mouse.x,mouseY:mouse.y};actions={confirm:false,pause:false,enter:false,shoot:false,toggleMute:false};mouse.pressed=false;return a;}};
}
