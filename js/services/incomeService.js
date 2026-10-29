/**
 * js/services/incomeService.js
 * مدیریت ورودی‌های نقدی و تفکیک حقوق اصلی از درآمدهای جانبی
 */
window.incomeService = {
    // دریافت لیست تمام درآمدهای یک دوره
    async getIncomesByCycle(cycleId) {
        if (!cycleId) return [];
        return await window.db.incomes.where('cycle_id').equals(cycleId).toArray();
    },

    // ثبت یک درآمد جدید
    async addIncome(cycleId, title, amount, isSalary = false, date = null) {
        return await window.db.incomes.add({
            cycle_id: cycleId,
            title: title.trim(),
            amount: Number(amount),
            is_salary: isSalary ? 1 : 0,
            date: date || new Date().toLocaleDateString('fa-IR'),
            created_at: new Date().toISOString()
        });
    },

    // حذف یک تراکنش درآمد
    async deleteIncome(id) {
        return await window.db.incomes.delete(Number(id));
    },

    // محاسبه کل نقدینگی دوره (موجودی اولیه + انتقالی + تمام دریافتی‌ها)
    async getTotalLiquidity(cycleId) {
        const cycle = await window.db.cycles.get(cycleId);
        if (!cycle) return 0;

        const incomes = await this.getIncomesByCycle(cycleId);
        const sumIncomes = incomes.reduce((sum, item) => sum + (item.amount || 0), 0);

        return (cycle.opening_balance || 0) + (cycle.carried_over_balance || 0) + sumIncomes;
    }
};