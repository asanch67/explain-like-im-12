/* ELI12 — Offline + Local Knowledge Base (.txt books)
   - Ask question OR paste text
   - Simple explanation (heuristics)
   - Formulas/facts (topic rules)
   - Local KB search with citations (top matching snippets)
   - Links to learn (static + topic rules)
*/

const $ = (id) => document.getElementById(id);

// --- DOM
const elText = $("text");
const elQuestion = $("question");
const elExplain = $("explainBtn");
const elClear = $("clearBtn");
const elCopy = $("copyBtn");
const elDownload = $("downloadBtn");

const elLevel = $("level");
const elLevelBadge = $("levelBadge");
const elMaxWords = $("maxWords");
const elCountBadge = $("countBadge");

const elEmpty = $("emptyState");
const elOut = $("output");

const elExplanation = $("explanation");
const elFormulas = $("formulas");
const elSources = $("sources");
const elLinks = $("links");

const elToast = $("toast");
const elHistory = $("history");

const elLangBtn = $("langBtn");
const elThemeBtn = $("themeBtn");
const elLiveLink = $("liveLink");

const elSubjectPill = $("subjectPill");
const elQualityPill = $("qualityPill");

// KB
const elKbFiles = $("kbFiles");
const elKbUploadBtn = $("kbUploadBtn");
const elKbClearBtn = $("kbClearBtn");
const elKbStatus = $("kbStatus");

// --- Demo texts
const DEMO = {
  bio: {
    q: "What is a neuron?",
    t: "A neuron is a cell that sends signals in the nervous system. Signals pass through synapses using chemicals. This helps the brain control movement, emotions, and memory."
  },
  chem: {
    q: "What is activation energy?",
    t: "Reaction speed depends on concentration and temperature. Higher temperature means particles move faster and collide more, so the reaction goes faster. A catalyst lowers activation energy and speeds up the reaction but is not used up much."
  },
  math: {
    q: "Simplify: sin(a − 3π/2)",
    t: "Use trigonometric identities for shifting angles. Reduce the angle by multiples of 2π and use unit circle values."
  }
};

// --- UI translations
const T = {
  en: {
    subtitle: "Paste text or ask a question → get explanation + formulas + sources",
    input: "Input",
    output: "Output",
    offline: "Offline",
    question: "Topic / question",
    paste: "Paste your text (optional)",
    level: "Simplify level",
    levelHint: "1 = light, 2 = normal, 3 = very simple",
    len: "Output length",
    lenHint: "Word count of your text",
    history: "History",
    kbTitle: "Knowledge Base (your books)",
    kbHint: "Upload theory books as .txt. Everything stays in your browser (no server).",
    note: "Offline MVP. Uses simple heuristics + local search inside your uploaded books.",
    emptyTitle: "No output yet",
    emptyText: "Ask a question or paste text, then press Explain.",
    simple: "1) Simple explanation",
    formulas: "2) Formulas / key facts",
    sources: "3) From your books (citations)",
    links: "4) Where to learn (links)",
    subject: "Subject",
    quality: "Quality",
    copied: "Copied ✅",
    kbStatus: (n) => `${n} docs indexed`,
    noKb: "No books uploaded yet. Upload .txt files to get citations here.",
    noMatches: "No strong matches found in your books for this query.",
  },
  ru: {
    subtitle: "Вопрос или текст → простое объяснение + формулы + источники",
    input: "Ввод",
    output: "Результат",
    offline: "Оффлайн",
    question: "Тема / вопрос",
    paste: "Вставь текст (необязательно)",
    level: "Уровень упрощения",
    levelHint: "1 = легко, 2 = нормально, 3 = максимально просто",
    len: "Длина ответа",
    lenHint: "Количество слов во входном тексте",
    history: "История",
    kbTitle: "База знаний (твои книги)",
    kbHint: "Загрузи книги как .txt. Всё хранится в браузере (без сервера).",
    note: "Оффлайн MVP. Эвристики + локальный поиск по твоим книгам.",
    emptyTitle: "Пока пусто",
    emptyText: "Задай вопрос или вставь текст, затем нажми Explain.",
    simple: "1) Простое объяснение",
    formulas: "2) Формулы / ключевые факты",
    sources: "3) Из твоих книг (цитаты)",
    links: "4) Где учить (ссылки)",
    subject: "Тема",
    quality: "Качество",
    copied: "Скопировано ✅",
    kbStatus: (n) => `Проиндексировано книг: ${n}`,
    noKb: "Книги ещё не загружены. Загрузи .txt, чтобы тут появились цитаты.",
    noMatches: "В твоих книгах не нашёлся сильный матч под запрос.",
  }
};

