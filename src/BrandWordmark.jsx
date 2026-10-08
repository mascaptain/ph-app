import {BRAND_VIEWBOX,BRAND_PATHS,BRAND_CIRCLE,BRAND_MACRON,BRAND_STROKE} from './brand-mark.js';

export default function BrandWordmark({h=22,color="currentColor"}) {
  return <svg role="img" aria-label="SŌMA" viewBox={BRAND_VIEWBOX}
    width={h*810/274} height={h} focusable="false"
    style={{display:"inline-block",flexShrink:0,verticalAlign:"middle",color}}>
    <g fill="none" stroke="currentColor" strokeWidth={BRAND_STROKE} strokeLinejoin="miter">
      {BRAND_PATHS.map((d,i)=><path key={i} d={d}/>)}
      <circle {...BRAND_CIRCLE}/>
    </g>
    <rect {...BRAND_MACRON} fill="currentColor"/>
  </svg>;
}
