(function () {
  const menuMarkup = `
    <div class="site-menu-title">
      <div><small>PAUSE / SITE MENU</small><b>冒険メニュー</b></div>
      <button type="button" data-menu-close aria-label="サイトメニューを閉じる">×</button>
    </div>
    <nav>
      <a href="/#top"><span>01</span><b>トップ</b><small>冒険島のスタート地点</small></a>
      <a href="/#guide"><span>02</span><b>初心者ガイド</b><small>Tシャツ作りの基本装備</small></a>
      <a href="/#topics"><span>03</span><b>島を選ぶ</b><small>テーマ別の攻略マップ</small></a>
      <a href="/#articles"><span>04</span><b>記事一覧</b><small>全10ミッションを読む</small></a>
      <a href="/prices/"><span>05</span><b>料金目安</b><small>プリントイメージで参考価格を見る</small></a>
      <a href="/works/"><span>06</span><b>制作事例</b><small>プリント装備を見る</small></a>
      <a href="/faq/"><span>07</span><b>よくある質問</b><small>冒険者の酒場で疑問を解決</small></a>
      <a class="menu-estimate" href="/estimate/"><span>GO</span><b>無料見積もり</b><small>分かる項目だけで相談OK</small></a>
      <a class="menu-line line-contact-link" href="https://lin.ee/YDuYZbM" target="_blank" rel="noopener"><span>裏</span><b>公式LINEで相談</b><small>クリアできないときの救済ルート</small></a>
    </nav>
    <div class="site-menu-sub"><a href="/about/">運営者情報</a><a href="/contact/">お問い合わせ</a><a href="/privacy/">プライバシー</a></div>
  `;

  let toggle = document.querySelector('.site-menu-toggle');
  let menu = document.getElementById('site-menu');
  let backdrop = document.querySelector('.site-menu-backdrop');

  if (!toggle) {
    const header = document.querySelector('.game-header');
    if (!header) return;

    let actions = header.querySelector('.header-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'header-actions';
      const headerCta = Array.from(header.children).find((element) =>
        element.matches && element.matches('a.pixel-button.small')
      );
      if (headerCta) actions.appendChild(headerCta);
      header.appendChild(actions);
    }

    toggle = document.createElement('button');
    toggle.className = 'site-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'サイトメニューを開く');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'site-menu');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    actions.appendChild(toggle);
  }

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'site-menu-backdrop';
    backdrop.setAttribute('data-menu-close', '');
    backdrop.hidden = true;
    document.body.appendChild(backdrop);
  }

  if (!menu) {
    menu = document.createElement('aside');
    menu.className = 'site-menu';
    menu.id = 'site-menu';
    menu.setAttribute('aria-label', 'サイトメニュー');
    menu.hidden = true;
    menu.innerHTML = menuMarkup;
    document.body.appendChild(menu);
  }

  const setOpen = (open) => {
    menu.hidden = !open;
    backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'サイトメニューを閉じる' : 'サイトメニューを開く');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      const firstLink = menu.querySelector('a');
      if (firstLink) firstLink.focus();
    } else {
      toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.querySelectorAll('[data-menu-close]').forEach((button) =>
    button.addEventListener('click', () => setOpen(false))
  );
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  menu.querySelectorAll('.line-contact-link').forEach((link) =>
    link.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {event_category: 'site_menu', event_label: 'official_line'});
      }
    })
  );
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  });
})();