// --- State
let lang = "en";
let dark = true;
let history = []; // {q, t, ts}

// KB state: list of {name, text, chunks[]}
let kbDocs = [];
let kbChunks = []; // {docName, idx, text}

// --- Helpers
function toast(msg){
  elToast.textContent = msg;
  elToast.classList.add("show");
  setTimeout(()=> elToast.classList.remove("show"), 900);
}

function wordCount(s){
  const m = (String(s).trim().match(/[A-Za-zА-Яа-яёЁ0-9]+/g) || []);
  return m.length;
}

function updateCount(){
  elCountBadge.textContent = wordCount(elText.value || "");
}

function setTheme(isDark){
  dark = isDark;
  document.body.classList.toggle("light", !dark);
  elThemeBtn.textContent = dark ? "🌙" : "☀️";
}

function setLang(next){
  lang = next;
  elLangBtn.textContent = (lang === "en") ? "RU" : "EN";
  const t = T[lang];
  $("uiSubtitle").textContent = t.subtitle;
  $("uiInputTitle").textContent = t.input;
  $("uiOutputTitle").textContent = t.output;
  $("uiOfflinePill").textContent = t.offline;
  $("uiQuestionLabel").textContent = t.question;
  $("uiPasteLabel").textContent = t.paste;
  $("uiLevelLabel").textContent = t.level;
  $("uiLevelHint").textContent = t.levelHint;
  $("uiLenLabel").textContent = t.len;
  $("uiLenHint").textContent = t.lenHint;
  $("uiHistoryTitle").textContent = t.history;
  $("uiKbTitle").textContent = t.kbTitle;
  $("uiKbHint").textContent = t.kbHint;
  $("uiNote").textContent = t.note;
  $("uiEmptyTitle").textContent = t.emptyTitle;
  $("uiEmptyText").textContent = t.emptyText;

  $("uiSimpleTitle").textContent = t.simple;
  $("uiFormulasTitle").textContent = t.formulas;
  $("uiSourcesTitle").textContent = t.sources;
  $("uiLinksTitle").textContent = t.links;

  elSubjectPill.textContent = `${t.subject}: —`;
  elQualityPill.textContent = `${t.quality}: —`;

  refreshKbStatus();
  renderHistory();
  elLiveLink.textContent = "Live";
  elLiveLink.href = window.location.href;
}

function splitSentences(text){
  const t = String(text).replace(/\s+/g," ").trim();
  if(!t) return [];
  return t.split(/[.!?…]+\s+/).map(s=>s.trim()).filter(Boolean);
}

function simplifyLines(sentences, level, maxWords){
  if(!sentences.length) return [];
  let take = (level===1? 5 : level===2? 4 : 3);
  const picked = sentences.slice(0, take).map(s=>{
    let x = s.trim();
    if(level===3){
      x = x.replace(/\((.*?)\)/g,"");
      x = x.replace(/[,;:]\s*/g, ". ");
      x = x.replace(/\s+/g," ").trim();
      if(lang==="ru"){
        if(!/^(это|значит|про)/i.test(x)) x = "Это значит: " + x.toLowerCase();
      } else {
        if(!/^(this|it means|about)/i.test(x)) x = "It means: " + x[0].toLowerCase() + x.slice(1);
      }
    }
    return x;
  }).filter(Boolean);

  const out = [];
  let wc = 0;
  for(const p of picked){
    const w = wordCount(p);
    if(wc + w > maxWords) break;
    out.push(p);
    wc += w;
  }
  return out.length ? out : picked.slice(0,1);
}

function qualityScore(input){
  const wc = wordCount(input);
  const sents = splitSentences(input).length;
  let score = 0;
  if(wc >= 15) score++;
  if(wc >= 40) score++;
  if(sents >= 2) score++;
  if(sents >= 4) score++;
  return score; // 0..4
}

function qualityLabel(score){
  // simple
  if(score <= 1) return {t:"low", c:"var(--warn)"};
  if(score === 2) return {t:"ok", c:"var(--good)"};
  if(score === 3) return {t:"good", c:"var(--good)"};
  return {t:"great", c:"var(--good)"};
}

// --- Subject detection (simple)
const SUBJECT_HINTS = {
  Math: ["sin","cos","tan","π","pi","derivative","integral","limit","log","function","triangle","триг","sin(","cos(","tg","ctg","производн","интеграл","предел","лог","функц"],
  Biology: ["cell","neuron","gene","protein","synapse","brain","immune","клет","нейрон","ген","белок","синапс","мозг","иммун"],
  Chemistry: ["reaction","mole","catal","acid","base","oxid","ion","реакц","моль","катализ","кисл","основан","окис","ион"],
  Physics: ["force","pressure","energy","mass","accel","field","сила","давлен","энерг","масса","ускор","поле"]
};

