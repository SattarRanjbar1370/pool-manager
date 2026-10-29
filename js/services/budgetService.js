/**
 * js/services/budgetService.js
 */
window.budgetService = {
    async getAllBudgets() {
        return await window.db.budgets.toArray();
    },

    async addBudget(title, allocatedAmount, month = 'جاری') {
        return await window.db.budgets.add({
            title: title.trim(),
            allocated_amount: Number(allocatedAmount),
            month: month,
            created_at: new Date().toISOString()
        });
    },

    async deleteBudget(budgetId) {
        return await window.db.transaction('rw', window.db.budgets, window.db.expenses, async () => {
            await window.db.expenses.where('budget_id').equals(budgetId).delete();
            await window.db.budgets.delete(budgetId);
        });
    },

    async getTotalAllocated() {
        const all = await window.db.budgets.toArray();
        return all.reduce((sum, item) => sum + (item.allocated_amount || 0), 0);
    },

    // ویرایش سرفصل بودجه
    async updateBudget(id, title, allocatedAmount) {
        return await window.db.budgets.update(Number(id), {
            title: title.trim(),
            allocated_amount: Number(allocatedAmount)
        });
    },
};