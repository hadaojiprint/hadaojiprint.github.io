(function () {
  const toggle = document.querySelector('.site-menu-toggle');
  const menu = document.getElementById('site-menu');
  const backdrop = document.querySelector('.site-menu-backdrop');
  if (!toggle || !menu || !backdrop) return;

  const setOpen = (open) => {
    menu.hidden = !open;
    backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'サイトメニューを閉じる' : 'サイトメニューを開く');
    document.body.classList.toggle('menu-open', open);
    if (open) menu.querySelector('a').focus();
    else toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.querySelectorAll('[data-menu-close]').forEach((button) => button.addEventListener('click', () => setOpen(false)));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  });
})();
