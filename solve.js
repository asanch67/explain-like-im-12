// ELI12 Solve mode (offline heuristics + KB snippets from localStorage)

const $ = (id) => document.getElementById(id);

// DOM
const elProblem = $("problem");
const elSolve = $("solveBtn");
const elClear = $("clearBtn");
const elCopy = $("copyBtn");
const elDownload = $("downloadBtn");
const elToast = $("toast");

const elEmpty = $("emptyState");
const elOut = $("output");

const elSteps = $("steps");
const elHints = $("hints");
const elBooks = $("books");
const elLinks = $("links");

const elTopicPill = $("topicPill");
const elConfidencePill = $("confidencePill");

const elLangBtn = $("langBtn");
const elThemeBtn = $("themeBtn");
const elKbStatus = $("kbStatus");

let lang = "en";
let dark = true;

// --- UI text (minimal)
const T = {
  en: {
    emptyTitle: "No solution yet",
    emptyText: "Write a problem and press “Solve step-by-step”.",
    copied: "Copied ✅",
    topic: "Topic",
    conf: "Confidence",
  },
  ru: {
    emptyTitle: "Пока решения нет",
    emptyText: "Напиши задачу и нажми “Solve step-by-step”.",
    copied: "Скопировано ✅",
    topic: "Тема",
    conf: "Уверенность",
  }
};

// --- Demo
$("demoTrig").onclick = () => elProblem.value = "Simplify: sin(a - 3π/2)";
$("demoPhys").onclick = () => elProblem.value = "A force of 20 N acts on area 0.5 m^2. Find pressure.";
$("demoChem").onclick = () => elProblem.value = "How does temperature affect reaction rate? Explain briefly.";

