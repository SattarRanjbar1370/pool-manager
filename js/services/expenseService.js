/**
 * js/services/expenseService.js
 */
window.expenseService = {
    async getAllExpenses() {
        const expenses = await window.db.expenses.toArray();
        const budgets = await window.db.budgets.toArray();
        const budgetMap = new Map(budgets.map(b => [b.id, b.title]));

        return expenses.map(exp => ({
            ...exp,
            budget_title: budgetMap.get(exp.budget_id) || 'سرفصل نامشخص'
        }));
    },

    async addExpense(budgetId, title, amount, date = null, notes = '') {
        const bId = Number(budgetId);
        if (!bId) {
            throw new Error('انتخاب سرفصل بودجه برای ثبت هزینه الزامی است.');
        }

        const currentBudget = await window.db.budgets.get(bId);
        if (!currentBudget) {
            throw new Error('سرفصل بودجه انتخاب‌شده در دیتابیس وجود ندارد.');
        }

        return await window.db.expenses.add({
            budget_id: bId,
            title: title.trim(),
            amount: Number(amount),
            date: date || new Date().toLocaleDateString('fa-IR'),
            notes: notes.trim(),
            created_at: new Date().toISOString()
        });
    },

    async deleteExpense(expenseId) {
        return await window.db.expenses.delete(Number(expenseId));
    },

    async getSpentByBudget(budgetId) {
        const list = await window.db.expenses.where('budget_id').equals(Number(budgetId)).toArray();
        return list.reduce((sum, item) => sum + (item.amount || 0), 0);
    },

    async getTotalSpent() {
        const all = await window.db.expenses.toArray();
        return all.reduce((sum, item) => sum + (item.amount || 0), 0);
    },

    // ویرایش هزینه ثبت‌شده
    async updateExpense(id, budgetId, title, amount) {
        return await window.db.expenses.update(Number(id), {
            budget_id: Number(budgetId),
            title: title.trim(),
            amount: Number(amount)
        });
    },
};