export function circuitClock({kind,startedAt,elapsed=0,durationSec,now=Date.now(),running=true}) {
  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const total=Math.max(0,Math.floor(finite(durationSec)));
  const start=finite(startedAt);
  const seconds=Math.min(total,Math.max(0,Math.floor(running&&start>0?(now-start)/1000:finite(elapsed))));
  return {elapsed:seconds,remaining:total-seconds,done:total>0&&seconds>=total,
    completedMinutes:kind==="emom"?Math.floor(seconds/60):0,
    countdown:kind==="emom"&&seconds<total?Math.min(60-seconds%60,total-seconds):total-seconds};
}
