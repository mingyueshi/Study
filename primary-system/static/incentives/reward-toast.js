/* 激励提示：学习动作的响应带 rewards 时弹出的小庆祝条（自包含组件）。
   用法：各玩法 JS 在接口成功回调里 `if (window.rewardToast && data.rewards) rewardToast(data.rewards)`。
   失败绝不抛错——提示不出来也不影响学习功能本身。 */
(function () {
  'use strict';
  var STYLE = [
    '.reward-toast-wrap { position: fixed; top: 18px; left: 50%; transform: translateX(-50%);',
    '  z-index: 9999; display: grid; gap: 10px; justify-items: center; pointer-events: none; }',
    '.reward-toast { display: flex; align-items: center; gap: 10px; max-width: min(92vw, 480px);',
    '  padding: 12px 22px; border: 1px solid var(--card-line, #efddca); border-radius: 999px;',
    '  background: var(--card-tint, #fff0e5); color: var(--card-accent, #b75e2c);',
    '  font-size: 16px; font-weight: 700; box-shadow: 0 6px 18px rgba(60, 40, 20, .18);',
    '  animation: reward-toast-in .3s ease; }',
    '.reward-toast .rt-icon { font-size: 22px; line-height: 1; }',
    '.reward-toast.hide { opacity: 0; transform: translateY(-8px); transition: all .4s ease; }',
    '@keyframes reward-toast-in { from { opacity: 0; transform: translateY(-10px); } }'
  ].join('\n');

  function ensureStyle() {
    if (!document.getElementById('reward-toast-style')) {
      var tag = document.createElement('style');
      tag.id = 'reward-toast-style';
      tag.textContent = STYLE;
      document.head.appendChild(tag);
    }
  }

  function item(award) {
    if (award.type === 'points') {
      return { icon: '⭐', text: '+' + award.points + ' 积分 · ' + (award.label || '学习奖励') };
    }
    if (award.type === 'checkin') {
      return { icon: '🔥', text: '连续打卡 ' + award.streak + ' 天' };
    }
    if (award.type === 'badge') {
      return { icon: award.icon || '🎉', text: '点亮勋章「' + award.name + '」' };
    }
    return null;
  }

  window.rewardToast = function (awards) {
    if (!Array.isArray(awards) || !awards.length) return;
    try {
      ensureStyle();
      var wrap = document.querySelector('.reward-toast-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'reward-toast-wrap';
        document.body.appendChild(wrap);
      }
      awards.forEach(function (award) {
        var line = item(award);
        if (!line) return;
        var toast = document.createElement('div');
        toast.className = 'reward-toast';
        toast.setAttribute('role', 'status');
        toast.innerHTML = '<span class="rt-icon" aria-hidden="true"></span><span class="rt-text"></span>';
        toast.querySelector('.rt-icon').textContent = line.icon;
        toast.querySelector('.rt-text').textContent = line.text;
        wrap.appendChild(toast);
        setTimeout(function () { toast.classList.add('hide'); }, 3200);
        setTimeout(function () { toast.remove(); }, 3700);
      });
    } catch (error) {
      /* 提示失败静默忽略。 */
    }
  };
})();
