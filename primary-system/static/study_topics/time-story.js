(() => {
  'use strict';

  function leapResult(year) {
    if (!Number.isInteger(year) || year < 1 || year > 9999) return '请输入 1 至 9999 之间的整数年份。';
    const leap = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
    const reason = year % 100 === 0 ? `整百年${leap ? '能' : '不能'}被 400 整除` : `${leap ? '能' : '不能'}被 4 整除，且不是整百年`;
    return `${year} 年是${leap ? '闰' : '平'}年，二月有 ${leap ? 29 : 28} 天。理由：${reason}。`;
  }

  function zoneResult(clock, origin, destination) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)) return '请输入有效的小时和分钟。';
    const [hours, minutes] = clock.split(':').map(Number);
    const difference = destination - origin;
    const total = hours * 60 + minutes + difference;
    const day = Math.floor(total / 1440);
    const within = total - day * 1440;
    const display = [Math.floor(within / 60), within % 60].map(part => String(part).padStart(2, '0')).join(':');
    const relation = day === 0 ? '同一天' : `${day < 0 ? '提前' : '推后'} ${Math.abs(day)} 天`;
    const shift = difference === 0 ? '两地偏移相同，不用拨钟' : `从出发地钟面${difference < 0 ? '减去' : '加上'} ${Math.floor(Math.abs(difference) / 60)} 小时 ${Math.abs(difference) % 60} 分钟`;
    return `目的地 ${display}（${relation}）。${shift}。`;
  }

  function eraResult(system, year, era) {
    const limit = system === 'reign' ? era.last - era.first + 1 : 9999;
    if (!Number.isInteger(year) || year < 1 || year > limit) return `请输入 1 至 ${limit} 之间的整数，没有第 0 年。`;
    const civil = system === 'reign' ? era.first + year - 1 : year;
    const prefix = system === 'bce' ? '公元前' : '公元';
    const century = Math.ceil(civil / 100);
    const start = (century - 1) * 100 + 1;
    const end = century * 100;
    const range = system === 'bce' ? `公元前 ${end} 年至前 ${start} 年` : `公元 ${start} 年至 ${end} 年`;
    const conversion = system === 'reign' ? `${era.name}${year === 1 ? '元' : year}年：${era.first}＋${year}－1＝${civil}。` : '';
    const reign = system === 'ce' && civil >= era.first && civil <= era.last ? `按年号对照为${era.name}${civil === era.first ? '元' : civil - era.first + 1}年。` : '';
    return `${conversion}${prefix} ${civil} 年属于${prefix} ${century} 世纪（${range}）。${reign}`;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {leapResult, zoneResult, eraResult};
  if (typeof document === 'undefined') return;

  function mount(id, calculate) {
    const panel = document.getElementById(id);
    const render = () => { panel.querySelector('output').textContent = calculate(panel.elements, panel.dataset); };
    panel.addEventListener('input', render);
    render();
    panel.hidden = false;
  }

  mount('leap-tool', fields => leapResult(fields.year.valueAsNumber));
  mount('zone-tool', fields => zoneResult(fields.clock.value, Number(fields.origin.value), Number(fields.destination.value)));
  mount('era-tool', (fields, data) => {
    const era = {name: data.name, first: Number(data.first), last: Number(data.last)};
    fields.year.max = fields.system.value === 'reign' ? era.last - era.first + 1 : 9999;
    return eraResult(fields.system.value, fields.year.valueAsNumber, era);
  });
})();
