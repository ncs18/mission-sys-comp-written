/* ==========================================================================
   Helpers used by the problem bank
   ========================================================================== */
function disp(tex){ return '<div class="math">\\[' + tex + '\\]</div>'; }
function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function comma(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function num(n){
  if (Number.isInteger(n)) return n.toString();
  return parseFloat(n.toFixed(4)).toString();
}
function sig(x, n){
  if (x === 0) return '0';
  const v = Number(x.toPrecision(n));
  if (Math.abs(v) >= 1000) return comma(Number(v.toFixed(0)));
  return parseFloat(v.toString()).toString();
}
function sci(x, n){
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  const m = x / Math.pow(10, e);
  return parseFloat(m.toPrecision(n)) + '\\times10^{' + e + '}';
}
function listify(arr){
  if (arr.length <= 1) return arr[0] || '';
  return arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1];
}
function db1(x){ return (Math.round(x*10)/10).toFixed(1); }
function article(n){ return (String(n)[0]==='8' || String(n).slice(0,2)==='11' || String(n).slice(0,2)==='18') ? 'an' : 'a'; }
function dbTableHint(db){
  const parts = [];
  let rest = db;
  while (rest >= 10){ parts.push('10 dB'); rest -= 10; }
  if (rest > 0) parts.push(rest + ' dB');
  return parts.join(' + ') + ' \u2192 multiply the ratios';
}

