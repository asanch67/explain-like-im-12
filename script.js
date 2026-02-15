// ---------- Demo texts ----------
const demoBio = "Нейрон — это клетка, которая передаёт сигналы в нервной системе. Сигналы проходят через синапсы с помощью химических веществ. Это помогает мозгу управлять движениями и чувствами.";
const demoChem = "Скорость химической реакции зависит от концентрации реагентов, температуры и наличия катализатора. При повышении температуры частицы движутся быстрее и чаще сталкиваются, поэтому реакция ускоряется.";
const demoPhys = "Давление — это сила, действующая на единицу площади. Если площадь опоры меньше, давление больше. Поэтому острый нож режет лучше, чем тупой.";

// ---------- Helpers ----------
const SUFFIXES = ["ция","изм","ность","ирование","логия","метрия","генез","функция","процесс"];

const SUBJECT_HINTS = {
  Biology: ["клет","нейрон","ген","белок","орган","мозг","кров","иммун"],
  Chemistry: ["реакц","моль","катализ","кисл","основан","раствор","окис","ион"],
  Physics: ["сила","давлен","скорост","энерг","поле","напряж","масса","ускор"]
};

function splitSentences(text){
  const t = text.replace(/\s+/g," ").trim();
  if(!t) return [];
  // split on .!? and keep it simple
  return t.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
}

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

function pickHardWords(text, k=8){
  const words = (text.match(/[A-Za-zА-Яа-яёЁ\-]{4,}/g) || []);
  const cand = [];
  for(const w of words){
    const wl = w.toLowerCase();
    let score = 0;
    if(w.length >= 11) score += 2;
    if(SUFFIXES.some(s=>wl.endsWith(s))) score += 2;
    if(wl.includes("ци") || wl.includes("изм") || wl.includes("лог")) score += 1;
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
  return words.map(w=>{
    const wl = w.toLowerCase();
    let d = "Простыми словами: ключевой термин из текста.";
    if(wl.endsWith("ция")) d = "Слово про действие/явление. Проще: «то, что происходит».";
    else if(wl.endsWith("изм")) d = "Название идеи/подхода. Проще: «способ думать или объяснять».";
    else if(wl.endsWith("ность")) d = "Это «качество/свойство». Проще: «насколько что-то такое-то».";
    else if(wl.includes("реак")) d = "Это когда вещества меняются и получается что-то новое.";
    else if(wl.includes("энерг")) d = "Это «запас сил»: то, что позволяет делать работу.";
    return {w, d};
  });
}

function buildExamples(subject){
  if(subject === "Physics") return [
    "Лыжи меньше проваливаются в снег: площадь больше → давление меньше.",
    "Толкаешь сильнее → ускорение больше: сила влияет на движение.",
    "Энергия — как заряд батарейки: чем больше, тем больше можно сделать."
  ];
  if(subject === "Chemistry") return [
    "Сахар быстрее растворяется в горячей воде — температура ускоряет процесс.",
    "Катализатор — как помощник: ускоряет реакцию, но сам почти не тратится.",
    "Больше концентрация → чаще столкновения частиц → реакция быстрее."
  ];
  if(subject === "Biology") return [
    "Нейроны как провода: передают сигналы.",
    "Ген как инструкция: по ней делают белки.",
    "Иммунитет как охрана: узнаёт чужое и защищает."
  ];
  return [
    "Объясни это младшему брату одним предложением.",
    "Придумай пример из жизни (школа/спорт/еда/игры).",
    "Замени сложные слова простыми — смысл должен остаться."
  ];
}

function shorten(s, n){
  const t = s.trim();
  return t.length > n ? t.slice(0,n).trimEnd() + "…" : t;
}

function analyze(text){
  const sents = splitSentences(text);
  if(sents.length === 0) return null;

  const subject = detectSubject(text);
  const hard = pickHardWords(text, 8);
  const glossary = glossaryFor(hard);

  let main = sents[0].replace(/[,;:]\s*/g, ". ");
  main = shorten(main, 160);

  const bullets = sents.slice(0,5).map(s=>{
    let x = s;
    x = x.replace(/\b(следовательно|в результате)\b/gi, "поэтому");
    x = x.replace(/\bоднако\b/gi, "но");
    x = x.replace(/\bхарактеризуется\b/gi, "обычно имеет");
    x = x.replace(/\bопределяется\b/gi, "это");
    return shorten(x, 140);
  });

  const explanationHTML = `
    <div class="kv"><div><b>Subject</b></div><div>${subject} <span class="badge">MVP</span></div></div>
    <div class="kv"><div><b>Main idea</b></div><div>${main}</div></div>
    <div style="margin-top:10px"><b>In simple steps:</b></div>
    <ul class="list">${bullets.map(b=>`<li>${b}</li>`).join("")}</ul>
  `;

  const examples = buildExamples(subject);

  const quiz = [
    {q:"Объясни одним предложением, о чём текст.", hint:"Сравни с Main idea"},
    {q:"Назови 1 сложный термин и объясни его простыми словами.", hint:"Можно взять из Glossary"},
    {q:"Приведи 1 пример из жизни, который подходит к идее.", hint:"Можно взять из Examples"},
    {q:"Что было самым непонятным?", hint:"Запиши слово/фразу"},
    {q:"Какая главная мысль?", hint:"Один короткий вывод"}
  ];

  return { explanationHTML, glossary, examples, quiz };
}

// ---------- UI wiring ----------
const elText = document.getElementById("text");
const out = document.getElementById("output");
const empty = document.getElementById("emptyState");

document.getElementById("demoBio").onclick = ()=>{ elText.value = demoBio; };
document.getElementById("demoChem").onclick = ()=>{ elText.value = demoChem; };
document.getElementById("demoPhys").onclick = ()=>{ elText.value = demoPhys; };

document.getElementById("clearBtn").onclick = ()=>{
  elText.value = "";
  out.classList.add("hidden");
  empty.classList.remove("hidden");
};

document.getElementById("explainBtn").onclick = ()=>{
  const res = analyze(elText.value || "");
  if(!res){
    alert("Paste some text first.");
    return;
  }

  // explanation
  document.getElementById("explanation").innerHTML = res.explanationHTML;

  // glossary
  const g = document.getElementById("glossary");
  if(res.glossary.length === 0){
    g.innerHTML = "<span class='muted'>No hard words detected (or text is very short).</span>";
  } else {
    g.innerHTML = res.glossary.map(x=>`
      <div class="kv">
        <div><b>${x.w}</b></div>
        <div>${x.d}</div>
      </div>
    `).join("");
  }

  // examples
  const ex = document.getElementById("examples");
  ex.innerHTML = res.examples.map(e=>`<li>${e}</li>`).join("");

  // quiz
  const showHints = document.getElementById("showHints").checked;
  const q = document.getElementById("quiz");
  q.innerHTML = res.quiz.map((it, idx)=>`
    <div class="q">
      <div><b>Q${idx+1}:</b> ${it.q}</div>
      ${showHints ? `<div class="hint">Hint: ${it.hint}</div>` : ""}
    </div>
  `).join("");

  empty.classList.add("hidden");
  out.classList.remove("hidden");
};

document.getElementById("showHints").onchange = ()=>{
  // re-render quiz hints if output already visible
  if(out.classList.contains("hidden")) return;
  document.getElementById("explainBtn").click();
};