// --- Helpers
function toast(msg){
  elToast.textContent = msg;
  elToast.classList.add("show");
  setTimeout(()=> elToast.classList.remove("show"), 900);
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setTheme(isDark){
  dark = isDark;
  document.body.classList.toggle("light", !dark);
  elThemeBtn.textContent = dark ? "🌙" : "☀️";
}

function setLang(next){
  lang = next;
  elLangBtn.textContent = (lang === "en") ? "RU" : "EN";
  $("uiEmptyTitle").textContent = T[lang].emptyTitle;
  $("uiEmptyText").textContent = T[lang].emptyText;
  refreshKbStatus();
}

// --- Topic detection (simple)
function detectTopic(s){
  const t = s.toLowerCase();

  if(t.includes("sin") || t.includes("cos") || t.includes("π") || t.includes("pi")) return "Math (Trig)";
  if(t.includes("pressure") || t.includes("p =") || t.includes("area") || t.includes("force") || t.includes("давлен") || t.includes("сила")) return "Physics";
  if(t.includes("reaction") || t.includes("catal") || t.includes("temperature") || t.includes("реакц") || t.includes("катализ") || t.includes("температур")) return "Chemistry";
  return "General";
}

// --- Knowledge Base from localStorage (same format as main page script)
let kbDocs = [];
let kbChunks = [];

function loadKBFromLocalStorage(){
  try{
    const raw = localStorage.getItem("eli12_kb");
    if(!raw) return;
    const data = JSON.parse(raw);
    kbDocs = [];
    kbChunks = [];
    for(const d of data){
      const chunks = d.chunks || [];
      kbDocs.push({name:d.name, chunks});
      for(let i=0;i<chunks.length;i++){
        kbChunks.push({docName:d.name, idx:i, text:chunks[i]});
      }
    }
  }catch(e){}
}

function refreshKbStatus(){
  elKbStatus.textContent = lang === "ru"
    ? `KB: ${kbDocs.length} книг`
    : `KB: ${kbDocs.length} docs`;
}

function normalize(s){
  return String(s).toLowerCase()
    .replace(/ё/g,"е")
    .replace(/[^a-zа-я0-9+\-*/=πpi\s]/gi," ")
    .replace(/\s+/g," ")
    .trim();
}

function tokenize(s){
  const t = normalize(s);
  if(!t) return [];
  return t.split(" ").filter(w => w.length >= 2);
}

function scoreChunk(queryTokens, chunkText){
  const cTokens = tokenize(chunkText);
  if(!cTokens.length) return 0;
  const set = new Set(cTokens);
  let hit = 0;
  for(const qt of queryTokens){
    if(set.has(qt)) hit++;
  }
  return hit;
}

function searchKB(query, topK=4){
  if(!kbChunks.length) return [];
  const qTokens = tokenize(query);
  if(!qTokens.length) return [];

  const scored = [];
  for(const ch of kbChunks){
    const s = scoreChunk(qTokens, ch.text);
    if(s > 0) scored.push({score:s, ...ch});
  }
  scored.sort((a,b)=> b.score - a.score);
  return scored.slice(0, topK);
}

function renderKB(matches){
  if(!kbDocs.length){
    return `<span class="muted">${lang==="ru"
      ? "Книги не загружены. Загрузи .txt на главной странице."
      : "No books uploaded. Upload .txt on the main page."}</span>`;
  }
  if(!matches.length){
    return `<span class="muted">${lang==="ru"
      ? "В книгах не нашлось подходящих фрагментов под запрос."
      : "No strong matches found in your books for this query."}</span>`;
  }

  return matches.map(m=>{
    const snippet = m.text.replace(/\s+/g," ").trim().slice(0, 280) + (m.text.length>280 ? "…" : "");
    return `
      <div class="kv">
        <div><b>${escapeHtml(m.docName)}</b><div class="muted">chunk #${m.idx+1} • score ${m.score}</div></div>
        <div>${escapeHtml(snippet)}</div>
      </div>
    `;
  }).join("");
}

// --- Solver templates (simple but useful)
function solve(problem){
  const p = problem.trim();
  const topic = detectTopic(p);

  // default
  let confidence = "medium";
  let steps = [];
  let hints = [];
  let links = [];

  if(topic === "Math (Trig)"){
    confidence = "high";
    steps = (lang==="ru")
      ? [
          "Заметим: −3π/2 ≡ +π/2 (по модулю 2π), потому что −3π/2 + 2π = +π/2.",
          "Значит sin(a − 3π/2) = sin(a + π/2).",
          "Используем тождество: sin(x + π/2) = cos(x).",
          "Ответ: sin(a − 3π/2) = cos(a)."
        ]
      : [
          "Note: −3π/2 ≡ +π/2 (mod 2π) because −3π/2 + 2π = +π/2.",
          "So sin(a − 3π/2) = sin(a + π/2).",
          "Use identity: sin(x + π/2) = cos(x).",
          "Answer: sin(a − 3π/2) = cos(a)."
        ];

    hints = (lang==="ru")
      ? [
          "Всегда можно прибавлять/вычитать 2π: sin(x) не меняется.",
          "Если видишь ±π/2, вспоминай связи sin и cos."
        ]
      : [
          "You can always add/subtract 2π: sin(x) stays the same.",
          "If you see ±π/2, recall sin↔cos shift identities."
        ];

    links = [
      ["Khan Academy — Trigonometry", "https://www.khanacademy.org/math/trigonometry"],
      ["Paul's Notes — Trig", "https://tutorial.math.lamar.edu/Classes/Trig/Trig.aspx"]
    ];
  }

  if(topic === "Physics"){
    confidence = "high";
    steps = (lang==="ru")
      ? [
          "Записываем формулу давления: p = F / S.",
          "Подставляем значения: F = 20 Н, S = 0.5 м².",
          "p = 20 / 0.5 = 40 Па.",
          "Ответ: 40 Па."
        ]
      : [
          "Use pressure formula: p = F / A.",
          "Substitute: F = 20 N, A = 0.5 m².",
          "p = 20 / 0.5 = 40 Pa.",
          "Answer: 40 Pa."
        ];

    hints = (lang==="ru")
      ? ["Единицы: Н/м² = Паскаль (Па).", "Если площадь меньше — давление больше."]
      : ["Units: N/m² = Pascal (Pa).", "Smaller area → larger pressure."];

    links = [
      ["Khan Academy — Physics", "https://www.khanacademy.org/science/physics"]
    ];
  }

  if(topic === "Chemistry"){
    confidence = "medium";
    steps = (lang==="ru")
      ? [
          "При повышении температуры частицы движутся быстрее.",
          "Из-за этого они чаще сталкиваются и чаще имеют достаточную энергию для реакции.",
          "Итог: скорость реакции обычно увеличивается при росте температуры."
        ]
      : [
          "Higher temperature makes particles move faster.",
          "They collide more often and more collisions have enough energy to react.",
          "Result: reaction rate usually increases with temperature."
        ];

    hints = (lang==="ru")
      ? ["Можно добавить: катализатор ускоряет реакцию, снижая энергию активации."]
      : ["You can add: a catalyst speeds up reactions by lowering activation energy."];

    links = [
      ["Khan Academy — Chemistry", "https://www.khanacademy.org/science/chemistry"]
    ];
  }

  // render links
  const linksHtml = links.length
    ? links.map(([name,url])=>`<div class="kv"><div><b>${escapeHtml(name)}</b></div><div><a href="${url}" target="_blank" rel="noreferrer">${url}</a></div></div>`).join("")
    : `<span class="muted">${lang==="ru" ? "Ссылки появятся для конкретной темы." : "Links appear for specific topics."}</span>`;

  return {topic, confidence, steps, hints, linksHtml};
}

function run(){
  const p = elProblem.value.trim();
  if(!p){
    alert(lang==="ru" ? "Напиши условие задачи." : "Write a problem statement.");
    return;
  }

  const res = solve(p);
  elTopicPill.textContent = `${T[lang].topic}: ${res.topic}`;
  elConfidencePill.textContent = `${T[lang].conf}: ${res.confidence}`;

  elSteps.innerHTML = `<ul style="margin:0;padding-left:18px">${res.steps.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}</ul>`;
  elHints.innerHTML = `<ul style="margin:0;padding-left:18px">${res.hints.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}</ul>`;

  const matches = searchKB(p, 5);
  elBooks.innerHTML = renderKB(matches);

  elLinks.innerHTML = res.linksHtml;

  elEmpty.classList.add("hidden");
  elOut.classList.remove("hidden");

  // prepare copy/download
  const copyText =
`ELI12 Solve

Problem:
${p}

Topic: ${res.topic}
Confidence: ${res.confidence}

Steps:
${res.steps.map(x=>"- "+x).join("\n")}

Hints:
${res.hints.map(x=>"- "+x).join("\n")}
`;
  elCopy.dataset.copy = copyText;
  elDownload.dataset.copy = copyText;
}

// collapse
function collapseSetup(){
  document.querySelectorAll("[data-collapse]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-collapse");
      const target = document.getElementById(id);
      if(!target) return;
      const hidden = target.classList.toggle("hidden");
      btn.textContent = hidden ? "Show" : "Hide";
    });
  });
}

// events
elSolve.onclick = run;
elClear.onclick = ()=>{
  elProblem.value = "";
  elOut.classList.add("hidden");
  elEmpty.classList.remove("hidden");
};

elCopy.onclick = async ()=>{
  const text = elCopy.dataset.copy || "";
  if(!text) return;
  try{
    await navigator.clipboard.writeText(text);
    toast(T[lang].copied);
  }catch{
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast(T[lang].copied);
  }
};

elDownload.onclick = ()=>{
  const text = elDownload.dataset.copy || "";
  if(!text) return;
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eli12_solve.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

elLangBtn.onclick = ()=>{
  setLang(lang==="en" ? "ru" : "en");
};
elThemeBtn.onclick = ()=> setTheme(!dark);

// init
loadKBFromLocalStorage();
setLang("en");
setTheme(true);
refreshKbStatus();
collapseSetup();