function detectSubject(q, text){
  const t = (q + " " + text).toLowerCase();
  let best = {name:"General", score:0};
  for(const [subj, keys] of Object.entries(SUBJECT_HINTS)){
    let score = 0;
    for(const k of keys) if(t.includes(k.toLowerCase())) score++;
    if(score > best.score) best = {name:subj, score};
  }
  return best.name;
}

// --- Formulas / facts templates
function formulasFor(subject, q){
  const isRU = (lang==="ru");
  const qq = (q||"").toLowerCase();

  // trig special
  if(subject==="Math" && (qq.includes("sin") || qq.includes("cos") || qq.includes("π") || qq.includes("pi"))){
    if(isRU){
      return `
        <div class="kv"><div><b>Сдвиги синуса</b></div><div>
          <code class="inline">sin(x - 3π/2) = cos(x)</code><br/>
          <span class="muted">Потому что: sin(x - 3π/2) = sin(x + π/2) (мод 2π) = cos(x)</span>
        </div></div>
        <div class="kv"><div><b>Напоминание</b></div><div>
          <code class="inline">sin(x + π/2) = cos(x)</code>, <code class="inline">sin(x - π/2) = -cos(x)</code>
        </div></div>
      `;
    } else {
      return `
        <div class="kv"><div><b>Trig shift</b></div><div>
          <code class="inline">sin(x - 3π/2) = cos(x)</code><br/>
          <span class="muted">Because: sin(x - 3π/2) = sin(x + π/2) (mod 2π) = cos(x)</span>
        </div></div>
        <div class="kv"><div><b>Reminder</b></div><div>
          <code class="inline">sin(x + π/2) = cos(x)</code>, <code class="inline">sin(x - π/2) = -cos(x)</code>
        </div></div>
      `;
    }
  }

  if(subject==="Physics"){
    return isRU
      ? `<div class="kv"><div><b>Давление</b></div><div><code class="inline">p = F / S</code> (сила / площадь)</div></div>
         <div class="kv"><div><b>2-й закон Ньютона</b></div><div><code class="inline">F = m a</code></div></div>`
      : `<div class="kv"><div><b>Pressure</b></div><div><code class="inline">p = F / A</code></div></div>
         <div class="kv"><div><b>Newton's 2nd law</b></div><div><code class="inline">F = m a</code></div></div>`;
  }

  if(subject==="Chemistry"){
    return isRU
      ? `<div class="kv"><div><b>Скорость реакции</b></div><div>Обычно растёт при ↑T и ↑концентрации</div></div>
         <div class="kv"><div><b>Катализатор</b></div><div>Снижает энергию активации, ускоряет реакцию</div></div>`
      : `<div class="kv"><div><b>Reaction rate</b></div><div>Usually increases with higher temperature and concentration</div></div>
         <div class="kv"><div><b>Catalyst</b></div><div>Lowers activation energy, speeds up reaction</div></div>`;
  }

  if(subject==="Biology"){
    return isRU
      ? `<div class="kv"><div><b>Нейрон</b></div><div>Клетка, которая передаёт сигналы</div></div>
         <div class="kv"><div><b>Синапс</b></div><div>Место передачи сигнала между нейронами</div></div>`
      : `<div class="kv"><div><b>Neuron</b></div><div>A cell that transmits signals</div></div>
         <div class="kv"><div><b>Synapse</b></div><div>A junction where neurons pass signals</div></div>`;
  }

  return isRU
    ? `<span class="muted">Формулы появятся, если ты задашь конкретную тему (например: давление, sin/cos, скорость реакции).</span>`
    : `<span class="muted">Formulas appear when you ask a specific topic (e.g., pressure, sin/cos, reaction rate).</span>`;
}

// --- Links (static + topic)
function linksFor(subject){
  const isRU = (lang==="ru");
  const links = [];

  if(subject==="Math"){
    links.push(["Khan Academy — Trigonometry", "https://www.khanacademy.org/math/trigonometry"]);
    links.push(["Paul's Online Math Notes (Trig)", "https://tutorial.math.lamar.edu/Classes/Trig/Trig.aspx"]);
  } else if(subject==="Physics"){
    links.push(["Khan Academy — Physics", "https://www.khanacademy.org/science/physics"]);
  } else if(subject==="Chemistry"){
    links.push(["Khan Academy — Chemistry", "https://www.khanacademy.org/science/chemistry"]);
  } else if(subject==="Biology"){
    links.push(["Khan Academy — Biology", "https://www.khanacademy.org/science/biology"]);
  } else {
    links.push(["Khan Academy", "https://www.khanacademy.org/"]);
  }

  if(isRU){
    links.push(["Фоксфорд (разделы по предметам)", "https://foxford.ru/"]);
  }

  return links.map(([name,url])=>`<div class="kv"><div><b>${name}</b></div><div><a href="${url}" target="_blank" rel="noreferrer">${url}</a></div></div>`).join("");
}