/* ==========================================================================
   Seeded RNG
   ========================================================================== */
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function makeRNG(seed){
  const r = mulberry32(seed);
  const api = {
    next: r,
    int(a, b){ return a + Math.floor(r() * (b - a + 1)); },
    pick(arr){ return arr[Math.floor(r() * arr.length)]; },
    shuffle(arr){
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--){
        const j = Math.floor(r() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    sample(arr, n){ return api.shuffle(arr).slice(0, n); }
  };
  return api;
}

/* ==========================================================================
   Math rendering
   ========================================================================== */
function typeset(root){
  const el = root || document.body;
  el.querySelectorAll('.math').forEach(function(m){ m.classList.remove('rendered'); });
  if (typeof renderMathInElement !== 'function'){
    el.querySelectorAll('.math').forEach(function(m){ m.classList.add('rendered'); });
    return;
  }
  try {
    renderMathInElement(el, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } catch (e){ /* leave source visible rather than blank */ }
  el.querySelectorAll('.math').forEach(function(m){ m.classList.add('rendered'); });
}

/* ==========================================================================
   Problem card markup
   ========================================================================== */
function problemCard(label, item, out, opts){
  opts = opts || {};
  const wrap = document.createElement('div');
  wrap.className = 'prob';
  wrap.dataset.mod = item.mod;

  let html = '<div class="q"><p class="qid">' + label +
             (opts.showModule ? ' <span class="modtag">Module ' + item.mod + '</span>' : '') +
             '</p>' + out.q + '</div>';

  html += '<details><summary>' + (opts.summaryText || 'Answer') + '</summary>' +
          '<div class="ans">' + out.a + '</div></details>';

  if (opts.selfGrade){
    html += '<div class="grade" hidden>' +
            '<button type="button" class="gbtn" data-v="1">Got it</button>' +
            '<button type="button" class="gbtn" data-v="0">Missed it</button>' +
            '</div>';
  }
  wrap.innerHTML = html;
  return wrap;
}

/* ==========================================================================
   TAB 1 — Review
   ========================================================================== */
let reviewSeed = 1;

function renderReview(seed){
  reviewSeed = seed;
  const hosts = document.querySelectorAll('[data-probhost]');
  hosts.forEach(function(h){ h.innerHTML = ''; });

  BANK.forEach(function(item, i){
    const host = document.querySelector('[data-probhost="' + item.mod + '"]');
    if (!host) return;
    const R = makeRNG(seed * 7919 + i * 104729);
    const out = item.gen(R);
    host.appendChild(problemCard(item.id, item, out, {}));
  });

  typeset(document.getElementById('tab-review'));
  const stamp = document.getElementById('seedStamp');
  if (stamp) stamp.textContent = 'set #' + seed;
}

/* ==========================================================================
   TAB 2 — Practice test
   ========================================================================== */
const TEST_SPECS = {
  15: { perModule: 1, minutes: 15 },
  30: { perModule: 2, minutes: 30 },
  60: { perModule: 3, minutes: 60 }
};

let timerHandle = null;
let secondsLeft = 0;
let currentTest = null;

function buildTest(minutes){
  const spec = TEST_SPECS[minutes];
  const seed = Date.now() % 2147483647;
  const R = makeRNG(seed);
  const modules = [1, 2, 3, 4, 5, 6, 7, 8];
  let picked = [];

  modules.forEach(function(m){
    const pool = BANK.filter(function(b){ return b.mod === m; });
    const take = Math.min(spec.perModule, pool.length);
    R.sample(pool, take).forEach(function(item){ picked.push(item); });
  });

  picked = R.shuffle(picked);

  const host = document.getElementById('testQuestions');
  host.innerHTML = '';
  picked.forEach(function(item, i){
    const qR = makeRNG(seed + i * 7919 + item.id.charCodeAt(0) * 131);
    const out = item.gen(qR);
    const card = problemCard('Question ' + (i + 1), item, out, {
      showModule: true,
      selfGrade: true,
      summaryText: 'Reveal answer'
    });
    host.appendChild(card);
  });

  currentTest = { seed: seed, minutes: minutes, count: picked.length };
  document.getElementById('testMeta').textContent =
    picked.length + ' questions \u00b7 ' + minutes + ' min \u00b7 set #' + seed;
  document.getElementById('testBody').hidden = false;
  document.getElementById('testScore').hidden = true;
  document.getElementById('testScore').textContent = '';

  typeset(host);
  startTimer(minutes * 60);
  window.scrollTo({ top: document.getElementById('testControls').offsetTop - 20, behavior: 'smooth' });
}

function fmtClock(s){
  const m = Math.floor(s / 60), r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}

function startTimer(total){
  stopTimer();
  secondsLeft = total;
  const el = document.getElementById('clock');
  el.classList.remove('warn', 'done');
  el.textContent = fmtClock(secondsLeft);
  timerHandle = setInterval(function(){
    secondsLeft--;
    el.textContent = fmtClock(Math.max(secondsLeft, 0));
    if (secondsLeft <= 60) el.classList.add('warn');
    if (secondsLeft <= 0){
      stopTimer();
      el.textContent = 'Time';
      el.classList.add('done');
      revealTest();
    }
  }, 1000);
  document.getElementById('pauseBtn').textContent = 'Pause';
}

function stopTimer(){
  if (timerHandle){ clearInterval(timerHandle); timerHandle = null; }
}

function revealTest(){
  document.querySelectorAll('#testQuestions details').forEach(function(d){ d.open = true; });
  document.querySelectorAll('#testQuestions .grade').forEach(function(g){ g.hidden = false; });
  updateScore();
}

function updateScore(){
  const cards = document.querySelectorAll('#testQuestions .prob');
  let graded = 0, right = 0;
  cards.forEach(function(c){
    if (c.dataset.score === '1'){ graded++; right++; }
    else if (c.dataset.score === '0'){ graded++; }
  });
  const el = document.getElementById('testScore');
  el.hidden = false;
  if (!graded){
    el.textContent = 'Mark each question once you have checked it.';
    return;
  }
  const pct = Math.round(right / graded * 100);
  el.innerHTML = '<strong>' + right + ' / ' + graded + '</strong> marked correct (' + pct + '%)' +
                 (graded < cards.length ? ' \u00b7 ' + (cards.length - graded) + ' still unmarked' : '') +
                 (graded === cards.length ? '<br>' + weakSpots() : '');
}

function weakSpots(){
  const miss = {};
  document.querySelectorAll('#testQuestions .prob').forEach(function(c){
    if (c.dataset.score === '0'){
      const m = c.dataset.mod;
      miss[m] = (miss[m] || 0) + 1;
    }
  });
  const keys = Object.keys(miss);
  if (!keys.length) return 'Clean sweep \u2014 nothing flagged.';
  keys.sort(function(a, b){ return miss[b] - miss[a]; });
  return 'Weakest areas: ' + keys.map(function(k){
    return 'Module ' + k + ' (' + miss[k] + ')';
  }).join(', ') + '.';
}

/* ==========================================================================
   Tabs
   ========================================================================== */
function showTab(name){
  document.querySelectorAll('.tabpanel').forEach(function(p){
    p.hidden = (p.id !== 'tab-' + name);
  });
  document.querySelectorAll('.tabbtn').forEach(function(b){
    const on = b.dataset.tab === name;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  if (history.replaceState) history.replaceState(null, '', '#' + name);
  window.scrollTo({ top: 0 });
}

/* ==========================================================================
   Boot
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function(){

  renderReview(1);

  document.getElementById('randomizeBtn').addEventListener('click', function(){
    renderReview(Math.floor(Math.random() * 100000) + 2);
  });
  document.getElementById('resetBtn').addEventListener('click', function(){
    renderReview(1);
  });

  const toggleAll = document.getElementById('toggleAll');
  let allOpen = false;
  toggleAll.addEventListener('click', function(){
    allOpen = !allOpen;
    document.querySelectorAll('#tab-review details').forEach(function(d){ d.open = allOpen; });
    toggleAll.textContent = allOpen ? 'Hide all answers' : 'Show all answers';
  });

  document.querySelectorAll('.tabbtn').forEach(function(b){
    b.addEventListener('click', function(){ showTab(b.dataset.tab); });
  });

  document.querySelectorAll('[data-mins]').forEach(function(b){
    b.addEventListener('click', function(){ buildTest(parseInt(b.dataset.mins, 10)); });
  });

  document.getElementById('revealBtn').addEventListener('click', function(){
    stopTimer();
    revealTest();
  });
  document.getElementById('pauseBtn').addEventListener('click', function(){
    if (timerHandle){
      stopTimer();
      this.textContent = 'Resume';
    } else if (secondsLeft > 0){
      startTimer(secondsLeft);
      this.textContent = 'Pause';
    }
  });

  document.getElementById('testQuestions').addEventListener('click', function(e){
    const btn = e.target.closest('.gbtn');
    if (!btn) return;
    const card = btn.closest('.prob');
    card.dataset.score = btn.dataset.v;
    card.querySelectorAll('.gbtn').forEach(function(b){ b.classList.remove('on'); });
    btn.classList.add('on');
    card.classList.toggle('missed', btn.dataset.v === '0');
    card.classList.toggle('got', btn.dataset.v === '1');
    updateScore();
  });

  const themeBtn = document.getElementById('themeBtn');
  function currentTheme(){
    const set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function paintTheme(){
    themeBtn.textContent = currentTheme() === 'dark' ? 'Light' : 'Dark';
  }
  themeBtn.addEventListener('click', function(){
    document.documentElement.setAttribute('data-theme', currentTheme() === 'dark' ? 'light' : 'dark');
    paintTheme();
  });
  paintTheme();

  const hash = (location.hash || '').replace('#', '');
  showTab(['review', 'test', 'equations', 'deck'].indexOf(hash) >= 0 ? hash : 'review');

  typeset(document.body);
  setTimeout(function(){
    document.querySelectorAll('.math').forEach(function(m){ m.classList.add('rendered'); });
  }, 3000);
});
