/* L1LC01 Weather Station: read thermometers, label the sky, write a journal page, plot a chart. */
'use strict';
(function () {
var K = window.DP, Kit = window.Kit, $ = K.$, $$ = K.$$, esc = K.esc;
var SEASONS = { monsoon: { n: 'Monsoon', lo: 21, hi: 29 }, spring: { n: 'Spring', lo: 19, hi: 27 }, summer: { n: 'Summer', lo: 28, hi: 37 } };
var SKIES = { sunny: 'Sunny', partly: 'Partly cloudy', cloudy: 'Cloudy', rainy: 'Rainy', windy: 'Windy' };
var FEEL = { sunny: 'Happy and full of energy', partly: 'Cheerful, just right for tag', cloudy: 'Calm and a bit sleepy', rainy: 'Cosy, so I read a book', windy: 'Adventurous, so I flew a kite' };
var THEMES = [{ id: 'sun', n: 'Sunny', ink: '#24405F', acc: '#E4572E', hi: '#F2B705', paper: '#FFFBEA' }, { id: 'sky', n: 'Sky', ink: '#1B4F8A', acc: '#2E8BC0', hi: '#7BD88F', paper: '#F2FAFF' }, { id: 'leaf', n: 'Leaf', ink: '#1F5A3A', acc: '#3BAA6A', hi: '#F2B705', paper: '#F4FFF6' }];
function make(seed, season) {
  var r = Kit.rng(seed + '|' + season), S = SEASONS[season], pool = [], t;
  for (t = S.lo; t <= S.hi; t++) pool.push(t);
  var a = Kit.shuffle(pool, r), w1 = a.slice(0, 4), w2 = a.slice(4, 8); // distinct temperatures: one hottest and one coldest day
  var sk = Kit.shuffle(Object.keys(SKIES), r), sk2 = Kit.shuffle(Object.keys(SKIES), r);
  return { season: season, w1: w1, sky1: sk.slice(0, 4), w2: w2, sky5: sk2[0], range: Math.max.apply(null, w2) - Math.min.apply(null, w2) };
}
window.WeatherTest = function (n) { var bad = 0; for (var i = 0; i < n; i++) Object.keys(SEASONS).forEach(function (s) { var D = make('s' + i, s), u = {}; D.w1.concat(D.w2).forEach(function (x) { u[x] = 1; }); if (Object.keys(u).length !== 8 || D.range < 3 || new Set(D.sky1).size !== 4) bad++; }); return bad; };

function guideSvg() { return '<img src="assets/img/sunny.webp" alt="">'; } // the guide (Sunny): image made with agy, transparent PNG
function skySvg(t) { return '<img class="skyimg" src="assets/img/sky-' + t + '.webp" alt="">'; } // sky scenes made with agy
function thermo(t, day) {
  var H = 200, y0 = 14, Y = function (v) { return y0 + (40 - v) / 30 * H; }, s = '<svg viewBox="0 -6 170 276" role="img" aria-label="Day ' + day + ' thermometer"><rect x="82" y="6" width="28" height="232" rx="14" fill="#fff" stroke="#24405F" stroke-width="4"/>';
  for (var v = 10; v <= 40; v++) { var len = v % 10 === 0 ? 22 : v % 5 === 0 ? 15 : 8; s += '<line x1="78" x2="' + (78 - len) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#24405F" stroke-width="' + (v % 5 ? 2 : 3) + '"/>'; if (v % 10 === 0) s += '<text x="52" y="' + (Y(v) + 9) + '" font-size="28" font-weight="700" fill="#24405F" text-anchor="end">' + v + '</text>'; }
  return s + '<rect x="90" y="' + Y(t) + '" width="12" height="' + (240 - Y(t)) + '" fill="#E5484D"/><circle cx="96" cy="246" r="20" fill="#E5484D" stroke="#24405F" stroke-width="4"/></svg>';
}
function S() { return K.S(); }
var scenes = [];
scenes.push(Kit.cards({ id: 'season', name: 'Pick a season', key: 'season', title: 'Pick a season', reset: ['a_sky', 'a_journal', 'chart'], opts: Object.keys(SEASONS).map(function (k) { return { id: k, t: SEASONS[k].n, sub: k === 'monsoon' ? 'Rain and clouds' : k === 'spring' ? 'Fresh and breezy' : 'Hot and bright', html: skySvg(k === 'monsoon' ? 'rainy' : k === 'spring' ? 'windy' : 'sunny') }; }) }));
scenes.push(Kit.num({ id: 'read', name: 'Read thermometers', fcls: 'g4', guide: function () { return ['Read each thermometer.', 'Enter the <b>°C</b>.']; }, reveal: function (D) { return 'The red line ends at ' + D.w1.join(', ') + ' °C.'; }, hint: function () { return 'Find the number the red line reaches. Each small mark is 1°C.'; }, bad1: function (D, v) { return 'Look where the red line stops. Each small mark is 1°C. '; },
  top: function (D) { return '<div class="thg">' + D.w1.map(function (t, i) { return '<div>' + thermo(t, i + 1) + '</div>'; }).join('') + '</div>'; },
  fields: function (D) { return D.w1.map(function (t, i) { return { lbl: 'Day ' + (i + 1), ans: t, unit: '°C' }; }); } }));
scenes.push(Kit.slots({ id: 'sky', name: 'Label the sky', cls: 'stack sky', cols: 4, guide: function () { return ['What is the sky doing?', 'Drop the right word on each window.']; }, reveal: 'Each window now has its matching word.',
  chips: function (D) { var sl = D.sky1; return Object.keys(SKIES).map(function (k) { var i = sl.indexOf(k); return { id: k, html: SKIES[k], slot: i >= 0 ? 'd' + i : null }; }); },
  slots: function (D) { return D.sky1.map(function (k, i) { return { id: 'd' + i, label: skySvg(k) + '<b>Day ' + (i + 1) + '</b>', aria: 'Day ' + (i + 1) + ' window' }; }); },
  bad1: function (D, n) { return n + ' windows have the wrong word. '; }, hint: function () { return 'Rain drops mean rainy. A sun means sunny. Swirls mean windy. '; } }));
scenes.push(Kit.slots({ id: 'journal', name: 'Write the journal', cls: 'journal', guide: function (D) { return ['Station log: <b>Day 5</b>', '<b>' + D.w2[0] + '°C</b> and <b>' + SKIES[D.sky5] + '</b>', 'Fill the journal page.']; }, reveal: 'The page is filled in.',
  chips: function (D) { var o = D.w2.slice(1, 3), sk = Object.keys(SKIES).filter(function (k) { return k !== D.sky5; }), fe = sk.slice(0, 2); return [{ id: 'tmp', html: D.w2[0] + '°C', slot: 'tmp' }, { id: 'skyc', html: SKIES[D.sky5], slot: 'sky' }, { id: 'fl', html: FEEL[D.sky5], slot: 'fl' }, { id: 'xt', html: o[0] + '°C', slot: null }, { id: 'xs', html: SKIES[sk[0]], slot: null }, { id: 'xf', html: FEEL[fe[1]], slot: null }].sort(function (a, b) { return a.id < b.id ? -1 : 1; }); },
  slots: function () { return [{ id: 'tmp', label: 'Temperature' }, { id: 'sky', label: 'Sky conditions' }, { id: 'fl', label: 'How I felt today' }]; }, cols: 1, bad1: function (D, n) { return n + ' notes are in the wrong place. '; }, hint: function () { return 'Copy the log, then pick the feeling that suits the weather. ' } }));
// chart: drag each dot to its temperature (chart build)
scenes.push({ id: 'chart', step: 1, name: 'Plot the chart', items: ['chart'], cue: function () { return K.done('chart') ? { tap: '#b-main' } : { drag: { from: '.dot', to: '.chart svg' } }; }, render: function (el) {
  var D = K.D(), x = S().x, v = x.chartv = x.chartv || [null, null, null, null], lo = Math.floor(Math.min.apply(null, D.w2) / 2) * 2 - 2, hi = Math.ceil(Math.max.apply(null, D.w2) / 2) * 2 + 2, W = 1000, H = 480, L = 90, B = 50, fin = K.done('chart');
  function Y(t) { return 20 + (hi - t) / (hi - lo) * (H - 20 - B); } function T(y) { return Math.round(hi - (y - 20) / (H - 20 - B) * (hi - lo)); } function X(i) { return L + 90 + i * 215; }
  el.innerHTML = '<div class="toprow">' + K.guide(['Plot the week.', 'Drag each dot to its temperature.']) + '<div class="fb" id="fb" hidden></div></div><div class="board" style="height:610px"><div class="paper chartbox" style="flex:1"><div class="chart" id="chart"></div></div><div class="paper logbox"><div class="eyebrow">Station log</div><table><tr><th>Day</th><th>°C</th></tr>' + D.w2.map(function (t, i) { return '<tr><td>Day ' + (i + 5) + '</td><td class="mono">' + t + '</td></tr>'; }).join('') + '</table></div></div>';
  function paint() { var s = '<svg viewBox="0 0 ' + W + ' ' + H + '"><rect x="' + L + '" y="20" width="' + (W - L - 10) + '" height="' + (H - 20 - B) + '" fill="#F4FBFF" stroke="#24405F" stroke-width="3"/>';
    for (var t = lo; t <= hi; t += 2) s += '<line x1="' + L + '" x2="' + (W - 10) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="#BFE3F7" stroke-width="2"/><text x="' + (L - 10) + '" y="' + (Y(t) + 10) + '" font-size="28" text-anchor="end" fill="#24405F">' + t + '</text>';
    for (var i = 0; i < 4; i++) { s += '<text x="' + X(i) + '" y="' + (H - 12) + '" font-size="28" text-anchor="middle" fill="#24405F">Day ' + (i + 5) + '</text>'; if (v[i] != null) s += '<line x1="' + X(i) + '" x2="' + X(i) + '" y1="' + Y(v[i]) + '" y2="' + (H - B) + '" stroke="#3A9BDC" stroke-width="10" opacity=".35"/>'; }
    for (i = 0; i < 4; i++) { var y = v[i] == null ? H - B - 30 : Y(v[i]); s += '<g class="dot" tabindex="0" data-i="' + i + '" role="slider" aria-label="Day ' + (i + 5) + ' temperature" aria-valuenow="' + (v[i] == null ? '' : v[i]) + '"><circle class="d" cx="' + X(i) + '" cy="' + y + '" r="30" fill="' + (v[i] == null ? '#fff' : fin ? '#0B7A4B' : '#E4572E') + '" stroke="#24405F" stroke-width="5"' + (v[i] == null ? ' stroke-dasharray="8 6"' : '') + '/><text x="' + X(i) + '" y="' + (y + 10) + '" font-size="28" font-weight="700" text-anchor="middle" fill="' + (v[i] == null ? '#24405F' : '#fff') + '">' + (v[i] == null ? '?' : v[i]) + '</text></g>'; }
    $('#chart').innerHTML = s + '</svg>'; var n = v.filter(function (a) { return a != null; }).length; if (!K.done('chart')) K.setFoot({ main: 'Check', en: n === 4, item: 'chart', go: check }); }
  var drag = null, svg = function () { return $('#chart svg'); };
  function yOf(e) { var r = svg().getBoundingClientRect(), k = r.width / W; return (e.clientY - r.top) / k; }
  el.addEventListener('pointerdown', function (e) { var d = e.target.closest('.dot'); if (d && !K.done('chart')) { drag = +d.dataset.i; e.preventDefault(); } });
  K.winOn('pointermove', function (e) { if (drag == null) return; v[drag] = Math.max(lo, Math.min(hi, T(yOf(e)))); paint(); });
  K.winOn('pointerup', function () { if (drag != null) { drag = null; K.save(); K.SFX.tap(); } });
  el.addEventListener('click', function (e) { if (K.done('chart') || e.target.closest('.dot')) return; var r = svg().getBoundingClientRect(), k = r.width / W, px = (e.clientX - r.left) / k, i = Math.round((px - L - 90) / 215); if (i >= 0 && i < 4 && e.target.closest('#chart')) { v[i] = Math.max(lo, Math.min(hi, T(yOf(e)))); K.save(); K.SFX.tap(); paint(); } }); // tap a column to place its dot
  el.addEventListener('keydown', function (e) { var d = e.target.closest('.dot'); if (!d || K.done('chart')) return; var i = +d.dataset.i, dv = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0; if (dv) { e.preventDefault(); v[i] = Math.max(lo, Math.min(hi, (v[i] == null ? Math.round((lo + hi) / 2) : v[i]) + dv)); K.save(); paint(); var nd = $('.dot[data-i="' + i + '"]'); if (nd) nd.focus(); } });
  function check() { var r = v.map(function (a, i) { return a != null && Math.abs(a - D.w2[i]) <= 1; }), ok = r.every(Boolean), s = K.attempt('chart', ok, v.join(',')); if (ok) { K.SFX.ok(); K.fb('ok', 'Correct.', ''); fin = true; paint(); K.setFoot({ main: 'Next', en: true, go: function () { K.next(); } }); return; } K.SFX.bad();
    if (s.rev) { D.w2.forEach(function (t, i) { v[i] = t; }); fin = true; K.save(); paint(); K.fb('rev', 'Answer shown.', ''); K.setFoot({ main: 'Next', en: true, go: function () { K.next(); } }); return; }
    K.fb(s.a === 1 ? 'no' : 'hint', s.a === 1 ? 'Not yet.' : 'Hint.', (s.a === 1 ? 'Some dots are not at the right height. ' : 'Match each dot to the number in the log. ') + K.lostHtml('chart')); r.forEach(function (g, i) { if (!g) v[i] = null; }); K.save(); paint(); }
  K.solve = function () { D.w2.forEach(function (t, i) { v[i] = t; }); paint(); };
  if (fin) { D.w2.forEach(function (t, i) { v[i] = t; }); paint(); K.setFoot({ main: 'Next', en: true, go: function () { K.next(); } }); } else paint();
} });
scenes.push(Kit.num({ id: 'range', name: 'Compare days', guide: function () { return ['How many °C warmer was the hottest day than the coldest?']; }, reveal: function (D) { return Math.max.apply(null, D.w2) + ' − ' + Math.min.apply(null, D.w2) + ' = ' + D.range; }, hint: function () { return 'Find the biggest and the smallest number. Take the small from the big. '; }, bad1: function () { return 'Pick the highest and lowest numbers in the log. '; },
  top: function (D) { return '<table class="data"><tr><th>Week 2</th><th>°C</th></tr>' + D.w2.map(function (t, i) { return '<tr><td>Day ' + (i + 5) + '</td><td class="mono">' + t + '</td></tr>'; }).join('') + '</table>'; }, fields: function (D) { return [{ lbl: 'Difference', ans: D.range, unit: '°C' }]; } }));
scenes.push(Kit.personal({ themes: THEMES, label: 'My weather journal', findings: function (Sx, D) { var h = Math.max.apply(null, D.w2), hd = D.w2.indexOf(h) + 5; return 'In my ' + SEASONS[D.season].n.toLowerCase() + ' journal, Day ' + hd + ' was the hottest at ' + h + '°C. The weather changed ' + D.range + '°C across the week, and the sky changed my mood too.'; } }));

function outcome(S, D) { return SEASONS[D.season].n + ' Weather Reporter'; }
function art(S, D) { return '<div class="thg" style="grid-template-columns:repeat(2,1fr);gap:20px 40px;align-content:center">' + D.sky1.map(function (k) { return '<div style="width:200px;max-width:100%">' + skySvg(k) + '</div>'; }).join('') + '</div>'; }
Kit.run({ coach: {
  intro: function (c) { var N = window.NARRATION; return [
    { id: 'intro1', t: N.intro1 },
    { id: 'intro2', t: N.intro2 },
    { id: 'intro3', t: N.intro3, list: ['Observe the weather carefully', 'Record it in a journal', 'Plot numbers on a chart', 'Compare one day with another'] },
    { id: 'intro4', t: N.intro4, steps: true, spot: '.prog' }
  ]; },
  scenes: (function () { var N = window.NARRATION; function L(id, skill) { return [{ id: id, t: N[id], skill: skill }]; } return {
    season: L('season', 'Planning'), read: L('read', 'Measuring'), sky: L('sky', 'Observing'), journal: L('journal', 'Recording'),
    chart: L('chart', 'Charting'), range: L('range', 'Comparing'), personalise: L('personalise'), review: L('review')
  }; })() },
  guideSvg: guideSvg, scenes: scenes, themes: THEMES, guideName: 'Sunny', defaultName: 'Young Reporter', artTitle: 'Your weather week',
  dataKey: function (Sx) { return Sx.x.season ? Sx.seed + '|' + Sx.x.season : ''; }, data: function (Sx) { return make(Sx.seed, Sx.x.season); },
  itemNames: { read: 'Read thermometers', sky: 'Label the sky', journal: 'Write the journal', chart: 'Plot the chart', range: 'Compare days' },
  headline: outcome, line: function (S, D) { return 'for completing Weather Station (L1LC01): ' + SEASONS[D.season].n + ' edition, as'; }, outro: 'You observed, recorded and compared the weather like a real reporter.',
  badges: function (S, D) { return [{ b: SEASONS[D.season].n, s: 'season' }, { b: '8 days', s: 'observed' }]; }, art: art,
  chain: function (S, D) { return [{ choice: 'Season: ' + SEASONS[D.season].n, consequence: 'Set the temperatures (' + SEASONS[D.season].lo + ' to ' + SEASONS[D.season].hi + '°C) and the skies for your station.' }, { choice: 'Thermometers and skies', consequence: '4 days read and labelled.' }, { choice: 'Journal page', consequence: 'Day 5 written up: ' + SKIES[D.sky5] + '.' }, { choice: 'Week 2 chart', consequence: 'Plotted 4 days; the range was ' + D.range + '°C.' }, { choice: 'Outcome', consequence: outcome(S, D) + '.' }]; },
  pdfArt: function (pdf, x, y, w, h, t, S, D) { var lo = Math.min.apply(null, D.w2) - 3, hi = Math.max.apply(null, D.w2) + 2; pdf.rect(x, y, w, h, '#FFFFFF', t.ink, 1.5); D.w2.forEach(function (v, i) { var bh = (v - lo) / (hi - lo) * (h - 70), bx = x + 30 + i * 85; pdf.rect(bx, y + h - 30 - bh, 60, bh, i % 2 ? t.acc : t.hi, t.ink, 1); pdf.text(bx + 30, y + h - 34 - bh, v + ' C', 11, 'bold', t.ink, 'c'); pdf.text(bx + 30, y + h - 12, 'Day ' + (i + 5), 10, 'sans', t.ink, 'c'); }); pdf.text(x + w / 2, y + 20, 'My week 2 temperatures', 11, 'bold', t.ink, 'c'); } });
})();