// --- Local KB (TF-ish scoring)
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
    if(set.has(qt)) hit += 1;
  }
  // boost if chunk contains exact phrase parts
  const chunkNorm = normalize(chunkText);
  const qNorm = queryTokens.join(" ");
  if(qNorm.length > 8 && chunkNorm.includes(qNorm)) hit += 3;
  return hit;
}

// split doc into chunks (~600 chars)
function chunkDoc(text, size=650){
  const clean = String(text).replace(/\r/g,"").trim();
  const out = [];
  for(let i=0; i<clean.length; i+=size){
    out.push(clean.slice(i, i+size));
  }
  return out;
}

function refreshKbStatus(){
  const t = T[lang];
  elKbStatus.textContent = t.kbStatus(kbDocs.length);
}

async function readFileAsText(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = () => resolve(String(r.result||""));
    r.onerror = reject;
    r.readAsText(file, "utf-8");
  });
}

async function addToKB(files){
  for(const f of files){
    const text = await readFileAsText(f);
    const chunks = chunkDoc(text);
    kbDocs.push({name: f.name, text, chunks});
    for(let i=0;i<chunks.length;i++){
      kbChunks.push({docName: f.name, idx: i, text: chunks[i]});
    }
  }
  // persist in localStorage (small docs only)
  saveKBToLocalStorage();
  refreshKbStatus();
}

function saveKBToLocalStorage(){
  // WARNING: localStorage has limits, so we store only chunks, not huge full texts.
  // We'll store first 2MB approx.
  try{
    const payload = kbDocs.map(d=>({name:d.name, chunks:d.chunks.slice(0, 200)})); // cap
    localStorage.setItem("eli12_kb", JSON.stringify(payload));
  }catch(e){
    // ignore
  }
}

function loadKBFromLocalStorage(){
  try{
    const raw = localStorage.getItem("eli12_kb");
    if(!raw) return;
    const data = JSON.parse(raw);
    kbDocs = [];
    kbChunks = [];
    for(const d of data){
      const chunks = d.chunks || [];
      kbDocs.push({name:d.name, text:"", chunks});
      for(let i=0;i<chunks.length;i++){
        kbChunks.push({docName:d.name, idx:i, text:chunks[i]});
      }
    }
  }catch(e){}
}

function clearKB(){
  kbDocs = [];
  kbChunks = [];
  try{ localStorage.removeItem("eli12_kb"); }catch(e){}
  refreshKbStatus();
}

