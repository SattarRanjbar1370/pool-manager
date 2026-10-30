/**
 * js/services/cycleService.js
 * مدیریت چرخه‌های کاری ماهانه، بستن دوره و انتقال مانده به ماه بعد
 */
window.cycleService = {
    // دریافت دوره مالی فعال فعلی
    async getCurrentCycle() {
        const active = await window.db.cycles.where('is_closed').equals(0).first();
        return active || null;
    },

    // ایجاد یا شروع یک دوره ماهانه جدید
    async startNewCycle(cycleId, title, openingBalance = 0, carriedOverBalance = 0) {
        // اگر دوره بازی از قبل بود، ابتدا آن را می‌بندیم
        const current = await this.getCurrentCycle();
        if (current) {
            await this.closeCycle(current.id);
        }

        const newCycle = {
            id: cycleId, // مثلاً 1405-08
            title: title, // مثلاً آبان ۱۴۰۵
            start_date: new Date().toLocaleDateString('fa-IR'),
            end_date: null,
            opening_balance: Number(openingBalance),
            carried_over_balance: Number(carriedOverBalance),
            is_closed: 0,
            created_at: new Date().toISOString()
        };

        await window.db.cycles.put(newCycle);
        return newCycle;
    },

    // بستن دوره و محاسبه مانده باقی‌مانده نهایی برای انتقال
    async closeCycle(cycleId) {
        const cycle = await window.db.cycles.get(cycleId);
        if (!cycle) return 0;

        // محاسبه درآمدهای این دوره
        const incomes = await window.db.incomes.where('cycle_id').equals(cycleId).toArray();
        const totalIncome = (cycle.opening_balance || 0) +
            (cycle.carried_over_balance || 0) +
            incomes.reduce((sum, item) => sum + (item.amount || 0), 0);

        // محاسبه کل خرج‌های این دوره
        const expenses = await window.db.expenses.where('cycle_id').equals(cycleId).toArray();
        const totalSpent = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

        const transfers = await window.db.transfers.where('cycle_id').equals(cycleId).toArray();
        const netTransfers = transfers.reduce((sum, t) => sum + (t.direction === 'out' ? Number(t.amount || 0) : -Number(t.amount || 0)), 0);
        const remainingCash = totalIncome - totalSpent - netTransfers;

        await window.db.cycles.update(cycleId, {
            is_closed: 1,
            end_date: new Date().toLocaleDateString('fa-IR')
        });

        return remainingCash;
    },

    // کپی کردن سرفصل‌های دوره قبل برای دوره جدید
    async copyBudgetsFromPreviousCycle(oldCycleId, newCycleId) {
        const prevBudgets = await window.db.budgets.where('cycle_id').equals(oldCycleId).toArray();

        const newBudgets = prevBudgets.map(b => ({
            cycle_id: newCycleId,
            title: b.title,
            allocated_amount: b.allocated_amount,
            month: b.month || 'جاری',
            created_at: new Date().toISOString()
        }));

        if (newBudgets.length > 0) {
            await window.db.budgets.bulkAdd(newBudgets);
        }
    }
};