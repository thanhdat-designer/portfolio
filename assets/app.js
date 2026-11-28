(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = window.PF || { items: [], featured: {} };
  if (window.PF_FEATURED) D.featured = Object.assign({}, D.featured, window.PF_FEATURED);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOVER = matchMedia('(hover: hover)').matches;

  /* language */
  let lang = 'en';
  try {
    lang = localStorage.getItem('pf-lang') || ((navigator.language || '').startsWith('vi') ? 'vi' : 'en');
  } catch (e) {}
  const T = {
    en: { vid: 'Video ad', gif: 'GIF / motion', img: 'Design', lp: 'Landing page', all: 'All', items: 'pieces', more: 'Show more', open: 'Open', of: 'of' },
    vi: { vid: 'Video ads', gif: 'GIF / motion', img: 'Thiết kế', lp: 'Landing page', all: 'Tất cả', items: 'sản phẩm', more: 'Xem thêm', open: 'Mở', of: '/' }
  };
  const t = k => T[lang][k] || k;
  function setLang(l) {
    lang = l;
    document.documentElement.lang = l;
    try { localStorage.setItem('pf-lang', l); } catch (e) {}
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l));
    const ti = document.documentElement.dataset[l === 'vi' ? 'titleVi' : 'titleEn'];
    if (ti) document.title = ti;
    document.dispatchEvent(new Event('langchange'));
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

  /* menu */
  const burger = $('.burger'), links = $('.links');
  if (burger) {
    burger.addEventListener('click', () => {
      const o = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', o);
    });
    links.addEventListener('click', e => {
      if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', false); }
    });
  }

  /* media helpers */
  const M = it => 'm/' + it.id;
  const isV = it => it.type === 'vid' || it.type === 'gif';
  const alt = it => (it.title ? it.title + ' – ' : '') + it.client + ' · ' + t(it.type);

  function tile(it, list, cls) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile ' + (cls || '');
    b.setAttribute('aria-label', t('open') + ': ' + alt(it));
    const im = new Image();
    im.loading = 'lazy'; im.decoding = 'async'; im.alt = alt(it); im.src = M(it) + '_t.webp';
    if (!cls) b.style.setProperty('--ar', Math.min(1.9, Math.max(0.56, it.w / it.h)).toFixed(3));
    b.appendChild(im);
    if (isV(it)) {
      const p = document.createElement('span');
      p.className = 'play'; p.setAttribute('aria-hidden', 'true');
      b.appendChild(p);
      const wh = document.createElement('span'); wh.className = 'who'; wh.setAttribute('aria-hidden', 'true'); wh.textContent = it.client; b.appendChild(wh);
      if (HOVER && !RM) {
        let v;
        b.addEventListener('pointerenter', () => {
          if (!v) {
            v = document.createElement('video');
            v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
            v.src = M(it) + '_p.mp4';
            b.insertBefore(v, p);
          }
          v.style.display = '';
          v.play().catch(() => {});
        });
        b.addEventListener('pointerleave', () => { if (v) { v.pause(); v.style.display = 'none'; } });
      }
    }
    b.addEventListener('click', () => LB.open(list, list.indexOf(it)));
    return b;
  }

  /* lightbox */
  const LB = (function () {
    const d = document.createElement('dialog');
    d.className = 'lb';
    d.setAttribute('aria-label', 'Viewer');
    d.innerHTML = '<div class="lb-top"><span class="lb-info"></span><button class="lb-b lb-x" aria-label="Close">✕</button></div>' +
      '<button class="lb-b lb-prev" aria-label="Previous">←</button><div class="lb-stage"></div><button class="lb-b lb-next" aria-label="Next">→</button>';
    document.body.appendChild(d);
    let list = [], i = 0;
    const lbl = () => { const v = lang === 'vi'; $('.lb-x', d).setAttribute('aria-label', v ? 'Đóng' : 'Close'); $('.lb-prev', d).setAttribute('aria-label', v ? 'Trước' : 'Previous'); $('.lb-next', d).setAttribute('aria-label', v ? 'Sau' : 'Next'); };
    lbl(); document.addEventListener('langchange', lbl);
    const st = $('.lb-stage', d), info = $('.lb-info', d);
    function show() {
      const it = list[i];
      st.innerHTML = '';
      if (isV(it)) {
        const v = document.createElement('video');
        v.src = M(it) + '.mp4'; v.controls = true; v.playsInline = true; v.poster = M(it) + '_t.webp';
        v.loop = it.type === 'gif'; v.muted = it.type === 'gif'; v.autoplay = !RM;
        st.appendChild(v);
      } else {
        const im = new Image();
        im.alt = alt(it); im.src = M(it) + '.webp';
        st.appendChild(im);
      }
      info.textContent = it.client + ' · ' + t(it.type) + (it.genre && GL[it.genre] ? ' · ' + GL[it.genre] : '') + ' · ' + (i + 1) + ' ' + t('of') + ' ' + list.length;
    }
    function go(n) { i = (i + n + list.length) % list.length; show(); }
    $('.lb-x', d).onclick = () => d.close();
    $('.lb-prev', d).onclick = () => go(-1);
    $('.lb-next', d).onclick = () => go(1);
    d.addEventListener('close', () => { st.innerHTML = ''; });
    d.addEventListener('click', e => { if (e.target === d || e.target === st) d.close(); });
    d.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
    return { open(l, k) { list = l; i = Math.max(0, k); show(); d.showModal(); } };
  })();

  const GL = { drama: 'Drama ad', ugc: 'UGC ad', cartoon: 'Cartoon ad', footage: 'Footage ad', sing: 'Sing ad', promo: 'Motion promo ad' };
  const byId = Object.fromEntries(D.items.map(x => [x.id, x]));
  const pick = ids => (ids || []).map(i => byId[i]).filter(Boolean);

  /* landing */
  const hv = $('#hero-v');
  if (hv) {
    const L = pick(D.featured.hero).slice(0, 2);
    const vids = [];
    L.forEach(it => {
      const b = tile(it, L, 'v34');
      if (!RM) {
        const v = document.createElement('video');
        v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'metadata';
        v.poster = M(it) + '_t.webp'; v.src = M(it) + '_p.mp4';
        b.insertBefore(v, b.querySelector('.play'));
        vids.push(v);
      }
      hv.appendChild(b);
    });
    const pb = $('#hero-pause');
    if (pb) {
      if (RM) pb.hidden = true;
      let on = true;
      pb.addEventListener('click', () => {
        on = !on;
        vids.forEach(v => (on ? v.play() : v.pause()));
        pb.setAttribute('aria-pressed', !on);
        pb.querySelector('[data-l=en]').textContent = on ? 'Pause videos' : 'Play videos';
        pb.querySelector('[data-l=vi]').textContent = on ? 'Dừng video' : 'Phát video';
      });
    }
  }
  const reel = $('#reel-grid');
  if (reel) { const L = pick(D.featured.reel); L.forEach(it => reel.appendChild(tile(it, L, 'v916'))); }
  const ag = $('#ads-grid');
  if (ag) { const L = pick(D.featured.ads); L.forEach(it => ag.appendChild(tile(it, L, 'v916'))); }
  const sg = $('#social-grid');
  if (sg) { const L = pick(D.featured.social); L.forEach(it => sg.appendChild(tile(it, L, 'v45'))); }
  const so = $('#social-oly-grid');
  if (so) { const L = pick(D.featured.social_oly); L.forEach(it => so.appendChild(tile(it, L, 'v45'))); }
  const sr = $('#showreel-v'), srb = $('#showreel-pause');
  if (sr && srb) {
    if (RM) { sr.removeAttribute('autoplay'); sr.pause(); sr.controls = true; srb.hidden = true; }
    srb.addEventListener('click', () => {
      const on = sr.paused;
      on ? sr.play() : sr.pause();
      srb.setAttribute('aria-pressed', !on);
      srb.querySelector('[data-l=en]').textContent = on ? 'Pause showreel' : 'Play showreel';
      srb.querySelector('[data-l=vi]').textContent = on ? 'Dừng showreel' : 'Phát showreel';
    });
  }
  const wg = $('#wall-grid');
  if (wg) {
    const pool = pick(D.featured.wall);
    const ar = it => it.w / it.h;
    const LAY = [
      [1100, [1.18, .84, 1.06, .8, 1.2, .92], [0, 56, 18, 84, 30, 64], 880],
      [700, [1.15, .85, 1.08, .92], [0, 48, 16, 64], 900],
      [480, [1.1, .86, 1.04], [0, 36, 14], 900],
      [0, [1.08, .92], [0, 34], 1050]
    ];
    const layFor = () => LAY.find(l => innerWidth >= l[0]);
    let cells = [], cur = null;
    const build = () => {
      const L = layFor();
      if (L === cur) return;
      cur = L;
      wg.textContent = '';
      cells = [];
      const ws = L[1], sum = ws.reduce((a, b) => a + b, 0);
      const gap = innerWidth <= 560 ? 8 : 14;
      const W = wg.clientWidth - gap * (ws.length - 1);
      const rest = pool.slice().sort(() => Math.random() - .5);
      ws.forEach((w, ci) => {
        const col = document.createElement('div');
        col.className = 'wcol';
        col.style.flex = w + ' 1 0';
        col.style.marginTop = L[2][ci] + 'px';
        const cw = W * w / sum, room = L[3] - L[2][ci];
        let h = 0, prev = 0;
        while (rest.length) {
          const left = room - h;
          if (left < cw * .45) break;
          let bi = -1, bs = 1e9;
          for (let k = 0; k < Math.min(rest.length, 14); k++) {
            const r = ar(rest[k]), th = cw / r;
            let s = Math.random() * 60 + (Math.abs(r - prev) < .05 ? 400 : 0);
            if (th > left + cw * .25) s += 1000 + th;
            if (s < bs) { bs = s; bi = k; }
          }
          const it = rest.splice(bi, 1)[0];
          if (cw / ar(it) > left + cw * .6 && h > 0) break;
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'tile';
          const im = new Image();
          im.decoding = 'async';
          b.appendChild(im);
          const cell = { b, im, it: null };
          cell.set = x => { cell.it = x; b.style.aspectRatio = x.w + '/' + x.h; cell.im.src = M(x) + '_t.webp'; cell.im.alt = alt(x); b.setAttribute('aria-label', t('open') + ': ' + alt(x)); };
          cell.set(it);
          b.addEventListener('click', () => LB.open(pool, pool.indexOf(cell.it)));
          col.appendChild(b);
          cells.push(cell);
          h += cw / ar(it) + gap;
          prev = ar(it);
        }
        wg.appendChild(col);
      });
    };
    build();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    let on = !RM, last = -1, vis = false;
    const swap = () => {
      if (!on || !vis || document.hidden || cells.length < 2) return;
      const taken = cells.map(c => c.it);
      const order = cells.slice().sort(() => Math.random() - .5);
      const want = Math.max(3, Math.round(cells.length * .6));
      const jobs = [];
      for (const c of order) {
        if (jobs.length >= want) break;
        const free = pool.filter(it => !taken.includes(it) && Math.abs(ar(it) - ar(c.it)) < .03);
        if (!free.length) continue;
        const it = free[Math.floor(Math.random() * free.length)];
        taken.push(it);
        jobs.push([c, it]);
      }
      let left = jobs.length;
      const go = () => {
        if (--left) return;
        const x0 = wg.getBoundingClientRect();
        jobs.forEach(j => { const r = j[0].b.getBoundingClientRect(); j[2] = (r.left - x0.left) * .55 + (r.top - x0.top) * .3; });
        jobs.forEach(([c, it, d]) => setTimeout(() => {
          if (!cells.includes(c)) return;
          const old = c.im, im = new Image();
          im.decoding = 'async';
          im.className = 'in';
          c.im = im;
          c.b.appendChild(im);
          c.set(it);
          requestAnimationFrame(() => requestAnimationFrame(() => im.classList.add('on')));
          setTimeout(() => old.remove(), 1300);
        }, d));
      };
      jobs.forEach(j => { const pre = new Image(); j[3] = pre; pre.onload = pre.onerror = go; pre.src = M(j[1]) + '_t.webp'; });
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(wg); else vis = true;
    setInterval(swap, 5200);
    const wp = $('#wall-pause');
    if (wp) {
      if (RM) wp.hidden = true;
      wp.addEventListener('click', () => {
        on = !on;
        wp.setAttribute('aria-pressed', !on);
        wp.querySelector('[data-l=en]').textContent = on ? 'Pause shuffle' : 'Resume shuffle';
        wp.querySelector('[data-l=vi]').textContent = on ? 'Dừng đổi ảnh' : 'Tiếp tục đổi ảnh';
      });
    }
  }
  /* product stacks */
  const RB = it => { const r = it.w / it.h; return r > 0.9 ? ['1:1', 1] : r > 0.7 ? ['4:5', 0.8] : ['9:16', 0.5625]; };
  function mkStack(list, onClick) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'stack';
    const top = list.slice(0, 5), fa = RB(list[0])[1];
    const fan = document.createElement('span'); fan.className = 'fan'; fan.style.setProperty('--fa', fa);
    top.reverse().forEach(it => { const im = new Image(); im.loading = 'lazy'; im.decoding = 'async'; im.alt = ''; im.src = M(it) + '_t.webp'; fan.appendChild(im); });
    const h = document.createElement('span'); h.className = 'stack-n';
    const c = document.createElement('span'); c.className = 'stack-c';
    b.append(fan, h, c);
    b.addEventListener('click', onClick);
    return { b, h, c };
  }
  const SET = (function () {
    let d, body, ttl, cnt, cur = null;
    function build() {
      d = document.createElement('dialog');
      d.className = 'set';
      d.innerHTML = '<div class="set-top"><div><h2 class="set-t"></h2><p class="set-c"></p></div><button class="lb-b set-x" type="button">✕</button></div><div class="set-body"></div>';
      document.body.appendChild(d);
      body = $('.set-body', d); ttl = $('.set-t', d); cnt = $('.set-c', d);
      $('.set-x', d).onclick = () => d.close();
      d.addEventListener('click', e => { if (e.target === d) d.close(); });
      d.addEventListener('close', () => { body.innerHTML = ''; cur = null; });
      document.addEventListener('langchange', () => { if (cur) fill(); });
    }
    function fill() {
      const vi = lang === 'vi';
      $('.set-x', d).setAttribute('aria-label', vi ? 'Đóng' : 'Close');
      ttl.textContent = cur.name;
      body.innerHTML = '';
      const a0 = (D.about || {})[cur.name], ab = a0 ? a0[vi ? 1 : 0] + ' · ' : '';
      const w = document.createElement('div');
      if (cur.groups.length > 1) {
        cnt.textContent = ab + cur.groups.length + (vi ? ' bộ · ' : ' sets · ') + cur.list.length + (vi ? ' ảnh quảng cáo' : ' ad images');
        w.className = 'stacks in';
        cur.groups.forEach((g, i) => {
          const s = mkStack(g.list, () => LB.open(g.list, 0));
          s.h.textContent = g.tag || ((vi ? 'Bộ ' : 'Set ') + String(i + 1).padStart(2, '0'));
          s.c.textContent = g.ratio + ' · ' + g.list.length + (vi ? ' ảnh' : ' ads');
          s.b.setAttribute('aria-label', (vi ? 'Xem ' : 'View ') + s.h.textContent + ', ' + s.c.textContent);
          w.appendChild(s.b);
        });
      } else {
        cnt.textContent = ab + cur.list.length + (vi ? ' ảnh quảng cáo' : ' ad images');
        w.className = 'grid';
        cur.list.forEach(it => w.appendChild(tile(it, cur.list)));
      }
      body.appendChild(w);
    }
    return { open(name, list, groups) { if (!d) build(); cur = { name, list, groups }; fill(); d.showModal(); body.scrollTop = 0; } };
  })();
  $$('.stacks').forEach(el => {
    const brand = el.dataset.brand, max = +el.dataset.max || 99;
    const pref = (D.featured.wall || []);
    const rank = id => { const k = pref.indexOf(id); return k < 0 ? 1e6 : k; };
    const by = {};
    D.items.filter(x => x.brand === brand && x.type === 'img').forEach(x => (by[x.client] = by[x.client] || []).push(x));
    Object.keys(by).sort((a, b) => by[b].length - by[a].length).slice(0, max).forEach(name => {
      const list = by[name].slice().sort((a, b) => rank(a.id) - rank(b.id));
      const gm = {};
      list.forEach(it => { const k = (it.g || '') + '|' + RB(it)[0]; (gm[k] = gm[k] || { key: k, ratio: RB(it)[0], tag: (D.sets || {})[k] || (D.sets || {})[it.g || ''], list: [] }).list.push(it); });
      const groups = Object.values(gm).sort((a, b) => a.key < b.key ? -1 : 1);
      const s = mkStack(list, () => SET.open(name, list, groups));
      s.h.textContent = name;
      const lab = () => { const vi = lang === 'vi'; s.c.textContent = (groups.length > 1 ? groups.length + (vi ? ' bộ · ' : ' sets · ') : '') + list.length + (vi ? ' ảnh' : ' ads'); s.b.setAttribute('aria-label', (vi ? 'Mở bộ ảnh: ' : 'Open set: ') + name + ', ' + s.c.textContent); };
      lab(); document.addEventListener('langchange', lab);
      el.appendChild(s.b);
    });
  });
  /* branding tiles: cycle that part's designs on hover */
  $$('.rbx.b7 .rt').forEach(a => {
    const s = $$('.sl', a); if (s.length < 2) return;
    let i = 0, t = null;
    const go = n => { s[i].classList.remove('on'); i = n % s.length; s[i].classList.add('on'); };
    const start = () => { if (RM || t) return; go(i + 1); t = setInterval(() => go(i + 1), 1100); };
    const stop = () => { clearInterval(t); t = null; go(0); };
    a.addEventListener('mouseenter', start); a.addEventListener('mouseleave', stop);
    a.addEventListener('focus', start); a.addEventListener('blur', stop);
  });
  const gf = $('#gif-grid');
  if (gf) { const L = pick(D.featured.gifs); L.forEach(it => gf.appendChild(tile(it, L, 'v45'))); }
  $$('[data-mosaic]').forEach(el => {
    pick(D.featured[el.dataset.mosaic]).slice(0, 3).forEach(it => {
      const d = document.createElement('div');
      const im = new Image();
      im.loading = 'lazy'; im.alt = alt(it); im.src = M(it) + '_t.webp';
      d.appendChild(im); el.appendChild(d);
    });
  });
  $$('[data-thumbs]').forEach(el => {
    pick(D.featured[el.dataset.thumbs]).slice(0, 4).forEach(it => {
      const im = new Image();
      im.loading = 'lazy'; im.alt = ''; im.src = M(it) + '_t.webp';
      el.appendChild(im);
    });
  });
  $$('[data-count]').forEach(el => {
    const k = el.dataset.count;
    let n = D.items.length;
    if (k !== 'all') {
      n = 0;
      k.split(/,(?=[a-z*]+:)/).forEach(part => {
        const [b, ty] = part.split(':');
        n += D.items.filter(x => (b === '*' || x.brand === b) && (!ty || ty.split(',').includes(x.type))).length;
      });
    }
    el.textContent = n;
  });

  /* brand page */
  const g = $('#grid');
  if (g) {
    const brand = document.body.dataset.brand;
    const all = D.items.filter(x => x.brand === brand);
    const groups = (D.filters || {})[brand] || [];
    const state = {};
    try { new URLSearchParams(location.search).forEach((v, k) => { if (groups.some(gr => gr.field === k)) state[k] = v; }); } catch (e) {}
    const PAGE = 60;
    let shown = PAGE;
    const rows = $('#filters');
    const val = (it, f) => f === 'clientg' ? ((D.mainClients || []).includes(it.client) ? it.client : '_other') : it[f];
    const active = gr => !gr.when || state[gr.when[0]] === gr.when[1];
    const ok = (it, skip) => groups.every(gr => gr === skip || (skip && gr.when && gr.when[0] === skip.field) || !active(gr) || !state[gr.field] || val(it, gr.field) === state[gr.field]);
    const filtered = () => all.filter(it => ok(it));
    function draw() {
      const L = filtered();
      g.innerHTML = '';
      L.slice(0, shown).forEach(it => g.appendChild(tile(it, L)));
      $('#count').textContent = L.length + ' ' + t('items');
      const lm = $('#loadmore');
      lm.hidden = L.length <= shown;
      lm.textContent = t('more') + ' (' + (L.length - shown) + ')';
    }
    function drawFilters() {
      rows.innerHTML = '';
      const top = document.createElement('div');
      top.className = 'fbar';
      rows.appendChild(top);
      groups.forEach((gr, gi) => {
        if (!active(gr)) { state[gr.field] = ''; return; }
        const pool = all.filter(it => ok(it, gr));
        const opts = [{ k: '', en: gr.all_en || T.en.all, vi: gr.all_vi || T.vi.all }].concat(gr.opts)
          .map(o => ({ o, n: o.k ? pool.filter(it => val(it, gr.field) === o.k).length : (gr.when ? pool.filter(it => it[gr.field]).length : pool.length) }))
          .filter(x => !x.o.k || x.n || state[gr.field] === x.o.k);
        const pickOpt = k => { state[gr.field] = k; shown = PAGE; drawFilters(); draw(); };
        if (gr.ui === 'select') {
          const lab = document.createElement('label');
          lab.className = 'fsel';
          const sp = document.createElement('span');
          sp.textContent = gr[lang];
          const sel = document.createElement('select');
          opts.forEach(x => { const op = document.createElement('option'); op.value = x.o.k; op.textContent = x.o[lang] + ' (' + x.n + ')'; sel.appendChild(op); });
          sel.value = state[gr.field] || '';
          sel.onchange = () => pickOpt(sel.value);
          lab.appendChild(sp); lab.appendChild(sel);
          top.appendChild(lab);
          return;
        }
        const r = document.createElement('div');
        r.className = 'frow' + (gr.when ? ' g' : '');
        r.setAttribute('role', 'group');
        r.setAttribute('aria-label', gr[lang]);
        opts.forEach(x => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'fbtn';
          b.innerHTML = x.o[lang] + '<small>' + x.n + '</small>';
          b.setAttribute('aria-pressed', (state[gr.field] || '') === x.o.k);
          b.onclick = () => pickOpt(x.o.k);
          r.appendChild(b);
        });
        if (gr.when) rows.appendChild(r); else top.insertBefore(r, top.firstChild);
      });
    }
    $('#loadmore').onclick = () => { shown += PAGE; draw(); };
    drawFilters(); draw();
    document.addEventListener('langchange', () => { drawFilters(); draw(); });
  }
  setLang(lang);
})();