function searchKB(query, topK=4){
  if(kbChunks.length === 0) return [];
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

function renderKBMatches(matches){
  const t = T[lang];
  if(kbDocs.length === 0){
    return `<span class="muted">${t.noKb}</span>`;
  }
  if(!matches.length){
    return `<span class="muted">${t.noMatches}</span>`;
  }

  return matches.map(m=>{
    const snippet = m.text.replace(/\s+/g," ").trim().slice(0, 280) + (m.text.length>280 ? "…" : "");
    return `
      <div class="kv">
        <div><b>${m.docName}</b><div class="muted">chunk #${m.idx+1} • score ${m.score}</div></div>
        <div>${escapeHtml(snippet)}</div>
      </div>
    `;
  }).join("");
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// --- History
function pushHistory(q, t){
  const key = (q+"||"+t).trim();
  if(!key) return;
  if(history.length && (history[0].q+"||"+history[0].t) === key) return;
  history.unshift({q, t, ts: Date.now()});
  history = history.slice(0, 6);
  renderHistory();
}

function renderHistory(){
  if(history.length === 0){
    elHistory.innerHTML = `<span class="muted">${lang==="ru" ? "Пока пусто" : "Empty"}</span>`;
    return;
  }
  elHistory.innerHTML = history.map((h, i)=>{
    const preview = (h.q || h.t || "").replace(/\s+/g," ").slice(0, 34) + ((h.q||h.t||"").length>34 ? "…" : "");
    return `<button class="hist" data-i="${i}" title="${escapeHtml(preview)}">${escapeHtml(preview)}</button>`;
  }).join("");

  [...elHistory.querySelectorAll(".hist")].forEach(btn=>{
    btn.onclick = ()=>{
      const idx = Number(btn.getAttribute("data-i"));
      elQuestion.value = history[idx].q || "";
      elText.value = history[idx].t || "";
      updateCount();
    };
  });
}

// --- Collapse buttons
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

// --- Main run
function run(){
  const q = (elQuestion.value || "").trim();
  const input = (elText.value || "").trim();
  if(!q && !input){
    alert(lang==="ru" ? "Напиши вопрос или вставь текст." : "Type a question or paste some text.");
    return;
  }

  const lvl = Number(elLevel.value);
  const maxWords = Number(elMaxWords.value);

  const subject = detectSubject(q, input);
  const qScore = qualityScore(input || q);
  const ql = qualityLabel(qScore);

  elSubjectPill.textContent = `${T[lang].subject}: ${subject} · L${lvl}`;
  elQualityPill.textContent = `${T[lang].quality}: ${ql.t}`;
  elQualityPill.style.borderColor = ql.c;

  // Explanation: prefer pasted text, else use question as text
  const baseText = input || q;
  const sents = splitSentences(baseText);
  const lines = simplifyLines(sents, lvl, maxWords);

  elExplanation.innerHTML = lines.length
    ? `<ul style="margin:0;padding-left:18px">${lines.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`
    : `<span class="muted">${lang==="ru" ? "Слишком коротко — добавь больше текста." : "Too short — add more text."}</span>`;

  // Formulas / facts
  elFormulas.innerHTML = formulasFor(subject, q);

  // KB citations
  const queryForKb = (q ? q : baseText).slice(0, 800);
  const matches = searchKB(queryForKb, 5);
  elSources.innerHTML = renderKBMatches(matches);

  // Links
  elLinks.innerHTML = linksFor(subject);

  // Show output
  elEmpty.classList.add("hidden");
  elOut.classList.remove("hidden");

  pushHistory(q, input);

  // Prepare copy/download text
  const copyText =
`ELI12 result

Question: ${q || "(none)"}
Subject: ${subject}

Simple explanation:
${lines.map(x=>"- "+x).join("\n")}

Formulas / key facts:
${stripHtml(formulasFor(subject, q))}

From your books:
${matches.length ? matches.map(m=>`- ${m.docName} (chunk ${m.idx+1}, score ${m.score}): ${m.text.replace(/\s+/g," ").trim().slice(0,180)}...`).join("\n") : "(no matches)"}
`;
  elCopy.dataset.copy = copyText;
  elDownload.dataset.copy = copyText;
}

function stripHtml(html){
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// --- Events
$("demoBio").onclick = ()=>{ elQuestion.value = DEMO.bio.q; elText.value = DEMO.bio.t; updateCount(); };
$("demoChem").onclick = ()=>{ elQuestion.value = DEMO.chem.q; elText.value = DEMO.chem.t; updateCount(); };
$("demoMath").onclick = ()=>{ elQuestion.value = DEMO.math.q; elText.value = DEMO.math.t; updateCount(); };

elExplain.onclick = run;

elClear.onclick = ()=>{
  elQuestion.value = "";
  elText.value = "";
  updateCount();
  elOut.classList.add("hidden");
  elEmpty.classList.remove("hidden");
};

elText.addEventListener("input", updateCount);

elLevel.addEventListener("input", ()=>{
  elLevelBadge.textContent = elLevel.value;
  if(!elOut.classList.contains("hidden")) run();
});

elLangBtn.onclick = ()=>{
  setLang(lang==="en" ? "ru" : "en");
  if(!elOut.classList.contains("hidden")) run();
};

elThemeBtn.onclick = ()=> setTheme(!dark);

// Copy / Download
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
  a.download = "eli12_result.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// KB upload
elKbUploadBtn.onclick = ()=> elKbFiles.click();
elKbFiles.onchange = async ()=>{
  const files = [...(elKbFiles.files || [])];
  if(!files.length) return;
  await addToKB(files);
  elKbFiles.value = "";
  toast(lang==="ru" ? "Книги добавлены ✅" : "Books added ✅");
};

elKbClearBtn.onclick = ()=>{
  clearKB();
  toast(lang==="ru" ? "KB очищена ✅" : "KB cleared ✅");
};

// Init
function init(){
  loadKBFromLocalStorage();
  setLang("en");
  setTheme(true);
  updateCount();
  elLevelBadge.textContent = elLevel.value;
  renderHistory();
  collapseSetup();
  refreshKbStatus();
}
init();
