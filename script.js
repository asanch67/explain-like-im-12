/* ===========================
   ELI12 — upgraded MVP
   - simplify level (1-3)
   - RU/EN UI
   - theme toggle
   - history (last 6 inputs)
   - copy / download
   - key terms chips + glossary
   - quiz w/ suggested answers
   =========================== */

// --------- Demo texts ----------
const DEMO = {
  bio: "Нейрон — это клетка, которая передаёт сигналы в нервной системе. Сигналы проходят через синапсы с помощью химических веществ. Это помогает мозгу управлять движениями, эмоциями и формировать память.",
  chem: "Скорость химической реакции зависит от концентрации реагентов и температуры. При повышении температуры частицы движутся быстрее и чаще сталкиваются, поэтому реакция ускоряется. Катализатор снижает энергию активации и ускоряет процесс, но сам почти не расходуется.",
  phys: "Давление — это сила, действующая на единицу площади. Если площадь опоры меньше, давление больше, поэтому острый нож режет лучше. Увеличение силы также увеличивает давление и влияет на результат."
};

// --------- UI translations ----------
const T = {
  en: {
    subtitle: "Paste textbook text → get simple explanation + examples + quiz",
    input: "Input",
    output: "Output",
    offline: "Offline MVP",
    paste: "Paste your text",
    level: "Simplify level",
    levelHint: "1 = light, 2 = normal, 3 = very simple",
    len: "Output length",
    lenHint: "Word count of your input",
    history: "History",
    note: "Works fully offline. No external APIs. Heuristic NLP + UX demo for hackathon.",
    emptyTitle: "No output yet",
    emptyText: "Choose a demo or paste text, then press Explain.",
    simple: "1) Simple explanation",
    terms: "2) Key terms",
    gloss: "Glossary",
    examples: "3) Examples",
    quiz: "4) Mini-quiz",
    showSuggested: "Show suggested answers",
    subject: "Subject",
    quality: "Quality",
    copied: "Copied ✅"
  },
  ru: {
    subtitle: "Вставь текст → получи простое объяснение + примеры + квиз",
    input: "Ввод",
    output: "Результат",
    offline: "Оффлайн MVP",
    paste: "Вставь свой текст",
    level: "Уровень упрощения",
    levelHint: "1 = легко, 2 = нормально, 3 = максимально просто",
    len: "Длина ответа",
    lenHint: "Количество слов во входном тексте",
    history: "История",
    note: "Работает полностью оффлайн. Без внешних API. Эвристики NLP + UX демо для хакатона.",
    emptyTitle: "Пока пусто",
    emptyText: "Выбери демо или вставь текст, затем нажми Explain.",
    simple: "1) Простое объяснение",
    terms: "2) Ключевые термины",
    gloss: "Глоссарий",
    examples: "3) Примеры",
    quiz: "4) Мини-квиз",
    showSuggested: "Показывать пример ответов",
    subject: "Тема",
    quality: "Качество",
    copied: "Скопировано ✅"
  }
};

// --------- DOM ----------
const $ = (id) => document.getElementById(id);

const elText = $("text");
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
const elGlossary = $("glossary");
const elTerms = $("terms");
const elExamples = $("examples");
const elQuiz = $("quiz");

const elShowSuggested = $("showSuggested");
const elToast = $("toast");

const elSubjectPill = $("subjectPill");
const elQualityPill = $("qualityPill");

const elHistory = $("history");

const elLangBtn = $("langBtn");
const elThemeBtn = $("themeBtn");
const elLiveLink = $("liveLink");

// UI text nodes
const ui = {
  subtitle: $("uiSubtitle"),
  input: $("uiInputTitle"),
  output: $("uiOutputTitle"),
  offline: $("uiOfflinePill"),
  paste: $("uiPasteLabel"),
  level: $("uiLevelLabel"),
  levelHint: $("uiLevelHint"),
  len: $("uiLenLabel"),
  lenHint: $("uiLenHint"),
  history: $("uiHistoryTitle"),
  note: $("uiNote"),
  emptyTitle: $("uiEmptyTitle"),
  emptyText: $("uiEmptyText"),
  simple: $("uiSimpleTitle"),
  terms: $("uiTermsTitle"),
  gloss: $("uiGlossTitle"),
  examples: $("uiExamplesTitle"),
  quiz: $("uiQuizTitle"),
  showSuggested: $("uiShowSuggested")
};

