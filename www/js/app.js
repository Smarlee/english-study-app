const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- 声音 ---------- */
let enVoice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  enVoice = vs.find(v => /en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || vs[0] || null;
}
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = pickVoice;
  pickVoice();
  // Chrome 某些版本需要额外触发一次
  setTimeout(pickVoice, 200);
}
function speak(text) {
  if (!text) return;

  // 1. 优先尝试云端 TTS 接口（彻底解决微信/夸克等 WebView 不支持的问题）
  const url = `https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(text)}`;
  const audio = new Audio(url);

  audio.play().catch(err => {
    console.warn('云端 TTS 播放失败，尝试回退系统语音:', err);
    // 2. 如果网络请求被拦截，降级使用原生 Web Speech API
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.72;
      u.pitch = 1.15;
      if (enVoice) u.voice = enVoice;
      speechSynthesis.speak(u);
    }
  });
}

let actx = null;
function unlockAudio() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
}
function tone(freq, delay, dur, type = 'sine', vol = .22) {
  if (!actx) return;
  const t = actx.currentTime + delay;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + .02);
  g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(actx.destination);
  o.start(t); o.stop(t + dur + .05);
}
const ding = () => { tone(880, 0, .15); tone(1318, .12, .3); };
const buzz = () => { tone(196, 0, .25, 'square', .1); tone(147, .12, .3, 'square', .1); };
const winSound = () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .12, .35));

/* ---------- 页面切换 ---------- */
let currentMode = 'home';
function go(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + name).classList.add('active');
  $('#overlay').classList.remove('show');
  currentMode = name;
  if (name === 'learn') startLearn();
  if (name === 'quiz') startQuiz();
  if (name === 'game') startGame();
  if (name === 'home') stopGame();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (b) { unlockAudio(); go(b.dataset.go); }
});

/* ---------- 首页跑马灯 ---------- */
$('#marqueeInner').innerHTML =
  WORDS.map(w => `<span class="mq-item">${w.emoji} ${w.en}</span>`).join('').repeat(2);

/* ---------- 学一学 ---------- */
let learnIdx = 0;
function startLearn() { learnIdx = 0; showLearn(); }
function showLearn() {
  const w = WORDS[learnIdx];
  $('#learnCounter').textContent = `${learnIdx + 1}/${WORDS.length}`;
  $('#learnProgress').style.width = ((learnIdx + 1) / WORDS.length * 100) + '%';

  const card = $('#learnCard');
  card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');

  const em = $('#learnEmoji');
  em.textContent = w.emoji;
  em.classList.remove('bounce'); void em.offsetWidth; em.classList.add('bounce');

  const wordEl = $('#learnWord');
  wordEl.innerHTML = '';
  [...w.en].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'letter';
    s.style.animationDelay = (.2 + i * .09) + 's';
    s.textContent = ch;
    wordEl.appendChild(s);
  });
  $('#learnPhon').textContent = w.phon;
  $('#learnCn').textContent = w.cn;
  $('#learnNote').textContent = w.note || '';
  speak(w.en);
}
$('#learnPrev').onclick = () => { learnIdx = (learnIdx - 1 + WORDS.length) % WORDS.length; showLearn(); };
$('#learnNext').onclick = () => { learnIdx = (learnIdx + 1) % WORDS.length; showLearn(); };
$('#learnSpeak').onclick = () => speak(WORDS[learnIdx].en);
document.addEventListener('keydown', e => {
  if (currentMode !== 'learn') return;
  if (e.key === 'ArrowLeft') $('#learnPrev').click();
  if (e.key === 'ArrowRight') $('#learnNext').click();
});

/* ---------- 练一练 ---------- */
const QUIZ_TOTAL = 10;
let quizQs = [], quizI = 0, quizScore = 0;

function buildQuiz() {
  return shuffle([...WORDS]).slice(0, QUIZ_TOTAL).map((w, i) => {
    const type = i % 2 === 0 ? 'pic2en' : 'en2pic';
    const others = shuffle(WORDS.filter(x => x !== w)).slice(0, 3);
    return { w, type, options: shuffle([w, ...others]) };
  });
}
function startQuiz() {
  quizQs = buildQuiz(); quizI = 0; quizScore = 0;
  showQuestion();
}
function updateQuizHud() {
  $('#quizScore').textContent = `⭐ ${quizScore}`;
  $('#quizProgress').style.width = (quizI / quizQs.length * 100) + '%';
}
function showQuestion() {
  const q = quizQs[quizI];
  const box = $('#quizBox');
  box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');

  const qEl = $('#quizQ');
  if (q.type === 'pic2en') {
    qEl.innerHTML = `<div class="q-emoji">${q.w.emoji}</div><div class="q-cn">${q.w.cn}</div><div class="q-ask">哪个单词是它？</div>`;
  } else {
    qEl.innerHTML = `<div class="q-word">${q.w.en}</div><div class="q-phon">${q.w.phon}</div><div class="q-ask">听一听、读一读，选出正确的图片</div>`;
    speak(q.w.en);
  }

  const opts = $('#quizOptions');
  opts.innerHTML = '';
  q.options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'opt ' + (q.type === 'pic2en' ? 'opt-word' : 'opt-emoji');
    b.textContent = q.type === 'pic2en' ? o.en : o.emoji;
    b.dataset.word = o.en;
    b.onclick = () => answer(b, o, q);
    opts.appendChild(b);
  });
  $('#quizFeedback').textContent = '';
  $('#quizFeedback').className = 'quiz-feedback';
  updateQuizHud();
}
function answer(btn, o, q) {
  if (btn.classList.contains('done')) return;
  const opts = $$('#quizOptions .opt');
  opts.forEach(b => b.classList.add('done'));
  const fb = $('#quizFeedback');
  if (o === q.w) {
    btn.classList.add('correct');
    quizScore++;
    const r = btn.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height / 2);
    ding(); speak(q.w.en);
    fb.textContent = `答对啦！${q.w.en} = ${q.w.cn} ${q.w.emoji}`;
    fb.classList.add('good');
  } else {
    btn.classList.add('wrong');
    opts.find(b => b.dataset.word === q.w.en).classList.add('correct');
    buzz();
    fb.textContent = `别灰心，正确答案是 ${q.w.en} ${q.w.emoji}`;
    fb.classList.add('bad');
  }
  updateQuizHud();
  setTimeout(() => {
    quizI++;
    if (quizI < quizQs.length) showQuestion();
    else showResult(quizScore, quizQs.length, 'quiz');
  }, 1500);
}

