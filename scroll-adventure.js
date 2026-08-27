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

  const playSelect = () => {
    tone(520, 0.045, 0, 0.018);
  };

  const playStep = () => {
    tone(440, 0.055, 0);
    tone(660, 0.065, 0.055);
  };

  const playClear = () => {
    tone(523, 0.08, 0);
    tone(659, 0.08, 0.08);
    tone(784, 0.14, 0.16);
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
    const choice = event.target.closest('.article-list a,.stage-grid a,.steps a,.pixel-button');
    if (choice && choice !== button && choice !== soundButton && await unlockAudio()) playSelect();
  }, {passive: true});

  addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, {passive: true});
  addEventListener('resize', update, {passive: true});
  paintSoundButton();
  update();
})();
