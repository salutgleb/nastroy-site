// Поведение страницы «Настрой»: меню, переключатель слоёв с подсветкой строки таблицы, выбор жёсткости, форма без отправки данных.
(function () {
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('site-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      document.body.classList.toggle('menu-open', !open);
    });
    var closeMenu = function () {
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };
    menu.addEventListener('click', function (ev) { if (ev.target.closest('a')) closeMenu(); });
    // меню закрывается по Esc и по нажатию мимо него
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); }
    });
    // pointerdown, а не click: Safari на iPhone не доносит click от нажатия по обычному тексту до document
    document.addEventListener('pointerdown', function (ev) {
      if (!ev.target.closest('.site-menu, .menu-toggle')) closeMenu();
    });
  }

  // переключатель «3, 2, 1 слой»: двигает красную метку на линейке у фото, гасит лишние слои на разрезе
  // и подсвечивает строку таблицы высот; все переключатели на странице показывают одно и то же
  var segs = document.querySelectorAll('.seg');
  var measure = document.querySelector('.measure');
  var status = document.querySelector('[data-status]');
  function setLayers(n) {
    segs.forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.n) === n)); });
    document.querySelectorAll('.ruler-mark').forEach(function (m) {
      var on = Number(m.dataset.n) === n;
      m.classList.toggle('is-active', on);
      if (on && measure) measure.style.setProperty('--y', m.style.getPropertyValue('--y'));
    });
    if (status) status.textContent = n + ' ' + (n === 1 ? 'слой' : 'слоя');
    document.querySelectorAll('.section-svg .layer').forEach(function (r) {
      r.classList.toggle('is-off', Number(r.dataset.k) > n);
    });
    document.querySelectorAll('.spec tbody tr').forEach(function (tr) {
      tr.classList.toggle('is-active', Number(tr.dataset.layers) === n);
    });
  }
  segs.forEach(function (b) { b.addEventListener('click', function () { setLayers(Number(b.dataset.n)); }); });
  if (segs.length) setLayers(3);

  // выбор жёсткости в блоке «Как устроена» и в форме заявки один и тот же
  function sync(from, toName) {
    var target = document.querySelector('input[name="' + toName + '"][value="' + from.value + '"]');
    if (target) target.checked = true;
  }
  document.querySelectorAll('input[name="hardness-preview"]').forEach(function (r) {
    r.addEventListener('change', function () { sync(r, 'hardness'); });
  });
  document.querySelectorAll('input[name="hardness"]').forEach(function (r) {
    r.addEventListener('change', function () { sync(r, 'hardness-preview'); });
  });

  var form = document.querySelector('.order-form');
  var done = document.getElementById('order-done');
  if (!form || !done) return;
  function setError(input, errId, text) {
    var err = document.getElementById(errId);
    // подсказка под подписью (data-hint) остаётся в описании поля и при ошибке, и без неё
    var hint = input.getAttribute('data-hint') || '';
    if (text) {
      err.textContent = 'Ошибка: ' + text;
      err.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', (errId + ' ' + hint).trim());
    } else {
      err.hidden = true;
      input.removeAttribute('aria-invalid');
      if (hint) input.setAttribute('aria-describedby', hint);
      else input.removeAttribute('aria-describedby');
    }
    return !text;
  }
  // кнопка формы type=button: без скрипта форма ничего не отправляет; Enter в поле тоже проверяет форму
  var submitBtn = document.getElementById('f-submit');
  form.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.tagName === 'INPUT' && ev.target.type !== 'radio') { ev.preventDefault(); check(); }
  });
  form.addEventListener('submit', function (ev) { ev.preventDefault(); check(); });
  if (submitBtn) submitBtn.addEventListener('click', check);
  // поле с ошибкой ставим в середину экрана, чтобы липкая шапка не закрыла подпись над ним
  function focusField(el) {
    el.scrollIntoView({block: 'center'});
    el.focus({preventScroll: true});
  }
  // кнопки «Заказать» после отправки снова открывают чистую форму
  document.querySelectorAll('a[href="#order"]').forEach(function (a) {
    a.addEventListener('click', function () { if (!done.hidden) { done.hidden = true; form.hidden = false; } });
  });
  function check() {
    var name = form.elements.name;
    var contact = form.elements.contact;
    var qty = form.elements.qty;
    var value = contact.value.trim();
    var digits = value.replace(/\D/g, '').length;
    var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    // типографские дефисы и тире из мессенджеров (U+2010–U+2015, U+2212) и точки тоже разделители номера
    var isPhone = /^[\d\s()+\-\u2010-\u2015\u2212.]+$/.test(value) && digits >= 10 && digits <= 11;
    var count = Number(qty.value);
    var okName = setError(name, 'e-name', name.value.trim() ? '' : 'напишите, как к вам обращаться');
    var okContact = setError(contact, 'e-contact', (isEmail || isPhone) ? '' : 'нужен телефон из 10 или 11 цифр или почта с @');
    var okQty = setError(qty, 'e-qty', (Number.isInteger(count) && count >= 1) ? '' : 'укажите целое число подушек, от 1');
    if (!okName) { focusField(name); return; }
    if (!okContact) { focusField(contact); return; }
    if (!okQty) { focusField(qty); return; }
    // данные никуда не отправляются и не сохраняются: учебный проект; поля очищаются, чтобы ничего не осталось на странице
    form.reset();
    var picked = form.querySelector('input[name="hardness"]:checked');
    if (picked) sync(picked, 'hardness-preview');
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }
})();
