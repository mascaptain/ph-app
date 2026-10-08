import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {brandSvg,BRAND_VIEWBOX} from '../src/brand-mark.js';

test('all branded assets use font-independent touching-letter geometry',()=>{
  const svg=brandSvg();
  assert.equal(readFileSync(new URL('../public/logo.svg',import.meta.url),'utf8'),svg);
  assert.equal(readFileSync(new URL('../public/brand/soma.svg',import.meta.url),'utf8'),svg);
  assert.ok(svg.includes(`viewBox="${BRAND_VIEWBOX}"`));
  assert.ok(!svg.includes('<text'));
  assert.ok(brandSvg({color:'#ffffff'}).includes('fill="#ffffff"'));
});

test('PWA, Apple and sharing assets exist, PNG dimensions are correct',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/manifest.json',import.meta.url)));
  for(const icon of manifest.icons){
    const file=new URL('../public'+icon.src.split('?')[0],import.meta.url);
    assert.ok(existsSync(file));
    const png=readFileSync(file);
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`,icon.sizes);
  }
  for(const [name,width,height] of [['icon-180.png',180,180],['social.png',1200,630]]){
    const png=readFileSync(new URL('../public/brand/'+name,import.meta.url));
    assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);
  }
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(html.includes('/brand/icon-180.png?v=5.11.1'));
  assert.ok(html.includes('/brand/social.png?v=5.11.1'));
});
