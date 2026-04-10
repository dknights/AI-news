import { useState, useRef, useEffect } from "react";

// ── Fallback stories shown while loading or if API fails ──────────────────────
const FALLBACK_STORIES = [
  { topic: "consultancy", emoji: "⚡", title: "Loading today's stories…", summary: "The daily feed is being fetched. If this persists, the scheduled refresh may not have run yet — try again in a moment.", insight: "Stories refresh automatically every morning at 6am UTC.", source: "", url: "" },
];

const DEFAULT_TOPICS = [
  { id: "all",         label: "All",         icon: "◈", fixed: true },
  { id: "consultancy", label: "Consultancy", icon: "⬡", fixed: true },
  { id: "philosophy",  label: "Philosophy",  icon: "∞", fixed: true },
  { id: "creative",    label: "Creative",    icon: "◎", fixed: true },
  { id: "vibe",        label: "Vibe Coding", icon: "⟁", fixed: true },
  { id: "education",   label: "Education",   icon: "◐", fixed: true },
];

const DEFAULT_COLORS = {
  consultancy: { accent: "#00d4ff", bg: "rgba(0,212,255,0.07)",   border: "rgba(0,212,255,0.18)"   },
  philosophy:  { accent: "#c084fc", bg: "rgba(192,132,252,0.07)", border: "rgba(192,132,252,0.18)" },
  creative:    { accent: "#fb923c", bg: "rgba(251,146,60,0.07)",  border: "rgba(251,146,60,0.18)"  },
  vibe:        { accent: "#4ade80", bg: "rgba(74,222,128,0.07)",  border: "rgba(74,222,128,0.18)"  },
  education:   { accent: "#f472b6", bg: "rgba(244,114,182,0.07)", border: "rgba(244,114,182,0.18)" },
};

const PALETTE = [
  "#00d4ff","#c084fc","#fb923c","#4ade80","#f472b6",
  "#fbbf24","#f87171","#34d399","#818cf8","#e879f9",
  "#38bdf8","#a3e635",
];

const ICONS = ["★","♦","✦","◆","▲","●","■","◉","⊕","⊗","⟐","⬟","⬠","⬡","⬢","✿","❋","⁂"];

const STORAGE_KEY = "ai-dispatch-custom-tags";

// ── Helpers ───────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
function makeColor(hex) {
  const rgb = hexToRgb(hex);
  return { accent: hex, bg: `rgba(${rgb},0.07)`, border: `rgba(${rgb},0.2)` };
}

// localStorage for custom tags (works outside Claude sandbox)
function loadCustomTags() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}
function saveCustomTags(topics, colors) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ topics, colors })); } catch {}
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ topic, allTopics, allColors }) {
  const t = allTopics.find(x => x.id === topic);
  const c = allColors[topic] || {};
  return (
    <span style={{ fontSize:"0.6rem", fontFamily:"monospace", letterSpacing:"0.1em", textTransform:"uppercase", color:c.accent, background:c.bg, border:`1px solid ${c.border}`, padding:"2px 8px", borderRadius:"2px", display:"inline-block" }}>
      {t?.icon} {t?.label || topic}
    </span>
  );
}

