(function () {
  const form = document.getElementById('estimate-form');
  const copyButton = document.getElementById('copy-estimate');
  const message = document.getElementById('form-message');
  const summary = document.getElementById('estimate-summary');
  const printPositionValue = document.getElementById('print-position-value');
  const submitFrame = document.getElementById('estimate-submit-frame');
  const submitButton = form?.querySelector('.estimate-submit');
  let awaitingResponse = false;
  if (!form) return;

  const resetSubmit = () => {
    if (!submitButton) return;
    submitButton.disabled = false;
    submitButton.textContent = '▶ 無料見積もりを送信';
  };

  const removeEncodedFiles = () => {
    form.querySelectorAll('[data-encoded-file]').forEach((field) => field.remove());
  };

  const addHiddenField = (name, value) => {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = name;
    field.value = value;
    field.dataset.encodedFile = 'true';
    form.appendChild(field);
  };

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('ファイルを読み込めませんでした。'));
    reader.readAsDataURL(file);
  });

  addEventListener('pageshow', resetSubmit);

  const read = (name) => {
    const fields = Array.from(form.querySelectorAll(`[name="${name}"]`));
    if (!fields.length) return '';
    if (fields[0].type === 'checkbox') return fields.filter((field) => field.checked).map((field) => field.value).join('、');
    return fields[0].value.trim();
  };

  const readPrintPositions = () => Array.from(form.querySelectorAll('[data-print-position]:checked'))
    .map((field) => field.value)
    .join('、');

  const syncPrintPositions = () => {
    const positions = readPrintPositions();
    printPositionValue.value = positions;
    return positions;
  };

  const buildText = () => [
    '【ウェアプリント無料見積もり】',
    '',
    `■用途：${read('用途') || '未入力'}`,
    `■ウェア：${read('ウェア') || '未入力'}`,
    `■予定枚数：${read('枚数') ? read('枚数') + '枚' : '未入力'}`,
    `■ウェアの色：${read('ウェアの色') || '未定'}`,
    `■プリント位置：${syncPrintPositions() || '未定'}`,
    `■プリントの色数：${read('色数') || '未定'}`,
    `■デザイン状況：${read('デザイン状況') || '未定'}`,
    `■希望納期：${read('希望納期') || '未定'}`,
    `■予算：${read('予算') || '未定'}`,
    `■ご要望・サイズ内訳：\n${read('ご要望') || 'なし'}`,
    '',
    `■お名前：${read('お名前') || '未入力'}`,
    `■会社・チーム名：${read('団体名') || 'なし'}`,
    `■メールアドレス：${read('email') || '未入力'}`,
    `■電話番号：${read('電話番号') || 'なし'}`,
    '',
    '※選択したデザイン画像は、フォームから一緒に送信されます。'
  ].join('\n');

  const updateSummary = () => {
    const values = [read('用途'), read('ウェア'), read('枚数') ? `${read('枚数')}枚` : '', syncPrintPositions(), read('希望納期')];
    summary.querySelectorAll('dd').forEach((item, index) => { item.textContent = values[index] || (index === 2 || index === 4 ? '未入力' : '未選択'); });
  };

  form.addEventListener('input', updateSummary);
  form.addEventListener('change', updateSummary);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!syncPrintPositions()) {
      message.textContent = 'プリント位置を1つ以上選んでください。未定でも大丈夫です。';
      form.querySelector('[data-print-position]').focus();
      return;
    }
    const files = Array.from(form.querySelectorAll('input[type="file"]')).flatMap((input) => Array.from(input.files || []));
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      message.textContent = '添付画像の合計が10MBを超えています。画像を小さくするか、1点だけ選んでください。';
      form.querySelector('input[type="file"]').focus();
      return;
    }

    message.textContent = files.length ? '画像を準備して送信しています…' : '入力内容を送信しています…';
    submitButton.disabled = true;
    submitButton.textContent = '送信中…';
    removeEncodedFiles();

    try {
      for (const input of form.querySelectorAll('input[type="file"]')) {
        const file = input.files && input.files[0];
        if (!file) continue;
        const key = input.name === 'attachment2' ? 'attachment2' : 'attachment';
        addHiddenField(`${key}_data`, await readFileAsBase64(file));
        addHiddenField(`${key}_name`, file.name);
        addHiddenField(`${key}_type`, file.type || 'application/octet-stream');
      }
    } catch (error) {
      resetSubmit();
      removeEncodedFiles();
      message.textContent = '画像を読み込めませんでした。画像を選び直して、もう一度送信してください。';
      return;
    }

    awaitingResponse = true;
    if (typeof gtag === 'function') gtag('event', 'generate_lead', {event_category: 'estimate', event_label: files.length ? 'form_with_image' : 'form'});
    form.submit();

    setTimeout(() => {
      if (!awaitingResponse) return;
      awaitingResponse = false;
      resetSubmit();
      removeEncodedFiles();
      message.textContent = '送信画面へ移動できませんでした。通信状態を確認して、もう一度送信してください。';
    }, 60000);
  });

  submitFrame?.addEventListener('load', () => {
    if (!awaitingResponse) return;
    awaitingResponse = false;
    removeEncodedFiles();

    const redirectToThanks = () => {
      location.assign(new URL('./thanks/', location.href).href);
    };

    if (typeof gtag !== 'function') {
      redirectToThanks();
      return;
    }

    let hasRedirected = false;
    const redirectOnce = () => {
      if (hasRedirected) return;
      hasRedirected = true;
      redirectToThanks();
    };

    gtag('event', 'form_submit', {
      event_category: 'estimate',
      event_label: 'estimate_form_success',
      transport_type: 'beacon',
      event_callback: redirectOnce,
      event_timeout: 1500
    });

    setTimeout(redirectOnce, 1800);
  });

  form.querySelectorAll('input[type="file"]').forEach((input) => input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    const label = input.closest('.file-choice').querySelector('[data-file-name]');
    label.textContent = file ? `${file.name}（${(file.size / 1024 / 1024).toFixed(1)}MB）` : '選択されていません';
    label.classList.toggle('has-file', Boolean(file));
  }));

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      message.textContent = '入力内容をコピーしました。LINEやお問い合わせフォームにも貼り付けられます。';
      copyButton.textContent = '✓ コピーしました';
      if (typeof gtag === 'function') gtag('event', 'estimate_copy', {event_category: 'estimate'});
      setTimeout(() => { copyButton.textContent = '入力内容をコピー'; }, 2200);
    } catch (error) {
      message.textContent = 'コピーできませんでした。「無料見積もりを送信」をご利用ください。';
    }
  });

  document.querySelectorAll('.line-contact-link').forEach((link) => link.addEventListener('click', () => {
    if (typeof gtag === 'function') gtag('event', 'generate_lead', {event_category: 'estimate', event_label: 'official_line'});
  }));

  updateSummary();
})();
