/* Coach: the guide character slides in over a greyed backdrop, explains with voice-over + subtitles, then slides out.
   While it plays the page underneath is inert (no clicks, no keys) and the slide's own clutter is hidden; only Skip (top-right) is live.
   API: Coach.play(lines, {steps:[names], done()}) | Coach.stop() | Coach.skip() | Coach.active()
   lines: [string | {t, say?, eb?, list?, steps?, spot?}] */
'use strict';
window.Coach = (function () {
  var ART = 'assets/img/sunny.webp';
  var root = null, st = null, tok = 0, tfb = 0, tmt = 0, tty = 0;
  var SKIP_ICO = '<svg viewBox="0 0 48 48" fill="none"><path d="M8 10l18 14L8 38V10Zm20 0l18 14-18 14V10Z" fill="currentColor"/></svg>';

  function stage() { return document.getElementById('stage'); }
  function inertSet(on) { ['.hdr', '#content', '.ftr', '#layer'].forEach(function (s) { var e = document.querySelector(s); if (e) { if (on) e.setAttribute('inert', ''); else e.removeAttribute('inert'); } }); stage().classList.toggle('coaching', !!on); }
  function spotClear() { Array.prototype.forEach.call(document.querySelectorAll('.cspot'), function (e) { e.classList.remove('cspot'); }); }
  function clearTimers() { clearTimeout(tfb); clearInterval(tmt); clearInterval(tty); }
  function pickVoice() {
    try { var v = speechSynthesis.getVoices() || [], f = function (re) { return v.filter(function (x) { return re.test(x.name) && /^en/i.test(x.lang); })[0]; };
      return f(/Zira|Aria|Jenny|Samantha|Google UK English Female|Google US English|Female/i) || v.filter(function (x) { return /^en/i.test(x.lang); })[0] || null; } catch (e) { return null; }
  }
  var AUD = null;
  function audStop() { if (AUD) { try { AUD.onended = AUD.onerror = AUD.onplay = null; AUD.pause(); } catch (e) {} AUD = null; } }
  function say(text, ended, id, sync) {
    var my = tok, done = false, est = Math.max(2200, text.length * 62 + 1200);
    function fin() { if (done || my !== tok) return; done = true; clearTimeout(tfb); audStop(); ended(); }
    if (id) { // recorded voice-over
      try { var a = new Audio('assets/audio/' + id + '.mp3'); AUD = a; a.onplay = function () { if (my === tok && root) root.classList.add('talk'); }; a.onplaying = function () { if (my === tok && sync && !a._synced) { a._synced = 1; sync(isFinite(a.duration) && a.duration > 0 ? a.duration * 1000 : est); } }; // the text starts the moment the voice does
        a.onended = function () { if (my !== tok) return; if (root) root.classList.remove('talk'); fin(); };
        a.onerror = function () { if (my === tok && AUD === a) { AUD = null; say(text, ended, null, sync); } }; tfb = setTimeout(fin, 30000);
        var pr = a.play(); if (pr && pr.catch) pr.catch(function () { if (my === tok && AUD === a) { AUD = null; clearTimeout(tfb); say(text, ended, null, sync); } }); return; } catch (e) {} }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { if (sync) sync(est); tfb = setTimeout(fin, est); return; }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text), v = pickVoice(); if (v) u.voice = v; u.lang = (v && v.lang) || 'en-US'; u.rate = 0.92; u.pitch = 1.25;
      u.onstart = function () { if (my === tok && root) { root.classList.add('talk'); if (sync) sync(est); } };
      u.onend = u.onerror = function () { if (my !== tok) return; if (root) root.classList.remove('talk'); fin(); };
      speechSynthesis.speak(u); tfb = setTimeout(fin, est * 1.8 + 2500); // some browsers never fire onend
    } catch (e) { if (sync) sync(est); tfb = setTimeout(fin, est); }
  }
  var tyc = null;
  function typeText(el, text, my) { // subtitles type out over time; the full text is laid out invisibly first so the bubble never grows or jumps
    var vis = document.createElement('span'), hid = document.createElement('span'); hid.style.visibility = 'hidden'; hid.textContent = text; el.textContent = ''; el.appendChild(vis); el.appendChild(hid);
    tyc = { t0: null, total: Math.max(1200, text.length * 55) }; // t0 stays empty (no text yet) until the voice starts
    setTimeout(function () { if (my === tok && tyc && tyc.t0 === null) typeSync(tyc.total / 0.88); }, 3000); // safety: never leave the bubble blank if audio is slow
    clearInterval(tty); tty = setInterval(function () { if (my !== tok || !tyc) { clearInterval(tty); return; } if (tyc.t0 === null) return; var f = Math.min(1, (Date.now() - tyc.t0) / tyc.total), i = Math.ceil(text.length * f); vis.textContent = text.slice(0, i); hid.textContent = text.slice(i); if (f >= 1) clearInterval(tty); }, 30);
  }
  function typeSync(ms) { if (tyc) { tyc.t0 = Date.now(); tyc.total = Math.max(800, ms * 0.88); } } // finish typing just before the voice finishes

  function showLine(i) {
    if (!st || !root) return; var my = ++tok, L = st.lines[i], bub = root.querySelector('.say');
    clearTimers(); audStop(); root.classList.remove('talk'); try { speechSynthesis.cancel(); } catch (e) {} spotClear();
    st.i = i; bub.classList.remove('show');
    setTimeout(function () {
      if (my !== tok || !st || !root) return;
      var html = (L.eb ? '<div class="eb">' + L.eb + '</div>' : '') + '<div class="tx"></div>';
      if (L.list) html += '<ul class="ls">' + L.list.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      if (L.steps && st.o.steps) html += '<div class="jr">' + st.o.steps.map(function (n) { return '<i title="' + n + '"></i>'; }).join('') + '</div>';
      html += '<div class="more"><span class="dots">' + st.lines.map(function (x, k) { return '<b class="' + (k === i ? 'on' : '') + '"></b>'; }).join('') + '</span><button class="nxt" type="button">' + (i === st.lines.length - 1 ? 'Let’s go!' : 'Next') + '</button></div>';
      bub.innerHTML = html; bub.classList.add('show'); st.ready = false;
      typeText(bub.querySelector('.tx'), L.t, my);
      if (L.spot) { var s = document.querySelector(L.spot); if (s) s.classList.add('cspot'); }
      Array.prototype.forEach.call(bub.querySelectorAll('.ls li'), function (x, k) { setTimeout(function () { if (my === tok) x.classList.add('show'); }, 900 + k * 1500); });
      Array.prototype.forEach.call(bub.querySelectorAll('.jr i'), function (x, k) { setTimeout(function () { if (my === tok) x.classList.add('f'); }, 1200 + k * 600); });
      say(L.say || L.t, function () { if (my !== tok || !st) return; st.ready = true; var nb = bub.querySelector('.nxt'); if (nb) { nb.classList.add('ready'); try { nb.focus(); } catch (e) {} } }, L.id, typeSync);
    }, i === 0 ? 0 : 260);
  }
  function leave() {
    if (!st || st.leaving) return; st.leaving = true; tok++; clearTimers(); audStop(); try { speechSynthesis.cancel(); } catch (e) {}
    spotClear(); var r = root, o = st.o; r.querySelector('.say').classList.remove('show'); r.classList.remove('talk', 'idle'); r.classList.add('off');
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); if (root === r) { root = null; st = null; inertSet(false); } if (o.done) o.done(); }, 700);
  }

  function play(lines, o) {
    stop(); o = o || {}; if (!lines || !lines.length) { if (o.done) o.done(); return; }
    lines = lines.map(function (l) { return typeof l === 'string' ? { t: l } : l; });
    root = document.createElement('div'); root.id = 'coach'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Your guide is talking');
    root.innerHTML = '<div class="shade"></div><div class="who" aria-hidden="true"><img alt="" src="' + ART + '"></div><div class="say" aria-live="polite"></div>'
      + '<div class="bar"><button type="button" class="skip" aria-label="Skip the explanation">Skip ' + SKIP_ICO + '</button></div>';
    stage().appendChild(root); st = { lines: lines, o: o, i: 0 }; inertSet(true);
    var sk = root.querySelector('.skip');
    sk.addEventListener('click', leave);
    root.querySelector('.say').addEventListener('click', function (e) { if (!e.target.closest('.nxt') || !st || !st.ready) return; if (st.i < st.lines.length - 1) showLine(st.i + 1); else leave(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); leave(); } });
    function begin() { var im = root.querySelector('.who img'), go = function () { if (!root) return; root.classList.add('on', 'in'); setTimeout(function () { if (root) root.classList.add('idle'); }, 900); setTimeout(function () { if (st) showLine(0); }, 800); sk.focus(); }; if (im && im.decode) im.decode().then(go, go); else go(); }
    var active = true; try { active = navigator.userActivation ? navigator.userActivation.hasBeenActive : true; } catch (e) {}
    if (!active) { // first screen of a fresh page: speech needs a tap, so ask for one (the grey shade fades in first)
      root.classList.add('on'); var g = document.createElement('div'); g.className = 'gate'; g.innerHTML = '<button type="button">Tap to meet your guide</button>'; root.appendChild(g);
      g.querySelector('button').addEventListener('click', function () { g.parentNode.removeChild(g); begin(); }); g.querySelector('button').focus();
    } else begin();
  }
  function stop() { if (!st && !root) return; tok++; audStop(); try { speechSynthesis.cancel(); } catch (e) {} clearTimers(); spotClear(); if (root && root.parentNode) root.parentNode.removeChild(root); root = null; st = null; inertSet(false); }
  return { play: play, stop: stop, active: function () { return !!st; }, skip: function () { if (st) leave(); } };
})();
