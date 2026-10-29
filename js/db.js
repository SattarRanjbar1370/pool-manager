/**
 * js/db.js
 * نسخه ۲ پایگاه داده PoolDB (پشتیبانی از چرخه‌های ماهانه و ثبت ورودی‌های نقدی)
 */
const db = new Dexie('PoolDB');

// نسخه ۱ (پایه‌ای قبلی)
db.version(1).stores({
    budgets: '++id, title, allocated_amount, month, created_at',
    expenses: '++id, budget_id, title, amount, date, created_at'
});

// نسخه ۲: ارتقای ساختار با حفظ اطلاعات قبلی
db.version(2).stores({
    // جدول دوره‌های کاری ماهانه (مثلاً: 1405-08)
    cycles: 'id, title, start_date, end_date, opening_balance, carried_over_balance, is_closed, created_at',

    // جدول درآمدهای ثبت‌شده (حقوق اصلی یا واریزی متفرقه طی ماه)
    incomes: '++id, cycle_id, title, amount, date, is_salary, created_at',

    // افزودن ایندکس cycle_id به بودجه‌ها و مخارج
    budgets: '++id, cycle_id, title, allocated_amount, month, created_at',
    expenses: '++id, cycle_id, budget_id, title, amount, date, created_at'
}).upgrade(tx => {
    // ارتقای داده‌های نسخه ۱ به یک دوره پیش‌فرض
    const defaultCycleId = 'current';
    return tx.budgets.toCollection().modify(b => {
        if (!b.cycle_id) b.cycle_id = defaultCycleId;
    }).then(() => {
        return tx.expenses.toCollection().modify(e => {
            if (!e.cycle_id) e.cycle_id = defaultCycleId;
        });
    });
});

window.db = db;