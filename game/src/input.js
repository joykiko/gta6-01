export const keys=new Set();
addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault()});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
