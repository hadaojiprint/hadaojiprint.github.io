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
  const TREASURE_KEY = 'wearprint-treasures-v1';
  const MASTER_KEY = 'wearprint-master-signature';
  const STAGE_TREASURE_KEY = 'wearprint-stage-treasures-v1';
  const HUNTER_KEY = 'wearprint-treasure-hunter-v1';
  const STAGE_QUESTS = [
    {id: 'volcano', name: 'プリント火山島', treasure: '炎のスキージ', articles: ['/articles/dtf-vs-silk/', '/articles/thirty-shirts-price/']},
    {id: 'beach', name: 'サイズの砂浜', treasure: '潮風の定規', articles: ['/articles/print-size-position/', '/articles/team-shirts/']},
    {id: 'forest', name: 'デザインの森', treasure: '黄金のデザインペン', articles: ['/articles/canva-to-shirt/', '/articles/low-resolution-image/', '/articles/ai-image-print/', '/articles/start-apparel-brand/']},
    {id: 'mountain', name: 'ボディの山', treasure: '伝説のTシャツ', articles: ['/articles/cvt-vs-act/', '/articles/one-shirt/']}
  ];
  const path = location.pathname.replace(/index\.html$/, '');
  let articlePaths = [
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
  let treasures = {};
  let awardedMasterSignature = '';
  let stageTreasures = {};
  let treasureHunter = false;
  try {
    const savedCoins = Number(localStorage.getItem(COIN_KEY));
    if (Number.isFinite(savedCoins) && savedCoins >= 0) coins = savedCoins;
    else localStorage.setItem(COIN_KEY, String(coins));
    cleared = JSON.parse(localStorage.getItem(CLEAR_KEY) || '{}') || {};
    articleClears = JSON.parse(localStorage.getItem(ARTICLE_CLEAR_KEY) || '{}') || {};
    treasures = JSON.parse(localStorage.getItem(TREASURE_KEY) || '{}') || {};
    awardedMasterSignature = localStorage.getItem(MASTER_KEY) || '';
    stageTreasures = JSON.parse(localStorage.getItem(STAGE_TREASURE_KEY) || '{}') || {};
    treasureHunter = localStorage.getItem(HUNTER_KEY) === '1';
  } catch {}

  const coinStyle = document.createElement('style');
  coinStyle.textContent = `
    .coin-hud-float{position:fixed;top:86px;right:14px;z-index:28;background:#172a20;color:#fff;border:3px solid #ffd76a;box-shadow:4px 4px #814520;padding:8px 10px;font:900 11px/1.1 "Courier New",monospace;letter-spacing:.05em;pointer-events:none}
    .coin-toast{position:fixed;left:50%;top:18%;z-index:120;transform:translate(-50%,-20px);opacity:0;background:#172a20;color:#fff;border:4px solid #ffd76a;box-shadow:7px 7px #814520;padding:15px 20px;text-align:center;font:900 12px/1.5 "Courier New",monospace;transition:.18s;pointer-events:none}
    .coin-toast b{display:block;color:#ffd76a;font-size:19px;margin-top:3px}
    .coin-toast.is-show{opacity:1;transform:translate(-50%,0)}
    .treasure-overlay{position:fixed;inset:0;z-index:135;display:grid;place-items:center;padding:20px;background:#0009;opacity:0;visibility:hidden;transition:opacity .16s steps(2,end);pointer-events:none}
    .treasure-overlay.is-show{opacity:1;visibility:visible}
    .treasure-card{width:min(88vw,390px);background:#172a20;color:#fff;border:5px solid #ffd76a;box-shadow:9px 9px #000;padding:20px 18px 18px;text-align:center;font-family:"Courier New",monospace;transform:translateY(24px) scale(.86);transition:transform .25s steps(4,end)}
    .treasure-overlay.is-show .treasure-card{transform:translateY(0) scale(1)}
    .treasure-label{display:block;color:#ffd76a;font-size:11px;font-weight:900;letter-spacing:.14em}
    .treasure-sprite{display:block;width:132px;height:132px;margin:7px auto 2px;background:url("/public/treasure-chest-v1.png") 0 0/200% 100% no-repeat;image-rendering:pixelated}
    .treasure-overlay.is-open .treasure-sprite{background-position:100% 0;animation:treasure-pop .42s steps(4,end)}
    .treasure-card strong{display:block;color:#fff36a;font-size:20px;line-height:1.2}
    .treasure-card small{display:block;margin-top:9px;color:#fff;font:800 11px/1.55 "Yu Gothic",sans-serif}
    .treasure-card em{display:inline-block;margin-top:12px;background:#ffd400;color:#111;padding:7px 10px;font-style:normal;font-size:11px;font-weight:900}
    @keyframes treasure-pop{0%{transform:translateY(8px) scale(.9)}60%{transform:translateY(-9px) scale(1.08)}100%{transform:translateY(0) scale(1)}}
    .page-transition{position:fixed;inset:0;z-index:999;display:grid;place-items:center;background-color:#050505;background-image:linear-gradient(#ffd40012 1px,transparent 1px),linear-gradient(90deg,#ffd40012 1px,transparent 1px);background-size:24px 24px;color:#fff;visibility:hidden;opacity:0;clip-path:inset(100% 0 0 0);pointer-events:none}
    .page-transition.is-leaving{visibility:visible;opacity:1;clip-path:inset(0);transition:clip-path .42s steps(8,end),opacity .08s linear}
    .page-transition.is-entering{visibility:visible;opacity:1;clip-path:inset(0)}
    .page-transition.is-entering.is-opening{clip-path:inset(0 0 100% 0);transition:clip-path .46s steps(8,end)}
    .transition-copy{min-width:230px;border:4px solid #ffd400;box-shadow:7px 7px #814520;background:#10241b;padding:18px 22px;text-align:center;font:900 12px/1.5 "Courier New",monospace;letter-spacing:.12em}
    .transition-copy b{display:block;margin-top:7px;color:#ffd400;font-size:17px}
    .transition-dots:after{content:"";animation:loading-dots .6s steps(3,end) infinite}
    @keyframes loading-dots{0%{content:""}33%{content:"."}66%{content:".."}100%{content:"..."}}
    .adventure-book{position:fixed;left:14px;bottom:18px;z-index:27;background:#172a20;color:#fff;border:3px solid #ffd76a;box-shadow:4px 4px #814520;padding:9px 11px;font:900 10px/1.35 "Courier New",monospace;letter-spacing:.03em;pointer-events:none}
    .adventure-book small{display:block;color:#ffd76a;font-size:8px}.adventure-book b{font-size:12px}.adventure-book em{display:block;margin-top:4px;color:#fff36a;font-style:normal;font-size:8px}.adventure-book.is-master{border-color:#fff36a;box-shadow:4px 4px #814520,0 0 0 3px #fff}.adventure-book.is-master em{color:#8affb8;font-size:9px}
    .master-overlay{position:fixed;inset:0;z-index:140;display:grid;place-items:center;padding:20px;background:#000b;opacity:0;visibility:hidden;transition:opacity .16s steps(2,end);pointer-events:none}
    .master-overlay.is-show{opacity:1;visibility:visible}
    .master-card{width:min(90vw,470px);background:#10241b;color:#fff;border:6px solid #ffd400;box-shadow:10px 10px #814520;padding:28px 22px;text-align:center;font-family:"Courier New",monospace;transform:scale(.72);transition:transform .42s steps(6,end)}
    .master-overlay.is-show .master-card{transform:scale(1)}
    .master-card small{display:block;color:#8affb8;font-size:10px;letter-spacing:.16em}.master-card strong{display:block;margin:12px 0 8px;color:#fff36a;font-size:clamp(28px,7vw,48px);line-height:1;text-shadow:4px 4px #814520}.master-card b{display:inline-block;margin-top:12px;background:#ffd400;color:#111;padding:8px 12px;font-size:11px}.master-stars{display:block;color:#ffd400;font-size:20px;letter-spacing:.25em;animation:master-flash .6s steps(2,end) infinite}
    @keyframes master-flash{50%{color:#fff;transform:scale(1.08)}}
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
    @media(max-width:760px){.coin-hud-float{top:74px;right:8px;font-size:10px;padding:7px 9px}.coin-toast{width:min(86vw,340px);top:14%}.adventure-book{left:8px;bottom:70px;padding:7px 9px}.scroll-walker{right:10px;bottom:72px;width:68px;height:102px}.treasure-card{padding:16px 14px}.treasure-sprite{width:112px;height:112px}.treasure-card strong{font-size:18px}.master-card{padding:22px 14px}.master-card strong{font-size:30px}}
    @media(prefers-reduced-motion:reduce){.scroll-walker,.walker-sprite{animation:none!important;transition:none!important}.page-transition{transition:none!important}.transition-dots:after{animation:none;content:"..."}.master-stars{animation:none}}
    .stage-treasure-progress{margin:13px 0 2px;padding:9px 8px;background:#fff7d4;color:#21170d;border:3px solid #71401f;text-align:left;font-family:"Courier New",monospace}
    .stage-treasure-progress small{display:block;color:#0a7140;font-size:8px}.stage-treasure-progress b{display:block;margin-top:4px;font-size:11px}.stage-treasure-progress em{display:block;margin-top:4px;color:#71401f;font-style:normal;font-size:9px}
    .stage-grid article.is-stage-clear{outline:5px solid #ffd400;outline-offset:-5px}.stage-grid article.is-stage-clear .stage-treasure-progress{background:#173c2d;color:#fff;border-color:#ffd400}.stage-grid article.is-stage-clear .stage-treasure-progress small,.stage-grid article.is-stage-clear .stage-treasure-progress em{color:#ffd400}
    .adventure-book .book-treasure{display:block;margin-top:5px;padding-top:4px;border-top:1px dashed #ffd76a;color:#8affb8;font-size:8px}.adventure-book.is-hunter{box-shadow:4px 4px #814520,0 0 0 3px #06c755}
    .stage-award-overlay{position:fixed;inset:0;z-index:142;display:grid;place-items:center;padding:20px;background:#000b;opacity:0;visibility:hidden;transition:opacity .16s steps(2,end);pointer-events:none}.stage-award-overlay.is-show{opacity:1;visibility:visible}
    .stage-award-card{width:min(90vw,430px);background:#10241b;color:#fff;border:6px solid #ffd400;box-shadow:10px 10px #814520;padding:24px 19px;text-align:center;font-family:"Courier New",monospace;transform:translateY(24px) scale(.8);transition:transform .36s steps(5,end)}.stage-award-overlay.is-show .stage-award-card{transform:translateY(0) scale(1)}
    .stage-award-item{width:158px;height:158px;margin:8px auto 2px}.stage-award-card small{display:block;color:#8affb8;font-size:9px;letter-spacing:.12em}.stage-award-card strong{display:block;color:#fff36a;font-size:clamp(23px,7vw,36px);line-height:1.1;text-shadow:4px 4px #814520}.stage-award-card p{margin:9px 0 0;font:800 12px/1.6 "Yu Gothic",sans-serif}.stage-award-card b{display:inline-block;margin-top:12px;padding:7px 10px;background:#ffd400;color:#111;font-size:10px}
    .hunter-overlay .master-card{border-color:#8affb8;box-shadow:10px 10px #064f2e}.hunter-overlay .master-card strong{color:#8affb8}.hunter-overlay .master-card b{background:#06c755;color:#fff}
    .adventure-book{pointer-events:auto;cursor:pointer;text-align:left;appearance:none;-webkit-appearance:none}.adventure-book:after{content:"TAP ▶ 宝物庫";display:block;margin-top:6px;color:#ffd76a;font-size:7px}.adventure-book:focus-visible{outline:4px solid #fff;outline-offset:4px}.treasure-vault-open{overflow:hidden}
    .treasure-vault{position:fixed;inset:0;z-index:150;display:grid;place-items:center;padding:16px;background:#000c;opacity:0;visibility:hidden;transition:opacity .16s steps(2,end)}.treasure-vault.is-show{opacity:1;visibility:visible}
    .treasure-vault-panel{width:min(94vw,760px);max-height:min(88vh,760px);overflow:auto;background:#fff7d4;color:#21170d;border:6px solid #ffd400;box-shadow:11px 11px #814520;padding:18px;font-family:"Courier New",monospace;transform:scale(.88);transition:transform .28s steps(4,end)}.treasure-vault.is-show .treasure-vault-panel{transform:scale(1)}
    .treasure-vault-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 14px;background:#173c2d;color:#fff}.treasure-vault-head small{display:block;color:#8affb8;font-size:8px}.treasure-vault-head strong{display:block;margin-top:4px;color:#ffd400;font-size:20px}.treasure-vault-close{display:grid;place-items:center;width:42px;height:42px;flex:0 0 auto;background:#ffd400;color:#111;border:4px solid #fff;font:900 24px/1 "Courier New",monospace;cursor:pointer}
    .treasure-vault-summary{margin:13px 0;padding:10px;background:#fff;color:#173c2d;border:3px solid #71401f;text-align:center;font-size:11px}.treasure-vault-summary b{color:#0a7140}
    .treasure-vault-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.vault-item{display:grid;grid-template-columns:86px 1fr;align-items:center;gap:10px;min-height:116px;padding:11px;background:#f1ead4;border:4px solid #8b7c68}.vault-item.is-owned{background:#173c2d;color:#fff;border-color:#ffd400;box-shadow:4px 4px #814520}.vault-treasure-art,.stage-award-item{display:block;background-image:url("/public/treasure-collection-sprite-v1.png?v=1");background-size:200% 200%;background-repeat:no-repeat;image-rendering:pixelated}.vault-treasure-art{width:86px;height:86px;filter:grayscale(1) brightness(.28);opacity:.52}.vault-item.is-owned .vault-treasure-art{filter:none;opacity:1}.vault-volcano{background-position:0 0}.vault-beach{background-position:100% 0}.vault-forest{background-position:0 100%}.vault-mountain{background-position:100% 100%}.vault-item small{display:block;color:#6f6556;font-size:8px}.vault-item.is-owned small{color:#8affb8}.vault-item strong{display:block;margin-top:6px;font-size:14px;line-height:1.35}.vault-item em{display:block;margin-top:6px;color:#71401f;font-style:normal;font-size:8px}.vault-item.is-owned em{color:#ffd400}.treasure-vault-title{margin-top:14px;padding:12px;background:#21170d;color:#fff;text-align:center;font-size:10px}.treasure-vault-title b{display:block;margin-top:5px;color:#8affb8;font-size:17px}
    @media(max-width:560px){.treasure-vault-panel{padding:11px;border-width:5px}.treasure-vault-grid{grid-template-columns:1fr}.vault-item{grid-template-columns:74px 1fr;min-height:94px}.vault-treasure-art{width:68px;height:68px}.treasure-vault-head strong{font-size:17px}.treasure-vault-close{width:38px;height:38px}}
  `;
  document.head.append(coinStyle);

  const pageTransition = document.createElement('div');
  pageTransition.className = 'page-transition';
  pageTransition.setAttribute('aria-hidden', 'true');
  pageTransition.innerHTML = '<div class="transition-copy"><span>NOW LOADING<span class="transition-dots"></span></span><b>NEXT STAGE</b></div>';
  document.body.append(pageTransition);
  try {
    if (sessionStorage.getItem('wearprint-page-transition') === '1') {
      sessionStorage.removeItem('wearprint-page-transition');
      pageTransition.classList.add('is-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => pageTransition.classList.add('is-opening')));
      setTimeout(() => pageTransition.classList.remove('is-entering', 'is-opening'), 520);
    }
  } catch {}

  const floatingCoin = document.createElement('div');
  floatingCoin.className = 'coin-hud-float';
  floatingCoin.setAttribute('aria-live', 'polite');
  if (!document.querySelector('.game-hud')) document.body.append(floatingCoin);

  const CHARACTER_KEY = 'wearprint-walker-character';
  const characters = {
    hadaoji: {src: '/public/hadaoji-actions-v2.png', name: 'ハダオジくん'},
    yuu: {src: '/public/yuu-actions-v3.png', name: 'ゆうちゃん'}
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

  const treasureOverlay = document.createElement('div');
  treasureOverlay.className = 'treasure-overlay';
  treasureOverlay.setAttribute('role', 'status');
  treasureOverlay.setAttribute('aria-live', 'polite');
  treasureOverlay.innerHTML = '<div class="treasure-card"><span class="treasure-label">TREASURE GET!</span><span class="treasure-sprite" aria-hidden="true"></span><strong>PRINT KNOWLEDGE</strong><small></small><em>KNOWLEDGE GET!</em></div>';
  document.body.append(treasureOverlay);
  const treasureTitle = treasureOverlay.querySelector('small');
  let treasureTimer;
  const showTreasure = () => {
    clearTimeout(treasureTimer);
    treasureTitle.textContent = document.querySelector('h1')?.textContent.trim().replace(/\s+/g, ' ') || '記事を読破しました';
    treasureOverlay.classList.remove('is-show', 'is-open');
    void treasureOverlay.offsetWidth;
    treasureOverlay.classList.add('is-show');
    setTimeout(() => treasureOverlay.classList.add('is-open'), 320);
    treasureTimer = setTimeout(() => treasureOverlay.classList.remove('is-show', 'is-open'), 2600);
  };

  const masterOverlay = document.createElement('div');
  masterOverlay.className = 'master-overlay';
  masterOverlay.setAttribute('role', 'status');
  masterOverlay.setAttribute('aria-live', 'polite');
  masterOverlay.innerHTML = '<div class="master-card"><span class="master-stars">★ ★ ★</span><small>ALL ARTICLES CLEAR!</small><strong>PRINT MASTER</strong><p>すべてのプリント知識を獲得しました</p><b>称号を獲得！</b></div>';
  document.body.append(masterOverlay);
  let masterTimer;
  const showMasterAward = () => {
    clearTimeout(masterTimer);
    masterOverlay.classList.remove('is-show');
    void masterOverlay.offsetWidth;
    masterOverlay.classList.add('is-show');
    playWalkerReaction('is-coin', 1400);
    masterTimer = setTimeout(() => masterOverlay.classList.remove('is-show'), 3600);
  };

  const stageAwardOverlay = document.createElement('div');
  stageAwardOverlay.className = 'stage-award-overlay';
  stageAwardOverlay.setAttribute('role', 'status');
  stageAwardOverlay.setAttribute('aria-live', 'polite');
  stageAwardOverlay.innerHTML = '<div class="stage-award-card"><small>STAGE CLEAR / TREASURE GET!</small><span class="stage-award-item" aria-hidden="true"></span><strong></strong><p></p><b>財宝を獲得！</b></div>';
  document.body.append(stageAwardOverlay);
  let stageAwardTimer;
  const showStageTreasureAward = stage => {
    clearTimeout(stageAwardTimer);
    const stageAwardArt = stageAwardOverlay.querySelector('.stage-award-item');
    stageAwardArt.className = 'stage-award-item vault-' + stage.id;
    stageAwardOverlay.querySelector('strong').textContent = stage.treasure;
    stageAwardOverlay.querySelector('p').textContent = stage.name + 'を完全攻略しました';
    stageAwardOverlay.classList.remove('is-show');
    void stageAwardOverlay.offsetWidth;
    stageAwardOverlay.classList.add('is-show');
    playWalkerReaction('is-coin', 1400);
    stageAwardTimer = setTimeout(() => stageAwardOverlay.classList.remove('is-show'), 3400);
  };

  const hunterOverlay = document.createElement('div');
  hunterOverlay.className = 'master-overlay hunter-overlay';
  hunterOverlay.setAttribute('role', 'status');
  hunterOverlay.setAttribute('aria-live', 'polite');
  hunterOverlay.innerHTML = '<div class="master-card"><span class="master-stars">◆ ◆ ◆ ◆</span><small>ALL TREASURES FOUND!</small><strong>TREASURE<br>HUNTER</strong><p>4つの島の財宝をすべて集めました</p><b>称号を獲得！</b></div>';
  document.body.append(hunterOverlay);
  let hunterTimer;
  const showHunterAward = () => {
    clearTimeout(hunterTimer);
    hunterOverlay.classList.remove('is-show');
    void hunterOverlay.offsetWidth;
    hunterOverlay.classList.add('is-show');
    playWalkerReaction('is-coin', 1800);
    hunterTimer = setTimeout(() => hunterOverlay.classList.remove('is-show'), 4200);
  };

  const adventureBook = document.createElement('button');
  adventureBook.type = 'button';
  adventureBook.className = 'adventure-book';
  adventureBook.setAttribute('aria-live', 'polite');
  adventureBook.setAttribute('aria-haspopup', 'dialog');
  adventureBook.setAttribute('aria-expanded', 'false');
  adventureBook.setAttribute('aria-label', '冒険の書と宝物庫を開く');
  document.body.append(adventureBook);

  const treasureVault = document.createElement('div');
  treasureVault.className = 'treasure-vault';
  treasureVault.setAttribute('role', 'dialog');
  treasureVault.setAttribute('aria-modal', 'true');
  treasureVault.setAttribute('aria-labelledby', 'treasure-vault-title');
  treasureVault.setAttribute('aria-hidden', 'true');
  treasureVault.innerHTML = '<div class="treasure-vault-panel"><div class="treasure-vault-head"><div><small>ADVENTURE TREASURE</small><strong id="treasure-vault-title">宝物庫</strong></div><button class="treasure-vault-close" type="button" aria-label="宝物庫を閉じる">×</button></div><div class="treasure-vault-summary"></div><div class="treasure-vault-grid"></div><div class="treasure-vault-title"></div></div>';
  document.body.append(treasureVault);
  const treasureVaultGrid = treasureVault.querySelector('.treasure-vault-grid');
  const treasureVaultSummary = treasureVault.querySelector('.treasure-vault-summary');
  const treasureVaultTitle = treasureVault.querySelector('.treasure-vault-title');
  const treasureVaultClose = treasureVault.querySelector('.treasure-vault-close');

  let articleRosterReady = false;
  const countArticleClears = () => articlePaths.filter(articlePath => articleClears[articlePath]).length;
  const rosterSignature = () => articlePaths.slice().sort().join('|');

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
      if (unique.length) articlePaths = unique;
    } catch {}
    articleRosterReady = true;
    paintAdventureBook();
  };

  const countStageArticles = stage => stage.articles.filter(articlePath => articleClears[articlePath]).length;
  const paintTreasureVault = () => {
    const ownedCount = STAGE_QUESTS.filter(stage => stageTreasures[stage.id]).length;
    treasureVaultSummary.innerHTML = `TREASURE <b>${ownedCount} / ${STAGE_QUESTS.length}</b>`;
    treasureVaultGrid.innerHTML = STAGE_QUESTS.map((stage, index) => {
      const owned = Boolean(stageTreasures[stage.id]);
      const clearCount = countStageArticles(stage);
      const remaining = Math.max(0, stage.articles.length - clearCount);
      return `<article class="vault-item${owned ? ' is-owned' : ''}"><span class="vault-treasure-art vault-${stage.id}" aria-hidden="true"></span><div><small>ISLAND ${String(index + 1).padStart(2, '0')} / ${stage.name}</small><strong>${owned ? stage.treasure : '？？？'}</strong><em>${owned ? 'TREASURE GET!' : `あと${remaining}記事で解放`}</em></div></article>`;
    }).join('');
    treasureVaultTitle.innerHTML = treasureHunter
      ? 'EQUIPPED TITLE<b>TREASURE HUNTER</b>'
      : `称号解放まで あと${STAGE_QUESTS.length - ownedCount}個<b>TREASURE HUNTER 🔒</b>`;
  };

  let treasureVaultLastFocus = null;
  const openTreasureVault = () => {
    paintTreasureVault();
    treasureVaultLastFocus = document.activeElement;
    treasureVault.classList.add('is-show');
    treasureVault.setAttribute('aria-hidden', 'false');
    adventureBook.setAttribute('aria-expanded', 'true');
    document.body.classList.add('treasure-vault-open');
    setTimeout(() => treasureVaultClose.focus(), 40);
  };
  const closeTreasureVault = () => {
    treasureVault.classList.remove('is-show');
    treasureVault.setAttribute('aria-hidden', 'true');
    adventureBook.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('treasure-vault-open');
    if (treasureVaultLastFocus?.focus) treasureVaultLastFocus.focus();
  };
  adventureBook.addEventListener('click', openTreasureVault);
  treasureVaultClose.addEventListener('click', closeTreasureVault);
  treasureVault.addEventListener('pointerdown', event => {
    if (event.target === treasureVault) closeTreasureVault();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && treasureVault.classList.contains('is-show')) closeTreasureVault();
  });
  const paintStageTreasures = (announce = false) => {
    const newlyAwarded = [];
    STAGE_QUESTS.forEach((stage, index) => {
      const count = countStageArticles(stage);
      const complete = count === stage.articles.length;
      if (complete && !stageTreasures[stage.id]) {
        stageTreasures[stage.id] = Date.now();
        newlyAwarded.push(stage);
      }
      const card = document.querySelectorAll('.stage-grid article')[index];
      if (!card) return;
      card.dataset.stage = stage.id;
      const owned = Boolean(stageTreasures[stage.id]);
      card.classList.toggle('is-stage-clear', owned);
      let panel = card.querySelector('.stage-treasure-progress');
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'stage-treasure-progress';
        const links = [...card.querySelectorAll(':scope > a')];
        card.insertBefore(panel, links[links.length - 1] || null);
      }
      const remaining = Math.max(0, stage.articles.length - count);
      panel.innerHTML = owned
        ? `<small>TREASURE GET!</small><b>${stage.treasure}</b><em>STAGE CLEAR ${count} / ${stage.articles.length}</em>`
        : `<small>STAGE QUEST ${count} / ${stage.articles.length}</small><b>財宝：${stage.treasure}</b><em>あと${remaining}記事で獲得</em>`;
    });

    if (newlyAwarded.length) {
      try { localStorage.setItem(STAGE_TREASURE_KEY, JSON.stringify(stageTreasures)); } catch {}
    }
    const allTreasures = STAGE_QUESTS.every(stage => Boolean(stageTreasures[stage.id]));
    const newHunter = allTreasures && !treasureHunter;
    if (newHunter) {
      treasureHunter = true;
      try { localStorage.setItem(HUNTER_KEY, '1'); } catch {}
    }
    adventureBook?.classList.toggle('is-hunter', treasureHunter);
    paintTreasureVault();

    if (announce && newlyAwarded.length) {
      const latest = newlyAwarded[newlyAwarded.length - 1];
      setTimeout(() => showStageTreasureAward(latest), 2850);
      if (typeof gtag === 'function') gtag('event', 'stage_treasure', {stage_id: latest.id, treasure_name: latest.treasure});
      if (newHunter) {
        setTimeout(showHunterAward, 6600);
        if (typeof gtag === 'function') gtag('event', 'treasure_hunter', {treasure_total: STAGE_QUESTS.length});
      }
    }
  };

  const paintAdventureBook = () => {
    const count = countArticleClears();
    const total = articlePaths.length;
    const remaining = Math.max(0, total - count);
    const signature = rosterSignature();
    const isMaster = articleRosterReady && total > 0 && remaining === 0;
    const hadMaster = Boolean(awardedMasterSignature);
    adventureBook.classList.toggle('is-master', isMaster);
    const status = isMaster
      ? 'PRINT MASTER'
      : hadMaster
        ? `NEW QUEST! あと${remaining}記事`
        : `PRINT MASTERまで あと${remaining}記事`;
    const treasureCount = STAGE_QUESTS.filter(stage => stageTreasures[stage.id]).length;
    const treasureStatus = treasureHunter ? 'TITLE: TREASURE HUNTER' : `TREASURE ${treasureCount} / ${STAGE_QUESTS.length}`;
    adventureBook.innerHTML = `<small>冒険の書</small><b>CLEAR ${String(count).padStart(2, '0')} / ${total}</b><em>${status}</em><span class="book-treasure">${treasureStatus}</span>`;

    if (isMaster && awardedMasterSignature !== signature) {
      awardedMasterSignature = signature;
      try { localStorage.setItem(MASTER_KEY, signature); } catch {}
      setTimeout(showMasterAward, 260);
      if (typeof gtag === 'function') {
        gtag('event', 'print_master', {cleared_articles: count, article_total: total});
      }
    }

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
    if (!isArticle) return;
    const firstClear = !articleClears[path];
    if (firstClear) {
      articleClears[path] = Date.now();
      try { localStorage.setItem(ARTICLE_CLEAR_KEY, JSON.stringify(articleClears)); } catch {}
      paintStageTreasures(true);
      paintAdventureBook();
      if (typeof gtag === 'function') {
        gtag('event', 'article_clear', {page_path: path, cleared_articles: countArticleClears()});
      }
    }
    if (!treasures[path]) {
      treasures[path] = Date.now();
      try { localStorage.setItem(TREASURE_KEY, JSON.stringify(treasures)); } catch {}
      showTreasure();
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
    if (!isArticle) showCoinToast(reward.label);
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

  let isTransitioning = false;
  document.addEventListener('click', event => {
    if (isTransitioning || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) return;
    let destination;
    try { destination = new URL(link.href, location.href); } catch { return; }
    if (destination.origin !== location.origin) return;
    const sameDocument = destination.pathname === location.pathname && destination.search === location.search;
    if (sameDocument && destination.hash) return;
    event.preventDefault();
    isTransitioning = true;
    try { sessionStorage.setItem('wearprint-page-transition', '1'); } catch {}
    pageTransition.classList.remove('is-entering', 'is-opening');
    pageTransition.classList.add('is-leaving');
    setTimeout(() => location.assign(destination.href), reduceMotion ? 40 : 440);
  }, true);

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
  paintStageTreasures(false);
  paintAdventureBook();
  refreshArticlePaths();
  paintSoundButton();
  update();
})();
