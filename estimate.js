(function () {
  const form = document.getElementById('estimate-form');
  const copyButton = document.getElementById('copy-estimate');
  const message = document.getElementById('form-message');
  const summary = document.getElementById('estimate-summary');
  if (!form) return;

  const read = (name) => {
    const fields = Array.from(form.querySelectorAll(`[name="${name}"]`));
    if (!fields.length) return '';
    if (fields[0].type === 'checkbox') return fields.filter((field) => field.checked).map((field) => field.value).join('、');
    return fields[0].value.trim();
  };

  const buildText = () => [
    '【ウェアプリント無料見積もり】',
    '',
    `■用途：${read('用途') || '未入力'}`,
    `■ウェア：${read('ウェア') || '未入力'}`,
    `■予定枚数：${read('枚数') ? read('枚数') + '枚' : '未入力'}`,
    `■ウェアの色：${read('ウェアの色') || '未定'}`,
    `■プリント位置：${read('プリント位置') || '未定'}`,
    `■プリントの色数：${read('色数') || '未定'}`,
    `■デザイン状況：${read('デザイン状況') || '未定'}`,
    `■希望納期：${read('希望納期') || '未定'}`,
    `■予算：${read('予算') || '未定'}`,
    `■ご要望・サイズ内訳：\n${read('ご要望') || 'なし'}`,
    '',
    `■お名前：${read('お名前') || '未入力'}`,
    `■会社・チーム名：${read('団体名') || 'なし'}`,
    `■メールアドレス：${read('メールアドレス') || '未入力'}`,
    `■電話番号：${read('電話番号') || 'なし'}`,
    '',
    '※デザイン画像がある場合は、このメールに添付します。'
  ].join('\n');

  const updateSummary = () => {
    const values = [read('用途'), read('ウェア'), read('枚数') ? `${read('枚数')}枚` : '', read('プリント位置'), read('希望納期')];
    summary.querySelectorAll('dd').forEach((item, index) => { item.textContent = values[index] || (index === 2 || index === 4 ? '未入力' : '未選択'); });
  };

  form.addEventListener('input', updateSummary);
  form.addEventListener('change', updateSummary);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!read('プリント位置')) {
      message.textContent = 'プリント位置を1つ以上選んでください。未定でも大丈夫です。';
      form.querySelector('[name="プリント位置"]').focus();
      return;
    }
    const subject = `【無料見積もり】${read('お名前')}様／${read('枚数')}枚`;
    const mailto = `mailto:hadaojiprint@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildText())}`;
    message.textContent = 'メール画面を開いています。画像があれば添付して送信してください。';
    if (typeof gtag === 'function') gtag('event', 'generate_lead', {event_category: 'estimate', event_label: 'mail_open'});
    window.location.href = mailto;
  });

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      message.textContent = '入力内容をコピーしました。LINEやお問い合わせフォームにも貼り付けられます。';
      copyButton.textContent = '✓ コピーしました';
      if (typeof gtag === 'function') gtag('event', 'estimate_copy', {event_category: 'estimate'});
      setTimeout(() => { copyButton.textContent = '入力内容をコピー'; }, 2200);
    } catch (error) {
      message.textContent = 'コピーできませんでした。「見積もりメールを開く」をご利用ください。';
    }
  });

  document.querySelectorAll('.line-contact-link').forEach((link) => link.addEventListener('click', () => {
    if (typeof gtag === 'function') gtag('event', 'generate_lead', {event_category: 'estimate', event_label: 'official_line'});
  }));

  updateSummary();
})();
