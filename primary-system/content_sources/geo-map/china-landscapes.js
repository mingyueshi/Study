/* 阶梯分区与中国地图、3D 剖面仪共享同一份数据。 */
(() => {
  const list = document.getElementById('landscape-steps');
  const {esc} = window.GMShared;
  list.innerHTML = window.GM_STEPS.map(step => `
    <li style="--guide-step:${esc(step.color)}">
      <h3>${esc(step.name)}</h3>
      <strong>${esc(step.altitude)}</strong>
      <p>${esc(step.areas)}</p>
    </li>`).join('');
})();
