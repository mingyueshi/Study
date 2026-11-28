'use strict';

(() => {
  const shop = document.querySelector('[data-english-shop]');
  if (!shop) return;

  const products = JSON.parse(document.getElementById('english-shop-products').textContent);
  const form = shop.querySelector('.shop-controls');
  const lines = shop.querySelectorAll('[data-shop-line]');
  const wordButton = shop.querySelector('[data-shop-word]');
  let playback = 0;

  form.querySelector('[data-shop-apply]').hidden = true;
  form.addEventListener('change', () => {
    const state = new FormData(form);
    const product = products[state.get('product')];
    const round = product.dialogues[state.get('quantity')];
    playback += 1;
    window.TTS?.stopSequence();

    shop.querySelectorAll('[data-shop-quantity]').forEach((label) => {
      label.textContent = product.dialogues[label.dataset.shopQuantity].label;
    });
    shop.querySelectorAll('[data-shop-product]').forEach((node) => {
      node.textContent = product[node.dataset.shopProduct];
    });
    wordButton.dataset.shopSay = product.word;
    wordButton.setAttribute('aria-label', '朗读商品 ' + product.word);

    for (const row of lines) {
      const line = round[row.dataset.shopLine];
      row.querySelectorAll('[data-shop-text]').forEach((node) => {
        node.textContent = line[node.dataset.shopText];
      });
      const sentence = row.querySelector('[data-shop-utterance="line"]');
      const phrase = row.querySelector('[data-shop-utterance="phrase"]');
      sentence.dataset.shopSay = line.en;
      sentence.setAttribute('aria-label', '听整句 ' + line.en);
      phrase.dataset.shopSay = line.lead + ' ' + line.phrase;
      phrase.setAttribute('aria-label', '听短语 ' + phrase.dataset.shopSay);
    }
    shop.querySelector('[data-shop-note]').textContent = round.note;
    shop.querySelectorAll('[data-shop-status]').forEach((status) => { status.textContent = ''; });

    const url = new URL(window.location.href);
    for (const key of ['product', 'quantity']) url.searchParams.set(key, state.get(key));
    window.history.replaceState(window.history.state, '', url);
  });

  shop.addEventListener('click', (event) => {
    const button = event.target.closest('[data-shop-say]');
    if (button) {
      const status = button.closest('[data-shop-audio-group]').querySelector('[data-shop-status]');
      const id = ++playback;
      const failure = '暂时无法点读，请检查设备是否有可用的英语语音。';
      status.textContent = '';
      if (!window.TTS) {
        status.textContent = failure;
        return;
      }
      window.TTS.stopSequence();
      window.TTS.speak(button.dataset.shopSay, {
        lang: 'en-US',
        rate: 0.82,
        onerror: ({error}) => {
          if (id === playback && !['canceled', 'interrupted'].includes(error)) status.textContent = failure;
        },
      });
      return;
    }

    const option = event.target.closest('[data-shop-option]');
    if (!option) return;
    const question = option.closest('[data-shop-question]');
    const correct = option.textContent === question.dataset.answer;
    for (const choice of question.querySelectorAll('[data-shop-option]')) {
      choice.setAttribute('aria-pressed', String(choice === option));
    }
    question.dataset.result = correct ? 'correct' : 'retry';
    question.querySelector('[data-shop-feedback]').textContent = correct ? '答对了！' : '再试一次。';
    question.querySelector('[data-shop-answer]').hidden = !correct;
  });
})();