// --------- State ----------
let lang = "en";
let dark = true;
let history = []; // {t, ts}

// --------- Utils ----------
function toast(msg){
  elToast.textContent = msg;
  elToast.classList.add("show");
  setTimeout(()=> elToast.classList.remove("show"), 900);
}

function wordCount(s){
  const m = (s.trim().match(/[A-Za-zА-Яа-яёЁ0-9]+/g) || []);
  return m.length;
}

function setLang(next){
  lang = next;
  elLangBtn.textContent = (lang === "en") ? "RU" : "EN";
  const t = T[lang];
  ui.subtitle.textContent = t.subtitle;
  ui.input.textContent = t.input;
  ui.output.textContent = t.output;
  ui.offline.textContent = t.offline;
  ui.paste.textContent = t.paste;
  ui.level.textContent = t.level;
  ui.levelHint.textContent = t.levelHint;
  ui.len.textContent = t.len;
  ui.lenHint.textContent = t.lenHint;
  ui.history.textContent = t.history;
  ui.note.textContent = t.note;
  ui.emptyTitle.textContent = t.emptyTitle;
  ui.emptyText.textContent = t.emptyText;
  ui.simple.textContent = t.simple;
  ui.terms.textContent = t.terms;
  ui.gloss.textContent = t.gloss;
  ui.examples.textContent = t.examples;
  ui.quiz.textContent = t.quiz;
  ui.showSuggested.textContent = t.showSuggested;

  // pills
  elSubjectPill.textContent = `${t.subject}: —`;
  elQualityPill.textContent = `${t.quality}: —`;

  // live link
  elLiveLink.textContent = "Live";
  elLiveLink.href = window.location.href;
}

function setTheme(isDark){
  dark = isDark;
  document.body.classList.toggle("light", !dark);
  elThemeBtn.textContent = dark ? "🌙" : "☀️";
}

