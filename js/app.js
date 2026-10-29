/**
 * js/app.js
 * هماهنگ‌کننده مرکزی با پشتیبانی از چرخه‌های ماهانه و حقوق
 */
let currentCycle = null;

// ۱. بررسی وضعیت دوره فعال در شروع برنامه
async function checkCurrentCycle() {
    currentCycle = await window.cycleService.getCurrentCycle();

    if (!currentCycle) {
        // هیچ دوره‌ای فعال نیست -> باز کردن مودال شروع ماه
        document.getElementById('newCycleModal').classList.remove('hidden');
        return null;
    }

    return currentCycle;
}

// ۲. بروزرسانی و لود مجدد اطلاعات
async function refreshApp() {
    if (!currentCycle) {
        currentCycle = await checkCurrentCycle();
        if (!currentCycle) return;
    }

    const incomes = await window.incomeService.getIncomesByCycle(cycleId);
    window.ui.renderIncomeTable(incomes, handleDeleteIncome);
    const cycleId = currentCycle.id;
    const totalLiquidity = await window.incomeService.getTotalLiquidity(cycleId);
    const budgets = await window.db.budgets.where('cycle_id').equals(cycleId).toArray();
    const expenses = await window.db.expenses.where('cycle_id').equals(cycleId).toArray();

    const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // آمار تفکیکی هر پاکت
    const budgetsWithStats = await Promise.all(
        budgets.map(async (b) => {
            const spent = await window.expenseService.getSpentByBudget(b.id);
            return { ...b, spent };
        })
    );

    // نمایش آمار در کارت‌ها
    window.ui.updateStatCards({ income: totalLiquidity, totalAllocated, totalSpent });
    window.ui.populateBudgetSelect(budgets);
    window.ui.renderBudgetTable(budgetsWithStats, handleEditBudget, handleDeleteBudget);
    window.ui.renderExpenseTable(expenses, handleEditExpense, handleDeleteExpense);
}

async function handleDeleteIncome(id) {
    await window.incomeService.deleteIncome(id);
    await refreshApp();
}

// ۳. رویدادهای کاربری
function setupEventListeners() {
    // الف) فرم شروع دوره کاری جدید
    const newCycleForm = document.getElementById('newCycleForm');
    newCycleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('cycleTitleInput').value.trim();
        const balance = document.getElementById('cycleOpeningBalanceInput').value;
        const cycleId = 'cycle_' + Date.now();

        currentCycle = await window.cycleService.startNewCycle(cycleId, title, balance, 0);
        document.getElementById('newCycleModal').classList.add('hidden');
        newCycleForm.reset();
        await refreshApp();
    });

    // ب) فرم افزودن پاکت بودجه
    const addBudgetForm = document.getElementById('addBudgetForm');
    addBudgetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentCycle) return;

        const title = document.getElementById('budgetTitleInput').value;
        const amount = document.getElementById('budgetAmountInput').value;

        await window.db.budgets.add({
            cycle_id: currentCycle.id,
            title: title.trim(),
            allocated_amount: Number(amount),
            month: currentCycle.title,
            created_at: new Date().toISOString()
        });

        addBudgetForm.reset();
        await refreshApp();
    });

    // ج) فرم ثبت خرج روزانه
    const addExpenseForm = document.getElementById('addExpenseForm');
    addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentCycle) return;

        const budgetId = document.getElementById('expenseBudgetSelect').value;
        const title = document.getElementById('expenseTitleInput').value;
        const amount = document.getElementById('expenseAmountInput').value;

        await window.db.expenses.add({
            cycle_id: currentCycle.id,
            budget_id: Number(budgetId),
            title: title.trim(),
            amount: Number(amount),
            date: new Date().toLocaleDateString('fa-IR'),
            created_at: new Date().toISOString()
        });

        addExpenseForm.reset();
        await refreshApp();
    });

    // د) بستن ماه و انتقال خودکار مانده
    const closeBtn = document.getElementById('btnCloseMonthBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', async () => {
            if (!currentCycle) return;
            if (confirm(`آیا مطمئن هستید که می‌خواهید دوره «${currentCycle.title}» را ببندید؟ مانده آزاد محاسبه شده و به عنوان سرمایه شروع دوره بعد منتقل می‌شود.`)) {
                const remaining = await window.cycleService.closeCycle(currentCycle.id);

                // باز کردن فرم دوره جدید با مقدار مانده قبلی
                document.getElementById('cycleOpeningBalanceInput').value = remaining;
                document.getElementById('newCycleModal').classList.remove('hidden');
                currentCycle = null;
            }
        });
    }

    // هـ) دکمه‌های پاپ‌آپ حقوق (تکرار ماه قبل / جدید)
    document.getElementById('btnStartFreshBudgets').addEventListener('click', () => {
        document.getElementById('salaryPromptModal').classList.add('hidden');
    });

    document.getElementById('btnCopyPreviousBudgets').addEventListener('click', async () => {
        // یافتن آخرین دوره بسته‌شده برای کپی بودجه‌ها
        const lastClosed = await window.db.cycles.where('is_closed').equals(1).reverse().first();
        if (lastClosed && currentCycle) {
            await window.cycleService.copyBudgetsFromPreviousCycle(lastClosed.id, currentCycle.id);
            await refreshApp();
        }
        document.getElementById('salaryPromptModal').classList.add('hidden');
    });

    // ثبت درآمد جدید و فعال‌سازی پاپ‌آپ حقوق
    const addIncomeForm = document.getElementById('addIncomeForm');
    if (addIncomeForm) {
        addIncomeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentCycle) return;

            const title = document.getElementById('incomeTitleInput').value;
            const amount = document.getElementById('incomeAmountInput').value;
            const isSalary = document.getElementById('isSalaryCheckbox').checked;

            await window.incomeService.addIncome(currentCycle.id, title, amount, isSalary);
            addIncomeForm.reset();
            await refreshApp();

            // اگر تیک حقوق اصلی خورده باشد، پاپ‌آپ تصمیم‌گیری هوشمند باز می‌شود
            if (isSalary) {
                document.getElementById('salaryPromptModal').classList.remove('hidden');
            }
        });
    }
}

// توابع کمکی ویرایش و حذف
function handleEditBudget(budget) { window.ui.openEditModal('budget', budget); }
function handleEditExpense(expense) { window.ui.openEditModal('expense', expense); }
async function handleDeleteBudget(id) { await window.budgetService.deleteBudget(id); await refreshApp(); }
async function handleDeleteExpense(id) { await window.expenseService.deleteExpense(id); await refreshApp(); }

// شروع برنامه
document.addEventListener('DOMContentLoaded', async () => {
    window.ui.setupTabs();
    setupEventListeners();
    await refreshApp();
});