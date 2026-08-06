// Classification des exercices — extraite d'App.jsx pour que le moteur V4 et
// l'interface partagent exactement la meme lecture du catalogue. Deux copies
// auraient fini par diverger.
const noAccent=(t)=>String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();

// Patron de mouvement. L'ordre des regles compte : du plus specifique au plus general.
const PATTERN_RULES=[
  [/gainage|planche|hollow|l-?sit|crunch|twist|releve.*jambe|jambe.*suspendu|ab ?wheel|ab ?rollout|dead ?bug|sit-?up|situp|dragon flag|bird ?dog|pallof/,"core"],
  [/rameur|velo|corde a sauter|corde 3|course|sprint|burpee|mountain climber|jumping jack|assault|ski erg|wall ball/,"cardio"],
  [/traction|chin-?up|pull-?up|tirage vertical|lat pulldown|muscle-?up|front lever/,"pull_v"],
  [/rowing|row |row$|tirage horizontal|face pull|tirage buste/,"pull_h"],
  [/souleve de terre|deadlift|romanian|good morning|hip thrust|glute bridge|swing|clean|snatch|kettlebell complex|sumo|turkish|get-?up|windmill/,"hinge"],
  [/squat|fente|lunge|presse a cuisse|leg press|step-?up|pistol|box jump|hack|bulgare/,"squat"],
  [/curl|biceps/,"arm_pull"],
  [/triceps|kickback|skull|barre au front|extension.*bras|dips triceps/,"arm_push"],
  [/couche|bench|pompe|push-?up|push up|dips|ecarte|fly|pec deck|pec |chest/,"push_h"],
  [/militaire|overhead|epaule|shoulder|arnold|elevation|oiseau|reverse fly|sots|bottoms-?up|press|developpe/,"push_v"],
];
const patternOf=(ex)=>{
  const n=noAccent(ex&&ex.n);
  for(const [re,pat] of PATTERN_RULES){ if(re.test(n)) return pat; }
  // Repli sur le libelle musculaire quand le nom ne dit rien.
  const m=noAccent(ex&&ex.m);
  if(/quad|fessier|jambe|mollet/.test(m)) return "squat";
  if(/ischio|lombaire/.test(m)) return "hinge";
  if(/dos/.test(m)) return "pull_h";
  if(/pec/.test(m)) return "push_h";
  if(/epaule/.test(m)) return "push_v";
  if(/biceps/.test(m)) return "arm_pull";
  if(/triceps/.test(m)) return "arm_push";
  if(/core|abdo|gainage/.test(m)) return "core";
  return "push_h";
};

// Etage de l'exercice : ce qui doit passer en premier, frais, et ce qui peut etre enchaine.
const COMPOUND=["squat","hinge","push_h","push_v","pull_v","pull_h"];
const tierOf=(ex,pattern)=>{
  if(pattern==="core") return "core";
  if(pattern==="cardio") return "cardio";
  const n=noAccent(ex&&ex.n);
  if(pattern==="arm_pull"||pattern==="arm_push") return "isolation";
  if(/elevation|oiseau|ecarte|fly|kickback|pec deck|leg extension|leg curl|mollet|shrug/.test(n)) return "isolation";
  // Seule la BARRE impose la serie droite : elle demande d'etre fraiche et de ne pas etre
  // enchainee. Les machines sont guidees et securisees, elles peuvent tres bien s'enchainer.
  if(ex.eq==="bar"&&COMPOUND.indexOf(pattern)>=0) return "lourd";
  if(COMPOUND.indexOf(pattern)>=0) return "compound";
  return "isolation";
};

// Type de progression : appliquer "+2,5 kg" a une planche ou a un kettlebell n'a aucun sens.
const progOf=(ex,pattern)=>{
  if(pattern==="cardio") return "densite";
  if(/\d+\s*s\b/.test(String(ex&&ex.reps))) return "temps";
  if(ex&&ex.eq==="kb") return "kb";
  if(ex&&ex.eq==="bw") return "bw";
  return "charge";
};

const EX_META={};
const metaOf=(ex)=>{
  if(!ex||!ex.id) return {pattern:"push_h",tier:"isolation",prog:"charge"};
  if(EX_META[ex.id]) return EX_META[ex.id];
  const pattern=patternOf(ex);
  const meta={pattern,tier:tierOf(ex,pattern),prog:progOf(ex,pattern)};
  EX_META[ex.id]=meta;
  return meta;
};

export { noAccent, PATTERN_RULES, patternOf, COMPOUND, tierOf, progOf, metaOf };