function splitSentences(text){
  const t = text.replace(/\s+/g," ").trim();
  if(!t) return [];
  // Safer split (no regex lookbehind)
  return t
    .split(/[.!?…]+\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

const SUBJECT_HINTS = {
  Biology: ["клет","нейрон","ген","белок","орган","мозг","кров","иммун","synapse","neuron","gene","protein"],
  Chemistry: ["реакц","моль","катализ","кисл","основан","раствор","окис","ион","reaction","mole","catal","acid","base"],
  Physics: ["сила","давлен","скорост","энерг","поле","масса","ускор","pressure","force","energy","mass","accel"]
};

function detectSubject(text){
  const t = text.toLowerCase();
  let best = {name:"General", score:0};
  for(const [subj, keys] of Object.entries(SUBJECT_HINTS)){
    let score = 0;
    for(const k of keys) if(t.includes(k)) score++;
    if(score > best.score) best = {name:subj, score};
  }
  return best.name;
}

// hard-word heuristics
const SUFFIXES = ["ция","изм","ность","ирование","логия","метрия","генез","функция","процесс","ation","ism","ness","tion","logy","metry","genesis"];

function pickHardWords(text, k=10){
  const words = (text.match(/[A-Za-zА-Яа-яёЁ\-]{4,}/g) || []);
  const cand = [];
  for(const w of words){
    const wl = w.toLowerCase();
    let score = 0;
    if(w.length >= 11) score += 2;
    if(SUFFIXES.some(s=>wl.endsWith(s))) score += 2;
    if(/[A-Z]/.test(w)) score += 1;
    if(score > 0) cand.push({score, w});
  }
  cand.sort((a,b)=> b.score - a.score || b.w.length - a.w.length);
  const out = [];
  const seen = new Set();
  for(const c of cand){
    const key = c.w.toLowerCase();
    if(!seen.has(key)){
      out.push(c.w);
      seen.add(key);
    }
    if(out.length >= k) break;
  }
  return out;
}

function glossaryFor(words){
  const isRU = (lang === "ru");
  return words.map(w=>{
    const wl = w.toLowerCase();
    let d = isRU
      ? "Простыми словами: важный термин из текста."
      : "In simple words: an important term from the text.";

    if(isRU){
      if(wl.endsWith("ция")) d = "Слово про действие/явление. Проще: «то, что происходит».";
      else if(wl.endsWith("изм")) d = "Название идеи/подхода. Проще: «способ думать или объяснять».";
      else if(wl.endsWith("ность")) d = "Это «качество/свойство». Проще: «насколько что-то такое-то».";
      else if(wl.includes("реак")) d = "Это когда вещества меняются и получается что-то новое.";
      else if(wl.includes("энерг")) d = "Это «запас сил»: то, что позволяет делать работу.";
      else if(wl.includes("давлен")) d = "Это насколько сильно «давит» сила на поверхность.";
      else if(wl.includes("катализ")) d = "Это «ускоритель» реакции, который сам почти не тратится.";
    } else {
      if(wl.endsWith("ation") || wl.endsWith("tion")) d = "A word about an action/process. Simply: “what happens”.";
      else if(wl.endsWith("ism")) d = "A named idea/approach. Simply: “a way to explain things”.";
      else if(wl.endsWith("ness")) d = "A property/quality. Simply: “how much something is like that”.";
      else if(wl.includes("reaction")) d = "When substances change and form something new.";
      else if(wl.includes("energy")) d = "A “store of power” that lets things happen / work be done.";
      else if(wl.includes("pressure")) d = "How strongly a force presses on a surface.";
      else if(wl.includes("catal")) d = "A helper that speeds up a reaction without being used up much.";
    }

    return {w, d};
  });
}

function buildExamples(subject){
  const isRU = (lang === "ru");
  if(subject === "Physics") return isRU ? [
    "Лыжи меньше проваливаются в снег: площадь больше → давление меньше.",
    "Острый нож режет лучше: площадь контакта маленькая → давление большое.",
    "Если толкать сильнее (больше силы), движение меняется быстрее."
  ] : [
    "Skis sink less: bigger area → lower pressure.",
    "A sharp knife cuts better: smaller area → higher pressure.",
    "More force usually changes motion faster."
  ];

  if(subject === "Chemistry") return isRU ? [
    "Сахар быстрее растворяется в горячей воде — температура ускоряет процесс.",
    "Катализатор — как помощник: ускоряет реакцию, но сам почти не тратится.",
    "Больше концентрация → чаще столкновения частиц → реакция быстрее."
  ] : [
    "Sugar dissolves faster in hot water — temperature speeds things up.",
    "A catalyst is like a helper: faster reaction, not used up much.",
    "Higher concentration → more collisions → faster reaction."
  ];

  if(subject === "Biology") return isRU ? [
    "Нейроны как провода: передают сигналы.",
    "Ген как инструкция: по ней делают белки.",
    "Иммунитет как охрана: узнаёт чужое и защищает."
  ] : [
    "Neurons are like wires: they carry signals.",
    "A gene is like instructions to build proteins.",
    "The immune system is like security: it protects you."
  ];

  return isRU ? [
    "Объясни это младшему брату одним предложением.",
    "Придумай пример из жизни (школа/спорт/еда/игры).",
    "Замени сложные слова простыми — смысл должен остаться."
  ] : [
    "Explain it to a younger friend in one sentence.",
    "Give a real-life example (school/sports/food/games).",
    "Replace hard words with simple ones without changing meaning."
  ];
}

function simplifyText(sentences, level, maxWords){
  const isRU = (lang === "ru");

  const replRU = [
    [/следовательно|в результате/gi, "поэтому"],
    [/однако/gi, "но"],
    [/характеризуется/gi, "обычно имеет"],
    [/определяется/gi, "это"],
    [/является/gi, "это"],
  ];
  const replEN = [
    [/therefore|thus|as a result/gi, "so"],
    [/however/gi, "but"],
    [/is characterized by/gi, "usually has"],
    [/is defined as/gi, "is"],
  ];

  const repl = isRU ? replRU : replEN;

  // ✅ FIX: level 3 = simpler + shorter, level 1 = more detailed
  let take = level === 1 ? 5 : (level === 2 ? 4 : 3);

  const picked = sentences.slice(0, take).map(s=>{
    let x = s;

    for(const [a,b] of repl) x = x.replace(a,b);

    if(level === 3){
      // aggressive simplification
      x = x.replace(/\((.*?)\)/g, "");
      x = x.replace(/[,;:]\s*/g, ". ");
      x = x.replace(/\s+/g, " ").trim();

      // add simple starter for “kid-level”
      if(isRU){
        if(!/^(это|про|значит)/i.test(x)) x = "Это значит: " + x.toLowerCase();
      } else {
        if(!/^(this|it means|about)/i.test(x)) x = "It means: " + x[0].toLowerCase() + x.slice(1);
      }
    }

    return x.trim();
  }).filter(Boolean);

  // cap by word limit
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
  if(wc >= 25) score += 1;
  if(wc >= 60) score += 1;
  if(sents >= 2) score += 1;
  if(sents >= 4) score += 1;
  return score; // 0..4
}

function qualityLabel(score){
  const isRU = (lang === "ru");
  if(score <= 1) return isRU ? {t:"low", c:"var(--warn)"} : {t:"low", c:"var(--warn)"};
  if(score === 2) return isRU ? {t:"ok", c:"var(--good)"} : {t:"ok", c:"var(--good)"};
  if(score === 3) return isRU ? {t:"good", c:"var(--good)"} : {t:"good", c:"var(--good)"};
  return isRU ? {t:"great", c:"var(--good)"} : {t:"great", c:"var(--good)"};
}

function buildQuiz(subject, showSuggested){
  const isRU = (lang === "ru");
  const base = isRU ? [
    {q:"Объясни одним предложением, о чём текст.", a:"Пример: «Текст объясняет, от чего зависит скорость реакции и как её ускорить»."},
    {q:"Назови 1 сложный термин и объясни его простыми словами.", a:"Пример: «Катализатор — это помощник, который ускоряет реакцию»."},
    {q:"Приведи 1 пример из жизни.", a:"Пример: «Сахар быстрее растворяется в горячей воде»."},
    {q:"Что было самым непонятным?", a:"Пример: «Энергия активации — что это и как её представить?»"},
    {q:"Сделай короткий вывод (1 строка).", a:"Пример: «Больше температура/концентрация → быстрее реакция»."}
  ] : [
    {q:"Explain in one sentence what the text is about.", a:"Example: “It explains what affects reaction speed and how to speed it up.”"},
    {q:"Pick one hard term and explain it simply.", a:"Example: “A catalyst is a helper that speeds up a reaction.”"},
    {q:"Give one real-life example.", a:"Example: “Sugar dissolves faster in hot water.”"},
    {q:"What was the most confusing part?", a:"Example: “Activation energy — how can I imagine it?”"},
    {q:"Write a one-line takeaway.", a:"Example: “Higher temperature/concentration → faster reaction.”"}
  ];

  // Small subject tweak
  if(subject === "Physics" && isRU){
    base[0].a = "Пример: «Текст объясняет, что такое давление и почему оно растёт при меньшей площади».";
    base[2].a = "Пример: «Острый нож режет лучше из-за большего давления».";
  }
  if(subject === "Biology" && isRU){
    base[0].a = "Пример: «Текст объясняет, как нейроны передают сигналы».";
    base[2].a = "Пример: «Рефлекс — это быстрый ответ на раздражитель».";
  }

  return base.map((it, idx)=>`
    <div class="q">
      <div><b>Q${idx+1}:</b> ${it.q}</div>
      ${showSuggested ? `<div class="hint2">${it.a}</div>` : ""}
    </div>
  `).join("");
}

function renderGlossary(items){
  if(items.length === 0){
    return `<span class="muted">${lang==="ru" ? "Сложные слова не найдены (или текст короткий)." : "No hard words detected (or text is short)."}</span>`;
  }
  return items.map(x=>`
    <div class="kv">
      <div><b>${x.w}</b></div>
      <div>${x.d}</div>
    </div>
  `).join("");
}

function renderTerms(words){
  if(words.length === 0){
    return `<span class="muted">${lang==="ru" ? "Пока пусто" : "Nothing yet"}</span>`;
  }
  return words.map(w=>`<span class="chip">${w}</span>`).join("");
}

function renderExamples(examples){
  return examples.map(e=>`<li>${e}</li>`).join("");
}

function buildCopyText(subject, explanationLines, terms, glossary, examples){
  const isRU = (lang==="ru");
  const head = isRU ? "ELI12 result" : "ELI12 result";
  const exp = explanationLines.map(x=>`- ${x}`).join("\n");
  const termLine = terms.length ? terms.join(", ") : (isRU ? "(нет)" : "(none)");
  const gl = glossary.map(g=>`- ${g.w}: ${g.d}`).join("\n");
  const ex = examples.map(e=>`- ${e}`).join("\n");
  return `${head}\n\nSubject: ${subject}\n\nSimple explanation:\n${exp}\n\nKey terms:\n${termLine}\n\nGlossary:\n${gl}\n\nExamples:\n${ex}\n`;
}

function pushHistory(text){
  const t = text.trim();
  if(!t) return;
  // avoid duplicates
  if(history.length && history[0].t === t) return;
  history.unshift({t, ts: Date.now()});
  history = history.slice(0, 6);
  renderHistory();
}

function renderHistory(){
  if(history.length === 0){
    elHistory.innerHTML = `<span class="muted">${lang==="ru" ? "Пока пусто" : "Empty"}</span>`;
    return;
  }
  elHistory.innerHTML = history.map((h, i)=>{
    const preview = h.t.replace(/\s+/g," ").slice(0, 34) + (h.t.length>34 ? "…" : "");
    return `<button class="hist" data-i="${i}" title="${preview}">${preview}</button>`;
  }).join("");
  // attach
  [...elHistory.querySelectorAll(".hist")].forEach(btn=>{
    btn.onclick = ()=>{
      const idx = Number(btn.getAttribute("data-i"));
      elText.value = history[idx].t;
      updateCount();
    };
  });
}

function updateCount(){
  elCountBadge.textContent = wordCount(elText.value || "");
}

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

// --------- Main analyze/render ----------
function run(){
  const input = (elText.value || "").trim();
  if(!input){
    alert(lang==="ru" ? "Сначала вставь текст." : "Paste some text first.");
    return;
  }

  const sentences = splitSentences(input);
  const subj = detectSubject(input);
  const lvl = Number(elLevel.value);
  const maxWords = Number(elMaxWords.value);

  const qScore = qualityScore(input);
  const q = qualityLabel(qScore);

  // pills
  elSubjectPill.textContent = `${T[lang].subject}: ${subj} · L${lvl}`;
  elQualityPill.textContent = `${T[lang].quality}: ${q.t}`;
  elQualityPill.style.borderColor = q.c;

  // explain lines
  const explainLines = simplifyText(sentences, lvl, maxWords);
  elExplanation.innerHTML = `<ul class="list">${explainLines.map(x=>`<li>${x}</li>`).join("")}</ul>`;

  // terms/glossary
  const hardWords = pickHardWords(input, 10);
  elTerms.innerHTML = renderTerms(hardWords.slice(0, 8));
  const glossary = glossaryFor(hardWords.slice(0, 8));
  elGlossary.innerHTML = renderGlossary(glossary);

  // examples
  const examples = buildExamples(subj);
  elExamples.innerHTML = renderExamples(examples);

  // quiz
  elQuiz.innerHTML = buildQuiz(subj, elShowSuggested.checked);

  // show output
  elEmpty.classList.add("hidden");
  elOut.classList.remove("hidden");

  // history
  pushHistory(input);

  // store for copy/download
  const copyText = buildCopyText(subj, explainLines, hardWords.slice(0,8), glossary, examples);
  elCopy.dataset.copy = copyText;
  elDownload.dataset.copy = copyText;
}

// --------- Events ----------
$("demoBio").onclick = ()=>{ elText.value = DEMO.bio; updateCount(); };
$("demoChem").onclick = ()=>{ elText.value = DEMO.chem; updateCount(); };
$("demoPhys").onclick = ()=>{ elText.value = DEMO.phys; updateCount(); };

elExplain.onclick = run;

elClear.onclick = ()=>{
  elText.value = "";
  updateCount();
  elOut.classList.add("hidden");
  elEmpty.classList.remove("hidden");
};

elText.addEventListener("input", updateCount);

elLevel.addEventListener("input", ()=>{
  elLevelBadge.textContent = elLevel.value;

  // ✅ auto re-run if output is visible
  if(!elOut.classList.contains("hidden")){
    run();
  }
});


elMaxWords.addEventListener("change", ()=>{
  // no-op, used in run
});

elShowSuggested.addEventListener("change", ()=>{
  if(elOut.classList.contains("hidden")) return;
  run(); // re-render quiz
});

elCopy.onclick = async ()=>{
  const text = elCopy.dataset.copy || "";
  if(!text) return;
  try{
    await navigator.clipboard.writeText(text);
    toast(T[lang].copied);
  } catch {
    // fallback
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

elLangBtn.onclick = ()=>{
  setLang(lang === "en" ? "ru" : "en");
  renderHistory();
  // if already rendered, rerun so text matches language
  if(!elOut.classList.contains("hidden")){
    run();
  }
};

elThemeBtn.onclick = ()=>{
  setTheme(!dark);
};

// --------- Init ----------
setLang("en");
setTheme(true);
updateCount();
elLevelBadge.textContent = elLevel.value;
renderHistory();
collapseSetup();
