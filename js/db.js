/**
 * js/db.js
 * نسخه ۳ پایگاه داده PoolDB (افزودن ماژول مدیریت دارایی‌ها، پس‌انداز و تاریخچه رشد)
 */
const db = new Dexie('PoolDB');

// نسخه ۱ (پایه‌ای قبلی)
db.version(1).stores({
    budgets: '++id, title, allocated_amount, month, created_at',
    expenses: '++id, budget_id, title, amount, date, created_at'
});

// نسخه ۲ (چرخه‌ها و درآمدها)
db.version(2).stores({
    cycles: 'id, title, start_date, end_date, opening_balance, carried_over_balance, is_closed, created_at',
    incomes: '++id, cycle_id, title, amount, date, is_salary, created_at',
    budgets: '++id, cycle_id, title, allocated_amount, month, created_at',
    expenses: '++id, cycle_id, budget_id, title, amount, date, created_at'
}).upgrade(tx => {
    const defaultCycleId = 'current';
    return tx.budgets.toCollection().modify(b => {
        if (!b.cycle_id) b.cycle_id = defaultCycleId;
    }).then(() => {
        return tx.expenses.toCollection().modify(e => {
            if (!e.cycle_id) e.cycle_id = defaultCycleId;
        });
    });
});

// نسخه ۳: جدول دارایی‌ها و لاگ‌های زمانی برای نمودارهای رشد
db.version(3).stores({
    assets: '++id, title, type, unit, current_quantity, initial_cost, notes, created_at',
    asset_logs: '++id, asset_id, date, quantity, change_amount, note, created_at'
});

window.db = db;
// انتقال داخلی بین نقدینگی و دارایی؛ نه درآمد و نه هزینه
 db.version(4).stores({
    transfers: '++id, cycle_id, asset_log_id, asset_id, amount, direction, date, created_at'
});
