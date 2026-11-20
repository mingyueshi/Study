'use strict';
(() => {
  const tube = document.getElementById('scope-tube');
  const eye = document.getElementById('scope-eye');
  const power = document.getElementById('scope-power');
  function calculate() {
    power.value = tube.validity.valid
      ? (tube.valueAsNumber / Number(eye.value)).toLocaleString('zh-CN', {maximumFractionDigits: 1}) + ' 倍'
      : '请输入 1—20000 毫米的有效焦距。';
  }
  tube.addEventListener('input', calculate);
  eye.addEventListener('change', calculate);
  calculate();
})();