// ── Story Card ────────────────────────────────────────────────────────────────
function Card({ item, index, allTopics, allColors }) {
  const [open, setOpen] = useState(false);
  const c = allColors[item.topic] || { accent:"#aaa", bg:"rgba(255,255,255,0.05)", border:"rgba(255,255,255,0.1)" };
  return (
    <div onClick={() => setOpen(!open)} style={{ background: open?"rgba(255,255,255,0.055)":"rgba(255,255,255,0.028)", border:`1px solid rgba(255,255,255,${open?"0.11":"0.065"})`, borderLeft:`3px solid ${c.accent}`, borderRadius:"4px", padding:"16px 18px", cursor:"pointer", transition:"background 0.2s", animation:"fadeIn 0.35s ease both", animationDelay:`${index*0.05}s` }}>
      <div style={{ display:"flex", gap:"11px", alignItems:"flex-start" }}>
        <span style={{ fontSize:"1.2rem", flexShrink:0, marginTop:1 }}>{item.emoji}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ marginBottom:6 }}><Badge topic={item.topic} allTopics={allTopics} allColors={allColors} /></div>
          <h3 style={{ margin:"0 0 6px", fontSize:"0.9rem", fontFamily:"Georgia, serif", fontWeight:700, color:"#efefef", lineHeight:1.4 }}>{item.title}</h3>
          <p style={{ margin:0, fontSize:"0.78rem", fontFamily:"monospace", color:"rgba(255,255,255,0.48)", lineHeight:1.75 }}>{item.summary}</p>
          {open && (
            <div style={{ animation:"fadeIn 0.2s ease both" }}>
              <div style={{ marginTop:11, padding:"10px 13px", background:c.bg, border:`1px solid ${c.border}`, borderRadius:3 }}>
                <div style={{ fontSize:"0.58rem", fontFamily:"monospace", letterSpacing:"0.13em", color:c.accent, marginBottom:5, textTransform:"uppercase" }}>▸ Why this matters</div>
                <p style={{ margin:0, fontSize:"0.78rem", fontFamily:"Georgia, serif", fontStyle:"italic", color:"rgba(255,255,255,0.74)", lineHeight:1.65 }}>{item.insight}</p>
              </div>
              {item.url && (
                <button onClick={e => { e.stopPropagation(); window.open(item.url,"_blank","noopener,noreferrer"); }} style={{ marginTop:9, display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:3, padding:"5px 11px", color:"rgba(255,255,255,0.45)", fontSize:"0.65rem", fontFamily:"monospace", cursor:"pointer", letterSpacing:"0.05em" }}>
                  ↗ {item.source}
                </button>
              )}
            </div>
          )}
        </div>
        <span style={{ color:"rgba(255,255,255,0.18)", fontSize:"0.65rem", flexShrink:0, marginTop:3 }}>{open?"▴":"▾"}</span>
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {[...Array(5)].map((_,i) => (
        <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderLeft:"3px solid rgba(255,255,255,0.08)", borderRadius:4, padding:"16px 18px", animation:`pulse 1.6s ease infinite`, animationDelay:`${i*0.12}s` }}>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
            <div style={{ flex:1 }}>
              <div style={{ width:"24%", height:11, background:"rgba(255,255,255,0.06)", borderRadius:2, marginBottom:8 }} />
              <div style={{ width:"78%", height:14, background:"rgba(255,255,255,0.08)", borderRadius:2, marginBottom:7 }} />
              <div style={{ width:"92%", height:10, background:"rgba(255,255,255,0.05)", borderRadius:2, marginBottom:5 }} />
              <div style={{ width:"65%", height:10, background:"rgba(255,255,255,0.05)", borderRadius:2 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Add Tag Modal ─────────────────────────────────────────────────────────────
function AddTagModal({ onAdd, onClose, existingIds }) {
  const [label, setLabel] = useState("");
  const [icon, setIcon]   = useState(ICONS[0]);
  const [color, setColor] = useState(PALETTE[0]);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    if (!id || existingIds.includes(id)) return;
    onAdd({ id, label: trimmed, icon, color });
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#141416", border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, padding:"24px", width:"100%", maxWidth:360, animation:"fadeIn 0.2s ease both" }}>
        <div style={{ fontSize:"0.6rem", letterSpacing:"0.2em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:14 }}>+ New Tag</div>
        <input ref={inputRef} value={label} onChange={e=>setLabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()} placeholder="Tag name…" maxLength={24} style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:3, padding:"9px 12px", color:"#fff", fontSize:"0.88rem", fontFamily:"Georgia, serif", outline:"none", marginBottom:18 }} />

        <div style={{ fontSize:"0.6rem", letterSpacing:"0.15em", color:"rgba(255,255,255,0.28)", textTransform:"uppercase", marginBottom:8 }}>Icon</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:18 }}>
          {ICONS.map(ic => (
            <button key={ic} onClick={()=>setIcon(ic)} style={{ width:32, height:32, borderRadius:3, border:icon===ic?`1px solid ${color}`:"1px solid rgba(255,255,255,0.1)", background:icon===ic?`rgba(${hexToRgb(color)},0.15)`:"rgba(255,255,255,0.04)", color:icon===ic?color:"rgba(255,255,255,0.5)", fontSize:"0.85rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{ic}</button>
          ))}
        </div>

        <div style={{ fontSize:"0.6rem", letterSpacing:"0.15em", color:"rgba(255,255,255,0.28)", textTransform:"uppercase", marginBottom:8 }}>Colour</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:22 }}>
          {PALETTE.map(hex => (
            <button key={hex} onClick={()=>setColor(hex)} style={{ width:24, height:24, borderRadius:"50%", background:hex, border:"none", cursor:"pointer", outline:color===hex?`2px solid ${hex}`:"2px solid transparent", outlineOffset:2 }} />
          ))}
        </div>

        {label.trim() && (
          <div style={{ marginBottom:18 }}>
            <span style={{ fontSize:"0.6rem", fontFamily:"monospace", letterSpacing:"0.1em", textTransform:"uppercase", color, background:`rgba(${hexToRgb(color)},0.1)`, border:`1px solid rgba(${hexToRgb(color)},0.25)`, padding:"3px 10px", borderRadius:"2px" }}>{icon} {label.trim()}</span>
          </div>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", borderRadius:3, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.35)", fontFamily:"monospace", fontSize:"0.72rem", cursor:"pointer" }}>Cancel</button>
          <button onClick={handleAdd} disabled={!label.trim()} style={{ flex:2, padding:"9px", borderRadius:3, border:`1px solid ${color}`, background:`rgba(${hexToRgb(color)},0.15)`, color, fontFamily:"monospace", fontSize:"0.72rem", cursor:label.trim()?"pointer":"not-allowed", opacity:label.trim()?1:0.4, letterSpacing:"0.05em" }}>Add Tag</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [stories, setStories]           = useState([]);
  const [feedDate, setFeedDate]         = useState("");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeTab, setActiveTab]       = useState("all");
  const [customTopics, setCustomTopics] = useState([]);
  const [allColors, setAllColors]       = useState({ ...DEFAULT_COLORS });
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteMode, setDeleteMode]     = useState(false);
  const [lastUpdated, setLastUpdated]   = useState("");

  // Load custom tags from localStorage on mount
  useEffect(() => {
    const saved = loadCustomTags();
    if (saved?.topics) {
      setCustomTopics(saved.topics);
      if (saved.colors) setAllColors(prev => ({ ...prev, ...saved.colors }));
    }
  }, []);

  // Fetch stories from the API
  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch("/api/feed");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStories(data.stories || []);
        setFeedDate(data.date || new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" }));
        if (data.generatedAt) {
          setLastUpdated(new Date(data.generatedAt).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }));
        }
      } catch (err) {
        setError("Couldn't load today's feed — the daily refresh may still be running.");
        setStories(FALLBACK_STORIES);
        setFeedDate(new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" }));
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, []);

  // Save custom tags whenever they change
  const isFirstSave = useRef(true);
  useEffect(() => {
    if (isFirstSave.current) { isFirstSave.current = false; return; }
    const customColors = {};
    customTopics.forEach(t => { if (allColors[t.id]) customColors[t.id] = allColors[t.id]; });
    saveCustomTags(customTopics, customColors);
  }, [customTopics]);

  const allTopics   = [...DEFAULT_TOPICS, ...customTopics];
  const existingIds = allTopics.map(t => t.id);

  const handleAddTag = ({ id, label, icon, color }) => {
    setCustomTopics(prev => [...prev, { id, label, icon, fixed: false }]);
    setAllColors(prev => ({ ...prev, [id]: makeColor(color) }));
  };

  const handleDeleteTag = (id) => {
    setCustomTopics(prev => prev.filter(t => t.id !== id));
    setAllColors(prev => { const n={...prev}; delete n[id]; return n; });
    if (activeTab === id) setActiveTab("all");
  };

  const visible        = activeTab === "all" ? stories : stories.filter(s => s.topic === activeTab);
  const activeIsCustom = customTopics.some(t => t.id === activeTab);
  const activeCustomTag = customTopics.find(t => t.id === activeTab);

  return (
    <div style={{ minHeight:"100vh", background:"#0b0b0d", backgroundImage:"radial-gradient(ellipse at 15% 0%, rgba(90,50,200,0.13) 0%, transparent 55%), radial-gradient(ellipse at 85% 100%, rgba(0,160,255,0.09) 0%, transparent 55%)", color:"#e5e5e5", fontFamily:"monospace", padding:"0 0 60px" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100%{opacity:.35} 50%{opacity:.8} }
        @keyframes spin   { to { transform:rotate(360deg); } }
        * { box-sizing:border-box; }
        input::placeholder { color:rgba(255,255,255,0.2); }
        input:focus { border-color:rgba(255,255,255,0.25) !important; outline:none; }
        button { transition: all 0.15s; }
      `}</style>

      {showAddModal && <AddTagModal onAdd={handleAddTag} onClose={()=>setShowAddModal(false)} existingIds={existingIds} />}

      {/* ── Header ── */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"26px 22px 18px", position:"sticky", top:0, background:"rgba(11,11,13,0.96)", backdropFilter:"blur(14px)", zIndex:10 }}>
        <div style={{ maxWidth:700, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:"0.56rem", letterSpacing:"0.26em", color:"rgba(255,255,255,0.26)", textTransform:"uppercase", marginBottom:5 }}>◈ AI Intelligence Feed</div>
              <h1 style={{ margin:"0 0 3px", fontFamily:"Georgia, serif", fontSize:"1.45rem", fontWeight:700, color:"#fff" }}>Today's AI Dispatch</h1>
              <div style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.24)" }}>
                {feedDate}
                {lastUpdated && <span style={{ marginLeft:8, opacity:0.6 }}>· updated {lastUpdated}</span>}
                {loading && <span style={{ marginLeft:8, opacity:0.5 }}> · loading…</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
              {customTopics.length > 0 && (
                <button onClick={()=>setDeleteMode(!deleteMode)} style={{ background:deleteMode?"rgba(248,113,113,0.1)":"transparent", border:deleteMode?"1px solid rgba(248,113,113,0.3)":"1px solid rgba(255,255,255,0.1)", color:deleteMode?"#f87171":"rgba(255,255,255,0.3)", padding:"6px 10px", borderRadius:3, cursor:"pointer", fontSize:"0.65rem", fontFamily:"monospace" }}>
                  {deleteMode?"Done":"Edit"}
                </button>
              )}
              <button onClick={()=>{setShowAddModal(true);setDeleteMode(false);}} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.55)", padding:"6px 11px", borderRadius:3, cursor:"pointer", fontSize:"0.68rem", fontFamily:"monospace" }}>
                + Tag
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginTop:14 }}>
            {allTopics.map(t => {
              const isActive = activeTab === t.id;
              const c        = allColors[t.id];
              const count    = t.id==="all" ? stories.length : stories.filter(s=>s.topic===t.id).length;
              const isCustom = !t.fixed;
              return (
                <div key={t.id} style={{ position:"relative" }}>
                  <button onClick={()=>{setActiveTab(t.id);setDeleteMode(false);}} style={{ background:isActive?(c?.bg||"rgba(255,255,255,0.07)"):"transparent", border:isActive?`1px solid ${c?.border||"rgba(255,255,255,0.15)"}`:"1px solid transparent", color:isActive?(c?.accent||"#fff"):"rgba(255,255,255,0.33)", padding:isCustom&&deleteMode?"5px 26px 5px 11px":"5px 11px", borderRadius:2, cursor:"pointer", fontSize:"0.62rem", letterSpacing:"0.06em", fontFamily:"monospace", textTransform:"uppercase" }}>
                    {t.icon} {t.label} <span style={{ opacity:0.4 }}>·{count}</span>
                  </button>
                  {isCustom && deleteMode && (
                    <button onClick={e=>{e.stopPropagation();handleDeleteTag(t.id);}} style={{ position:"absolute", right:4, top:"50%", transform:"translateY(-50%)", background:"rgba(248,113,113,0.2)", border:"none", color:"#f87171", borderRadius:"50%", width:16, height:16, cursor:"pointer", fontSize:"0.55rem", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth:700, margin:"0 auto", padding:"20px 22px 0" }}>

        {loading && <Skeleton />}

        {!loading && error && (
          <div style={{ padding:"16px 18px", background:"rgba(251,146,60,0.07)", border:"1px solid rgba(251,146,60,0.2)", borderRadius:4, marginBottom:16, fontSize:"0.75rem", color:"rgba(251,146,60,0.85)", fontFamily:"monospace", lineHeight:1.6 }}>
            ⚠ {error}
          </div>
        )}

        {/* Custom tag empty state */}
        {!loading && activeIsCustom && visible.length === 0 && (
          <div style={{ marginTop:40, textAlign:"center", padding:"40px 24px", border:"1px dashed rgba(255,255,255,0.1)", borderRadius:6, animation:"fadeIn 0.3s ease both" }}>
            <div style={{ fontSize:"2rem", marginBottom:12, opacity:0.35 }}>{activeCustomTag?.icon||"★"}</div>
            <div style={{ fontSize:"0.82rem", fontFamily:"Georgia, serif", color:"rgba(255,255,255,0.45)", marginBottom:10 }}>No stories yet for <em>{activeCustomTag?.label}</em></div>
            <div style={{ fontSize:"0.68rem", fontFamily:"monospace", color:"rgba(255,255,255,0.22)", lineHeight:1.8 }}>
              Add this topic to the refresh function<br />in <code style={{ color:"rgba(255,255,255,0.4)" }}>netlify/functions/refresh-feed.mts</code>
            </div>
          </div>
        )}

        {/* Stories */}
        {!loading && visible.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {visible.map((item,i) => <Card key={`${item.topic}-${i}`} item={item} index={i} allTopics={allTopics} allColors={allColors} />)}
          </div>
        )}

        <div style={{ textAlign:"center", padding:"28px 0 0", fontSize:"0.56rem", letterSpacing:"0.16em", color:"rgba(255,255,255,0.1)", textTransform:"uppercase" }}>
          ◈ refreshes automatically every morning at 6am UTC ◈
        </div>
      </div>
    </div>
  );
}
