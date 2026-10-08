// node scripts/build-brand-assets.mjs [absolute path to sharp package]
import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import {brandSvg} from '../src/brand-mark.js';
const require=createRequire(import.meta.url);
const sharp=require(process.argv[2]||'sharp');
const out=new URL('../public/brand/',import.meta.url);
await mkdir(out,{recursive:true});
const svg=brandSvg();
await writeFile(new URL('soma.svg',out),svg);
await writeFile(new URL('../logo.svg',out),svg);
await writeFile(new URL('soma-white.svg',out),brandSvg({color:'#ffffff'}));
const iconSvg=brandSvg({background:'#ffffff',viewBox:'-125 -393 1060 1060'});
await writeFile(new URL('../favicon.svg',out),iconSvg);
for(const size of [16,32,180,192,512]) {
  await sharp(Buffer.from(iconSvg)).resize(size,size).png().toFile(new URL(`icon-${size}.png`,out).pathname.replace(/^\/([A-Z]:)/,'$1'));
}
// A wider safe zone for launchers that crop maskable icons to a circle.
await sharp(Buffer.from(brandSvg({background:'#ffffff',viewBox:'-190 -458 1190 1190'})))
  .resize(512,512).png().toFile(new URL('icon-maskable-512.png',out).pathname.replace(/^\/([A-Z]:)/,'$1'));
await sharp(Buffer.from(svg)).resize(810,274).png().toFile(new URL('soma.png',out).pathname.replace(/^\/([A-Z]:)/,'$1'));
await sharp(Buffer.from(brandSvg({background:'#ffffff',viewBox:'-165 -162 1140 598.5'})))
  .resize(1200,630).png().toFile(new URL('social.png',out).pathname.replace(/^\/([A-Z]:)/,'$1'));
// PNG-backed ICO, supported by current browsers. Two actual bitmap sizes.
const bitmaps=await Promise.all([16,32].map(size=>sharp(Buffer.from(iconSvg)).resize(size,size).png().toBuffer()));
const header=Buffer.alloc(6+16*bitmaps.length);header.writeUInt16LE(1,2);header.writeUInt16LE(bitmaps.length,4);
let offset=header.length;
bitmaps.forEach((b,i)=>{const p=6+i*16;header[p]=[16,32][i];header[p+1]=header[p];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(b.length,p+8);header.writeUInt32LE(offset,p+12);offset+=b.length;});
await writeFile(new URL('../favicon.ico',out),Buffer.concat([header,...bitmaps]));
console.log('Generated SVG, PNG, ICO, Apple/PWA and social assets from the shared SŌMA geometry.');
