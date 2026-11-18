(() => {
  'use strict';

  const yuan = cents => (cents / 100).toFixed(2);

  function basketResult(budget, items) {
    if (!Number.isInteger(budget) || budget < 0 || budget > 99999) return null;
    if (!items.every(item => Number.isInteger(item.quantity) && item.quantity >= 0 && item.quantity <= 99)) return null;

    const subtotals = items.map(item => item.cents * item.quantity);
    const total = subtotals.reduce((sum, value) => sum + value, 0);
    return { subtotals, total, balance: budget - total };
  }

  function marketResult(market, scenarioId, price) {
    const scenario = market.scenarios.find(item => item.id === scenarioId);
    const index = market.prices.indexOf(price);
    if (!scenario || index === -1) return null;

    const supply = scenario.supply[index];
    const demand = scenario.demand[index];
    return { supply, demand, gap: demand - supply };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { basketResult, marketResult };
  if (typeof document === 'undefined') return;

  function mountBasket(panel, basket) {
    const budget = panel.querySelector('#money-budget');
    const output = panel.querySelector('output');
    const rows = Array.from(panel.querySelectorAll('.money-item'), (row, index) => {
      const { cents, quantity } = basket.items[index];
      const input = row.querySelector('input');
      input.value = quantity;
      row.querySelector('[data-unit-price]').textContent = `单价 ${yuan(cents)} 元`;
      return { cents, input, subtotal: row.querySelector('[data-subtotal]') };
    });
    budget.value = yuan(basket.budget_cents);

    function update() {
      const budgetCents = budget.validity.valid ? Math.round(budget.valueAsNumber * 100) : NaN;
      const items = rows.map(({ cents, input }) => ({ cents, quantity: input.valueAsNumber }));
      const result = basketResult(budgetCents, items);
      rows.forEach(({ subtotal }, index) => {
        subtotal.textContent = result ? `小计 ${yuan(result.subtotals[index])} 元` : '小计 —';
      });
      if (!result) {
        output.textContent = '请填入 0 至 999.99 元的预算和 0 至 99 的整数数量，预算最多保留两位小数。';
        return;
      }
      const status = result.balance < 0 ? '超出预算' : '预算剩余';
      output.textContent = `总价 ${yuan(result.total)} 元，${status} ${yuan(Math.abs(result.balance))} 元。`;
    }

    panel.addEventListener('input', update);
    update();
    panel.hidden = false;
  }

  function mountMarket(panel, market) {
    const scenario = panel.querySelector('[name="scenario"]');
    const price = panel.querySelector('[name="price"]');
    const supplyMeter = panel.querySelector('#money-supply');
    const demandMeter = panel.querySelector('#money-demand');
    const output = panel.querySelector('output');
    supplyMeter.max = demandMeter.max = Math.max(...market.scenarios.flatMap(item => [...item.supply, ...item.demand]));

    function update() {
      const result = marketResult(market, scenario.value, Number(price.value));
      supplyMeter.value = result.supply;
      demandMeter.value = result.demand;
      panel.querySelector('[data-supply]').textContent = `${result.supply} 份`;
      panel.querySelector('[data-demand]').textContent = `${result.demand} 份`;
      let message = '供需相等，这个价位在模型中达到均衡。';
      if (result.gap > 0) message = `供不应求，还有 ${result.gap} 份需求未满足。`;
      if (result.gap < 0) message = `供过于求，还有 ${-result.gap} 份可能卖不完。`;
      output.textContent = `供给 ${result.supply} 份，需求 ${result.demand} 份。${message}`;
    }

    panel.addEventListener('change', update);
    update();
    panel.hidden = false;
  }

  function read(id) {
    return JSON.parse(document.getElementById(id).textContent);
  }

  mountBasket(document.getElementById('money-basket'), read('money-basket-data'));
  mountMarket(document.getElementById('money-market'), read('money-market-data'));
})();
