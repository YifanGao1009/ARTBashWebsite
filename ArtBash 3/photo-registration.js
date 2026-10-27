'use strict';
// Both assets depict the same specimen with different framing and local proportions.
// Register the photograph once in the digital image's coordinate system; each window
// is then a literal viewport onto that shared layer, including at responsive sizes.
(() => {
  const photograph = document.getElementById('flower');
  // [photo x,y at 736x1308, digital x,y at 1280x1920]. Petal and tendril landmarks.
  const landmarks = [
    [0,0,0,0],[736,0,1280,0],[0,1308,0,1920],[736,1308,1280,1920],
    [530,84,977,30],[535,139,965,139],[576,141,1040,106],
    [94,150,220,150],[215,232,430,258],[336,152,624,114],[386,199,733,230],
    [203,285,375,397],[147,326,260,478],[98,384,170,583],[109,469,220,742],
    [180,506,340,780],[275,355,490,505],[239,408,407,597],[287,492,503,737],
    [344,245,670,285],[306,300,555,385],[291,409,526,630],[350,532,646,846],
    [383,237,774,295],[513,176,906,188],[572,262,1032,340],
    [610,330,1155,459],[636,412,1207,602],[601,499,1116,764],
    [446,349,868,469],[466,471,882,695],[378,620,734,954],[481,584,943,914],
    // Anchor the left filament at the actual frame crossings, not the nearby petal.
    [93,538,159,818],[130,565,220,849],[180,611,350,951.2],
    [210,634.5,430,995],[280,658,525,1015.6],[300,656.5,580,1008.8],
    [113,679,193,1042],[130,736.5,220,1128.1],[143,760,256,1190.4],[146,766,267,1207],[150,773,280,1220],
    [180,797.5,350,1263.8],[210,808.1,430,1295],[250,805,525,1252.5],
    [130,772.5,180,1208.1],[180,767.5,350,1210.6],
    [210,761,430,1190],[250,746,525,1145.6],
    // Left anther loop: lock its entry through the window's left edge.
    // The old landmark sampled empty black pixels to the left of the real anther.
    [100,704,172,1101],[78.5,722,128,1119.4],[63.3,738,95,1154],
    [58.7,748,82,1176],[53.7,774,79,1217],[66,800,98,1260],
    [76.5,811,140,1296],[82,763,128,1195],[105,770,150,1203],
    [388,883,725,1415],[216,1008,416,1587],[277,1014,566,1580],[212,1268,434,1887],
    // Lower-right diagonal and return curl: constrain both sides of each crossing.
    [420,665,807,1029.4],[450,683,850,1071.2],[480,701,900,1108.1],
    [520,725.5,950,1141.9],[550,742.5,1000,1175],
    [610,780.5,1100,1235],[640,806.5,1178,1272.5],[651,809,1190,1285],
    [636,858,1178,1380],[626,885,1162,1424],
    [428,730,807,1141.9],[450,754.5,850,1195.6],
    [480,790,900,1240.6],[520,822,980,1300],[555,807,1040,1273],
    [570,700,1050,1112],[533,664,990,1044]
  ];
  // Preserve the thin stalk's width between the bulb and the lower crossing.
  // Paired normal constraints prevent a rubber-sheet stretch into a broad wedge.
  [[115,700,197,1080],[120,714,205,1100],[130,736.5,220,1128.1],
   [135,748,235,1158],[140,756,250,1180],[143,760,256,1190.4],
   [146,766,267,1207]].forEach(([x,y,u,v])=>{
    landmarks.push([x-4,y,u-7,v],[x+4,y,u+7,v]);
  });
  const normalizedLandmarks=landmarks.map(([x,y,u,v])=>({x:x/736,y:y/1308,u:u/1280,v:v/1920}));
  const kernel = r => r < 1e-12 ? 0 : r * Math.log(r);
  function coefficients(axis) {
    const n=normalizedLandmarks.length, size=n+3;
    const a=Array.from({length:size},()=>new Float64Array(size+1));
    normalizedLandmarks.forEach((p,i)=>{
      normalizedLandmarks.forEach((q,j)=>{a[i][j]=kernel((p.u-q.u)**2+(p.v-q.v)**2)+(i===j?0.0000001:0);});
      a[i][n]=a[n][i]=1;a[i][n+1]=a[n+1][i]=p.u;a[i][n+2]=a[n+2][i]=p.v;a[i][size]=p[axis];
    });
    for(let col=0;col<size;col++){
      let pivot=col;for(let row=col+1;row<size;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
      [a[col],a[pivot]]=[a[pivot],a[col]];
      const divisor=a[col][col];if(Math.abs(divisor)<1e-12)throw new Error('Degenerate flower registration');
      for(let j=col;j<=size;j++)a[col][j]/=divisor;
      for(let row=0;row<size;row++){if(row===col)continue;const f=a[row][col];for(let j=col;j<=size;j++)a[row][j]-=f*a[col][j];}
    }
    return a.map(row=>row[size]);
  }
  let registered;
  function createLayer(){
    const cx=coefficients('x'),cy=coefficients('y'),n=normalizedLandmarks.length;
    function source(u,v){
      let x=cx[n]+cx[n+1]*u+cx[n+2]*v,y=cy[n]+cy[n+1]*u+cy[n+2]*v;
      normalizedLandmarks.forEach((p,i)=>{const k=kernel((p.u-u)**2+(p.v-v)**2);x+=cx[i]*k;y+=cy[i]*k;});
      return [x*photograph.naturalWidth,y*photograph.naturalHeight];
    }
    registered=document.createElement('canvas');registered.width=1024;registered.height=1536;
    const ctx=registered.getContext('2d');ctx.imageSmoothingQuality='high';
    const nx=96,ny=144;
    const grid=Array.from({length:ny+1},(_,j)=>Array.from({length:nx+1},(_,i)=>({s:source(i/nx,j/ny),d:[i/nx*1024,j/ny*1536]})));
    function triangle(p,q,r){
      const [sx,sy]=p.s,ux=q.s[0]-sx,uy=q.s[1]-sy,vx=r.s[0]-sx,vy=r.s[1]-sy;
      const det=ux*vy-uy*vx;if(Math.abs(det)<1e-8)return;
      const dx=q.d[0]-p.d[0],dy=q.d[1]-p.d[1],ex=r.d[0]-p.d[0],ey=r.d[1]-p.d[1];
      const a=(dx*vy-ex*uy)/det,c=(ex*ux-dx*vx)/det,b=(dy*vy-ey*uy)/det,d=(ey*ux-dy*vx)/det;
      ctx.save();ctx.beginPath();
      const center=[(p.d[0]+q.d[0]+r.d[0])/3,(p.d[1]+q.d[1]+r.d[1])/3];
      [p,q,r].forEach((pt,i)=>{const x=pt.d[0]+(pt.d[0]-center[0])*.025,y=pt.d[1]+(pt.d[1]-center[1])*.025;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.closePath();ctx.clip();ctx.setTransform(a,b,c,d,p.d[0]-a*sx-c*sy,p.d[1]-b*sx-d*sy);ctx.drawImage(photograph,0,0);ctx.restore();
    }
    for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const p=grid[y][x],q=grid[y][x+1],r=grid[y+1][x],s=grid[y+1][x+1];triangle(p,q,r);triangle(q,s,r);}
    paintWindows();
  }
  function paintWindows(){
    if(!registered)return;
    document.querySelectorAll('.frame-photo').forEach(canvas=>{
      const target=canvas.parentElement, surface=target.parentElement;
      const surfaceW=surface.clientWidth,surfaceH=surface.clientHeight;
      const artW=Math.min(surfaceW,surfaceH*2/3),artH=artW*1.5;
      const left=(surfaceW-artW)/2,top=(surfaceH-artH)/2;
      const x=target.offsetLeft+target.clientLeft-left,y=target.offsetTop+target.clientTop-top;
      const w=target.clientWidth,h=target.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
      if(!w||!h||!artW)return;
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
      ctx.drawImage(registered,x/artW*1024,y/artH*1536,w/artW*1024,h/artH*1536,0,0,canvas.width,canvas.height);
    });
  }
  const observer=new ResizeObserver(paintWindows);
  document.querySelectorAll('.hero-tracking,.specimen').forEach(el=>observer.observe(el));
  if(photograph.complete&&photograph.naturalWidth)createLayer();else photograph.addEventListener('load',createLayer,{once:true});
})();
