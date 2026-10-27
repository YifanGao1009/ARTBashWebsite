'use strict';
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('.bloom-stage');
  const plane = document.querySelector('.hero-tracking');
  // Match the actual contained artwork, independently of viewport aspect ratio.
  function alignPlane() {
    const r = stage.getBoundingClientRect(), h = hero.getBoundingClientRect();
    const width = Math.min(r.width, r.height * 2 / 3);
    plane.style.width = width + 'px'; plane.style.height = width * 1.5 + 'px';
    plane.style.left = r.left - h.left + r.width / 2 + 'px';
    plane.style.top = r.top - h.top + r.height / 2 + 'px';
  }
  new ResizeObserver(alignPlane).observe(stage); alignPlane();

  // A small non-modal, anchored window keeps context visible and allows another target to be selected.
  const panel = document.createElement('section');
  panel.id = 'opportunity-popover'; panel.className = 'tracking-popover';
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'popover-title');
  panel.hidden = true;
  panel.innerHTML = '<header><span id="popover-category"></span><button type="button" aria-label="Close information">×</button></header><div class="popover-content"><h2 id="popover-title"></h2><p class="popover-date"></p><div class="popover-description"></div></div>';
  document.body.append(panel);
  let active = null;
  const closeButton = panel.querySelector('button');
  function close(restore = false) {
    panel.hidden = true;
    if(active){active.classList.remove('is-selected');active.setAttribute('aria-expanded','false');if(restore)active.focus({preventScroll:true});}
    active = null;
  }
  function position() {
    if (!active || panel.hidden) return;
    const r = active.getBoundingClientRect(), artwork = plane.getBoundingClientRect();
    const gap = 14, pad = 14;
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const right = r.left + r.width / 2 >= artwork.left + artwork.width / 2;
    panel.dataset.side = right ? 'right' : 'left';
    const available = right ? vw - r.right - gap - pad : r.left - gap - pad;
    // Keep the requested outward side. Narrow the panel before allowing edge overlap.
    const width = vw < 600 ? Math.min(340,vw-pad*2) : Math.min(340,Math.max(240,available),vw-pad*2);
    panel.style.width = width + 'px';
    const box = panel.getBoundingClientRect();
    let x = right ? r.right + gap : r.left - gap - box.width;
    let y = r.top - 18;
    if (vw < 600) {
      x = right ? vw-pad-box.width : pad;
      y = r.bottom + gap + box.height < vh-pad ? r.bottom + gap : r.top - box.height - gap;
    }
    panel.style.left = Math.max(pad,Math.min(x,vw-box.width-pad)) + 'px';
    panel.style.top = Math.max(pad,Math.min(y,vh-box.height-pad)) + 'px';
  }
  const records = document.getElementById('opportunity-data').content;
  function openTarget(target) {
    close(); active = target;
    const record = records.getElementById(target.dataset.target);
    panel.querySelector('#popover-title').textContent = record.dataset.name;
    panel.querySelector('#popover-category').textContent = record.querySelector('.event-category').textContent;
    panel.querySelector('.popover-date').textContent = 'DUE / ' + record.querySelector('time').textContent;
    panel.querySelector('.popover-description').replaceChildren(...[...record.querySelectorAll('.description-inner > p')].map(p=>p.cloneNode(true)));
    target.classList.add('is-selected'); target.setAttribute('aria-expanded','true');
    panel.hidden=false; position(); closeButton.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-target]').forEach(target => {
    target.setAttribute('aria-haspopup','dialog');target.setAttribute('aria-controls',panel.id);target.setAttribute('aria-expanded','false');
    target.addEventListener('click', event => {
      event.preventDefault();
      if(active===target){close();return;}
      openTarget(target);
    });
  });
  function revealHash() {
    const id = location.hash.slice(1);
    if (id === 'opportunities') { hero.scrollIntoView({block:'start'}); return; }
    const target = [...plane.querySelectorAll('[data-target]')].find(el=>el.dataset.target === id);
    if (!target || !hero.classList.contains('is-digital')) return;
    hero.scrollIntoView({block:'start',behavior:'instant'});
    requestAnimationFrame(()=>openTarget(target));
  }
  const entrance = new MutationObserver(()=>{
    if (!hero.classList.contains('is-digital')) return;
    entrance.disconnect(); revealHash();
  });
  entrance.observe(hero,{attributes:true,attributeFilter:['class']});
  window.addEventListener('hashchange',revealHash);
  revealHash();
  closeButton.addEventListener('click',()=>close(true));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();close(true);}});
  document.addEventListener('pointerdown',event=>{if(active&&!panel.contains(event.target)&&!event.target.closest('[data-target]'))close();});
  // Dismiss on page scroll instead of leaving a floating window detached from its target.
  document.addEventListener('scroll',event=>{if(event.target===document)close();},{passive:true});
  window.addEventListener('resize',position);

  // Decorative magenta particles, paused when offscreen or the document is hidden.
  document.querySelectorAll('.ambient-particles').forEach(canvas => {
    const ctx=canvas.getContext('2d');if(!ctx)return;
    let width=0,height=0,frame=0,visible=false;
    const dots=Array.from({length:canvas.classList.contains('hero-particles')?520:110},(_,i)=>({x:((i*73.37)%100)/100,y:((i*41.61)%100)/100,s:i%11===0?3:i%3===0?2:1,a:.24+(i%7)*.075,phase:i*1.7}));
    function draw(now=0){
      frame=0;ctx.clearRect(0,0,width,height);
      const t=reduce.matches?0:now*.00018;
      for(const p of dots){
        const x=p.x*width+Math.sin(t+p.phase)*12,y=(p.y*height-t*9+height*100)%height;
        ctx.fillStyle=`rgba(236,76,167,${p.a})`;ctx.fillRect(x,y,p.s,p.s);
        if(p.s>=2){ctx.fillStyle='rgba(236,76,167,.09)';ctx.fillRect(x-3,y-3,8,8);}
      }
      if(visible&&!document.hidden&&!reduce.matches)frame=requestAnimationFrame(draw);
    }
    function update(){cancelAnimationFrame(frame);if(visible&&!document.hidden)draw(performance.now());}
    new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);update();}).observe(canvas);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();}).observe(canvas);
    document.addEventListener('visibilitychange',update);reduce.addEventListener('change',update);
  });
})();
