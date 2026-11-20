/* L1LC01 Weather Station (story mode): the learner picks ONE of three everyday situations. Six different tasks feed one final decision.
   Picnic Day (a1-a6), Out Today from today's date (b1-b6), Sports Day (c1-c6). Only the chosen mission's scenes and scored items are used. */
'use strict';
(function () {
var K = window.DP, Kit = window.Kit, $ = K.$, $$ = K.$$, esc = K.esc;
var SEASONS = { monsoon: { n: 'Monsoon', lo: 21, hi: 29 }, spring: { n: 'Cool season', lo: 19, hi: 27 }, summer: { n: 'Summer', lo: 28, hi: 37 } };
var SKIES = { sunny: 'Sunny', partly: 'Partly cloudy', cloudy: 'Cloudy', rainy: 'Rainy', windy: 'Windy' };
var FEEL = { sunny: 'Happy and full of energy', partly: 'Cheerful, just right for tag', cloudy: 'Calm and a bit sleepy', rainy: 'Cosy, so I read a book', windy: 'Adventurous, so I flew a kite' };
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var THEMES = [{ id: 'sun', n: 'Sunny', ink: '#24405F', acc: '#E4572E', hi: '#F2B705', paper: '#FFFBEA' }, { id: 'sky', n: 'Sky', ink: '#1B4F8A', acc: '#2E8BC0', hi: '#7BD88F', paper: '#F2FAFF' }, { id: 'leaf', n: 'Leaf', ink: '#1F5A3A', acc: '#3BAA6A', hi: '#F2B705', paper: '#F4FFF6' }];
var CLOTHES = { rain: 'Raincoat', hat: 'Sun hat', wind: 'Windcheater', jacket: 'Light jacket', tee: 'T-shirt' };
var CLOTHES_WHY = { rain: 'for rain', hat: 'very hot', wind: 'windy', jacket: 'cool', tee: 'mild' };
var PLANS = { indoor: 'Indoor games', kite: 'Fly a kite', swim: 'Go swimming', park: 'Play in the park' };
var PLANS_WHY = { indoor: 'rain', kite: 'windy', swim: 'very hot', park: 'dry and mild' };

/* ---------- data (seeded, so a learner sees the same numbers when reopening) ---------- */
function isGood(t, sky) { return (sky === 'sunny' || sky === 'partly' || sky === 'cloudy') && t < 33; } // dry, calm and under 33 C
function pool(season) { var S = SEASONS[season], p = [], t; for (t = S.lo; t <= S.hi; t++) p.push(t); return p; }
function fourDays(seed, season) { // used by the picnic and sports-day missions: 4 distinct temperatures and 4 distinct skies, at least one good day
  var r = Kit.rng(seed + '|' + season), p = pool(season), w = Kit.shuffle(p, r).slice(0, 4), sky = Kit.shuffle(Object.keys(SKIES), r).slice(0, 4), i;
  if (!w.some(function (t, k) { return isGood(t, sky[k]); })) { var gi = 0; for (i = 0; i < 4; i++) if (sky[i] === 'sunny' || sky[i] === 'partly' || sky[i] === 'cloudy') { gi = i; break; } w[gi] = p.filter(function (t) { return t < 33 && w.indexOf(t) < 0; })[0]; }
  var good = w.map(function (t, k) { return isGood(t, sky[k]); }), best = -1, hot = 0;
  w.forEach(function (t, k) { if (good[k] && (best < 0 || t < w[best])) best = k; if (t > w[hot]) hot = k; });
  return { season: season, w: w, sky: sky, good: good, best: best, hot: hot, order: w.map(function (t, k) { return k; }).sort(function (p, q) { return w[p] - w[q]; }), range: Math.max.apply(null, w) - Math.min.apply(null, w), rainyCloudy: sky.filter(function (k) { return k === 'rainy' || k === 'cloudy'; }).length };
}
function seasonOfMonth(m) { return m >= 2 && m <= 4 ? 'summer' : m >= 5 && m <= 8 ? 'monsoon' : 'spring'; } // Mar-May summer, Jun-Sep monsoon, Oct-Feb cool season
function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function todayData(seed, iso) { // mission 2: built from the real date
  var d = new Date(iso + 'T12:00:00'), season = seasonOfMonth(d.getMonth()), r = Kit.rng(seed + '|B|' + iso), a = Kit.shuffle(pool(season), r).slice(0, 4).sort(function (x, y) { return x - y; }), w = [a[1], a[3], a[2], a[0]];
  var sky = Kit.shuffle(Object.keys(SKIES), r).slice(0, 3), nt = w[1], ns = sky[1];
  var wear = ns === 'rainy' ? 'rain' : nt >= 33 ? 'hat' : ns === 'windy' ? 'wind' : nt <= 22 ? 'jacket' : 'tee', plan = ns === 'rainy' ? 'indoor' : ns === 'windy' ? 'kite' : nt >= 33 ? 'swim' : 'park';
  return { season: season, dateText: d.getDate() + ' ' + MONTHS[d.getMonth()], w: w, sky: sky, noonT: nt, noonSky: ns, wear: wear, plan: plan, bestTime: w.indexOf(Math.min.apply(null, w)), range: w[1] - Math.min.apply(null, w) };
}
function makeAll(Sx) {
  if (!Sx.x.today) Sx.x.today = ymd(new Date());
  var sA = Sx.x.season || 'summer', sC = ['summer', 'monsoon', 'spring'].filter(function (k) { return k !== sA; })[Kit.rng(Sx.seed + '|C')() < 0.5 ? 0 : 1];
  return { season: sA, A: fourDays(Sx.seed + '|A', sA), B: todayData(Sx.seed, Sx.x.today), C: fourDays(Sx.seed + '|C', sC) };
}
window.WeatherTest = function (n) { var bad = 0; for (var i = 0; i < n; i++) Object.keys(SEASONS).forEach(function (s) { var D = fourDays('s' + i, s), u = {}; D.w.forEach(function (x) { u[x] = 1; }); if (Object.keys(u).length !== 4 || D.best < 0 || !D.good[D.best] || new Set(D.sky).size !== 4 || D.rainyCloudy < 1) bad++;
  var B = todayData('s' + i, '2026-0' + (1 + i % 9) + '-15'); if (new Set(B.w).size !== 4 || new Set(B.sky).size !== 3 || !B.wear || !B.plan) bad++; }); return bad; };

/* ---------- pictures ---------- */
function guideSvg() { return '<img src="assets/img/sunny.webp" alt="">'; } // the guide (Sunny): image made with agy, transparent
function skySvg(t) { return '<img class="skyimg" src="assets/img/sky-' + t + '.webp" alt="">'; } // sky scenes made with agy
function thermo(t, label) {
  var H = 200, y0 = 14, Y = function (v) { return y0 + (40 - v) / 30 * H; }, s = '<svg viewBox="0 -6 170 276" role="img" aria-label="' + label + ' thermometer"><rect x="82" y="6" width="28" height="232" rx="14" fill="#fff" stroke="#24405F" stroke-width="4"/>';
  for (var v = 10; v <= 40; v++) { var len = v % 10 === 0 ? 22 : v % 5 === 0 ? 15 : 8; s += '<line x1="78" x2="' + (78 - len) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#24405F" stroke-width="' + (v % 5 ? 2 : 3) + '"/>'; if (v % 10 === 0) s += '<text x="52" y="' + (Y(v) + 9) + '" font-size="28" font-weight="700" fill="#24405F" text-anchor="end">' + v + '</text>'; }
  return s + '<rect x="90" y="' + Y(t) + '" width="12" height="' + (240 - Y(t)) + '" fill="#E5484D"/><circle cx="96" cy="246" r="20" fill="#E5484D" stroke="#24405F" stroke-width="4"/></svg>';
}
function S() { return K.S(); }

/* ---------- task builders ---------- */
function readScene(id, p, labels, guide) { // read thermometers (numeric)
  return Kit.num({ id: id, name: 'Read thermometers', fcls: 'g4', guide: function () { return guide; }, reveal: function (D) { return 'The red line ends at ' + D[p].w.join(', ') + ' °C.'; }, hint: function () { return 'Find the number the red line reaches. Each small mark is 1°C.'; }, bad1: function () { return 'Look where the red line stops. Each small mark is 1°C. '; },
    top: function (D) { return '<div class="thg">' + D[p].w.map(function (t, i) { return '<div>' + thermo(t, labels[i]) + '</div>'; }).join('') + '</div>'; },
    fields: function (D) { return D[p].w.map(function (t, i) { return { lbl: labels[i], ans: t, unit: '°C' }; }); } });
}
function skyScene(id, p, labels, guide) { // name each sky (drag a word onto each window)
  function list(D) { return D[p].sky.slice(0, labels.length); }
  return Kit.slots({ id: id, name: 'Label the sky', cls: 'stack sky', cols: labels.length, guide: function () { return guide; }, reveal: 'Each window now has its matching word.',
    chips: function (D) { var sl = list(D); return Object.keys(SKIES).map(function (k) { var i = sl.indexOf(k); return { id: k, html: SKIES[k], slot: i >= 0 ? 'd' + i : null }; }); },
    slots: function (D) { return list(D).map(function (k, i) { return { id: 'd' + i, label: skySvg(k) + '<b>' + labels[i] + '</b>', aria: labels[i] + ' window' }; }); },
    bad1: function (D, n) { return n + ' windows have the wrong word. '; }, hint: function () { return 'Rain drops mean rainy. A sun means sunny. Swirls mean windy. '; } });
}
function choiceScene(id, name, slotLabel, guide, chips, hint) { // pick the one right answer and drop it in the slot
  return Kit.slots({ id: id, name: name, cls: 'choice', cols: 1, guide: guide, reveal: 'The right choice is in place.', chips: chips, slots: function () { return [{ id: 'pick', label: slotLabel }]; },
    bad1: function () { return 'Not that one. Look at the weather again. '; }, hint: function () { return hint; } });
}
function chartScene(id, p, labels, guide, logTitle) { // drag each dot to its temperature
  return { id: id, step: 1, name: 'Plot the chart', items: [id], cue: function () { return K.done(id) ? { tap: '#b-main' } : { drag: { from: '.dot', to: '.chart svg' } }; }, render: function (el) {
    var D = K.D(), W_ = D[p].w, N = W_.length, x = S().x, key = 'cv_' + id, v = x[key] = x[key] || W_.map(function () { return null; }), lo = Math.floor(Math.min.apply(null, W_) / 2) * 2 - 2, hi = Math.ceil(Math.max.apply(null, W_) / 2) * 2 + 2, W = 1000, H = 480, L = 90, B = 50, fin = K.done(id);
    function Y(t) { return 20 + (hi - t) / (hi - lo) * (H - 20 - B); } function T(y) { return Math.round(hi - (y - 20) / (H - 20 - B) * (hi - lo)); } function X(i) { return L + 90 + i * 215; }
    el.innerHTML = '<div class="toprow">' + K.guide(guide) + '<div class="fb" id="fb" hidden></div></div><div class="board" style="height:610px"><div class="paper chartbox" style="flex:1"><div class="chart" id="chart"></div></div><div class="paper logbox"><div class="eyebrow">' + logTitle + '</div><table><tr><th>' + labels.head + '</th><th>°C</th></tr>' + W_.map(function (t, i) { return '<tr><td>' + labels.items[i] + '</td><td class="mono">' + t + '</td></tr>'; }).join('') + '</table></div></div>';
    function paint() { var s = '<svg viewBox="0 0 ' + W + ' ' + H + '"><rect x="' + L + '" y="20" width="' + (W - L - 10) + '" height="' + (H - 20 - B) + '" fill="#F4FBFF" stroke="#24405F" stroke-width="3"/>';
      for (var t = lo; t <= hi; t += 2) s += '<line x1="' + L + '" x2="' + (W - 10) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="#BFE3F7" stroke-width="2"/><text x="' + (L - 10) + '" y="' + (Y(t) + 10) + '" font-size="28" text-anchor="end" fill="#24405F">' + t + '</text>';
      for (var i = 0; i < N; i++) { s += '<text x="' + X(i) + '" y="' + (H - 12) + '" font-size="26" text-anchor="middle" fill="#24405F">' + labels.items[i] + '</text>'; if (v[i] != null) s += '<line x1="' + X(i) + '" x2="' + X(i) + '" y1="' + Y(v[i]) + '" y2="' + (H - B) + '" stroke="#3A9BDC" stroke-width="10" opacity=".35"/>'; }
      for (i = 0; i < N; i++) { var y = v[i] == null ? H - B - 30 : Y(v[i]); s += '<g class="dot" tabindex="0" data-i="' + i + '" role="slider" aria-label="' + labels.items[i] + ' temperature" aria-valuenow="' + (v[i] == null ? '' : v[i]) + '"><circle cx="' + X(i) + '" cy="' + y + '" r="66" fill="transparent"/><circle class="d" cx="' + X(i) + '" cy="' + y + '" r="30" fill="' + (v[i] == null ? '#fff' : fin ? '#0B7A4B' : '#E4572E') + '" stroke="#24405F" stroke-width="5"' + (v[i] == null ? ' stroke-dasharray="8 6"' : '') + '/><text x="' + X(i) + '" y="' + (y + 10) + '" font-size="28" font-weight="700" text-anchor="middle" fill="' + (v[i] == null ? '#24405F' : '#fff') + '">' + (v[i] == null ? '?' : v[i]) + '</text></g>'; }
      $('#chart').innerHTML = s + '</svg>'; var n = v.filter(function (a) { return a != null; }).length; if (!K.done(id)) K.setFoot({ main: 'Check', en: n === N, item: id, go: check }); }
    var drag = null, svg = function () { return $('#chart svg'); };
    function yOf(e) { var r = svg().getBoundingClientRect(), k = r.width / W; return (e.clientY - r.top) / k; }
    el.addEventListener('pointerdown', function (e) { var d = e.target.closest('.dot'); if (d && !K.done(id)) { drag = +d.dataset.i; e.preventDefault(); } });
    K.winOn('pointermove', function (e) { if (drag == null) return; v[drag] = Math.max(lo, Math.min(hi, T(yOf(e)))); paint(); });
    K.winOn('pointerup', function () { if (drag != null) { drag = null; K.save(); K.SFX.tap(); } });
    el.addEventListener('click', function (e) { if (K.done(id) || e.target.closest('.dot')) return; var r = svg().getBoundingClientRect(), k = r.width / W, px = (e.clientX - r.left) / k, i = Math.round((px - L - 90) / 215); if (i >= 0 && i < N && e.target.closest('#chart')) { v[i] = Math.max(lo, Math.min(hi, T(yOf(e)))); K.save(); K.SFX.tap(); paint(); } }); // tap a column to place its dot
    el.addEventListener('keydown', function (e) { var d = e.target.closest('.dot'); if (!d || K.done(id)) return; var i = +d.dataset.i, dv = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0; if (dv) { e.preventDefault(); v[i] = Math.max(lo, Math.min(hi, (v[i] == null ? Math.round((lo + hi) / 2) : v[i]) + dv)); K.save(); paint(); var nd = $('.dot[data-i="' + i + '"]'); if (nd) nd.focus(); } });
    function check() { var r = v.map(function (a, i) { return a != null && Math.abs(a - W_[i]) <= 1; }), ok = r.every(Boolean), s = K.attempt(id, ok, v.join(',')); if (ok) { K.SFX.ok(); K.fb('ok', 'Correct.', ''); fin = true; paint(); K.setFoot({ main: 'Next', en: true, go: function () { K.next(); } }); return; } K.SFX.bad();
      if (s.rev) { W_.forEach(function (t, i) { v[i] = t; }); fin = true; K.save(); paint(); K.fb('rev', 'Answer shown.', ''); K.setFoot({ main: 'Next', en: true, go: function () { K.next(); } }); return; }
      K.fb(s.a === 1 ? 'no' : 'hint', s.a === 1 ? 'Not yet.' : 'Hint.', (s.a === 1 ? 'Some dots are not at the right height. ' : 'Match each dot to the number in the log. ') + K.lostHtml(id)); r.forEach(function (g, i) { if (!g) v[i] = null; }); K.save(); paint(); }
    K.solve = function () { W_.forEach(function (t, i) { v[i] = t; }); paint(); };
    if (fin) { W_.forEach(function (t, i) { v[i] = t; }); paint(); K.setFoot({ main: 'Next', en: true, go: function () { K.next(); } }); } else paint();
  } };
}
function table(title, labels, vals) { return '<table class="data"><tr><th>' + title + '</th><th>°C</th></tr>' + vals.map(function (t, i) { return '<tr><td>' + labels[i] + '</td><td class="mono">' + t + '</td></tr>'; }).join('') + '</table>'; }
function dayCard(d, i, tag, cls) { return '<div class="dcard ' + (cls || '') + '">' + skySvg(d.sky[i]) + '<b>Day ' + (i + 1) + '</b><span>' + d.w[i] + '°C · ' + SKIES[d.sky[i]] + '</span><em>' + tag + '</em></div>'; }
function solveScene(id, build) { // unscored: the decision that the five tasks above made possible
  return { id: id, step: 1, name: 'Solve it', cue: function () { return { tap: '#b-main' }; }, render: function (el) { el.innerHTML = '<div class="solve"><div class="paper">' + build(K.D()) + '</div></div>'; K.setFoot({ main: 'Next', en: true, go: function () { K.next(); } }); } };
}
var DAYS = ['Day 1', 'Day 2', 'Day 3', 'Day 4'], TIMES = ['Morning', 'Noon', 'Afternoon', 'Evening'];

/* ---------- the scenes ---------- */
var scenes = [];
// MISSION 1: Picnic Day
scenes.push(Kit.cards({ id: 'season', name: 'Pick a season', key: 'season', title: INSTR.season[0], reset: ['a_a2', 'a_a5', 'cv_a3'], opts: Object.keys(SEASONS).map(function (k) { return { id: k, t: SEASONS[k].n, sub: k === 'monsoon' ? 'Rain and clouds' : k === 'spring' ? 'Fresh and breezy' : 'Hot and bright', html: skySvg(k === 'monsoon' ? 'rainy' : k === 'spring' ? 'windy' : 'sunny') }; }) }));
scenes.push(readScene('a1', 'A', DAYS, INSTR.a1));
scenes.push(skyScene('a2', 'A', DAYS, INSTR.a2));
scenes.push(chartScene('a3', 'A', { head: 'Day', items: DAYS }, INSTR.a3, 'Picnic week log'));
scenes.push(Kit.num({ id: 'a4', name: 'Compare days', guide: function () { return INSTR.a4; }, reveal: function (D) { return Math.max.apply(null, D.A.w) + ' − ' + Math.min.apply(null, D.A.w) + ' = ' + D.A.range; }, hint: function () { return 'Find the biggest and the smallest number. Take the small from the big. '; }, bad1: function () { return 'Pick the highest and lowest numbers in the log. '; },
  top: function (D) { return table('Picnic week', DAYS, D.A.w); }, fields: function (D) { return [{ lbl: 'Difference', ans: D.A.range, unit: '°C' }]; } }));
scenes.push(Kit.slots({ id: 'a5', name: 'Picnic or stay home', cls: 'bins', cols: 2, guide: function () { return INSTR.a5; }, reveal: 'Each day is in its right place.',
  chips: function (D) { var d = D.A; return d.w.map(function (t, i) { return { id: 'd' + i, html: 'Day ' + (i + 1) + ' · ' + t + '°C · ' + SKIES[d.sky[i]], slot: d.good[i] ? 'yes' : 'no' }; }); },
  slots: function () { return [{ id: 'yes', label: 'Picnic day', cap: 4 }, { id: 'no', label: 'Stay home', cap: 4 }]; }, ready: function (asg) { return Object.keys(asg).length === 4; },
  bad1: function (D, n) { return n + ' days are in the wrong place. '; }, hint: function () { return 'Rain or wind means stay home. So does 33°C or more. '; } }));
scenes.push(Kit.slots({ id: 'a6', name: 'Write the notice', cls: 'journal', guide: function () { return INSTR.a6; }, reveal: 'The notice is filled in.',
  chips: function (D) { var d = D.A, b = d.best, bring = d.sky[b] === 'cloudy' ? 'Umbrella' : 'Sun hat', oth = ['Sun hat', 'Umbrella', 'Raincoat'].filter(function (x) { return x !== bring; }), days = [0, 1, 2, 3].filter(function (i) { return i !== b; }), sk = Object.keys(SKIES).filter(function (k) { return k !== d.sky[b]; });
    return [{ id: 'dy', html: 'Day ' + (b + 1), slot: 'day' }, { id: 'wx', html: SKIES[d.sky[b]], slot: 'wx' }, { id: 'br', html: bring, slot: 'br' }, { id: 'x1', html: 'Day ' + (days[0] + 1), slot: null }, { id: 'x2', html: 'Day ' + (days[1] + 1), slot: null }, { id: 'x3', html: SKIES[sk[0]], slot: null }, { id: 'x4', html: SKIES[sk[1]], slot: null }, { id: 'x5', html: oth[0], slot: null }, { id: 'x6', html: oth[1], slot: null }].sort(function (p, q) { return p.html < q.html ? -1 : 1; }); },
  slots: function () { return [{ id: 'day', label: 'Picnic day' }, { id: 'wx', label: 'Weather' }, { id: 'br', label: 'Bring' }]; }, cols: 1, bad1: function (D, n) { return n + ' notes are in the wrong place. '; }, hint: function () { return 'Best day: dry, calm and the coolest. Bring a hat for sun, an umbrella for clouds. '; } }));
scenes.push(solveScene('aS', function (D) { var d = D.A; return '<div class="eyebrow">' + INSTR.aS[0] + '</div><h2>Picnic on Day ' + (d.best + 1) + '!</h2><p class="why">The driest, calmest day, and the coolest of the good ones.</p><div class="days">' + d.w.map(function (t, i) { return dayCard(d, i, i === d.best ? 'Picnic day!' : d.good[i] ? 'Good too' : 'Stay home', i === d.best ? 'best' : d.good[i] ? '' : 'no'); }).join('') + '</div>'; }));
// MISSION 2: Out Today (built from the real date)
scenes.push(choiceScene('b1', 'Season from the date', 'Today is in the…', function (D) { return ['Today is <b>' + D.B.dateText + '</b>.', 'Mar–May: Summer · Jun–Sep: Monsoon · Oct–Feb: Cool']; },
  function (D) { return Object.keys(SEASONS).map(function (k) { return { id: k, html: SEASONS[k].n, slot: k === D.B.season ? 'pick' : null }; }); }, 'Look at the month. March to May is Summer, June to September is Monsoon, the rest is the Cool season.'));
scenes.push(readScene('b2', 'B', TIMES, INSTR.b2));
scenes.push(skyScene('b3', 'B', ['Morning', 'Noon', 'Evening'], INSTR.b3));
scenes.push(choiceScene('b4', 'Best time to go out', 'The coolest time is…', function () { return INSTR.b4; },
  function (D) { return D.B.w.map(function (t, i) { return { id: 't' + i, html: TIMES[i] + ' · ' + t + '°C', slot: i === D.B.bestTime ? 'pick' : null }; }); }, 'Look for the smallest number.'));
scenes.push(choiceScene('b5', 'What to wear', 'Today I wear…', function (D) { return ['Noon: <b>' + D.B.noonT + '°C</b> and <b>' + SKIES[D.B.noonSky] + '</b>', 'What should we wear?']; },
  function (D) { return Object.keys(CLOTHES).map(function (k) { return { id: k, html: CLOTHES[k], slot: k === D.B.wear ? 'pick' : null }; }); }, 'Match the noon weather: rain, very hot (33°C or more), windy, cool (22°C or less) or mild.'));
scenes.push(choiceScene('b6', 'What to do', 'Today we…', function (D) { return ['Noon: <b>' + D.B.noonT + '°C</b> and <b>' + SKIES[D.B.noonSky] + '</b>', 'What should we do?']; },
  function (D) { return Object.keys(PLANS).map(function (k) { return { id: k, html: PLANS[k], slot: k === D.B.plan ? 'pick' : null }; }); }, 'Rain means indoors. Wind is for kites. 33°C or more is for swimming. Otherwise the park.'));
scenes.push(solveScene('bS', function (D) { var b = D.B; return '<div class="eyebrow">' + INSTR.bS[0] + '</div><h2>Today’s plan</h2><div class="plan"><div class="pic">' + skySvg(b.noonSky) + '<span>' + b.dateText + ' · Noon ' + b.noonT + '°C · ' + SKIES[b.noonSky] + '</span></div><div class="prows"><div class="prow"><small>Best time</small><b>' + TIMES[b.bestTime] + '</b></div><div class="prow"><small>Wear</small><b>' + CLOTHES[b.wear] + '</b></div><div class="prow"><small>Do</small><b>' + PLANS[b.plan] + '</b></div></div></div>'; }));
// MISSION 3: Sports Day
scenes.push(Kit.slots({ id: 'c1', name: 'Write the journal', cls: 'journal', guide: function (D) { return ['Forecast log: <b>Day 1</b>', '<b>' + D.C.w[0] + '°C</b> and <b>' + SKIES[D.C.sky[0]] + '</b>', 'Fill the journal page.']; }, reveal: 'The page is filled in.',
  chips: function (D) { var c = D.C, sk = Object.keys(SKIES).filter(function (k) { return k !== c.sky[0]; }); return [{ id: 'tmp', html: c.w[0] + '°C', slot: 'tmp' }, { id: 'skyc', html: SKIES[c.sky[0]], slot: 'sky' }, { id: 'fl', html: FEEL[c.sky[0]], slot: 'fl' }, { id: 'xt', html: c.w[1] + '°C', slot: null }, { id: 'xs', html: SKIES[sk[0]], slot: null }, { id: 'xf', html: FEEL[sk[1]], slot: null }].sort(function (a, b) { return a.id < b.id ? -1 : 1; }); },
  slots: function () { return [{ id: 'tmp', label: 'Temperature' }, { id: 'sky', label: 'Sky conditions' }, { id: 'fl', label: 'How the team felt' }]; }, cols: 1, bad1: function (D, n) { return n + ' notes are in the wrong place. '; }, hint: function () { return 'Copy the log, then pick the feeling that suits the weather. '; } }));
scenes.push(chartScene('c2', 'C', { head: 'Day', items: DAYS }, INSTR.c2, 'Forecast log'));
scenes.push(Kit.num({ id: 'c3', name: 'Count the days', guide: function () { return INSTR.c3; }, reveal: function (D) { return D.C.rainyCloudy + ' of the 4 days are rainy or cloudy.'; }, hint: function () { return 'Look at each picture. Count the rain clouds and the grey clouds. '; }, bad1: function () { return 'Check each day’s picture. '; },
  top: function (D) { return '<div class="thg" style="grid-template-columns:repeat(4,1fr);gap:16px">' + D.C.sky.map(function (k, i) { return '<div>' + skySvg(k) + '<b>Day ' + (i + 1) + '</b></div>'; }).join('') + '</div>'; }, fields: function (D) { return [{ lbl: 'Rainy or cloudy days', ans: D.C.rainyCloudy, unit: 'days' }]; } }));
scenes.push(Kit.num({ id: 'c4', name: 'Hottest day', guide: function () { return INSTR.c4; }, reveal: function (D) { return 'Day ' + (D.C.hot + 1) + ' is hottest, ' + D.C.range + '°C above the coldest.'; }, hint: function () { return 'Find the biggest number: that is the hottest day. Then take the smallest from it. '; }, bad1: function () { return 'Pick the highest and lowest numbers in the log. '; },
  top: function (D) { return table('Forecast', DAYS, D.C.w); }, fields: function (D) { return [{ lbl: 'Hottest day (1 to 4)', ans: D.C.hot + 1, unit: '' }, { lbl: 'Hotter by', ans: D.C.range, unit: '°C' }]; } }));
scenes.push(Kit.slots({ id: 'c5', name: 'Order the days', cls: 'stack', cols: 4, guide: function () { return INSTR.c5; }, reveal: 'The days are in order.',
  chips: function (D) { var c = D.C; return c.w.map(function (t, i) { return { id: 'd' + i, html: 'Day ' + (i + 1) + ' · ' + t + '°C', slot: 'r' + c.order.indexOf(i) }; }); },
  slots: function () { return ['Coolest', '2nd', '3rd', 'Hottest'].map(function (l, i) { return { id: 'r' + i, label: '<b>' + l + '</b>' }; }); },
  bad1: function (D, n) { return n + ' days are in the wrong place. '; }, hint: function () { return 'Smallest number first, biggest number last. '; } }));
scenes.push(choiceScene('c6', 'Pick Sports Day', 'Sports Day is on…', function () { return INSTR.c6; },
  function (D) { var c = D.C; return c.w.map(function (t, i) { return { id: 'd' + i, html: 'Day ' + (i + 1) + ' · ' + t + '°C · ' + SKIES[c.sky[i]], slot: i === c.best ? 'pick' : null }; }); }, 'Cross out rainy and windy days and anything 33°C or more. Of the days left, take the coolest.'));
scenes.push(solveScene('cS', function (D) { var d = D.C; return '<div class="eyebrow">' + INSTR.cS[0] + '</div><h2>Sports Day: Day ' + (d.best + 1) + '!</h2><p class="why">' + (d.sky[d.best] === 'cloudy' ? 'Dry and cool enough to play outdoors.' : 'Sunshine and a comfortable ' + d.w[d.best] + '°C: outdoors it is!') + '</p><div class="days">' + d.w.map(function (t, i) { return dayCard(d, i, i === d.best ? 'Sports Day!' : d.good[i] ? 'Good too' : 'Indoors', i === d.best ? 'best' : d.good[i] ? '' : 'no'); }).join('') + '</div>'; }));
scenes.push(Kit.personal({ instr: INSTR.personalise, themes: THEMES, label: 'My weather report', findings: function (Sx, D) { return 'I solved "' + MISSIONS[Sx.x.mission || 'a'].name + '". ' + solution(Sx, D) + '. I used real weather facts to decide.'; } }));

// which mission and task each scene belongs to (drives the header and the guide's "Mission 1 of 3 · Task 2 of 5")
[{ n: 1, name: 'Picnic Day', setup: true, ids: ['season', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'aS'] }, { n: 2, name: 'Out Today', ids: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'bS'] }, { n: 3, name: 'Sports Day', ids: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'cS'] }].forEach(function (m) {
  m.ids.forEach(function (id, k) { var sc = scenes.filter(function (x) { return x.id === id; })[0]; sc.mission = 'abc'.charAt(m.n - 1); sc.mis = { n: m.n, name: m.name, task: m.setup ? k : k + 1, tasks: 6, solve: k === m.ids.length - 1 }; }); });

/* ---------- the three situations (what am I deciding? why? what will I learn?) ---------- */
var MISSIONS = {
  a: { name: 'Picnic Day', pic: 'sunny', problem: 'Which day is best for the picnic?', learn: ['Read thermometers', 'Plot a chart', 'Decide'], role: 'Picnic Planner' },
  b: { name: 'Out Today', pic: 'partly', problem: 'What should I wear and do today?', learn: ['Use a date', 'Observe the sky', 'Decide'], role: 'Day Planner' },
  c: { name: 'Sports Day', pic: 'windy', problem: 'Which day should we hold the races?', learn: ['Record', 'Count', 'Compare'], role: 'Sports Day Planner' }
};
function M(Sx) { return Sx.x.mission || 'a'; }
function solution(Sx, D) {
  var m = M(Sx); if (m === 'a') { var a = D.A; return 'Picnic on Day ' + (a.best + 1) + ' (' + a.w[a.best] + '°C, ' + SKIES[a.sky[a.best]] + ')'; }
  if (m === 'b') return 'Wear a ' + CLOTHES[D.B.wear].toLowerCase() + ' and ' + PLANS[D.B.plan].toLowerCase();
  var c = D.C; return 'Sports Day on Day ' + (c.best + 1) + ' (' + c.w[c.best] + '°C, ' + SKIES[c.sky[c.best]] + ')';
}
function answerText(id, D) { // the correct answer, shown only for revealed items in the PDF (DP-905)
  var A = D.A, B = D.B, C = D.C, sk = function (l) { return l.map(function (k) { return SKIES[k]; }).join(', '); };
  var t = { a1: A.w.join(', ') + ' C', a2: sk(A.sky), a3: A.w.join(', ') + ' C', a4: A.range + ' C', a5: 'Picnic days: ' + (A.good.map(function (g, i) { return g ? 'Day ' + (i + 1) : null; }).filter(Boolean).join(', ') || 'none'),
    a6: 'Day ' + (A.best + 1) + ', ' + SKIES[A.sky[A.best]] + ', ' + (A.sky[A.best] === 'cloudy' ? 'Umbrella' : 'Sun hat'),
    b1: SEASONS[B.season].n, b2: B.w.join(', ') + ' C', b3: sk(B.sky), b4: TIMES[B.bestTime], b5: CLOTHES[B.wear], b6: PLANS[B.plan],
    c1: C.w[0] + ' C, ' + SKIES[C.sky[0]] + ', ' + FEEL[C.sky[0]], c2: C.w.join(', ') + ' C', c3: String(C.rainyCloudy), c4: 'Day ' + (C.hot + 1) + ', ' + C.range + ' C hotter than the coldest',
    c5: C.order.map(function (i) { return 'Day ' + (i + 1); }).join(', '), c6: 'Day ' + (C.best + 1) };
  return t[id] || '';
}
// the first screen: the ASK's Start and Choose in one. The learner picks ONE situation; the rest of the project is built from that choice
scenes.unshift({ id: 'pick', name: 'Choose your situation', cue: function () { return { tap: '.pick' }; }, render: function (el) {
  var x = K.S().x, lock = K.started();
  el.innerHTML = '<div class="sthead"><h1>' + esc(K.C().title) + '</h1><p class="goal">Use weather facts to make a real decision.</p><p class="meta"><b>About 10 minutes.</b> You will make a weather decision report.</p></div>'
    + '<h2 class="ask">' + esc(INSTR.pick[0]) + '</h2><div class="cards3 missions">' + ['a', 'b', 'c'].map(function (k) { var m = MISSIONS[k]; return '<button class="card pick" data-k="' + k + '"' + (lock ? ' disabled' : '') + '><div class="cimg">' + skySvg(m.pic) + '</div><b>' + m.name + '</b><span>' + m.problem + '</span><div class="learn"><small>You will learn</small>' + m.learn.map(function (t) { return '<i>' + t + '</i>'; }).join('') + '</div><i class="tick">' + Kit.tick() + ' Chosen</i></button>'; }).join('') + '</div>'
    + (lock ? '<p class="note">Locked: you have started this situation.</p>' : '') + '<p class="startfine">' + esc(K.C().disclaimer) + ' ' + esc(K.C().aiNote) + '</p>';
  function paint() { $$('.pick', el).forEach(function (b) { b.classList.toggle('sel', b.dataset.k === x.mission); }); K.setFoot({ main: 'Start', en: !!x.mission, st: x.mission ? '' : 'Pick one to continue.', go: function () { K.rebuild(); K.next(); } }); }
  el.addEventListener('click', function (e) { var b = e.target.closest('.pick'); if (!b || b.disabled) return; x.mission = b.dataset.k; K.rebuild(); K.save(); K.SFX.tap(); paint(); });
  paint(); } });

/* ---------- results ---------- */
function outcome(Sx) { return MISSIONS[M(Sx)].role; }
function art(Sx, D) { var m = M(Sx), sk = m === 'a' ? D.A.sky : m === 'b' ? D.B.sky : D.C.sky, lab = m === 'b' ? ['Morning', 'Noon', 'Evening'] : DAYS, cols = sk.length === 3 ? 3 : 2;
  return '<div class="thg" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr));gap:16px;align-content:center">' + sk.map(function (k, i) { return '<div style="max-width:100%">' + skySvg(k) + '<b style="display:block;margin-top:6px">' + lab[i] + '</b></div>'; }).join('') + '</div>'; }
var N = window.NARRATION;
function T(id, extra) { return Object.assign({ id: id, t: N[id] }, extra || {}); }
Kit.run({ coach: {
  intro: function () { return [T('intro1'), T('intro2'), T('intro3')]; },
  scenes: {
    season: [T('mA1'), T('mA2'), T('mA3'), T('season', { skill: 'Planning' })], a1: [T('a1', { skill: 'Measuring' })], a2: [T('a2', { skill: 'Observing' })], a3: [T('a3', { skill: 'Charting' })], a4: [T('a4', { skill: 'Comparing' })], a5: [T('a5', { skill: 'Sorting' })], a6: [T('a6', { skill: 'Recording' })], aS: [T('aS')],
    b1: [T('mB1'), T('mB2'), T('mB3'), T('b1', { skill: 'Using dates' })], b2: [T('b2', { skill: 'Measuring' })], b3: [T('b3', { skill: 'Observing' })], b4: [T('b4', { skill: 'Comparing' })], b5: [T('b5', { skill: 'Deciding' })], b6: [T('b6', { skill: 'Deciding' })], bS: [T('bS')],
    c1: [T('mC1'), T('mC2'), T('mC3'), T('c1', { skill: 'Recording' })], c2: [T('c2', { skill: 'Charting' })], c3: [T('c3', { skill: 'Counting' })], c4: [T('c4', { skill: 'Comparing' })], c5: [T('c5', { skill: 'Ordering' })], c6: [T('c6', { skill: 'Deciding' })], cS: [T('cS')],
    personalise: [T('personalise')], review: [T('review')], submitted: [T('done')]
  } },
  filter: function (Sx, sc) { return !sc.mission || sc.mission === Sx.x.mission; }, // only the chosen mission's scenes
  sync: function (Sx) { var C = K.C(); C.items = C.missions[M(Sx)]; },                // and only its five scored tasks
  guideSvg: guideSvg, scenes: scenes, themes: THEMES, guideName: 'Sunny', defaultName: 'Learner', artTitle: 'Your solution',
  dataKey: function (Sx) { return Sx.x.mission ? Sx.seed + '|' + Sx.x.mission + '|' + (Sx.x.season || '') + '|' + (Sx.x.today || '') : ''; }, data: makeAll,
  itemNames: { a1: 'Read thermometers', a2: 'Label the skies', a3: 'Plot the chart', a4: 'Compare days', a5: 'Sort the days', a6: 'Write the notice', b1: 'Season from the date', b2: 'Read thermometers', b3: 'Label the skies', b4: 'Best time to go out', b5: 'What to wear', b6: 'What to do', c1: 'Write the journal', c2: 'Plot the chart', c3: 'Count the days', c4: 'Hottest day', c5: 'Order the days', c6: 'Pick the day' },
  headline: function (Sx) { return outcome(Sx); }, line: function (Sx) { return 'for deciding \u201C' + MISSIONS[M(Sx)].name + '\u201D in Weather Station (L1LC01) using real weather data, as'; }, outro: 'You used real weather facts to make a good decision.',
  badges: function (Sx) { return [{ b: MISSIONS[M(Sx)].name, s: 'solved' }, { b: '6 tasks', s: 'done' }]; }, art: art,
  chain: function (Sx, D) { var m = MISSIONS[M(Sx)], first = M(Sx) === 'a' ? 'Situation: ' + m.name + '. Season: ' + SEASONS[D.season].n + '.' : M(Sx) === 'b' ? 'Situation: ' + m.name + '. Date used: ' + D.B.dateText + '.' : 'Situation: ' + m.name + '.'; return [{ choice: 'Your choices', consequence: first }, { choice: 'Skills you used', consequence: m.learn.join(', ') + '.' }, { choice: 'Your solution', consequence: solution(Sx, D) + '.' }, { choice: 'Outcome', consequence: outcome(Sx) + '.' }]; },
  answers: answerText, reviewInstr: INSTR.review,
  pdfArt: function (pdf, x, y, w, h, t, Sx, D) { var m = M(Sx), W_ = m === 'a' ? D.A.w : m === 'b' ? D.B.w : D.C.w, lab = m === 'b' ? ['Morn', 'Noon', 'Aft', 'Eve'] : ['Day 1', 'Day 2', 'Day 3', 'Day 4'], lo = Math.min.apply(null, W_) - 3, hi = Math.max.apply(null, W_) + 2; pdf.rect(x, y, w, h, '#FFFFFF', t.ink, 1.5); W_.forEach(function (v, i) { var bh = (v - lo) / (hi - lo) * (h - 70), bx = x + 30 + i * 85; pdf.rect(bx, y + h - 30 - bh, 60, bh, i % 2 ? t.acc : t.hi, t.ink, 1); pdf.text(bx + 30, y + h - 34 - bh, v + ' C', 11, 'bold', t.ink, 'c'); pdf.text(bx + 30, y + h - 12, lab[i], 10, 'sans', t.ink, 'c'); }); pdf.text(x + w / 2, y + 20, 'My temperatures: ' + MISSIONS[m].name, 11, 'bold', t.ink, 'c'); } });
})();
