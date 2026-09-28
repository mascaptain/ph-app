// Séances maison : composées dans le créateur, rangées avec les Hero pour être
// choisies en un geste. Même format que les entraînements personnels.
export const HOUSE_WORKOUTS=[
  {id:'house_duo10',name:'Duo 10 tours',format:'rounds',rounds:10,roundRestSec:60,durationMin:45,moves:[
    {name:'Squats',quantity:5,unit:'reps',kg:0},{name:'Arnold press',quantity:5,unit:'reps',kg:0,link:true},
    {name:'Bent over rows',quantity:5,unit:'reps',kg:0},{name:'Upright rows',quantity:5,unit:'reps',kg:0,link:true},
    {name:'RDL',quantity:5,unit:'reps',kg:0},{name:'Front squats',quantity:5,unit:'reps',kg:0,link:true},
    {name:'Jump lunges',quantity:5,unit:'reps',kg:0},
    {name:'Burpees',quantity:5,unit:'reps',kg:0}]},
  {id:'house_chipper280',name:'Chipper 280',format:'fortime',rounds:1,durationMin:20,moves:[
    {name:'Burpee snatches',quantity:40,unit:'reps',kg:0},{name:'Thrusters',quantity:40,unit:'reps',kg:0},
    {name:'Cleans',quantity:40,unit:'reps',kg:0},{name:'Gorilla rows',quantity:40,unit:'reps',kg:0},
    {name:'Reverse lunges',quantity:40,unit:'reps',kg:0},{name:'Alt press',quantity:40,unit:'reps',kg:0},
    {name:'Press up knee to elbow',quantity:40,unit:'reps',kg:0}]},
].map(w=>({...w,house:true,moves:w.moves.map(m=>({sets:1,restSec:0,...m}))}));
