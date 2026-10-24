/*
 * Selector de idioma (es / en / pt).
 * - El español es el texto original del HTML; cada página define window.I18N = { en: {...}, pt: {...} }
 *   (y opcionalmente es: {...} para textos que solo existen en JS).
 * - Elementos traducibles: data-i18n="clave" (reemplaza innerHTML)
 *   y data-i18n-attr="atributo:clave;otro:clave" (reemplaza atributos).
 * - La elección se guarda en localStorage; la primera visita muestra el pop-up.
 * - Si existe un [data-lang-slot], el botón se inserta ahí; si no, queda fijo arriba a la derecha.
 * - Expone window.t(clave) y dispara el evento 'langchange' en window.
 */
(() => {
  const KEY = 'tandem-lang';
  const LANGS = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' },
  ];
  const dict = window.I18N || {};
  const valid = (l) => LANGS.some(x => x.code === l);
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (l) => { try { localStorage.setItem(KEY, l); } catch (e) {} };

  const stored = read();
  let lang = valid(stored) ? stored : 'es';

  const t = (key) => {
    const v = dict[lang] && dict[lang][key];
    return v != null ? v : (dict.es && dict.es[key] != null ? dict.es[key] : key);
  };
  window.t = t;

  // textos originales (español) de cada elemento, para poder volver a ellos
  const originalHTML = new WeakMap();
  const originalAttr = new WeakMap();

  const apply = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (!originalHTML.has(el)) originalHTML.set(el, el.innerHTML);
      const v = lang !== 'es' && dict[lang] && dict[lang][el.dataset.i18n];
      el.innerHTML = v != null && v !== false ? v : originalHTML.get(el);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      if (!originalAttr.has(el)) originalAttr.set(el, {});
      const orig = originalAttr.get(el);
      el.dataset.i18nAttr.split(';').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (!attr || !key) return;
        if (!(attr in orig)) orig[attr] = el.getAttribute(attr);
        const v = lang !== 'es' && dict[lang] && dict[lang][key];
        el.setAttribute(attr, v != null && v !== false ? v : orig[attr]);
      });
    });
    switchLabel.textContent = lang.toUpperCase();
    modal.querySelectorAll('.lang-modal__option').forEach(b => {
      b.classList.toggle('is-current', b.dataset.lang === lang);
    });
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  };

  /* ---------- estilos ---------- */
  const css = `
  .lang-switch { position: fixed; top: 18px; right: 20px; z-index: 40; display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: 30px; cursor: pointer; font: 700 0.7rem/1 'Helvetica Neue', 'Inter', system-ui, sans-serif;
    letter-spacing: 0.2em; color: #F8FAFC; background: rgba(22, 30, 46, 0.85); border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    transition: border-color 0.3s ease, transform 0.3s ease; }
  .lang-switch:hover { border-color: #FF5277; transform: translateY(-1px); }
  .lang-switch svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.6; }
  .lang-switch--inline { position: static; box-shadow: none; }

  html.lang-open, html.lang-open body { overflow: hidden !important; }
  .lang-modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;
    background: rgba(5, 8, 14, 0.55); backdrop-filter: blur(14px) saturate(0.8); -webkit-backdrop-filter: blur(14px) saturate(0.8);
    opacity: 0; transition: opacity 0.35s ease; }
  .lang-modal[hidden] { display: none; }
  .lang-modal.is-visible { opacity: 1; }
  .lang-modal__box { position: relative; width: 100%; max-width: 420px; padding: 40px 32px 32px; text-align: center; border-radius: 22px; overflow: hidden;
    color: #F8FAFC; font-family: 'Helvetica Neue', 'Inter', system-ui, sans-serif;
    background: rgba(17, 23, 36, 0.96); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
    transform: translateY(16px) scale(0.97); transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1); }
  .lang-modal.is-visible .lang-modal__box { transform: none; }
  .lang-modal__box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #FF5277, #A855F7, #FF7A00); }
  .lang-modal__close { position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
    background: transparent; border: 1px solid rgba(255, 255, 255, 0.12); color: #94A3B8; font-size: 18px; line-height: 1; }
  .lang-modal__close:hover { color: #F8FAFC; border-color: rgba(255, 255, 255, 0.3); }
  .lang-modal__icon { width: 34px; height: 34px; margin: 0 auto 18px; color: #FF5277; }
  .lang-modal__icon svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.4; }
  .lang-modal__title { font-size: 1.5rem; font-weight: 300; letter-spacing: 0.02em; margin-bottom: 8px; }
  .lang-modal__sub { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: #64748B; line-height: 1.9; margin-bottom: 28px; }
  .lang-modal__options { display: flex; flex-direction: column; gap: 10px; }
  .lang-modal__option { display: flex; align-items: center; gap: 16px; width: 100%; padding: 16px 20px; border-radius: 14px; cursor: pointer;
    font: inherit; color: #F8FAFC; text-align: left; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);
    transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease; }
  .lang-modal__option:hover, .lang-modal__option:focus-visible { border-color: #FF5277; background: rgba(255, 82, 119, 0.08); transform: translateX(3px); outline: none; }
  .lang-modal__option.is-current { border-color: rgba(255, 82, 119, 0.6); }
  .lang-modal__code { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; color: #FF5277; width: 26px; }
  .lang-modal__name { flex: 1; font-size: 1rem; }
  .lang-modal__check { opacity: 0; color: #FF5277; }
  .lang-modal__option.is-current .lang-modal__check { opacity: 1; }
  @media (max-width: 480px) {
    .lang-modal__box { padding: 36px 20px 22px; }
    .lang-switch { top: 12px; right: 12px; }
  }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- botón ---------- */
  const GLOBE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>';
  const switchBtn = document.createElement('button');
  switchBtn.type = 'button';
  switchBtn.className = 'lang-switch';
  switchBtn.setAttribute('aria-label', 'Idioma · Language · Idioma');
  switchBtn.innerHTML = GLOBE + '<span></span>';
  const switchLabel = switchBtn.querySelector('span');
  const slot = document.querySelector('[data-lang-slot]');
  if (slot) { switchBtn.classList.add('lang-switch--inline'); slot.appendChild(switchBtn); }
  else document.body.appendChild(switchBtn);

  /* ---------- pop-up ---------- */
  const modal = document.createElement('div');
  modal.className = 'lang-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'lang-modal-title');
  modal.innerHTML = `
    <div class="lang-modal__box">
      <button type="button" class="lang-modal__close" aria-label="Cerrar">&times;</button>
      <div class="lang-modal__icon">${GLOBE}</div>
      <h2 class="lang-modal__title" id="lang-modal-title">Elegí tu idioma</h2>
      <p class="lang-modal__sub">Choose your language<br>Escolha seu idioma</p>
      <div class="lang-modal__options">
        ${LANGS.map(l => `<button type="button" class="lang-modal__option" data-lang="${l.code}" lang="${l.code}">
          <span class="lang-modal__code">${l.code.toUpperCase()}</span>
          <span class="lang-modal__name">${l.name}</span>
          <span class="lang-modal__check" aria-hidden="true">&#10003;</span>
        </button>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(modal);
  const closeBtn = modal.querySelector('.lang-modal__close');
  const options = [...modal.querySelectorAll('.lang-modal__option')];

  // en la primera visita hay que elegir sí o sí: sin botón de cerrar
  let mustChoose = false;
  const open = (required) => {
    mustChoose = required;
    closeBtn.hidden = required;
    modal.hidden = false;
    document.documentElement.classList.add('lang-open');
    requestAnimationFrame(() => modal.classList.add('is-visible'));
    (options.find(o => o.dataset.lang === lang) || options[0]).focus();
  };
  const close = () => {
    modal.classList.remove('is-visible');
    document.documentElement.classList.remove('lang-open');
    setTimeout(() => { modal.hidden = true; }, 350);
    switchBtn.focus({ preventScroll: true });
  };
  const choose = (l) => {
    lang = l;
    save(l);
    apply();
    close();
  };

  options.forEach(o => o.addEventListener('click', () => choose(o.dataset.lang)));
  closeBtn.addEventListener('click', close);
  switchBtn.addEventListener('click', () => open(false));
  modal.addEventListener('click', (e) => { if (e.target === modal && !mustChoose) close(); });
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mustChoose) { e.preventDefault(); close(); return; }
    // flechas para moverse entre opciones; Tab queda dentro del pop-up
    const i = options.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = (i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[n].focus();
    }
    if (e.key === 'Tab') {
      const focusables = [...modal.querySelectorAll('button:not([hidden])')];
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    e.stopPropagation();
  });

  apply();
  if (!valid(stored)) open(true);
})();
