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
    '<button class="quest-sound" type="button" aria-label="効果音をオンにする" aria-pressed="false" title="SOUND OFF">♪</button>',
    '<button class="quest-next" type="button" aria-label="次のステージへ移動">▼</button>'
  ].join('');
  document.body.append(nav);
  document.body.classList.add('has-scroll-quest');

  const fill = nav.querySelector('.quest-progress-fill');
  const status = nav.querySelector('.quest-copy small');
  const label = nav.querySelector('.quest-copy strong');
  const soundButton = nav.querySelector('.quest-sound');
  const button = nav.querySelector('.quest-next');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COIN_KEY = 'wearprint-coins';
  const CLEAR_KEY = 'wearprint-coin-clears';
  const ARTICLE_CLEAR_KEY = 'wearprint-article-clears';
  const path = location.pathname.replace(/index\.html$/, '');
  const articlePaths = [
    '/articles/one-shirt/',
    '/articles/dtf-vs-silk/',
    '/articles/thirty-shirts-price/',
    '/articles/print-size-position/',
    '/articles/canva-to-shirt/',
    '/articles/cvt-vs-act/',
    '/articles/low-resolution-image/',
    '/articles/team-shirts/',
    '/articles/start-apparel-brand/',
    '/articles/ai-image-print/'
  ];
  const isArticle = path.startsWith('/articles/');
  const reward = path.startsWith('/articles/')
    ? {threshold: 72, label: 'ARTICLE CLEAR'}
    : path.startsWith('/prices/')
      ? {threshold: 55, label: 'PRICE CHECK'}
      : path.startsWith('/works/')
        ? {threshold: 60, label: 'GEAR DISCOVERY'}
        : path.startsWith('/faq/')
          ? {threshold: 60, label: 'HINT FOUND'}
          : null;

  let coins = 1;
  let cleared = {};
  let articleClears = {};
  try {
    const savedCoins = Number(localStorage.getItem(COIN_KEY));
    if (Number.isFinite(savedCoins) && savedCoins >= 0) coins = savedCoins;
    else localStorage.setItem(COIN_KEY, String(coins));
    cleared = JSON.parse(localStorage.getItem(CLEAR_KEY) || '{}') || {};
    articleClears = JSON.parse(localStorage.getItem(ARTICLE_CLEAR_KEY) || '{}') || {};
  } catch {}

  const coinStyle = document.createElement('style');
  coinStyle.textContent = `
    .coin-hud-float{position:fixed;top:86px;right:14px;z-index:28;background:#172a20;color:#fff;border:3px solid #ffd76a;box-shadow:4px 4px #814520;padding:8px 10px;font:900 11px/1.1 "Courier New",monospace;letter-spacing:.05em;pointer-events:none}
    .coin-toast{position:fixed;left:50%;top:18%;z-index:120;transform:translate(-50%,-20px);opacity:0;background:#172a20;color:#fff;border:4px solid #ffd76a;box-shadow:7px 7px #814520;padding:15px 20px;text-align:center;font:900 12px/1.5 "Courier New",monospace;transition:.18s;pointer-events:none}
    .coin-toast b{display:block;color:#ffd76a;font-size:19px;margin-top:3px}
    .coin-toast.is-show{opacity:1;transform:translate(-50%,0)}
    .adventure-book{position:fixed;left:14px;bottom:18px;z-index:27;background:#172a20;color:#fff;border:3px solid #ffd76a;box-shadow:4px 4px #814520;padding:9px 11px;font:900 10px/1.35 "Courier New",monospace;letter-spacing:.03em;pointer-events:none}
    .adventure-book small{display:block;color:#ffd76a;font-size:8px}.adventure-book b{font-size:12px}
    .article-clear-badge{display:inline-block;margin-left:8px;padding:3px 6px;background:#172a20;color:#ffd76a;border:2px solid #814520;font:900 9px/1 "Courier New",monospace;vertical-align:middle}
    .article-list article.is-cleared{outline:4px solid #159447;outline-offset:-4px}.article-list article.is-cleared .level{color:#0a6d36}.article-list article.is-cleared a{background:#159447;color:#fff}
    .scroll-walker{position:fixed;right:22px;bottom:82px;z-index:108;width:94px;height:141px;padding:0;border:0;background:transparent;cursor:pointer;transform-origin:center bottom;-webkit-tap-highlight-color:transparent}
    .walker-sprite{display:block;width:100%;height:100%;background-repeat:no-repeat;background-size:500% 100%;background-position:0 0;image-rendering:pixelated}
    .scroll-walker:focus-visible{outline:4px solid #ffd400;outline-offset:4px}
    .scroll-walker.is-walking{animation:walker-bob .34s steps(2,end) infinite}
    .scroll-walker.is-walking .walker-sprite{animation:walker-feet .34s steps(1,end) infinite}
    .scroll-walker.is-victory{animation:none}
    .scroll-walker.is-victory .walker-sprite{animation:none;background-position:100% 0}
    .scroll-walker.is-jumping{animation:walker-jump .52s steps(6,end)}
    .scroll-walker.is-jumping .walker-sprite{animation:none;background-position:50% 0}
    .scroll-walker.is-coin{animation:walker-double-jump .9s steps(9,end)}
    .scroll-walker.is-coin .walker-sprite{animation:none;background-position:75% 0}
    @keyframes walker-feet{0%,49%{background-position:0 0}50%,100%{background-position:25% 0}}
    @keyframes walker-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    @keyframes walker-jump{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-28px) scale(1.04)}70%{transform:translateY(-9px) scale(.98)}}
    @keyframes walker-double-jump{0%,100%{transform:translateY(0)}20%,65%{transform:translateY(-24px) rotate(-3deg)}38%,82%{transform:translateY(0) rotate(3deg)}}
    @media(max-width:760px){.coin-hud-float{top:74px;right:8px;font-size:10px;padding:7px 9px}.coin-toast{width:min(86vw,340px);top:14%}.adventure-book{left:8px;bottom:70px;padding:7px 9px}.scroll-walker{right:10px;bottom:72px;width:68px;height:102px}}
    @media(prefers-reduced-motion:reduce){.scroll-walker,.walker-sprite{animation:none!important;transition:none!important}}
  `;
  document.head.append(coinStyle);

  const floatingCoin = document.createElement('div');
  floatingCoin.className = 'coin-hud-float';
  floatingCoin.setAttribute('aria-live', 'polite');
  if (!document.querySelector('.game-hud')) document.body.append(floatingCoin);

  const CHARACTER_KEY = 'wearprint-walker-character';
  const characters = {
    hadaoji: {src: '/public/hadaoji-actions-v1.png', name: 'ハダオジくん'},
    yuu: {src: '/public/yuu-actions-v1.png', name: 'ゆうちゃん'}
  };
  let activeCharacter = 'hadaoji';
  try {
    const savedCharacter = localStorage.getItem(CHARACTER_KEY);
    if (savedCharacter && characters[savedCharacter]) activeCharacter = savedCharacter;
  } catch {}

  const walker = document.createElement('button');
  walker.className = 'scroll-walker';
  walker.type = 'button';
  walker.innerHTML = '<span class="walker-sprite" aria-hidden="true"></span>';
  const walkerSprite = walker.querySelector('.walker-sprite');
  const paintWalker = () => {
    const character = characters[activeCharacter];
    walkerSprite.style.backgroundImage = `url("${character.src}")`;
    walker.setAttribute('aria-label', character.name + 'をクリックしてキャラクターを切り替える');
    walker.title = character.name + ' / CLICK CHANGE';
  };
  let reactionTimer;
  const playWalkerReaction = (className, duration) => {
    clearTimeout(reactionTimer);
    walker.classList.remove('is-jumping', 'is-coin');
    void walker.offsetWidth;
    walker.classList.add(className);
    reactionTimer = setTimeout(() => walker.classList.remove(className), duration);
  };
  paintWalker();
  document.body.append(walker);

  const coinToast = document.createElement('div');
  coinToast.className = 'coin-toast';
  coinToast.setAttribute('role', 'status');
  document.body.append(coinToast);

  const adventureBook = document.createElement('div');
  adventureBook.className = 'adventure-book';
  adventureBook.setAttribute('aria-live', 'polite');
  document.body.append(adventureBook);

  const countArticleClears = () => articlePaths.filter(articlePath => articleClears[articlePath]).length;

  const refreshArticlePaths = async () => {
    try {
      const response = await fetch('/sitemap.xml', {cache: 'no-store'});
      if (!response.ok) return;
      const xml = await response.text();
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const discovered = [...doc.querySelectorAll('url > loc')]
        .map(node => {
          try { return new URL(node.textContent.trim()).pathname.replace(/index\.html$/, ''); }
          catch { return ''; }
        })
        .filter(p => p.startsWith('/articles/'));
      const unique = [...new Set(discovered)];
      if (unique.length) {
        articlePaths = unique;
        paintAdventureBook();
      }
    } catch {}
  };

  const paintAdventureBook = () => {
    const count = countArticleClears();
    adventureBook.innerHTML = `<small>冒険の書</small><b>CLEAR ${String(count).padStart(2, '0')} / ${articlePaths.length}</b>`;

    document.querySelectorAll('.article-list article').forEach(card => {
      const link = card.querySelector('a[href*="/articles/"]');
      if (!link) return;
      const resolved = new URL(link.href, location.href).pathname.replace(/index\.html$/, '');
      const done = Boolean(articleClears[resolved]);
      card.classList.toggle('is-cleared', done);
      const level = card.querySelector('.level');
      if (level) {
        let badge = level.querySelector('.article-clear-badge');
        if (done && !badge) {
          badge = document.createElement('span');
          badge.className = 'article-clear-badge';
          badge.textContent = 'CLEAR';
          level.append(badge);
        }
        if (!done && badge) badge.remove();
      }
    });
  };

  const markArticleClear = () => {
    if (!isArticle || articleClears[path]) return;
    articleClears[path] = Date.now();
    try {
      localStorage.setItem(ARTICLE_CLEAR_KEY, JSON.stringify(articleClears));
    } catch {}
    paintAdventureBook();
    if (typeof gtag === 'function') {
      gtag('event', 'article_clear', {page_path: path, cleared_articles: countArticleClears()});
    }
  };

  const paintCoins = () => {
    const value = String(coins).padStart(2, '0');
    const gameHudCoins = document.querySelector('.game-hud span:nth-child(2)');
    if (gameHudCoins) gameHudCoins.textContent = `COIN × ${value}`;
    floatingCoin.textContent = `🪙 COIN × ${value}`;
  };

  const showCoinToast = rewardLabel => {
    coinToast.innerHTML = `${rewardLabel}<b>🪙 COIN +1</b>`;
    coinToast.classList.add('is-show');
    setTimeout(() => coinToast.classList.remove('is-show'), 1800);
  };

  let soundOn = false;
  try {
    soundOn = localStorage.getItem('wearprint-sound') === 'on';
  } catch {}
  let audioContext;
  let wasClear = false;
  let target = stages[0];
  let ticking = false;

  const getAudio = () => {
    if (!audioContext) {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return null;
      audioContext = new AudioEngine({latencyHint: 'interactive'});
    }
    return audioContext;
  };

  const unlockAudio = async () => {
    if (!soundOn) return false;
    const audio = getAudio();
    if (!audio) return false;
    if (audio.state !== 'running') {
      try {
        await audio.resume();
      } catch {
        return false;
      }
    }
    return audio.state === 'running';
  };

  const tone = (frequency, duration = 0.06, delay = 0, volume = 0.025) => {
    if (!soundOn) return;
    const audio = getAudio();
    if (!audio || audio.state !== 'running') return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  };

  const playSelect = () => tone(520, 0.045, 0, 0.018);
  const playStep = () => {
    tone(440, 0.055, 0);
    tone(660, 0.065, 0.055);
  };
  const playClear = () => {
    tone(523, 0.08, 0);
    tone(659, 0.08, 0.08);
    tone(784, 0.14, 0.16);
  };
  const playCoin = () => {
    tone(988, 0.05, 0, 0.03);
    tone(1319, 0.08, 0.055, 0.03);
  };

  const awardCoin = () => {
    if (!reward || cleared[path]) return;
    cleared[path] = Date.now();
    coins += 1;
    try {
      localStorage.setItem(COIN_KEY, String(coins));
      localStorage.setItem(CLEAR_KEY, JSON.stringify(cleared));
    } catch {}
    paintCoins();
    showCoinToast(reward.label);
    playWalkerReaction('is-coin', 900);
    playCoin();
    if (typeof gtag === 'function') {
      gtag('event', 'coin_earned', {coin_total: coins, reward_type: reward.label, page_path: path});
    }
  };

  const paintSoundButton = () => {
    soundButton.classList.toggle('is-on', soundOn);
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.setAttribute('aria-label', soundOn ? '効果音をオフにする' : '効果音をオンにする');
    soundButton.title = soundOn ? 'SOUND ON' : 'SOUND OFF';
  };

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

    if (reward && progress >= reward.threshold) awardCoin();
    if (isArticle && progress >= 72) markArticleClear();

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
    walker.classList.toggle('is-victory', clear);
    if (clear && !wasClear) playClear();
    wasClear = clear;
    ticking = false;
  };

  button.addEventListener('click', async () => {
    if (await unlockAudio()) playStep();
    const destination = nav.classList.contains('is-clear') ? document.body : target;
    destination?.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'start'});
  });

  soundButton.addEventListener('click', async () => {
    soundOn = !soundOn;
    try {
      localStorage.setItem('wearprint-sound', soundOn ? 'on' : 'off');
    } catch {}
    paintSoundButton();
    if (soundOn) {
      if (await unlockAudio()) playStep();
    }
  });

  document.addEventListener('pointerdown', async event => {
    const choice = event.target.closest('.article-list a,.stage-grid a,.steps a,.pixel-button,.secret-route-link');
    if (choice && choice !== button && choice !== soundButton && await unlockAudio()) playSelect();
  }, {passive: true});

  document.querySelectorAll('.secret-route-link').forEach(link => link.addEventListener('click', () => {
    if (typeof gtag === 'function') gtag('event', 'generate_lead', {event_category: 'secret_route', event_label: 'official_line'});
  }));

  walker.addEventListener('click', async () => {
    playWalkerReaction('is-jumping', 520);
    setTimeout(() => {
      activeCharacter = activeCharacter === 'hadaoji' ? 'yuu' : 'hadaoji';
      try { localStorage.setItem(CHARACTER_KEY, activeCharacter); } catch {}
      paintWalker();
    }, 210);
    if (await unlockAudio()) playSelect();
  });

  let walkTimer;
  addEventListener('scroll', () => {
    walker.classList.add('is-walking');
    clearTimeout(walkTimer);
    walkTimer = setTimeout(() => walker.classList.remove('is-walking'), 140);
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, {passive: true});
  addEventListener('resize', update, {passive: true});
  paintCoins();
  paintAdventureBook();
  refreshArticlePaths();
  paintSoundButton();
  update();
})();
