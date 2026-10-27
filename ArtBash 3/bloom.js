'use strict';
// Sample the supplied Gloriosa photograph: preserve every petal, tendril and stem.
const canvas=document.getElementById('bloom'),image=document.getElementById('flower');
const ctx=canvas.getContext('2d',{alpha:true}),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const digital=document.getElementById('digital-flower');
let complete=false,digitalReady=false;
let groups=[],frame=0,start=0,width=0,height=0,ready=false,inView=true;
const hero=document.querySelector('.hero'),control=document.querySelector('.bloom-control');
let pointer={x:-1000,y:-1000,active:false},burst={x:0,y:0,time:-10000},previous=0;
function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,1.7);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(ready&&reduced.matches)render(performance.now());}
function render(now){if(!ready)return;const elapsed=(now-start)/1000,t=reduced.matches?0:elapsed;
 if(digitalReady && (reduced.matches || elapsed>=6.5)) hero.classList.add('is-digitizing');
 if(digitalReady && (reduced.matches || elapsed>=9.2)) { complete=true;hero.classList.add('is-digital');document.querySelector('.hero-tracking').inert=false;document.querySelector('#hero-title').inert=true;ctx.clearRect(0,0,width,height);return; }

 const dt=Math.min((now-(previous||now-16.7))/16.7,2);previous=now;
 const h=Math.min(height*1.10,width/(image.naturalWidth/image.naturalHeight)*.97),w=h*image.naturalWidth/image.naturalHeight;
 ctx.clearRect(0,0,width,height);
 ctx.globalAlpha=reduced.matches?1:Math.min(1,elapsed/1.7);
 for(const group of groups){ctx.fillStyle=group.color;ctx.beginPath();for(const dot of group.dots){
 const petal=Math.max(0,Math.min(1,(.65-dot.y)*4));
 const delay=(Math.sin(dot.x*8+dot.y*5)+1)*.28;
 const p=reduced.matches?1:Math.max(0,Math.min((elapsed-delay)/5.8,1));
 const bloom=p*p*p*(p*(p*6-15)+10),unfold=1-bloom;
 let x=(dot.x-.5)*w,y=(dot.y-.48)*h;
 // Each side unfurls around the flower's base, then sways in a shared breeze.
 const turn=unfold*(dot.x<.5?-.32:.32)*petal;
 const sway=reduced.matches?0:Math.sin(t*.48+dot.y*3)*.021*petal;
 const angle=turn+sway;
 const nx=x*Math.cos(angle)-y*Math.sin(angle);
 y=x*Math.sin(angle)+y*Math.cos(angle);x=nx;
 x*=1-.22*unfold*petal;
 if(!reduced.matches){
 const drift=unfold*unfold;
 x+=Math.sin(dot.phase+t*.4)*w*.09*drift+Math.sin(t*.7+dot.y*9)*w*.009*petal;
 y+=Math.cos(dot.phase+t*.3)*h*.045*drift+Math.sin(t*.6+dot.x*6)*h*.006*petal;
 x+=Math.sin(t*.9+dot.phase)*.7;y+=Math.cos(t*.8+dot.phase)*.6;
 }
 let px=width*.5+x,py=height*.48+y;
 if(!reduced.matches){
 let fx=-dot.ox*.038,fy=-dot.oy*.038;
 if(pointer.active){const dx=px+dot.ox-pointer.x,dy=py+dot.oy-pointer.y,d=Math.hypot(dx,dy);const radius=Math.min(115,width*.23);if(d<radius&&d>.1){const force=(1-d/radius)*2.8;fx+=dx/d*force;fy+=dy/d*force;}}
 const age=(now-burst.time)/1000;
 if(age>=0&&age<1.25){const dx=px-burst.x,dy=py-burst.y,d=Math.hypot(dx,dy);const ring=age*620;const edge=(d-ring)/55;const force=Math.exp(-edge*edge)*4*(1-age/1.25);if(d>.1){fx+=dx/d*force;fy+=dy/d*force;}}
 dot.vx=(dot.vx+fx*dt)*Math.pow(.87,dt);dot.vy=(dot.vy+fy*dt)*Math.pow(.87,dt);dot.ox+=dot.vx*dt;dot.oy+=dot.vy*dt;
 px+=dot.ox;py+=dot.oy;
 }
 const radius=(w/270)*dot.size*(1+.2*unfold);
 ctx.moveTo(px+radius,py);ctx.arc(px,py,radius,0,Math.PI*2);
 }ctx.fill();}
 ctx.globalAlpha=1;
 if(!reduced.matches&&inView&&!document.hidden)frame=requestAnimationFrame(render);
}
function resume(){cancelAnimationFrame(frame);if(ready&&!complete)frame=requestAnimationFrame(render);}
function setup(){try{
 const sample=document.createElement('canvas');sample.width=270;sample.height=Math.round(270*image.naturalHeight/image.naturalWidth);const sc=sample.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0,sample.width,sample.height);const {data}=sc.getImageData(0,0,sample.width,sample.height);const buckets=new Map();
 for(let y=0;y<sample.height;y++)for(let x=0;x<sample.width;x++){
 const i=(y*sample.width+x)*4,r=data[i],g=data[i+1],b=data[i+2];if(Math.max(r,g,b)<25)continue;
 const q=v=>Math.min(255,Math.round(v/16)*16);
 const color=`rgb(${q(r)} ${q(g)} ${q(b)})`;if(!buckets.has(color))buckets.set(color,[]);
 const seed=Math.sin(x*127.1+y*311.7)*43758.5453,n=seed-Math.floor(seed);
 buckets.get(color).push({x:(x+(n-.5)*.45)/sample.width,y:(y+(n-.5)*.45)/sample.height,phase:n*Math.PI*2,size:.50+n*.20,ox:0,oy:0,vx:0,vy:0});
 }
 groups=Array.from(buckets,([color,dots])=>({color,dots}));ready=true;start=performance.now();hero.classList.add('is-blooming');canvas.style.display='block';image.style.opacity='0';resize();resume();
 }catch(e){canvas.style.display='none';image.style.opacity='1';}}
if(ctx){new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)resume();else cancelAnimationFrame(frame);},{threshold:0}).observe(canvas);reduced.addEventListener('change',resume);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else resume();});if(image.complete&&image.naturalWidth)setup();else image.addEventListener('load',setup,{once:true});}

// Pointer events feed only the canvas simulation; touch scrolling stays native.
hero.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches)return;const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;pointer.active=true;},{passive:true});
hero.addEventListener('pointerleave',()=>{pointer.active=false;});
function scatter(event){if(reduced.matches)return;const r=canvas.getBoundingClientRect();burst={x:event&&event.detail!==0?event.clientX-r.left:width*.5,y:event&&event.detail!==0?event.clientY-r.top:height*.38,time:performance.now()};resume();}
function replay(){
 if(reduced.matches)return;
 complete=false;hero.classList.remove('is-digitizing','is-digital');document.querySelector('.hero-tracking').inert=true;document.querySelector('#hero-title').inert=false;
 start=performance.now();previous=0;
 for(const group of groups)for(const dot of group.dots){dot.ox=dot.oy=dot.vx=dot.vy=0;}
 burst.time=-10000;resume();
}
control.addEventListener('click',replay);
function digitalLoaded(){digitalReady=true;if(ready)resume();}
if(digital.complete&&digital.naturalWidth)digitalLoaded();else digital.addEventListener('load',digitalLoaded,{once:true});

window.addEventListener('artbash:burst',()=>scatter());
