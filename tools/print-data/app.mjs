import {bounds,dimensions,removeBackground,cornerColour,paint,withPpi} from './core.mjs';
const $=id=>document.getElementById(id),canvas=$('preview'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const source=document.createElement('canvas'),sctx=source.getContext('2d',{willReadFrequently:true});
let rgba,mask,w=0,h=0,history=[],mode='view',before=false,seed=null,stroke=null,fileName='design',saveUrl=null,busy=false;
let brushBefore=null,currentBlob=null,importVersion=0;
const tell=(message,error=false)=>{$('status').textContent=message;$('status').classList.toggle('error',error);};
function lock(on){busy=on;document.querySelectorAll('[data-needs-image]').forEach(e=>e.disabled=on||!rgba);$('demo').disabled=on;$('upload').disabled=on;$('auto').textContent=on?'処理しています…':'背景を自動除去';}
function saveHistory(){history.push(mask.slice());if(history.length>6)history.shift();$('undo').disabled=false;}
function invalidate(){if(saveUrl){URL.revokeObjectURL(saveUrl);saveUrl=null;}$('result').hidden=true;currentBlob=null;}
function box(){return rgba?($('crop').checked?bounds(rgba,mask,w,h):{x:0,y:0,w,h}):null;}
function ratio(){const b=box();return b?b.h/b.w:1;}
function updateDimensions(changed='width'){
  const r=ratio();if(changed==='height')$('width').value=(Number($('height').value)/r).toFixed(3);else $('height').value=(Number($('width').value)*r).toFixed(3);
  invalidate();summary();
}
function summary(){
  const b=box();if(!b){$('spec').textContent=rgba?'デザインが残っていません。「元に戻す」で復元してください。':'画像を読み込むと出力の画素数を表示します。';$('make').disabled=true;$('quality').textContent='';return;}
  try{
    const cm=Number($('width').value),ppi=Number($('ppi').value),out=dimensions(cm,Number($('height').value),ppi);
    $('spec').textContent=`出力 ${out.w.toLocaleString()} × ${out.h.toLocaleString()} px ／ ${ppi} PPI`;
    const available=Math.min(b.w/cm*2.54,b.h/Number($('height').value)*2.54),scale=Math.max(out.w/b.w,out.h/b.h);
    $('quality').textContent=scale>1.02?`元デザインは ${b.w} × ${b.h} px。この実寸では約${Math.round(available)} PPIです。${scale.toFixed(1)}倍に拡大しますが、細部の画質は増えません。`:`元デザイン ${b.w} × ${b.h} px。指定の画素数を確保しています。`;
    $('quality').classList.toggle('warning',scale>1.02);$('make').disabled=busy;
  }catch(e){$('spec').textContent=e.message;$('quality').textContent='';$('make').disabled=true;}
  $('undo').disabled=!history.length||busy;
}
function draw(){
  if(!rgba)return;
  const data=new Uint8ClampedArray(rgba);if(!before)for(let i=0;i<mask.length;i++)data[i*4+3]=Math.round(data[i*4+3]*mask[i]/255);
  sctx.putImageData(new ImageData(data,w,h),0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);
  $('image-info').textContent=`${w} × ${h} px ／ ${before?'元画像':'加工後（市松模様は透明部分）'}`;
}
function setMode(value){mode=value;before=false;$('after').setAttribute('aria-pressed','true');$('before').setAttribute('aria-pressed','false');canvas.style.touchAction=mode==='view'?'pan-y':'none';canvas.style.cursor=mode==='view'?'default':'crosshair';document.querySelectorAll('[data-mode]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.mode===mode)));$('edit-hint').textContent=mode==='view'?'閲覧中はプレビュー上でもスクロールできます。':mode==='pick'?'背景をタップして色を指定。続けて「背景を自動除去」を押してください。':'プレビューをなぞって調整。編集する間だけ、この画面内のスクロールを止めます。';draw();}
function init(image,name){
  w=image.width;h=image.height;source.width=w;source.height=h;sctx.clearRect(0,0,w,h);sctx.drawImage(image,0,0);
  rgba=sctx.getImageData(0,0,w,h).data;mask=new Uint8Array(w*h).fill(255);history=[];seed=null;fileName=name.replace(/\.[^.]+$/,'').replace(/[^\w\u3000-\u9fff-]/g,'_').slice(0,60)||'design';
  const k=Math.min(1,1400/w,1400/h);canvas.width=Math.round(w*k);canvas.height=Math.round(h*k);
  const colour=cornerColour(rgba,w,h);$('bg-colour').value='#'+colour.map(v=>v.toString(16).padStart(2,'0')).join('');
  $('empty').hidden=true;canvas.hidden=false;lock(false);setMode('view');updateDimensions();$('image-area').classList.add('has-image');
}
$('upload').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;const version=++importVersion;lock(true);tell('画像を読み込んでいます…');
  let url;
  try{
    if(file.size>35*1024*1024)throw Error('画像は35MBまでです。小さめのPNG・JPEG・WebPを選んでください。');
    url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();
    if(image.width*image.height>12000000||image.width>9000||image.height>9000)throw Error('スマホの安定動作のため、画像は1200万画素・一辺9000pxまでです。元画像を小さくして読み込んでください。');
    if(version!==importVersion)return;init(image,file.name);tell('画像を読み込みました。単色の背景は自動除去、細部は「消す・戻す」で調整できます。');
  }catch(err){tell('読み込めませんでした。'+err.message,true);}finally{if(url)URL.revokeObjectURL(url);lock(false);summary();e.target.value='';}
});
$('demo').onclick=()=>{
  const demo=document.createElement('canvas');demo.width=800;demo.height=800;const d=demo.getContext('2d');d.fillStyle='#ffffff';d.fillRect(0,0,800,800);
  d.fillStyle='#123b2d';d.beginPath();d.ellipse(380,350,200,130,0,0,Math.PI*2);d.fill();d.beginPath();d.moveTo(570,350);d.lineTo(700,230);d.lineTo(700,470);d.closePath();d.fill();
  d.fillStyle='#ffffff';d.beginPath();d.arc(290,315,35,0,Math.PI*2);d.fill();d.fillStyle='#123b2d';d.beginPath();d.arc(290,315,15,0,Math.PI*2);d.fill();
  d.strokeStyle='#ffd400';d.lineWidth=25;d.lineCap='round';d.beginPath();d.moveTo(150,550);d.quadraticCurveTo(260,470,380,550);d.quadraticCurveTo(500,630,650,550);d.stroke();
  init(demo,'hadaoji-demo');tell('サンプルを読み込みました。自動除去しても、魚の目の内側にある白は残ります。');
};
$('auto').onclick=async()=>{
  if(!rgba||busy)return;lock(true);tell('背景を除去しています…');await new Promise(r=>setTimeout(r,20));
  try{
    const hex=$('bg-colour').value,c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
    const result=removeBackground(rgba,w,h,c,Number($('tolerance').value),seed);
    saveHistory();for(let i=0;i<mask.length;i++)mask[i]=Math.min(mask[i],result.mask[i]);before=false;setMode('view');updateDimensions();draw();
    tell(result.removed?`背景を除去しました。文字の穴など、外周からつながっていない背景は、色指定でその場所を選ぶか「消す」で調整できます。`:'指定色の背景が見つかりませんでした。「背景の色を拾う」で背景を選んでください。');
  }catch(e){tell('処理できませんでした。'+e.message,true);}finally{lock(false);summary();}
};
$('bg-colour').oninput=()=>{seed=null;};
$('tolerance').oninput=()=>{$('tol-value').textContent=$('tolerance').value;};
$('brush').oninput=()=>{$('brush-value').textContent=$('brush').value;};
document.querySelectorAll('[data-mode]').forEach(e=>e.onclick=()=>setMode(e.dataset.mode));
for(const [id,value] of [['before',true],['after',false]])$(id).onclick=()=>{if(stroke!==null)return;before=value;mode='view';canvas.style.touchAction='pan-y';document.querySelectorAll('[data-mode]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.mode==='view')));$('before').setAttribute('aria-pressed',String(value));$('after').setAttribute('aria-pressed',String(!value));draw();};
function point(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(w-1,(e.clientX-r.left)/r.width*w)),y:Math.max(0,Math.min(h-1,(e.clientY-r.top)/r.height*h))};}
function brushAt(p){const r=Number($('brush').value)/100*Math.min(w,h)/2;paint(mask,w,h,p.x,p.y,r,mode==='erase'?0:255);}
canvas.onpointerdown=e=>{
  if(!rgba||busy||mode==='view'||stroke!==null)return;e.preventDefault();const p=point(e);
  if(mode==='pick'){seed=Math.floor(p.y)*w+Math.floor(p.x);const i=seed*4;$('bg-colour').value='#'+[rgba[i],rgba[i+1],rgba[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');tell('背景の色を指定しました。「背景を自動除去」で、この場所につながる背景を消します。');return;}
  saveHistory();brushBefore=history[history.length-1];stroke={id:e.pointerId,last:p};canvas.setPointerCapture(e.pointerId);brushAt(p);invalidate();draw();
};
canvas.onpointermove=e=>{
  if(!stroke||e.pointerId!==stroke.id)return;e.preventDefault();const p=point(e),a=stroke.last,dist=Math.hypot(p.x-a.x,p.y-a.y),r=Number($('brush').value)/100*Math.min(w,h)/2,steps=Math.max(1,Math.ceil(dist/Math.max(1,r*.4)));
  for(let i=1;i<=steps;i++)brushAt({x:a.x+(p.x-a.x)*i/steps,y:a.y+(p.y-a.y)*i/steps});stroke.last=p;draw();
};
function endStroke(e){if(!stroke||e.pointerId!==stroke.id)return;stroke=null;brushBefore=null;updateDimensions();draw();}
canvas.onpointerup=endStroke;canvas.onlostpointercapture=endStroke;canvas.onpointercancel=e=>{if(stroke&&stroke.id===e.pointerId&&brushBefore){mask=brushBefore;history.pop();}endStroke(e);};
$('undo').onclick=()=>{if(!history.length||busy)return;mask=history.pop();updateDimensions();draw();tell('ひとつ前の状態に戻しました。');};
$('reset').onclick=()=>{saveHistory();mask.fill(255);seed=null;updateDimensions();draw();tell('背景除去と手動調整をリセットしました。');};
document.querySelectorAll('[data-backdrop]').forEach(e=>e.onclick=()=>{$('image-area').dataset.backdrop=e.dataset.backdrop;document.querySelectorAll('[data-backdrop]').forEach(b=>b.setAttribute('aria-pressed',String(b===e)));});
for(const id of ['width','height','ppi','crop'])$(id).addEventListener('input',()=>updateDimensions(id));
$('make').onclick=async()=>{
  if(!rgba||busy)return;const b=box();if(!b){tell('デザインが残っていません。元に戻してください。',true);return;}lock(true);tell('指定サイズのPNGを作っています…');
  try{
    const ppi=Number($('ppi').value),out=dimensions(Number($('width').value),Number($('height').value),ppi);before=false;draw();
    const exportCanvas=document.createElement('canvas');exportCanvas.width=out.w;exportCanvas.height=out.h;const ectx=exportCanvas.getContext('2d');ectx.imageSmoothingEnabled=true;ectx.imageSmoothingQuality='high';ectx.drawImage(source,b.x,b.y,b.w,b.h,0,0,out.w,out.h);
    const raw=await new Promise((resolve,reject)=>exportCanvas.toBlob(b=>b?resolve(b):reject(Error('画像を作成できませんでした。出力サイズを小さくしてください。')),'image/png'));
    const bytes=withPpi(new Uint8Array(await raw.arrayBuffer()),ppi);currentBlob=new Blob([bytes],{type:'image/png'});if(saveUrl)URL.revokeObjectURL(saveUrl);saveUrl=URL.createObjectURL(currentBlob);
    const name=`${fileName}_${$('width').value}cm_${ppi}ppi.png`;$('download').href=saveUrl;$('download').download=name;$('saved-preview').src=saveUrl;$('result').hidden=false;
    $('output-info').textContent=`${out.w} × ${out.h} px ／ ${ppi} PPI ／ 約${(currentBlob.size/1024/1024).toFixed(2)} MB`;
    $('share').hidden=!(navigator.canShare&&navigator.canShare({files:[new File([currentBlob],name,{type:'image/png'})]}));tell('PNGを作成しました。「PNGをダウンロード」から保存してください。');
    exportCanvas.width=exportCanvas.height=1;
  }catch(e){tell('出力できませんでした。'+e.message,true);}finally{lock(false);summary();}
};
$('share').onclick=async()=>{try{await navigator.share({files:[new File([currentBlob],$('download').download,{type:'image/png'})],title:'HADAOJI プリントデータ'});}catch(e){if(e.name!=='AbortError')tell('共有できませんでした。PNGのダウンロードを使ってください。',true);}};
lock(false);summary();
