// Shared outline of the approved SŌMA wordmark: touching letters, drawn macron.
// No font dependency. UI and exported assets must use this exact geometry.
export const BRAND_VIEWBOX = "0 0 810 274";
export const BRAND_PATHS = [
  "M158 66 C133 43 106 41 88 41 C48 41 23 60 23 92 C23 125 48 137 88 147 C133 158 162 168 162 199 C162 235 134 254 92 254 C60 254 32 244 12 218",
  "M389 256 V45 H397 L487 188 L581 45 H585 V256",
  "M585 256 L688 45 H694 L793 256 M618 187 H759",
];
export const BRAND_CIRCLE = {cx:277,cy:149,r:107};
export const BRAND_MACRON = {x:221,y:6,width:113,height:11.5};
export const BRAND_STROKE = 11.5;

export function brandSvg({color="#111111",background=null,viewBox=BRAND_VIEWBOX}={}) {
  const backgroundRect=background?`<rect x="${viewBox.split(' ')[0]}" y="${viewBox.split(' ')[1]}" width="${viewBox.split(' ')[2]}" height="${viewBox.split(' ')[3]}" fill="${background}"/>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="SŌMA">${backgroundRect}<g fill="none" stroke="${color}" stroke-width="${BRAND_STROKE}" stroke-linejoin="miter">${BRAND_PATHS.map(d=>`<path d="${d}"/>`).join('')}<circle cx="277" cy="149" r="107"/></g><rect x="221" y="6" width="113" height="11.5" fill="${color}"/></svg>`;
}
