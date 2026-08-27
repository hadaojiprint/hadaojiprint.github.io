(() => {
  const main = document.querySelector('main');
  if (!main) return;

  const stages = [...main.querySelectorAll('section[id]')].filter(
    stage => stage.offsetParent !== null
  );
  if (!stages.length) return;

  const nav = document.createElement('div');
  nav.className = 'scroll-quest';
  nav.setAttribute('aria-label', 'スクロール進行ナビゲーション');
  nav.innerHTML = [
    '<div class="quest-progress" aria-hidden="true"><span class="quest-progress-fill"></span></div>',
    '<div class="quest-copy" aria-live="polite"><small>ADVENTURE 00%</small><strong>NEXT STAGE</strong></div>',
    '<button class="quest-next" type="button" aria-label="次のステージへ移動">▼</button>'
  ].join('');
  document.body.append(nav);
  document.body.classList.add('has-scroll-quest');

  const fill = nav.querySelector('.quest-progress-fill');
  const status = nav.querySelector('.quest-copy small');
  const label = nav.querySelector('.quest-copy strong');
  const button = nav.querySelector('.quest-next');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let target = stages[0];
  let ticking = false;

  const titleOf = stage => {
    const heading = stage.querySelector('h2');
    return heading ? heading.textContent.trim().replace(/\s+/g, ' ') : 'NEXT STAGE';
  };

  const update = () => {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - innerHeight);
    const progress = Math.min(100, Math.max(0, Math.round(scrollY / max * 100)));
    const checkpoint = scrollY + innerHeight * 0.48;
    target = stages.find(stage => stage.offsetTop > checkpoint) || null;
    const clear = !target && progress > 92;

    if (innerWidth <= 760) {
      fill.style.width = progress + '%';
      fill.style.height = '';
    } else {
      fill.style.height = progress + '%';
      fill.style.width = '';
    }
    status.textContent = clear ? 'MISSION CLEAR!' : 'ADVENTURE ' + String(progress).padStart(2, '0') + '%';
    label.textContent = clear ? '島の入口へ戻る' : 'NEXT: ' + titleOf(target || stages[stages.length - 1]);
    button.textContent = clear ? '▲' : '▼';
    button.setAttribute('aria-label', clear ? 'ページ上部へ戻る' : '次のステージへ移動');
    nav.classList.toggle('is-clear', clear);
    nav.classList.toggle('is-visible', scrollY > 70 || innerWidth <= 760);
    ticking = false;
  };

  button.addEventListener('click', () => {
    const destination = nav.classList.contains('is-clear') ? document.body : target;
    destination?.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'start'});
  });

  addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, {passive: true});
  addEventListener('resize', update, {passive: true});
  update();
})();
