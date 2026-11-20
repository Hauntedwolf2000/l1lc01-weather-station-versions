/* Coach (v2 story mode): a small guide peeks in, says her own line(s) (situation, why it matters), then READS ALOUD the screen's instruction while that
   instruction is highlighted. The instruction text is never repeated in her bubble (DP-515). Then she leaves.
   While she talks the page underneath is inert; only Skip (top-right) is live.
   API: Coach.play(lines, {done()}) | Coach.hear(lines) (audio only, no character) | Coach.stop() | Coach.skip() | Coach.active() | Coach.setVoice(bool)
   lines: [{id, t}]  guide lines          [{ins:true, sid}]  read the screen instruction aloud (clip i_<sid>, else the device voice) */
'use strict';
window.Coach = (function () {
  var ART = 'assets/img/sunny.webp';
  var root = null, st = null, tok = 0, tfb = 0, tmt = 0, tty = 0, tyc = null, AUD = null, voiceOn = true;
  var SKIP_ICO = '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 10l18 14L8 38V10Zm20 0l18 14-18 14V10Z" fill="currentColor"/></svg>';

  function stage() { return document.getElementById('stage'); }
  function inertSet(on) { ['.hdr', '#content', '.ftr', '#layer'].forEach(function (s) { var e = document.querySelector(s); if (e) { if (on) e.setAttribute('inert', ''); else e.removeAttribute('inert'); } }); stage().classList.toggle('coaching', !!on); }
  function spotClear() { Array.prototype.forEach.call(document.querySelectorAll('.cspot'), function (e) { e.classList.remove('cspot'); }); }
  function clearTimers() { clearTimeout(tfb); clearInterval(tmt); clearInterval(tty); }
  function audStop() { if (AUD) { try { AUD.onended = AUD.onerror = AUD.onplay = AUD.onplaying = null; AUD.pause(); } catch (e) {} AUD = null; } }
  function pickVoice() { // DP-517: Indian English first, then any English voice
    try { var v = speechSynthesis.getVoices() || [], en = v.filter(function (x) { return /^en/i.test(x.lang); });
      return en.filter(function (x) { return /en[-_]IN/i.test(x.lang); })[0] || en.filter(function (x) { return /Zira|Aria|Jenny|Samantha|Female/i.test(x.name); })[0] || en[0] || null; } catch (e) { return null; }
  }
  function say(text, ended, id, sync) { // recorded clip when there is one, else the device voice, else silent timing; with Voice off it is silent
    var my = tok, done = false, est = Math.max(2200, text.length * 62 + 1200);
    function fin() { if (done || my !== tok) return; done = true; clearTimeout(tfb); audStop(); ended(); }
    if (!voiceOn) { if (sync) sync(est); tfb = setTimeout(fin, Math.min(est, 2600)); return; }
    if (id) {
      try { var a = new Audio('assets/audio/' + id + '.mp3'); AUD = a; a.onplay = function () { if (my === tok && root) root.classList.add('talk'); };
        a.onplaying = function () { if (my === tok && sync && !a._synced) { a._synced = 1; sync(isFinite(a.duration) && a.duration > 0 ? a.duration * 1000 : est); } }; // the text starts the moment the voice does
        a.onended = function () { if (my !== tok) return; if (root) root.classList.remove('talk'); fin(); };
        a.onerror = function () { if (my === tok && AUD === a) { AUD = null; say(text, ended, null, sync); } }; tfb = setTimeout(fin, 30000);
        var pr = a.play(); if (pr && pr.catch) pr.catch(function () { if (my === tok && AUD === a) { AUD = null; clearTimeout(tfb); say(text, ended, null, sync); } }); return; } catch (e) {} }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { if (sync) sync(est); tfb = setTimeout(fin, est); return; }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text), v = pickVoice(); if (v) u.voice = v; u.lang = (v && v.lang) || 'en-IN'; u.rate = 0.95; u.pitch = 1.1;
      u.onstart = function () { if (my === tok && root) root.classList.add('talk'); if (my === tok && sync) sync(est); };
      u.onend = u.onerror = function () { if (my !== tok) return; if (root) root.classList.remove('talk'); fin(); };
      speechSynthesis.speak(u); tfb = setTimeout(fin, est * 1.8 + 2500); // some browsers never fire onend
    } catch (e) { if (sync) sync(est); tfb = setTimeout(fin, est); }
  }
  function typeText(el, text, my) { // words appear in step with the voice; the full text is laid out invisibly first so the bubble never grows or jumps
    var vis = document.createElement('span'), hid = document.createElement('span'); hid.style.visibility = 'hidden'; hid.textContent = text; el.textContent = ''; el.appendChild(vis); el.appendChild(hid);
    var starts = []; text.replace(/\S+\s*/g, function (m, off) { starts.push(off); return m; });
    tyc = { t0: null, total: Math.max(1200, text.length * 55) }; // t0 stays empty (no text yet) until the voice starts
    setTimeout(function () { if (my === tok && tyc && tyc.t0 === null) typeSync(tyc.total / 0.93); }, 3000); // safety: never leave the bubble blank if audio is slow
    clearInterval(tty); tty = setInterval(function () { if (my !== tok || !tyc) { clearInterval(tty); return; } if (tyc.t0 === null) return;
      var f = Math.min(1, (Date.now() - tyc.t0) / tyc.total), lim = text.length * f, n = 0; while (n < starts.length && starts[n] <= lim) n++;
      var i = f >= 1 || n >= starts.length ? text.length : starts[n]; vis.textContent = text.slice(0, i); hid.textContent = text.slice(i); if (f >= 1) clearInterval(tty); }, 30);
  }
  function typeSync(ms) { if (tyc) { tyc.t0 = Date.now(); tyc.total = Math.max(800, ms * 0.93); } } // finish typing just before the voice finishes

  // the screen's own instruction: found on the page, highlighted, and read aloud (clip if it is fixed text, device voice if it holds learner data)
  function insInfo(sid) {
    var node = document.querySelector('#content .toprow .guide') || document.querySelector('#content .ask') || document.querySelector('#content .solve .eyebrow'), I = window.INSTR && window.INSTR[sid];
    return { node: node, text: I ? I.join(' ') : node ? (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim() : '', id: I ? 'i_' + sid : null };
  }
  function revealBubbles() { Array.prototype.forEach.call(document.querySelectorAll('#content .gbub'), function (b) { b.classList.remove('wait', 'typing'); b.classList.add('in'); }); }

  function showLine(i) {
    if (!st || !root) return; var my = ++tok, L = st.lines[i], bub = root.querySelector('.say');
    clearTimers(); audStop(); root.classList.remove('talk'); try { speechSynthesis.cancel(); } catch (e) {} spotClear();
    st.i = i; bub.classList.remove('show');
    setTimeout(function () {
      if (my !== tok || !st || !root) return;
      if (L.ins) { // read the on-screen instruction aloud while it is highlighted; the guide's bubble stays away so nothing is shown twice
        var r = insInfo(L.sid); revealBubbles(); if (r.node) r.node.classList.add('cspot');
        if (!r.text) { leave(); return; }
        say(r.text, function () { if (my === tok && st) leave(); }, r.id); return;
      }
      var html = '<div class="tx"></div><div class="more"><button class="nxt" type="button">Next</button></div>';
      bub.innerHTML = html; bub.classList.add('show'); st.ready = false;
      typeText(bub.querySelector('.tx'), L.t, my);
      say(L.say || L.t, function () { if (my !== tok || !st) return; st.ready = true; var nb = bub.querySelector('.nxt'); if (nb) { nb.classList.add('ready'); try { nb.focus(); } catch (e) {} } }, L.id, typeSync);
    }, i === 0 ? 0 : 260);
  }
  function leave() {
    if (!st || st.leaving) return; st.leaving = true; tok++; clearTimers(); audStop(); try { speechSynthesis.cancel(); } catch (e) {}
    spotClear(); var r = root, o = st.o; r.querySelector('.say').classList.remove('show'); r.classList.remove('talk', 'idle'); r.classList.add('off');
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); if (root === r) { root = null; st = null; inertSet(false); } if (o.done) o.done(); }, 420);
  }

  function play(lines, o) {
    stop(); o = o || {}; if (!lines || !lines.length) { if (o.done) o.done(); return; }
    if (o.voice != null) voiceOn = !!o.voice;
    root = document.createElement('div'); root.id = 'coach'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Your guide is talking');
    root.innerHTML = '<div class="shade"></div><div class="who" aria-hidden="true"><img alt="" src="' + ART + '"></div><div class="say" aria-live="polite"></div>'
      + '<div class="bar"><button type="button" class="skip" aria-label="Skip">' + SKIP_ICO + '</button></div>';
    stage().appendChild(root); st = { lines: lines, o: o, i: 0 }; inertSet(true);
    var sk = root.querySelector('.skip');
    sk.addEventListener('click', leave);
    root.querySelector('.say').addEventListener('click', function (e) { if (!e.target.closest('.nxt') || !st || !st.ready) return; if (st.i < st.lines.length - 1) showLine(st.i + 1); else leave(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); leave(); } });
    function begin() { var im = root.querySelector('.who img'), go = function () { if (!root) return; root.classList.add('on', 'in'); setTimeout(function () { if (root) root.classList.add('idle'); }, 650); setTimeout(function () { if (st) showLine(0); }, 550); sk.focus(); }; if (im && im.decode) im.decode().then(go, go); else go(); }
    var active = true; try { active = navigator.userActivation ? navigator.userActivation.hasBeenActive : true; } catch (e) {}
    if (!active) { // first screen of a fresh page: audio needs a tap, so ask for one (the grey shade fades in first)
      root.classList.add('on'); var g = document.createElement('div'); g.className = 'gate'; g.innerHTML = '<button type="button">Tap to meet your guide</button>'; root.appendChild(g);
      g.querySelector('button').addEventListener('click', function () { g.parentNode.removeChild(g); begin(); }); g.querySelector('button').focus();
    } else begin();
  }
  function hear(lines) { // "Hear again" (DP-516): the same lines as audio only, no character, with the instruction highlighted
    stop(); if (!voiceOn || !lines || !lines.length) return; audStop(); try { speechSynthesis.cancel(); } catch (e) {} var my = ++tok, i = 0;
    (function nxt() { if (my !== tok) return; spotClear(); if (i >= lines.length) return; var L = lines[i++], t = L.t, id = L.id;
      if (L.ins) { var r = insInfo(L.sid); revealBubbles(); if (r.node) r.node.classList.add('cspot'); t = r.text; id = r.id; }
      if (!t) { nxt(); return; } say(t, function () { if (my !== tok) return; setTimeout(function () { if (my === tok) { nxt(); } }, 250); }, id); })();
  }
  function stop() { var had = st || root; tok++; audStop(); try { speechSynthesis.cancel(); } catch (e) {} clearTimers(); spotClear(); if (root && root.parentNode) root.parentNode.removeChild(root); root = null; st = null; if (had) inertSet(false); }
  return { play: play, hear: hear, stop: stop, active: function () { return !!st; }, skip: function () { if (st) leave(); }, setVoice: function (v) { voiceOn = !!v; if (!voiceOn) { audStop(); try { speechSynthesis.cancel(); } catch (e) {} } } };
})();
