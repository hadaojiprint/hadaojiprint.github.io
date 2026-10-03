import test from 'node:test';
import assert from 'node:assert/strict';
import {dimensions,removeBackground,bounds,paint,withPpi} from '../tools/print-data/core.mjs';
function logo(){const rgba=new Uint8ClampedArray(7*7*4).fill(255);for(let y=1;y<=5;y++)for(let x=1;x<=5;x++){const i=(y*7+x)*4;rgba[i]=rgba[i+1]=rgba[i+2]=0;}const eye=(3*7+3)*4;rgba[eye]=rgba[eye+1]=rgba[eye+2]=255;return rgba;}
test('white boundary is removed but enclosed white detail is retained',()=>{
  const rgba=logo(),{mask}=removeBackground(rgba,7,7,[255,255,255],30);
  assert.equal(mask[0],0);assert.equal(mask[3*7+3],255);assert.equal(mask[1*7+1],255);
  assert.deepEqual(bounds(rgba,mask,7,7),{x:1,y:1,w:5,h:5});
});
test('picking an enclosed background removes only that connected region',()=>{
  const rgba=logo(),{mask,removed}=removeBackground(rgba,7,7,[255,255,255],30,3*7+3);
  assert.equal(removed,1);assert.equal(mask[3*7+3],0);assert.equal(mask[0],255);
});
test('manual erase and restore preserve original alpha and detect empty artwork',()=>{
  const rgba=logo(),mask=new Uint8Array(49).fill(255);paint(mask,7,7,3,3,20,0);assert.equal(bounds(rgba,mask,7,7),null);
  paint(mask,7,7,3,3,0,255);assert.deepEqual(bounds(rgba,mask,7,7),{x:3,y:3,w:1,h:1});rgba[(3*7+3)*4+3]=0;assert.equal(bounds(rgba,mask,7,7),null);
});
test('print dimensions are calculated from cm and PPI and enforce memory limits',()=>{
  assert.deepEqual(dimensions(25,30,300),{w:2953,h:3544});assert.deepEqual(dimensions(2.54,2.54,300),{w:300,h:300});
  assert.throws(()=>dimensions(0,25,300));assert.throws(()=>dimensions(200,200,600));assert.throws(()=>dimensions(NaN,25,300));
});
test('PNG export includes a single pHYs metre unit chunk, also when replaced',()=>{
  const png=new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64'));
  const out=withPpi(withPpi(png,150),300);let pos=8,phys=[];while(pos<out.length){const len=new DataView(out.buffer,pos,4).getUint32(0);const type=String.fromCharCode(...out.slice(pos+4,pos+8));if(type==='pHYs')phys.push(out.slice(pos+8,pos+8+len));pos+=len+12;}
  assert.equal(phys.length,1);assert.equal(new DataView(phys[0].buffer).getUint32(0),11811);assert.equal(new DataView(phys[0].buffer).getUint32(4),11811);assert.equal(phys[0][8],1);
  assert.throws(()=>withPpi(png,0));assert.throws(()=>withPpi(new Uint8Array(20),300));
});
