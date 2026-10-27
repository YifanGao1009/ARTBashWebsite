'use strict';
// Spring-driven lettering: hover separates letters, drag displaces the word, release restores it.
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 for(const word of document.querySelectorAll('.title-word')){
 const letters=[...word.querySelectorAll('.title-letter')].map(el=>({el,x:0,y:0,vx:0,vy:0,tx:0,ty:0,impulseAt:0}));
 let frame=0,previous=0,inside=false,dragging=false,downX=0,downY=0,dragX=0,dragY=0,distance=0,rect=null;
 function animate(now){frame=0;const dt=Math.min((now-(previous||now-16.7))/16.7,2);previous=now;let moving=false;
 letters.forEach((p,i)=>{if(p.impulseAt&&now>=p.impulseAt){p.vy=-12-i*1.3;p.vx=(i%2?-1:1)*3;p.impulseAt=0;}
 const tx=p.tx+dragX,ty=p.ty+dragY;
 p.vx+=(tx-p.x)*.075*dt;p.vy+=(ty-p.y)*.075*dt;p.vx*=Math.pow(.74,dt);p.vy*=Math.pow(.74,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;
 p.el.style.transform=`translate3d(${p.x}px,${p.y}px,0) rotate(${p.x*.075}deg)`;
 if(Math.abs(p.x-tx)+Math.abs(p.y-ty)+Math.abs(p.vx)+Math.abs(p.vy)>.05||p.impulseAt)moving=true;
 });if(moving)frame=requestAnimationFrame(animate);}
 function run(){if(!reduce.matches&&!frame){previous=0;frame=requestAnimationFrame(animate);}}
 function reset(){letters.forEach(p=>{p.tx=0;p.ty=0;});dragX=0;dragY=0;run();}
 word.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;inside=true;rect=word.getBoundingClientRect();});
 word.addEventListener('pointermove',e=>{if(reduce.matches||e.pointerType!=='mouse')return;if(dragging){dragX=Math.max(-90,Math.min(90,(e.clientX-downX)*.55));dragY=Math.max(-70,Math.min(70,(e.clientY-downY)*.55));distance=Math.hypot(e.clientX-downX,e.clientY-downY);}
 else if(inside){rect ||=word.getBoundingClientRect();const local=e.clientX-rect.left;letters.forEach((p,i)=>{const center=(i+.5)*rect.width/letters.length;const d=local-center;const proximity=Math.max(0,1-Math.abs(d)/(rect.width*.65));p.tx=-Math.sign(d)*proximity*16;p.ty=-proximity*24+(i%2?5:-3);});}run();},{passive:true});
 word.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||reduce.matches)return;dragging=true;distance=0;downX=e.clientX;downY=e.clientY;word.setPointerCapture(e.pointerId);word.classList.add('is-dragging');});
 function release(){dragging=false;word.classList.remove('is-dragging');reset();}
 word.addEventListener('pointerup',release);word.addEventListener('pointercancel',release);word.addEventListener('lostpointercapture',()=>{if(dragging)release();});
 word.addEventListener('pointerleave',()=>{inside=false;rect=null;if(!dragging)reset();});
 word.addEventListener('click',()=>{if(reduce.matches)return;if(distance>5){distance=0;return;}letters.forEach((p,i)=>p.impulseAt=performance.now()+i*60);run();window.dispatchEvent(new CustomEvent('artbash:burst'));});
 word.addEventListener('keydown',e=>{if(e.key==='Escape')release();});
 reduce.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;if(reduce.matches){letters.forEach(p=>{p.x=p.y=p.vx=p.vy=p.tx=p.ty=0;p.el.style.transform='none';});}});
 }
})();
