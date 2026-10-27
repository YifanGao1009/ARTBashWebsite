'use strict';
(()=>{
 const cursor=document.querySelector('.saic-cursor'),logo=cursor.querySelector('img');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');let frame=0,x=0,y=0;
 const hide=()=>{document.body.classList.remove('saic-cursor-active');cancelAnimationFrame(frame);frame=0;};
 function move(event){if(!fine.matches||event.pointerType!=='mouse'||!logo.complete||!logo.naturalWidth){hide();return;}
 if(!event.target.closest('.hero')||event.target.closest('.hero.is-digitizing')||event.target.closest('input,textarea,[contenteditable="true"]')){hide();return;}
 x=event.clientX;y=event.clientY;
 cursor.classList.toggle('is-link',!!event.target.closest('a,button,summary,[role="button"]'));
 if(!frame)frame=requestAnimationFrame(()=>{cursor.style.transform=`translate3d(${x-25}px,${y-10}px,0)`;document.body.classList.add('saic-cursor-active');frame=0;});
 }
 window.addEventListener('pointermove',move,{passive:true});
 document.addEventListener('pointerout',e=>{if(!e.relatedTarget)hide();});
 window.addEventListener('blur',hide);fine.addEventListener('change',hide);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
 window.addEventListener('pointerdown',()=>cursor.classList.add('is-pressed'),{passive:true});
 window.addEventListener('pointerup',()=>cursor.classList.remove('is-pressed'),{passive:true});
})();
