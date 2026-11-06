/* Peningkatan interaksi (progressive enhancement). Konten & navigasi tetap berfungsi tanpa file ini. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function el(tag, cls, text) { var n = d.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  try { if (window.top !== window.self) root.classList.add('is-embedded'); } catch (e) { root.classList.add('is-embedded'); }

  /* Toast */
  var toastBox;
  function toast(msg) {
    if (!toastBox) { toastBox = el('div', 'toast-box'); toastBox.setAttribute('role', 'status'); toastBox.setAttribute('aria-live', 'polite'); d.body.appendChild(toastBox); }
    var t = el('div', 'toast'), x = el('button', '', '\u00d7');
    x.type = 'button'; x.setAttribute('aria-label', 'Tutup notifikasi');
    t.appendChild(el('span', '', msg)); t.appendChild(x); toastBox.appendChild(t);
    function close() { if (t.parentNode) t.parentNode.removeChild(t); }
    x.addEventListener('click', close); setTimeout(close, 3500);
  }

  /* Salin ke clipboard + fallback */
  function legacyCopy(text) {
    var ta = el('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
    d.body.appendChild(ta); ta.select(); var ok = false;
    try { ok = d.execCommand('copy'); } catch (e) {}
    d.body.removeChild(ta); return ok;
  }
  function copy(text) {
    var p = (navigator.clipboard && navigator.clipboard.writeText) ? navigator.clipboard.writeText(text) : Promise.reject();
    return p.catch(function () { if (!legacyCopy(text)) throw new Error('copy'); });
  }

  /* Tema gelap/terang */
  var bar = $('.topbar-in');
  if (bar) {
    var tb = el('button', 'icon-btn'); tb.type = 'button';
    var setTheme = function (t) {
      root.dataset.theme = t;
      tb.textContent = t === 'dark' ? '\u2600' : '\u263E';
      var l = t === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap';
      tb.setAttribute('aria-label', l); tb.title = l;
    };
    setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
    tb.addEventListener('click', function () {
      var n = root.dataset.theme === 'dark' ? 'light' : 'dark'; setTheme(n); store('tema', n);
    });
    bar.appendChild(tb);
  }

  /* Indikator navigasi */
  var nav = $('.topbar .nav-utama');
  if (nav) {
    var ind = el('span', 'nav-ind'); ind.setAttribute('aria-hidden', 'true'); nav.insertBefore(ind, nav.firstChild);
    var cur = $('a[aria-current]', nav);
    var move = function (a) {
      if (!a) return;
      ind.style.width = a.offsetWidth + 'px'; ind.style.height = a.offsetHeight + 'px';
      ind.style.transform = 'translate(' + a.offsetLeft + 'px,' + a.offsetTop + 'px)';
    };
    var place = function () { move(cur); };
    place(); requestAnimationFrame(function () { ind.classList.add('ready'); });
    if (cur) nav.scrollLeft = cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2;
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(place);
    addEventListener('resize', place);
    $$('a', nav).forEach(function (a) {
      a.addEventListener('mouseenter', function () { move(a); });
      a.addEventListener('focus', function () { move(a); });
      a.addEventListener('mouseleave', place);
      a.addEventListener('blur', place);
    });
  }

  /* Transisi halaman halus (hanya tautan internal biasa) */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || reduce || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target || a.hasAttribute('download') || a.hasAttribute('aria-current')) return;
    if (!/^[\w-]+\.html(#.*)?$/.test(a.getAttribute('href'))) return;
    e.preventDefault(); d.body.classList.add('leaving');
    setTimeout(function () { location.href = a.href; }, 160);
  });
  addEventListener('pageshow', function () { d.body.classList.remove('leaving'); });

  /* Progress scroll / progress baca */
  var prog = el('div', 'progress'); prog.setAttribute('aria-hidden', 'true'); d.body.appendChild(prog);
  var art = $('.post-jurnal'), ticking = false;
  function update() {
    ticking = false; var p;
    if (art) { var r = art.getBoundingClientRect(); p = -r.top / Math.max(1, r.height - innerHeight * 0.5); }
    else { var h = root.scrollHeight - innerHeight; p = h > 0 ? (window.pageYOffset / h) : 0; }
    prog.style.transform = 'scaleX(' + Math.max(0, Math.min(1, p)) + ')';
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update); update();

  /* Tombol kembali ke atas */
  var fab = el('button', 'fab', '\u2191'); fab.type = 'button';
  fab.setAttribute('aria-label', 'Kembali ke atas'); fab.title = 'Kembali ke atas'; d.body.appendChild(fab);
  fab.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  if ('IntersectionObserver' in window) {
    var sent = el('div'); sent.setAttribute('aria-hidden', 'true');
    sent.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:400px;pointer-events:none;visibility:hidden';
    d.body.appendChild(sent);
    new IntersectionObserver(function (en) { fab.classList.toggle('on', !en[0].isIntersecting); }).observe(sent);
  } else { fab.classList.add('on'); }

  /* Reveal saat masuk viewport */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { threshold: 0.02, rootMargin: '0px 0px -4% 0px' });
    $$('.card:not(.hero):not(.profile-hero),.widget,.tabel-wrap,.post-jurnal,.browser').forEach(function (n) { n.classList.add('reveal'); io.observe(n); });
    root.classList.add('js');
  }

  /* Blok kode: jendela editor + tombol salin */
  $$('pre').forEach(function (pre) {
    var code = (pre.querySelector('code') || pre).textContent;
    var w = el('div', 'code-window'), b = el('div', 'code-bar');
    var dots = el('span', 'dots'); dots.setAttribute('aria-hidden', 'true'); dots.innerHTML = '<i></i><i></i><i></i>';
    var btn = el('button', 'copy-btn', 'Salin'); btn.type = 'button'; btn.title = 'Salin kode ke papan klip';
    b.appendChild(dots); b.appendChild(el('span', 'lang', /^\s*<\?php/.test(code) ? 'PHP' : 'HTML')); b.appendChild(btn);
    pre.parentNode.insertBefore(w, pre); w.appendChild(b); w.appendChild(pre); pre.tabIndex = 0;
    btn.addEventListener('click', function () {
      copy(code).then(function () {
        btn.textContent = 'Tersalin \u2713'; btn.classList.add('done'); toast('Kode berhasil disalin.');
        setTimeout(function () { btn.textContent = 'Salin'; btn.classList.remove('done'); }, 1800);
      }, function () { toast('Gagal menyalin. Blok kode lalu tekan Ctrl+C.'); });
    });
  });

  /* Fallback media gagal dimuat */
  d.addEventListener('error', function (e) {
    var t = e.target; if (!t || !t.tagName) return; var n = t.tagName;
    if (n === 'IMG') { t.classList.add('img-failed'); return; }
    if (n !== 'SOURCE' && n !== 'VIDEO' && n !== 'AUDIO') return;
    var m = n === 'SOURCE' ? t.parentNode : t;
    if (n === 'SOURCE' && t.nextElementSibling && t.nextElementSibling.tagName === 'SOURCE') return;
    if (!m || m.dataset.failed) return; m.dataset.failed = '1';
    var note = el('p', 'media-note'); note.setAttribute('role', 'status');
    note.appendChild(el('span', '', 'Media tidak dapat dimuat. Periksa koneksi internet, lalu coba lagi.'));
    var r = el('button', 'btn', 'Coba lagi'); r.type = 'button'; note.appendChild(r);
    r.addEventListener('click', function () { m.dataset.failed = ''; if (note.parentNode) note.parentNode.removeChild(note); try { m.load(); } catch (x) {} });
    m.insertAdjacentElement('afterend', note);
  }, true);

  /* Galeri: frame demo ala browser */
  var fr = $('iframe[name="proyektor-karya"]');
  if (fr) {
    var links = $$('.demo-links a'), url = fr.getAttribute('src'), timer;
    var win = el('div', 'browser'), tbar = el('div', 'browser-bar'), view = el('div', 'browser-view');
    var dots2 = el('span', 'dots'); dots2.setAttribute('aria-hidden', 'true'); dots2.innerHTML = '<i></i><i></i><i></i>';
    var addr = el('span', 'addr', url); addr.setAttribute('aria-live', 'polite');
    var rf = el('button', 'icon-btn', '\u21BB'); rf.type = 'button'; rf.setAttribute('aria-label', 'Muat ulang pratinjau'); rf.title = 'Muat ulang pratinjau';
    var load = el('div', 'loading'); load.hidden = true; load.appendChild(el('span', 'spin')); load.appendChild(el('span', 'sr', 'Memuat pratinjau'));
    tbar.appendChild(dots2); tbar.appendChild(addr); tbar.appendChild(rf);
    fr.parentNode.insertBefore(win, fr); win.appendChild(tbar); win.appendChild(view); view.appendChild(fr); view.appendChild(load);
    var busy = function () { load.hidden = false; clearTimeout(timer); timer = setTimeout(function () { load.hidden = true; }, 10000); };
    var mark = function () { links.forEach(function (a) { var on = a.getAttribute('href') === url; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); };
    fr.addEventListener('load', function () { clearTimeout(timer); load.hidden = true; });
    links.forEach(function (a) { a.addEventListener('click', function () { url = a.getAttribute('href'); addr.textContent = url; mark(); busy(); }); });
    rf.addEventListener('click', function () { busy(); fr.src = url; toast('Pratinjau dimuat ulang.'); });
    mark();
  }

  /* Blog: waktu baca, bagikan, validasi komentar */
  var meta = $('.post-jurnal .meta');
  if (meta) {
    var words = $$('.babak-cerita').map(function (s) { return s.textContent; }).join(' ').trim().split(/\s+/).length;
    var tools = el('div', 'post-tools');
    tools.appendChild(el('span', 'chip', '\u2248 ' + Math.max(1, Math.ceil(words / 200)) + ' menit baca'));
    var sh = el('button', 'btn', 'Bagikan artikel'); sh.type = 'button'; sh.title = 'Bagikan artikel ini'; tools.appendChild(sh);
    meta.parentNode.insertBefore(tools, meta.nextSibling);
    sh.addEventListener('click', function () {
      if (navigator.share) { navigator.share({ title: d.title, url: location.href }).catch(function () {}); return; }
      copy(location.href).then(function () { toast('Tautan artikel disalin.'); }, function () { toast('Gagal menyalin tautan.'); });
    });
  }
  var form = $('#form-komentar');
  if (form) {
    var msg = $('#pesan-komentar'), nama = $('#nama-komentar'), isi = $('#isi-komentar');
    form.insertBefore(el('p', 'hint', 'Catatan: formulir ini hanya simulasi di browser. Komentar tidak dikirim atau disimpan di server.'), $('button[type="submit"]', form));
    var setErr = function (inp, text) {
      var id = inp.id + '-err', e = d.getElementById(id);
      if (!text) { inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); if (e) e.parentNode.removeChild(e); return; }
      if (!e) { e = el('p', 'err'); e.id = id; inp.parentNode.insertBefore(e, inp.nextSibling); }
      e.textContent = '\u26A0 ' + text; inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', id);
    };
    var check = function () {
      var bad = [], n = nama.value.trim(), c = isi.value.trim();
      setErr(nama, n ? '' : 'Nama wajib diisi.'); if (!n) bad.push(nama);
      var ce = !c ? 'Komentar wajib diisi.' : (c.length < 5 ? 'Komentar minimal 5 karakter.' : '');
      setErr(isi, ce); if (ce) bad.push(isi);
      return bad;
    };
    [nama, isi].forEach(function (i) { i.addEventListener('input', function () { if (i.getAttribute('aria-invalid')) check(); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = check();
      if (bad.length) { msg.className = 'fail'; msg.textContent = 'Komentar belum terkirim. Periksa kolom yang ditandai.'; bad[0].focus(); return; }
      msg.className = 'ok'; msg.textContent = 'Makasih, ' + nama.value.trim() + '! Komentarmu sudah diterima.';
      form.reset(); toast('Simulasi tampilan: komentar tidak disimpan di server.');
    });
  }
})();
