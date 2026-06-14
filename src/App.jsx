import React, { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const WEEK = "S24";
const USER_ID = "mascaptain";

const DAYS = [
  {
    id: 1, name: "LUNDI", type: "LOWER BODY", color: "#C8FF00",
    sessions: [
      { name: "Squat", sets: 4, reps: 6, rpe: 8 },
      { name: "Romanian Deadlift", sets: 3, reps: 10, rpe: 7 },
      { name: "Leg Press", sets: 3, reps: 12, rpe: 7 },
      { name: "Leg Curl", sets: 3, reps: 12, rpe: 7 },
      { name: "Calf Raises", sets: 4, reps: 15, rpe: 8 },
    ]
  },
  {
    id: 2, name: "MARDI", type: "UPPER BODY", color: "#FF6B35",
    sessions: [
      { name: "Bench Press", sets: 4, reps: 6, rpe: 8 },
      { name: "Barbell Row", sets: 4, reps: 8, rpe: 8 },
      { name: "OHP", sets: 3, reps: 8, rpe: 7 },
      { name: "Pull-ups", sets: 3, reps: 8, rpe: 8 },
      { name: "Dips", sets: 3, reps: 10, rpe: 7 },
    ]
  },
  {
    id: 3, name: "MERCREDI", type: "REPOS ACTIF", color: "#888",
    sessions: []
  },
  {
    id: 4, name: "JEUDI", type: "HYBRID CIRCUIT", color: "#C8FF00",
    sessions: [
      { name: "KB Swing", sets: 5, reps: 15, rpe: 8 },
      { name: "Box Jump", sets: 4, reps: 8, rpe: 7 },
      { name: "Deadlift", sets: 3, reps: 5, rpe: 8 },
      { name: "Farmer Carry", sets: 4, reps: 40, rpe: 7 },
      { name: "Battle Ropes", sets: 4, reps: 30, rpe: 8 },
    ]
  },
  {
    id: 5, name: "VENDREDI", type: "UPPER BODY", color: "#FF6B35",
    sessions: [
      { name: "Incline Press", sets: 4, reps: 8, rpe: 8 },
      { name: "Cable Row", sets: 4, reps: 10, rpe: 7 },
      { name: "Arnold Press", sets: 3, reps: 10, rpe: 7 },
      { name: "Face Pull", sets: 3, reps: 15, rpe: 7 },
      { name: "Bicep Curl", sets: 3, reps: 12, rpe: 7 },
    ]
  },
  {
    id: 6, name: "SAMEDI", type: "LOWER BODY", color: "#C8FF00",
    sessions: [
      { name: "Front Squat", sets: 4, reps: 6, rpe: 8 },
      { name: "Hip Thrust", sets: 4, reps: 10, rpe: 8 },
      { name: "Walking Lunge", sets: 3, reps: 12, rpe: 7 },
      { name: "Leg Extension", sets: 3, reps: 15, rpe: 7 },
      { name: "Standing Calf", sets: 4, reps: 15, rpe: 8 },
    ]
  },
  {
    id: 7, name: "DIMANCHE", type: "REPOS", color: "#444",
    sessions: []
  },
];

const S = {
  app: { minHeight:"100vh", background:"#000", color:"#fff", fontFamily:"Inter,sans-serif" },
  header: { padding:"24px 20px 16px", borderBottom:"1px solid #111" },
  title: { fontFamily:"Bebas Neue,sans-serif", fontSize:48, letterSpacing:6, color:"#C8FF00", lineHeight:1 },
  sub: { color:"#555", fontSize:12, letterSpacing:3, marginTop:4 },
  tabs: { display:"flex", gap:8, padding:"12px 20px", overflowX:"auto", borderBottom:"1px solid #111" },
  tab: (active,color) => ({
    padding:"6px 14px", borderRadius:20, border:`1px solid ${active?color:"#222"}`,
    background: active ? color+"22" : "transparent",
    color: active ? color : "#666", fontSize:11, fontWeight:600,
    letterSpacing:1, cursor:"pointer", whiteSpace:"nowrap", transition:"all .2s"
  }),
  content: { padding:"20px" },
  dayCard: (color) => ({
    background:"#0a0a0a", border:`1px solid ${color}33`,
    borderRadius:12, padding:"16px", marginBottom:16
  }),
  dayHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  dayName: (color) => ({ fontFamily:"Bebas Neue,sans-serif", fontSize:22, color, letterSpacing:3 }),
  dayType: { color:"#555", fontSize:11, letterSpacing:2 },
  exRow: { display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #111" },
  exName: { flex:1, fontSize:13, color:"#ddd" },
  badge: (color) => ({
    padding:"3px 8px", borderRadius:6, background:color+"22",
    color, fontSize:11, fontWeight:700
  }),
  input: { width:60, background:"#111", border:"1px solid #222", borderRadius:6,
    color:"#fff", fontSize:12, padding:"4px 8px", textAlign:"center" },
  logBtn: (done) => ({
    padding:"6px 14px", borderRadius:8,
    background: done ? "#C8FF00" : "transparent",
    border: `1px solid ${done ? "#C8FF00" : "#333"}`,
    color: done ? "#000" : "#555", fontSize:11, fontWeight:700,
    cursor:"pointer", transition:"all .2s"
  }),
  completeBtn: (done,color) => ({
    padding:"8px 20px", borderRadius:8,
    background: done ? color : "transparent",
    border:`1px solid ${done?color:"#333"}`,
    color: done ? "#000":"#555", fontSize:12, fontWeight:700,
    cursor:"pointer", marginTop:12, transition:"all .2s"
  }),
  statsRow: { display:"flex", gap:12, marginBottom:20 },
  statCard: { flex:1, background:"#0a0a0a", border:"1px solid #1a1a1a", borderRadius:10, padding:"12px" },
  statVal: (color) => ({ fontFamily:"Bebas Neue,sans-serif", fontSize:32, color: color||"#fff" }),
  statLabel: { color:"#555", fontSize:10, letterSpacing:2, marginTop:2 },
  toast: { position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
    background:"#C8FF00", color:"#000", padding:"10px 20px", borderRadius:20,
    fontWeight:700, fontSize:13, zIndex:999, boxShadow:"0 4px 20px #C8FF0044" }
};

export default function App() {
  const [view, setView] = useState("program");
  const [activeDay, setActiveDay] = useState(0);
  const [weights, setWeights] = useState({});
  const [completed, setCompleted] = useState({});
  const [sessions, setSessions] = useState([]);
  const [pbs, setPbs] = useState([]);
  const [streak, setStreak] = useState({ current_streak:0, total_sessions:0, longest_streak:0 });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: sess }, { data: pbData }, { data: strData }] = await Promise.all([
        supabase.from("sessions").select("*").eq("user_id", USER_ID).order("date", { ascending: false }),
        supabase.from("personal_bests").select("*").eq("user_id", USER_ID),
        supabase.from("streaks").select("*").eq("user_id", USER_ID).single()
      ]);
      if (sess) setSessions(sess);
      if (pbData) setPbs(pbData);
      if (strData) setStreak(strData);
    } catch(e) { console.log(e); }
    setLoading(false);
  };

  const logSession = async (day) => {
    if (day.sessions.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("sessions").insert({
      user_id: USER_ID,
      date: today,
      week: WEEK,
      day_name: day.name,
      session_type: day.type,
      duration_minutes: 60,
      completed: true
    });
    if (!error) {
      setCompleted(p => ({ ...p, [day.id]: true }));
      await updateStreak(today);
      showToast(`✅ ${day.name} logged!`);
      loadData();
    }
  };

  const updateStreak = async (today) => {
    const { data: existing } = await supabase.from("streaks").select("*").eq("user_id", USER_ID).single();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    let current = 1;
    if (existing) {
      current = existing.last_session_date === yesterday ? existing.current_streak + 1 : 1;
      const longest = Math.max(current, existing.longest_streak || 0);
      await supabase.from("streaks").upsert({
        user_id: USER_ID,
        current_streak: current,
        longest_streak: longest,
        last_session_date: today,
        total_sessions: (existing.total_sessions || 0) + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    } else {
      await supabase.from("streaks").insert({
        user_id: USER_ID, current_streak: 1, longest_streak: 1,
        last_session_date: today, total_sessions: 1
      });
    }
  };

  const day = DAYS[activeDay];

  if (loading) return (
    <div style={{...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16}}>
      <div style={{fontFamily:"Bebas Neue,sans-serif", fontSize:64, color:"#C8FF00", letterSpacing:6}}>PH</div>
      <div style={{color:"#333", fontSize:12, letterSpacing:3}}>LOADING...</div>
    </div>
  );

  return (
    <div style={S.app}>
      {toast && <div style={S.toast}>{toast}</div>}

      <div style={S.header}>
        <div style={S.title}>PH</div>
        <div style={S.sub}>PROGRAMME HYBRIDE — SEMAINE {WEEK}</div>
      </div>

      <div style={S.tabs}>
        {["program","logbook","stats"].map(v => (
          <button key={v} style={S.tab(view===v,"#C8FF00")} onClick={() => setView(v)}>
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {view === "program" && (
        <div style={S.content}>
          <div style={S.tabs}>
            {DAYS.map((d,i) => (
              <button key={d.id} style={S.tab(activeDay===i, d.color)} onClick={() => setActiveDay(i)}>
                {d.name.slice(0,3)}
              </button>
            ))}
          </div>

          <div style={{...S.dayCard(day.color), marginTop:16}}>
            <div style={S.dayHeader}>
              <div>
                <div style={S.dayName(day.color)}>{day.name}</div>
                <div style={S.dayType}>{day.type}</div>
              </div>
              <span style={S.badge(day.color)}>{WEEK}</span>
            </div>

            {day.sessions.length === 0 ? (
              <div style={{color:"#333", textAlign:"center", padding:"32px 0", fontSize:13}}>
                {day.type === "REPOS" ? "🔋 Récupération active" : "💤 Repos"}
              </div>
            ) : (
              <>
                {day.sessions.map((ex, i) => (
                  <div key={i} style={S.exRow}>
                    <span style={S.exName}>{ex.name}</span>
                    <span style={S.badge("#444")}>{ex.sets}×{ex.reps}</span>
                    <span style={S.badge("#333")}>RPE {ex.rpe}</span>
                    <input
                      style={S.input}
                      type="number"
                      placeholder="kg"
                      value={weights[`${day.id}-${i}`] || ""}
                      onChange={e => setWeights(p => ({...p, [`${day.id}-${i}`]: e.target.value}))}
                    />
                  </div>
                ))}
                <button
                  style={S.completeBtn(completed[day.id], day.color)}
                  onClick={() => logSession(day)}
                >
                  {completed[day.id] ? "✅ SESSION LOGGED" : "LOG SESSION"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {view === "logbook" && (
        <div style={S.content}>
          <div style={{fontFamily:"Bebas Neue,sans-serif", fontSize:28, color:"#C8FF00", letterSpacing:4, marginBottom:16}}>
            HISTORIQUE
          </div>
          {sessions.length === 0 ? (
            <div style={{color:"#333", textAlign:"center", padding:"40px 0"}}>Aucune session enregistrée</div>
          ) : sessions.map(s => (
            <div key={s.id} style={{background:"#0a0a0a", border:"1px solid #1a1a1a", borderRadius:10, padding:"14px", marginBottom:10}}>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                <span style={{fontWeight:600, color:"#C8FF00", fontSize:13}}>{s.day_name}</span>
                <span style={{color:"#444", fontSize:11}}>{s.date}</span>
              </div>
              <div style={{color:"#555", fontSize:11, marginTop:4, letterSpacing:1}}>{s.session_type} — {s.week}</div>
            </div>
          ))}
        </div>
      )}

      {view === "stats" && (
        <div style={S.content}>
          <div style={{fontFamily:"Bebas Neue,sans-serif", fontSize:28, color:"#C8FF00", letterSpacing:4, marginBottom:16}}>
            STATS
          </div>
          <div style={S.statsRow}>
            <div style={S.statCard}>
              <div style={S.statVal("#C8FF00")}>{streak.current_streak || 0}</div>
              <div style={S.statLabel}>STREAK 🔥</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statVal("#FF6B35")}>{streak.total_sessions || 0}</div>
              <div style={S.statLabel}>SESSIONS</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statVal("#fff")}>{streak.longest_streak || 0}</div>
              <div style={S.statLabel}>BEST STREAK</div>
            </div>
          </div>

          <div style={{fontFamily:"Bebas Neue,sans-serif", fontSize:18, color:"#555", letterSpacing:3, marginBottom:12}}>
            PERSONAL BESTS
          </div>
          {pbs.length === 0 ? (
            <div style={{color:"#333", textAlign:"center", padding:"20px 0", fontSize:12}}>Aucun PB enregistré</div>
          ) : pbs.map(pb => (
            <div key={pb.id} style={{background:"#0a0a0a", border:"1px solid #1a1a1a", borderRadius:10, padding:"12px", marginBottom:8, display:"flex", justifyContent:"space-between"}}>
              <span style={{color:"#ddd", fontSize:13}}>{pb.exercise_name}</span>
              <span style={{color:"#C8FF00", fontWeight:700}}>{pb.weight_kg}kg × {pb.reps}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
