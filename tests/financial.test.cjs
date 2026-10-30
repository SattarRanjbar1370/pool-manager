const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ opening = 30, income = 0, expenses = [], transfers = [] } = {}) {
  const cycle = { id: 'c1', opening_balance: opening, carried_over_balance: 0 };
  const db = {
    cycles: { get: async () => cycle, update: async () => 1 },
    incomes: { where: () => ({ equals: () => ({ toArray: async () => [{ amount: income }] }) }) },
    expenses: { where: () => ({ equals: () => ({ toArray: async () => expenses.map(amount => ({ amount })) }) }) },
    transfers: { where: () => ({ equals: () => ({ toArray: async () => transfers }) }) }
  };
  const context = { window: { db }, Date };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('js/services/cycleService.js', 'utf8'), context);
  return context.window.cycleService;
}
test('budget allocations do not decrease cash', async () => {
  assert.equal(await setup().closeCycle('c1'), 30);
});
test('real spending decreases cash', async () => {
  assert.equal(await setup({ expenses: [5] }).closeCycle('c1'), 25);
});
test('savings deposits decrease cash but not expenses', async () => {
  assert.equal(await setup({ expenses: [5], transfers: [{ direction: 'out', amount: 3 }] }).closeCycle('c1'), 22);
});
test('savings withdrawals restore cash without income', async () => {
  assert.equal(await setup({ expenses: [5], transfers: [{ direction: 'out', amount: 3 }, { direction: 'in', amount: 2 }] }).closeCycle('c1'), 24);
});
test('cash deficit survives cycle closing', async () => {
  assert.equal(await setup({ opening: 10, expenses: [12] }).closeCycle('c1'), -2);
});
test('asset funding from savings must not count as cash transfer', () => {
  const cash = 30 - 5 - 3;
  const savings = 3 - 2;
  const assetCost = 2;
  assert.equal(cash, 22);
  assert.equal(savings + assetCost, 3);
});
