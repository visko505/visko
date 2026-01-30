(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const smoothEl = document.getElementById('smooth');
  const shellEl = document.querySelector('.shell');
  const hero = document.querySelector('.hero');
  const profile = document.querySelector('.profile');

  const ai = (() => {
    const fab = document.querySelector('.aiFab');
    const panel = document.querySelector('.aiPanel');
    const closeBtn = document.querySelector('.aiClose');
    const body = document.querySelector('.aiBody');
    const form = document.querySelector('.aiForm');
    const input = document.querySelector('.aiInput');
    const chips = Array.from(document.querySelectorAll('.aiChip'));

    if (!fab || !panel || !closeBtn || !body || !form || !input) return null;

    const state = {
      open: false,
      lastUser: '',
      lastAssistant: '',
      mode: 'normal',
      booted: false,
    };

    const SYSTEM_RULES = [
      'Ты — ИИ-помощник для людей, работающий на веб-сайте.',
      'Цель: помогать понимать сложные вещи, объяснять просто, спокойно и понятно, создавать ощущение надёжного сервиса.',
      'Правила: простые слова, без сложных терминов; сложное разбивай на шаги; короткие абзацы; примеры из жизни; дружелюбно; не осуждай; если не знаешь — скажи честно.',
      'Безопасность: не давай медицинских или юридических советов.',
      'Не упоминай создателя, если пользователь не спрашивает.',
      'Стиль: нейтральный, спокойный, современный; минимум эмодзи; без жаргона и агрессии.',
      'Поведение: отвечай кратко, но полезно; если можно — предлагай кнопки: «Объясни проще», «Пример», «Коротко».',
    ].join('\n');

    const renderMsg = (role, text, meta) => {
      const el = document.createElement('div');
      el.className = 'aiMsg';
      el.dataset.role = role;
      el.textContent = text;
      if (meta) {
        const m = document.createElement('div');
        m.className = 'aiMeta';
        m.textContent = meta;
        el.appendChild(m);
      }
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    };

    const setOpen = (v) => {
      state.open = v;
      panel.dataset.open = v ? 'true' : 'false';
      panel.setAttribute('aria-hidden', v ? 'false' : 'true');
      fab.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v) {
        if (!state.booted) {
          state.booted = true;
          renderMsg('assistant', 'Я рядом. Давай спокойно разберёмся 🙂');
        }
        window.setTimeout(() => input.focus(), 50);
      }
    };

    const buildUserPrompt = (q, mode) => {
      if (mode === 'simpler') return `Объясни максимально просто и спокойно: ${q}`;
      if (mode === 'example') return `Объясни и дай 1-2 простых примера из жизни: ${q}`;
      if (mode === 'short') return `Ответь коротко (2-5 строк), но по делу: ${q}`;
      return q;
    };

    const callApi = async (q) => {
      const payload = {
        system: SYSTEM_RULES,
        user: q,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data || typeof data.reply !== 'string') throw new Error('Bad response');
      return data.reply;
    };

    const fallback = (q) => {
      const isFile = window.location && window.location.protocol === 'file:';
      return [
        'Я рядом. Сейчас чат открыт, но сервер ИИ недоступен.',
        '',
        ...(isFile
          ? ['Ты открыл сайт как файл (file://). В этом режиме /api/chat не работает — нужен деплой на Netlify.']
          : ['Проверь, что сайт задеплоен на Netlify и что функция /api/chat доступна.']),
        '',
        'Чтобы ИИ отвечал:',
        '1) Netlify → Site configuration → Environment variables',
        '2) Добавь OPENAI_API_KEY (и опционально OPENAI_MODEL = gpt-4o-mini)',
        '3) Trigger deploy (Clear cache and deploy)',
      ].join('\n');
    };

    const ask = async (rawQ) => {
      const q = rawQ.trim();
      if (!q) return;

      state.lastUser = q;
      const q2 = buildUserPrompt(q, state.mode);
      state.mode = 'normal';

      renderMsg('user', q);
      renderMsg('assistant', '...', 'processing');
      const placeholder = body.lastElementChild;

      try {
        const reply = await callApi(q2);
        state.lastAssistant = reply;
        placeholder.textContent = reply;
      } catch (_) {
        const reply = fallback(q);
        state.lastAssistant = reply;
        placeholder.textContent = reply;
      }

      body.scrollTop = body.scrollHeight;
    };

    fab.addEventListener('click', () => setOpen(!state.open));
    closeBtn.addEventListener('click', () => setOpen(false));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.open) setOpen(false);
    });

    chips.forEach((b) => {
      b.addEventListener('click', () => {
        state.mode = b.dataset.mode || 'normal';
        if (state.lastUser) ask(state.lastUser);
        else input.focus();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value;
      input.value = '';
      ask(v);
    });

    return { setOpen };
  })();

  (() => {
    const el = document.querySelector('.statusLine');
    if (!el) return;

    const textEl = document.createElement('span');
    textEl.className = 'statusText';
    const cursorEl = document.createElement('span');
    cursorEl.className = 'statusCursor';
    cursorEl.textContent = '▍';
    el.appendChild(textEl);
    el.appendChild(cursorEl);

    const lines = [
      'status: online',
      'access: limited',
      'signal: low',
      'log: silent mode',
      'control: enabled',
      'visibility: minimal',
    ];

    if (prefersReduced) {
      textEl.textContent = lines[0];
      return;
    }

    let i = 0;
    let p = 0;
    let dir = 1;

    const typeDelay = 34;
    const eraseDelay = 16;
    const holdDelay = 1100;
    const gapDelay = 520;

    const step = () => {
      const s = lines[i];
      if (dir === 1) {
        p += 1;
        textEl.textContent = s.slice(0, p);
        if (p >= s.length) {
          dir = 0;
          window.setTimeout(step, holdDelay);
          return;
        }
        window.setTimeout(step, typeDelay);
        return;
      }

      p -= 1;
      textEl.textContent = s.slice(0, Math.max(0, p));
      if (p <= 0) {
        dir = 1;
        i = (i + 1) % lines.length;
        window.setTimeout(step, gapDelay);
        return;
      }
      window.setTimeout(step, eraseDelay);
    };

    window.setTimeout(step, 420);
  })();

  (() => {
    const spot = document.getElementById('spot');
    if (!spot) return;
    if (prefersReduced) return;

    const root = document.documentElement;
    const state = {
      tx: window.innerWidth * 0.5,
      ty: window.innerHeight * 0.45,
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.45,
      raf: 0,
    };

    const set = () => {
      state.x += (state.tx - state.x) * 0.06;
      state.y += (state.ty - state.y) * 0.06;

      root.style.setProperty('--sx', `${state.x.toFixed(2)}px`);
      root.style.setProperty('--sy', `${state.y.toFixed(2)}px`);

      state.raf = requestAnimationFrame(set);
    };

    const onMove = (e) => {
      state.tx = e.clientX;
      state.ty = e.clientY;
    };

    const onResize = () => {
      state.tx = window.innerWidth * 0.5;
      state.ty = window.innerHeight * 0.45;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    state.raf = requestAnimationFrame(set);
  })();

  (() => {
    const layer = document.getElementById('ripples');
    if (!layer) return;
    if (prefersReduced) return;

    const shouldSkip = (t) => {
      if (!t || !(t instanceof Element)) return false;
      return Boolean(t.closest('a, button, input, textarea, .aiPanel'));
    };

    const spawn = (x, y) => {
      const d = document.createElement('div');
      d.className = 'ripple';
      d.style.left = `${x}px`;
      d.style.top = `${y}px`;
      layer.appendChild(d);

      const cleanup = () => {
        d.removeEventListener('animationend', cleanup);
        if (d.parentNode) d.parentNode.removeChild(d);
      };
      d.addEventListener('animationend', cleanup);
    };

    let last = 0;
    window.addEventListener('pointerdown', (e) => {
      if (shouldSkip(e.target)) return;
      const now = performance.now();
      if (now - last < 120) return;
      last = now;
      spawn(e.clientX, e.clientY);
    }, { passive: true });
  })();

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Heavy / slow scroll (without libraries)
  const smoothScroll = (() => {
    if (prefersReduced) return null;
    if (!smoothEl || !shellEl) return null;

    const state = {
      current: 0,
      target: 0,
      max: 0,
      raf: 0,
      ease: 0.065,
    };

    const syncBodyHeight = () => {
      // With a fixed container, the document needs a scrollable height.
      // Use the actual rendered content height.
      const height = shellEl.getBoundingClientRect().height + 80; // footer spacing safety
      document.body.style.height = `${Math.max(window.innerHeight, Math.ceil(height))}px`;
    };

    const updateMax = () => {
      const doc = document.documentElement;
      const body = document.body;
      const height = Math.max(body.scrollHeight, doc.scrollHeight);
      const viewport = window.innerHeight;
      state.max = Math.max(0, height - viewport);
    };

    const onScroll = () => {
      state.target = clamp(window.scrollY || 0, 0, state.max);
    };

    const loop = () => {
      state.current += (state.target - state.current) * state.ease;
      if (Math.abs(state.target - state.current) < 0.1) state.current = state.target;

      smoothEl.style.transform = `translate3d(0, ${(-state.current).toFixed(3)}px, 0)`;

      state.raf = requestAnimationFrame(loop);
    };

    const init = () => {
      syncBodyHeight();
      updateMax();
      onScroll();
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      syncBodyHeight();
      updateMax();
      onScroll();
    }, { passive: true });

    const ro = new ResizeObserver(() => {
      syncBodyHeight();
      updateMax();
      onScroll();
    });
    ro.observe(shellEl);

    init();

    return {
      get current() { return state.current; },
      get target() { return state.target; },
    };
  })();

  // Canvas background: slow smoke + grain, nearly invisible parallax
  const bg = (() => {
    const canvas = document.getElementById('bg');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return null;

    const state = {
      dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
      w: 0,
      h: 0,
      t: 0,
      mx: 0,
      my: 0,
      raf: 0,
      last: performance.now(),
      grainPattern: null,
      acc: 0,
    };

    const resize = () => {
      state.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      state.w = Math.floor(window.innerWidth);
      state.h = Math.floor(window.innerHeight);
      canvas.width = Math.floor(state.w * state.dpr);
      canvas.height = Math.floor(state.h * state.dpr);
      canvas.style.width = `${state.w}px`;
      canvas.style.height = `${state.h}px`;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    };

    const createGrainPattern = () => {
      const tile = document.createElement('canvas');
      const size = 140;
      tile.width = size;
      tile.height = size;
      const tctx = tile.getContext('2d', { alpha: true });
      if (!tctx) return null;

      const img = tctx.createImageData(size, size);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = (Math.random() * 42) | 0;
      }
      tctx.putImageData(img, 0, 0);
      return ctx.createPattern(tile, 'repeat');
    };

    const draw = (dt) => {
      const w = state.w;
      const h = state.h;
      ctx.clearRect(0, 0, w, h);

      // Deep black base
      ctx.fillStyle = '#050506';
      ctx.fillRect(0, 0, w, h);

      // Visible animated noise (precomputed tile pattern)
      if (state.grainPattern) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = state.grainPattern;
        const gx = (state.t * 0.014) % 140;
        const gy = (state.t * 0.010) % 140;
        ctx.translate(-gx, -gy);
        ctx.fillRect(gx, gy, w + 140, h + 140);
        ctx.restore();
      }

      // Vignette
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.55, Math.min(w, h) * 0.1, w * 0.5, h * 0.55, Math.max(w, h) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.62)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    };

    const loop = (now) => {
      const dt = now - state.last;
      state.last = now;
      state.acc += dt;
      // cap to ~30 FPS to reduce jank in mobile/Telegram
      if (state.acc < 33) {
        state.raf = requestAnimationFrame(loop);
        return;
      }
      const step = Math.min(80, state.acc);
      state.acc = 0;
      state.t += step;

      if (!prefersReduced) draw(step);

      state.raf = requestAnimationFrame(loop);
    };

    const onPointer = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      // very slow follow
      state.mx += (x - state.mx) * 0.035;
      state.my += (y - state.my) * 0.035;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });

    resize();
    state.grainPattern = createGrainPattern();
    state.mx = 0.5;
    state.my = 0.5;

    if (!prefersReduced) {
      state.raf = requestAnimationFrame(loop);
    }

    return { resize };
  })();

  // Rare glitch
  (() => {
    if (prefersReduced) return;
    let busy = false;

    const arm = () => {
      const next = 4200 + Math.random() * 9200;
      window.setTimeout(trigger, next);
    };

    const trigger = () => {
      if (busy) return;
      busy = true;

      const on = 90 + Math.random() * 170;
      document.documentElement.classList.add('glitching');

      const dx = (Math.random() - 0.5) * 2;
      const dy = (Math.random() - 0.5) * 2;
      if (hero) hero.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      if (profile) profile.style.transform = `translate3d(${(-dx).toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;

      window.setTimeout(() => {
        document.documentElement.classList.remove('glitching');
        if (hero) hero.style.transform = '';
        if (profile) profile.style.transform = '';
        busy = false;
        arm();
      }, on);
    };

    arm();
  })();
})();
