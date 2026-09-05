(() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#161616"/>
  <rect y="0" width="1280" height="130" fill="#2c211b"/>
  <rect x="350" y="28" width="580" height="82" fill="#090909" stroke="#ffd84a" stroke-width="12"/>
  <text x="640" y="83" text-anchor="middle" font-family="monospace" font-weight="900" font-size="44" fill="#ffd84a">HADAOJI PRINT</text>
  <rect x="50" y="160" width="290" height="300" fill="#262626" stroke="#5d4939" stroke-width="12"/>
  <rect x="940" y="160" width="290" height="300" fill="#262626" stroke="#5d4939" stroke-width="12"/>
  <g fill="#f1eee0">
    <path d="M95 205h68l24 32 24-32h68l30 55-46 20-14-28v150H125V252l-14 28-46-20z"/>
    <path d="M985 205h68l24 32 24-32h68l30 55-46 20-14-28v150H1015V252l-14 28-46-20z"/>
  </g>
  <rect x="0" y="500" width="1280" height="220" fill="#4d3525"/>
  <rect x="0" y="486" width="1280" height="28" fill="#765637"/>
  <rect x="70" y="545" width="1140" height="128" fill="#382519" stroke="#1d1510" stroke-width="10"/>
  <text x="640" y="615" text-anchor="middle" font-family="monospace" font-weight="900" font-size="34" fill="#ffd84a">ONLINE COUNTER</text>
  <g fill="#38d39f">
    <rect x="390" y="190" width="26" height="26"/><rect x="864" y="190" width="26" height="26"/>
    <rect x="390" y="226" width="26" height="26"/><rect x="864" y="226" width="26" height="26"/>
  </g>
  <text x="640" y="160" text-anchor="middle" font-family="monospace" font-size="22" fill="#d8d2c2">WELCOME TO THE ONLINE T-SHIRT SHOP</text>
</svg>`;
  const backgroundDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));

  function getApi() {
    try { return typeof api !== 'undefined' ? api : null; } catch (_) { return null; }
  }

  function setStatus(message) {
    const el = document.getElementById('status');
    if (el) el.textContent = message;
  }

  function applyBackground() {
    const meetingApi = getApi();
    if (!meetingApi) {
      setStatus('先にオンライン店舗へ入ってから背景をONにしてください。');
      return;
    }
    try {
      if (typeof meetingApi.setVirtualBackground === 'function') {
        meetingApi.setVirtualBackground(true, backgroundDataUrl);
      } else {
        meetingApi.executeCommand('setVirtualBackground', true, backgroundDataUrl);
      }
      setStatus('8BIT店舗背景を適用しています… 人物を自動認識して背景を差し替えます。');
    } catch (e) {
      setStatus('この端末では自動背景を適用できませんでした。背景選択を試してください。');
    }
  }

  function removeBackground() {
    const meetingApi = getApi();
    if (!meetingApi) return;
    try {
      if (typeof meetingApi.setVirtualBackground === 'function') {
        meetingApi.setVirtualBackground(false, '');
      } else {
        meetingApi.executeCommand('setVirtualBackground', false, '');
      }
      setStatus('バーチャル背景をOFFにしました。');
    } catch (e) {
      setStatus('背景OFFの切り替えに失敗しました。');
    }
  }

  function openBackgroundDialog() {
    const meetingApi = getApi();
    if (!meetingApi) {
      setStatus('先にオンライン店舗へ入ってください。');
      return;
    }
    try { meetingApi.executeCommand('toggleVirtualBackgroundDialog'); }
    catch (e) { setStatus('この端末では背景選択画面を開けませんでした。'); }
  }

  function installControls() {
    const actions = document.querySelector('.counter .actions');
    if (!actions || document.getElementById('pixelBgOn')) return;
    const box = document.createElement('div');
    box.style.cssText = 'margin:14px auto 0;padding:12px;border:2px solid #ffd84a;background:#161616;max-width:700px;text-align:center';
    box.innerHTML = `
      <div style="font-weight:900;color:#ffd84a;margin-bottom:8px">店長用 8BITバーチャル背景 TEST</div>
      <div style="font-size:12px;color:#d4cfbd;line-height:1.6;margin-bottom:10px">通話に入ったあと「背景ON」を押してください。人物を自動で認識し、背景だけをTシャツ屋カウンターに差し替えます。</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="primary" id="pixelBgOn" type="button">8BIT店舗背景 ON</button>
        <button class="secondary" id="pixelBgOff" type="button">背景 OFF</button>
        <button class="secondary" id="pixelBgDialog" type="button">背景設定を開く</button>
      </div>`;
    actions.parentNode.insertBefore(box, actions.nextSibling);
    document.getElementById('pixelBgOn').addEventListener('click', applyBackground);
    document.getElementById('pixelBgOff').addEventListener('click', removeBackground);
    document.getElementById('pixelBgDialog').addEventListener('click', openBackgroundDialog);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installControls);
  else installControls();
})();
