const assert = require('node:assert/strict');
const test = require('node:test');
const { basketResult, marketResult } = require('../static/study_topics/money-trade.js');
const { basket, market } = require('../content_sources/money-trade.json');

test('购物篮以整数分计算小计、总价和预算差额', () => {
  assert.deepEqual(basketResult(basket.budget_cents, basket.items), {
    subtotals: [360, 350, 0], total: 710, balance: 290,
  });
  assert.equal(basketResult(710, basket.items).balance, 0);
  assert.equal(basketResult(709, basket.items).balance, -1);
  assert.equal(basketResult(0, [{ cents: 1, quantity: 0 }]).balance, 0);
  for (const quantity of [NaN, -1, 0.5, 100]) assert.equal(basketResult(1000, [{ cents: 180, quantity }]), null);
  for (const budget of [NaN, -1, 12.5, 100000]) assert.equal(basketResult(budget, basket.items), null);
});

test('固定价格时可单独改变供给或需求，调价格可找到均衡', () => {
  assert.deepEqual(marketResult(market, 'ordinary', 4), { supply: 30, demand: 30, gap: 0 });
  assert.deepEqual(marketResult(market, 'more-buyers', 4), { supply: 30, demand: 50, gap: 20 });
  assert.deepEqual(marketResult(market, 'poor-harvest', 4), { supply: 10, demand: 30, gap: 20 });
  assert.equal(marketResult(market, 'more-buyers', 5).gap, 0);
  assert.equal(marketResult(market, 'poor-harvest', 6).gap, -20);
  assert.equal(marketResult(market, 'unknown', 4), null);
  assert.equal(marketResult(market, 'ordinary', 0), null);
});