/* ---------- 玩一玩 ---------- */
const ROUNDS = 8;
const gc = $('#gameCanvas');
const gctx = gc.getContext('2d');
let sprites = [], target = null, round = 0, gameScore = 0, locked = false, gameRAF = 0, lastT = 0;

function sizeGameCanvas() {
  const r = gc.getBoundingClientRect();
  if (r.width < 10) return;
  const dpr = window.devicePixelRatio || 1;
  gc.width = r.width * dpr; gc.height = r.height * dpr;
  gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', () => { if (currentMode === 'game') sizeGameCanvas(); });

function startGame() {
  stopGame();
  gameScore = 0; round = 0;
  sizeGameCanvas();
  nextRound();
  lastT = performance.now();
  gameRAF = requestAnimationFrame(gameLoop);
}
function stopGame() { if (gameRAF) cancelAnimationFrame(gameRAF); gameRAF = 0; }

function nextRound() {
  round++;
  if (round > ROUNDS) { stopGame(); showResult(gameScore, ROUNDS, 'game'); return; }
  $('#gameRound').textContent = `${round}/${ROUNDS}`;
  $('#gameScore').textContent = `⭐ ${gameScore} / ${ROUNDS}`;
  target = WORDS[Math.floor(Math.random() * WORDS.length)];
  const others = shuffle(WORDS.filter(w => w !== target)).slice(0, 5);
  const w = gc.clientWidth, h = gc.clientHeight;
  sprites = shuffle([target, ...others]).map(word => ({
    word,
    x: 60 + Math.random() * Math.max(60, w - 120),
    y: 60 + Math.random() * Math.max(60, h - 120),
    vx: (Math.random() < .5 ? -1 : 1) * (60 + Math.random() * 80),
    vy: (Math.random() < .5 ? -1 : 1) * (60 + Math.random() * 80),
    size: 54 + Math.random() * 18,
    phase: Math.random() * 6.28, pop: 0, shake: 0
  }));
  $('#gameTargetWord').textContent = target.en;
  locked = false;
  speak(target.en);
}
$('#gameTargetSpeak').onclick = () => speak(target.en);

function gameLoop(t) {
  const dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
  const w = gc.clientWidth, h = gc.clientHeight;
  gctx.clearRect(0, 0, w, h);
  for (const s of sprites) {
    if (!locked) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      const pad = s.size * .6;
      if (s.x < pad) { s.x = pad; s.vx *= -1; }
      if (s.x > w - pad) { s.x = w - pad; s.vx *= -1; }
      if (s.y < pad) { s.y = pad; s.vy *= -1; }
      if (s.y > h - pad) { s.y = h - pad; s.vy *= -1; }
    }
    s.pop = Math.max(0, s.pop - dt * 1.6);
    s.shake = Math.max(0, s.shake - dt * 2);
    const bob = Math.sin(t / 300 + s.phase) * 4;
    const rot = Math.sin(t / 500 + s.phase) * .12 + (s.shake > 0 ? Math.sin(t / 25) * .25 * s.shake : 0);
    const scale = 1 + s.pop * .7;
    gctx.save();
    gctx.translate(s.x, s.y + bob);
    gctx.rotate(rot);
    gctx.scale(scale, scale);
    gctx.font = s.size + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif';
    gctx.textAlign = 'center'; gctx.textBaseline = 'middle';
    gctx.fillText(s.word.emoji, 0, 0);
    gctx.restore();
  }
  gameRAF = requestAnimationFrame(gameLoop);
}

gc.addEventListener('pointerdown', e => {
  if (locked || !target) return;
  const r = gc.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  const hit = sprites.find(s => Math.hypot(s.x - x, s.y - y) < s.size * .62);
  if (!hit) return;
  if (hit.word === target) {
    locked = true;
    gameScore++;
    hit.pop = 1;
    FX.burst(e.clientX, e.clientY);
    ding(); speak(target.en);
    $('#gameScore').textContent = `⭐ ${gameScore} / ${ROUNDS}`;
    setTimeout(nextRound, 950);
  } else {
    hit.shake = 1;
    buzz();
  }
});

/* ---------- 结算 ---------- */
let lastMode = 'quiz';
function showResult(score, total, mode) {
  lastMode = mode;
  const ratio = score / total;
  const stars = ratio >= .99 ? 3 : ratio >= .7 ? 2 : ratio >= .4 ? 1 : 0;
  $('#resultStars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  $('#resultEmoji').textContent = ['🌱', '💪', '🎉', '🏆'][stars];
  $('#resultTitle').textContent = ['继续加油！', '不错哦！', '太棒了！', '完美！'][stars];
  $('#resultText').textContent = `答对 ${score} / ${total} 题`;
  $('#overlay').classList.add('show');
  if (stars === 3) { FX.rain(); winSound(); }
  else if (stars > 0) ding();
}
$('#resultRetry').onclick = () => { unlockAudio(); go(lastMode); };
$('#resultHome').onclick = () => go('home');
