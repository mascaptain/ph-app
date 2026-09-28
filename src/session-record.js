// Explicit database boundary: UI fields must never become invented SQL columns.
export function sessionRecord(entry, {week, blocks=[]}={}) {
  const feedback={...(entry.feedback||{})};
  if(entry.tag || blocks.length) feedback.workout={
    ...(feedback.workout||{}),tag:entry.tag||null,
    blocks:blocks.map(block=>({heroId:block.heroId||null,heroName:block.heroName||null,
      label:block.label,kind:block.kind,execution:block.execution,
      durationMin:block.durationMin,exerciseIds:(block.exercises||[]).map(ex=>ex.id)})),
  };
  return {
    user_id:entry.user_id,date:entry.date,week,day:entry.day,
    day_label:entry.dayLabel,session_type:entry.dayLabel,
    session_index:entry.sessionIndex,mode:entry.mode,
    total_kg:entry.totalKg,total_sets:entry.totalSets,
    target_kg:entry.targetKg,target_sets:entry.targetSets,
    duration_seconds:entry.duration,score:entry.score,completed:true,
    exercises:entry.exercises,feedback,notes:feedback.notes||"",
  };
}
