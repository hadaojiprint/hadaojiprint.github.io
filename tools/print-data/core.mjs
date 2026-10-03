export function bounds(rgba, mask, w, h) {
  let l=w,t=h,r=-1,b=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    if(rgba[i*4+3]*mask[i]/255>2){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  }
  return r<0?null:{x:l,y:t,w:r-l+1,h:b-t+1};
}
export function dimensions(widthCm,heightCm,ppi){
  if(![widthCm,heightCm,ppi].every(v=>Number.isFinite(v)&&v>0))throw Error('実寸とPPIに正の数を入力してください。');
  const w=Math.ceil(widthCm/2.54*ppi),h=Math.ceil(heightCm/2.54*ppi);
  if(w>12000||h>12000||w*h>24000000)throw Error('出力は2400万画素・一辺12000pxまでです。実寸またはPPIを小さくしてください。');
  return {w,h};
}
// Only background connected to the image boundary or an explicit seed is removed.
// Enclosed whites in a logo remain intact, unlike a global colour-key operation.
export function removeBackground(rgba,w,h,colour,tolerance,seed=null){
  const n=w*h,visited=new Uint8Array(n),queue=new Uint32Array(n),mask=new Uint8Array(n).fill(255);
  let tail=0,head=0;
  const allowed=i=>{
    if(rgba[i*4+3]===0)return true;
    const d=Math.max(Math.abs(rgba[i*4]-colour[0]),Math.abs(rgba[i*4+1]-colour[1]),Math.abs(rgba[i*4+2]-colour[2]));
    return d<=tolerance;
  };
  const add=i=>{if(i>=0&&i<n&&!visited[i]){visited[i]=1;if(allowed(i)){queue[tail++]=i;mask[i]=0;}}};
  if(seed!==null)add(seed);else{
    for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}
    for(let y=1;y<h-1;y++){add(y*w);add(y*w+w-1);}
  }
  while(head<tail){const i=queue[head++],x=i%w;if(x>0)add(i-1);if(x<w-1)add(i+1);if(i>=w)add(i-w);if(i<n-w)add(i+w);}
  return {mask,removed:tail};
}
export function cornerColour(rgba,w,h){
  const samples=[];
  for(const [cx,cy] of [[0,0],[w-1,0],[0,h-1],[w-1,h-1]]){
    for(let dy=0;dy<Math.min(4,h);dy++)for(let dx=0;dx<Math.min(4,w);dx++){
      const x=cx===0?dx:cx-dx,y=cy===0?dy:cy-dy,i=(y*w+x)*4;
      if(rgba[i+3]>128)samples.push([rgba[i],rgba[i+1],rgba[i+2]]);
    }
  }
  if(!samples.length)return [255,255,255];
  return [0,1,2].map(c=>samples.map(s=>s[c]).sort((a,b)=>a-b)[Math.floor(samples.length/2)]);
}
export function paint(mask,w,h,x,y,radius,value){
  for(let yy=Math.max(0,Math.floor(y-radius));yy<=Math.min(h-1,Math.ceil(y+radius));yy++){
    for(let xx=Math.max(0,Math.floor(x-radius));xx<=Math.min(w-1,Math.ceil(x+radius));xx++){
      if((xx-x)**2+(yy-y)**2<=radius**2)mask[yy*w+xx]=value;
    }
  }
}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function physicalChunk(ppi){
  const c=new Uint8Array(21),v=new DataView(c.buffer);v.setUint32(0,9);
  c.set([112,72,89,115],4);const ppm=Math.round(ppi/0.0254);v.setUint32(8,ppm);v.setUint32(12,ppm);c[16]=1;
  v.setUint32(17,crc32(c.subarray(4,17)));return c;
}
export function withPpi(png,ppi){
  if(!Number.isFinite(ppi)||ppi<1||ppi>2400)throw Error('PPIは1〜2400で指定してください。');
  if(png.length<33||png[0]!==137||png[1]!==80||png[2]!==78||png[3]!==71)throw Error('PNG形式ではありません。');
  const chunks=[png.slice(0,8)];let offset=8,inserted=false;
  while(offset+12<=png.length){
    const v=new DataView(png.buffer,png.byteOffset+offset,4),len=v.getUint32(0),end=offset+len+12;
    if(end>png.length)throw Error('PNGデータが壊れています。');
    const type=String.fromCharCode(...png.subarray(offset+4,offset+8));
    if(type!=='pHYs')chunks.push(png.slice(offset,end));
    if(type==='IHDR'&&!inserted){chunks.push(physicalChunk(ppi));inserted=true;}
    offset=end;
  }
  if(!inserted)throw Error('PNGヘッダーがありません。');
  const out=new Uint8Array(chunks.reduce((a,c)=>a+c.length,0));let pos=0;for(const c of chunks){out.set(c,pos);pos+=c.length;}return out;
}
