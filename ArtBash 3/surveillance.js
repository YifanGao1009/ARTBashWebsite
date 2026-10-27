'use strict';
(() => {
  const hero=document.querySelector('.hero'),canvas=hero.querySelector('.vision-backdrop');
  const plane=hero.querySelector('.hero-tracking'),photo=document.getElementById('flower');
  const ctx=canvas.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let width=0,height=0,art={x:0,y:0,w:0,h:0},visible=false,frame=0,last=-Infinity;
  const started=performance.now();
  // Same specimen, three fixed camera stations. Source crops follow visible petal landmarks.
  const stations=[
    {crop:[80,265,220,250],target:[.27,.3],box:[.035,.28,.20,.19]},
    {crop:[385,270,240,300],target:[.79,.38],box:[.79,.35,.18,.22]},
    {crop:[300,555,180,180],target:[.575,.5],box:[.075,.70,.18,.17]}
  ];
  function line(points,color='rgba(236,76,167,.3)'){
    ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  }
  function corners(x,y,w,h,k=7){
    ctx.strokeStyle='rgba(244,112,183,.65)';ctx.lineWidth=1;
    ctx.beginPath();for(const [a,b,dx,dy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){ctx.moveTo(a+k*dx,b);ctx.lineTo(a,b);ctx.lineTo(a,b+k*dy);}ctx.stroke();
  }
  function draw(now){
    ctx.clearRect(0,0,width,height);
    if(!photo.complete||!photo.naturalWidth||!art.w)return;
    const elapsed=reduce.matches?0:(now-started)/1000;
    const compact=width<768;
    const state=Math.floor(elapsed*5);
    stations.slice(0,compact?2:3).forEach((station,i)=>{
      // Geometry is held, then re-detected in discrete steps; never interpolated or floated.
      const cycle=(elapsed+i*.83)%4.6;
      const acquiring=!reduce.matches && cycle<.48;
      const sample=Math.floor((elapsed+i*.83)/4.6);
      const offset=acquiring?((Math.floor(cycle*15)%3)-1)*5:0;
      const tx=art.x+art.w*station.target[0],ty=art.y+art.h*station.target[1];
      let [px,py,pw,ph]=station.box;
      if(compact){[px,py,pw,ph]=i===0?[.025,.105,.22,.115]:[.755,.79,.22,.115];}
      const x=Math.round(px*width),y=Math.round(py*height),w=Math.round(pw*width),h=Math.round(ph*height);
      const bw=art.w*(acquiring?.105:.075),bh=art.h*(acquiring?.068:.05);
      const bx=Math.round(tx-bw/2+offset),by=Math.round(ty-bh/2-offset);
      // A right-angle leader ties the fixed view to the actual flower feature.
      const edge=x+w/2<tx?x+w:x,elbow=(edge+tx)/2;
      line([[edge,y+h*.52],[elbow,y+h*.52],[elbow,ty],[tx,ty]],'rgba(236,76,167,.25)');
      ctx.strokeStyle='rgba(236,76,167,.38)';ctx.strokeRect(bx,by,bw,bh);corners(bx,by,bw,bh,5);
      line([[tx-4,ty],[tx+4,ty]],'rgba(245,142,199,.55)');line([[tx,ty-4],[tx,ty+4]],'rgba(245,142,199,.55)');
      ctx.font=`${compact?7:9}px monospace`;ctx.fillStyle='rgba(245,142,199,.65)';
      ctx.fillText(String(i+1).padStart(2,'0'),bx,by-5);
      // Camera crops remain in place, with a short recapture step and a raster scan.
      ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
      ctx.fillStyle='rgba(7,5,7,.38)';ctx.fillRect(x,y,w,h);
      const [sx,sy,sw,sh]=station.crop;
      ctx.globalAlpha=compact?.23:.35;ctx.filter='grayscale(1)';
      const zoom=acquiring?1.04:1;const aspect=w/h;
      let cw=sw/zoom,ch=cw/aspect;if(ch>sh/zoom){ch=sh/zoom;cw=ch*aspect;}
      ctx.drawImage(photo,sx+(sw-cw)/2,sy+(sh-ch)/2,cw,ch,x,y,w,h);
      ctx.filter='none';ctx.globalAlpha=1;
      ctx.fillStyle='rgba(236,76,167,.055)';ctx.fillRect(x,y,w,h);
      ctx.fillStyle='rgba(0,0,0,.22)';for(let row=0;row<h;row+=4)ctx.fillRect(x,y+row,w,1);
      for(let n=0;n<38;n++){
        const nx=(n*47+state*13+i*11)%Math.max(1,w),ny=(n*29+state*7)%Math.max(1,h);
        ctx.fillStyle=n%2?'rgba(236,76,167,.1)':'rgba(240,210,228,.09)';ctx.fillRect(x+nx,y+ny,1,1);
      }
      const scan=reduce.matches?h*.4:(elapsed*.22+i*.31)%1*h;
      line([[x,y+scan],[x+w,y+scan]],'rgba(236,76,167,.24)');
      const insetW=w*.36,insetH=h*.43;
      const dx=acquiring?offset:0;
      const ix=x+w*.32+dx,iy=y+h*.25-dx;
      ctx.strokeStyle='rgba(236,76,167,.4)';ctx.strokeRect(ix,iy,insetW,insetH);corners(ix,iy,insetW,insetH,4);
      ctx.restore();
      ctx.strokeStyle='rgba(236,76,167,.38)';ctx.strokeRect(x,y,w,h);corners(x,y,w,h);
      ctx.font=`${compact?7:9}px monospace`;ctx.fillStyle='rgba(236,114,180,.72)';
      ctx.fillText(`CAM ${String(i+1).padStart(2,'0')}`,x,y-7);
      const seconds=Math.floor(elapsed),clock=`${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
      ctx.textAlign='right';ctx.fillText(clock,x+w,y-7);ctx.textAlign='left';
      // Different residual detections per camera: broken brackets, contours, and node traces.
      // Their positions are sampled and held, preserving the stepped surveillance rhythm.
      if(!compact){
        const drift=(sample%3-1)*3;
        const mark=(rx,dy,points,nodes=[])=>{
          const ox=x+w*rx+drift,oy=y+h+dy;
          if(oy+36>=height-12)return;
          ctx.save();ctx.translate(ox,oy);
          line(points,'rgba(236,76,167,.38)');
          ctx.fillStyle='rgba(236,76,167,.6)';
          nodes.forEach(([nx,ny])=>ctx.fillRect(nx-1,ny-1,2,2));
          ctx.restore();
        };
        if(i===0){
          mark(.06,20,[[0,11],[0,0],[18,0]],[[7,7],[13,12]]);
          mark(.36,38,[[0,0],[7,0],[7,6],[22,6],[22,17],[15,17]],[[12,9]]);
          mark(.81,17,[[0,0],[35,0],[35,8],[24,8]],[[6,4],[19,4]]);
        }else if(i===1){
          mark(.14,24,[[0,5],[9,0],[27,3],[31,17],[18,24],[3,18],[0,5]],[[13,10],[23,14]]);
          mark(.69,42,[[-7,0],[7,0]],[[0,0]]);
          mark(.69,42,[[0,-9],[0,6],[12,6],[12,16]],[[12,16]]);
        }else{
          mark(.04,20,[[0,0],[13,0],[13,6],[29,6],[29,19],[8,19],[8,13]],[[5,5],[21,12]]);
          mark(.50,30,[[0,16],[12,16],[12,2],[27,2],[27,9],[43,9]],[[0,16],[12,2],[27,9],[43,9]]);
          mark(.88,16,[[0,0],[0,9],[9,9]],[[5,4]]);
        }
      }
    });
  }
  function tick(now){frame=0;if(now-last>110){draw(now);last=now;}frame=requestAnimationFrame(tick);}
  function update(){
    cancelAnimationFrame(frame);frame=0;
    if(!visible||document.hidden||!hero.classList.contains('is-digital'))return;
    draw(performance.now());if(!reduce.matches)frame=requestAnimationFrame(tick);
  }
  function resize(){
    const h=hero.getBoundingClientRect(),p=plane.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    width=h.width;height=h.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);art={x:p.left-h.left,y:p.top-h.top,w:p.width,h:p.height};update();
  }
  const observer=new ResizeObserver(resize);observer.observe(hero);observer.observe(plane);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();}).observe(hero);
  new MutationObserver(update).observe(hero,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',update);reduce.addEventListener('change',update);
  photo.addEventListener('load',update);resize();
})();
