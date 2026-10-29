/**
 * js/app.js
 * کنترل‌کننده مرکزی سیستم بودجه‌بندی استخر نقدینگی
 */
let currentCycle = null;

// ۱. بررسی یا باز کردن مودال دوره فعال
async function checkCurrentCycle() {
    currentCycle = await window.cycleService.getCurrentCycle();
    const titleDisplay = document.getElementById('currentCycleDisplay');

    if (!currentCycle) {
        if (titleDisplay) titleDisplay.textContent = 'دوره کاری فعال: دوره‌ای تعریف نشده است';
        document.getElementById('newCycleModal').classList.remove('hidden');
        return null;
    }

    if (titleDisplay) {
        titleDisplay.textContent = `دوره کاری فعال: ${currentCycle.title} (شروع: ${currentCycle.start_date || '-'})`;
    }
    return currentCycle;
}

// ۲. بروزرسانی و بارگذاری مجدد تمام بخش‌ها
async function refreshApp() {
    if (!currentCycle) {
        currentCycle = await checkCurrentCycle();
        if (!currentCycle) return;
    }

    const cycleId = currentCycle.id;

    // دریافت اطلاعات از پایگاه داده
    const totalLiquidity = await window.incomeService.getTotalLiquidity(cycleId);
    const budgets = await window.db.budgets.where('cycle_id').equals(cycleId).toArray();
    const rawExpenses = await window.db.expenses.where('cycle_id').equals(cycleId).toArray();
    const incomes = await window.incomeService.getIncomesByCycle(cycleId);

    // نقشه نام سرفصل‌ها برای اتصال به مخارج
    const budgetMap = {};
    budgets.forEach(b => { budgetMap[b.id] = b.title; });

    const expenses = rawExpenses.map(e => ({
        ...e,
        budget_title: budgetMap[e.budget_id] || 'سرفصل نامشخص'
    }));

    // محاسبه آمار مصرفی هر پاکت
    const budgetsWithStats = await Promise.all(
        budgets.map(async (b) => {
            const spent = await window.expenseService.getSpentByBudget(b.id);
            return { ...b, spent };
        })
    );

    const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // به‌روزرسانی کارت‌های آمار بالای صفحه
    window.statCardsComponent.update({ income: totalLiquidity, totalAllocated, totalSpent });

    // بروزرسانی کامپوننت‌ها
    window.budgetViewComponent.renderTable(budgetsWithStats, handleEditBudget, handleDeleteBudget);
    window.expenseViewComponent.populateBudgetDropdown(budgets);
    window.expenseViewComponent.renderTable(expenses, handleEditExpense, handleDeleteExpense);
    window.incomeViewComponent.renderTable(incomes, handleDeleteIncome);
    window.timelineViewComponent.render(expenses);

    return { budgetsWithStats, expenses, totalSpent, totalLiquidity };
}

// ۳. هندلرهای ویرایش و حذف
function handleEditBudget(budget) {
    window.modalsComponent.openEdit('budget', budget);
}

function handleEditExpense(expense) {
    window.modalsComponent.openEdit('expense', expense);
}

async function handleDeleteBudget(id) {
    await window.budgetService.deleteBudget(id);
    await refreshApp();
}

async function handleDeleteExpense(id) {
    await window.expenseService.deleteExpense(id);
    await refreshApp();
}

async function handleDeleteIncome(id) {
    await window.incomeService.deleteIncome(id);
    await refreshApp();
}

// ۴. اتصال شنونده‌های رویدادها (Event Listeners)
function setupEventListeners() {
    // فرم شروع دوره جدید
    const newCycleForm = document.getElementById('newCycleForm');
    if (newCycleForm) {
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
    }

    // فرم افزودن پاکت بودجه
    const addBudgetForm = document.getElementById('addBudgetForm');
    if (addBudgetForm) {
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
    }

    // فرم ثبت هزینه روزانه
    const addExpenseForm = document.getElementById('addExpenseForm');
    if (addExpenseForm) {
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
    }

    // فرم ثبت دریافتی جدید و تشخیص حقوق
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

            if (isSalary) {
                document.getElementById('salaryPromptModal').classList.remove('hidden');
            }
        });
    }

    // پاپ‌آپ تصمیم‌گیری حقوق (الگوی ماه قبل یا جدید)
    const btnStartFresh = document.getElementById('btnStartFreshBudgets');
    if (btnStartFresh) {
        btnStartFresh.addEventListener('click', () => {
            document.getElementById('salaryPromptModal').classList.add('hidden');
        });
    }

    const btnCopyPrev = document.getElementById('btnCopyPreviousBudgets');
    if (btnCopyPrev) {
        btnCopyPrev.addEventListener('click', async () => {
            const lastClosed = await window.db.cycles.where('is_closed').equals(1).reverse().first();
            if (lastClosed && currentCycle) {
                await window.cycleService.copyBudgetsFromPreviousCycle(lastClosed.id, currentCycle.id);
                await refreshApp();
            } else {
                alert('دوره قبلی بسته‌شده‌ای برای کپی اطلاعات یافت نشد.');
            }
            document.getElementById('salaryPromptModal').classList.add('hidden');
        });
    }

    // فرم ویرایش ردیف‌ها
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const type = document.getElementById('editItemType').value;
            const id = document.getElementById('editItemId').value;
            const title = document.getElementById('modalInputTitle').value;
            const amount = document.getElementById('modalInputAmount').value;

            if (type === 'budget') {
                await window.budgetService.updateBudget(id, title, amount);
            } else {
                const budgetId = document.getElementById('modalBudgetSelect').value;
                await window.expenseService.updateExpense(id, budgetId, title, amount);
            }

            window.modalsComponent.closeEdit();
            await refreshApp();
        });
    }

    // دکمه‌های بستن مودال ویرایش
    const modalClose = document.getElementById('modalCloseBtn');
    const modalCancel = document.getElementById('modalCancelBtn');
    if (modalClose) modalClose.addEventListener('click', () => window.modalsComponent.closeEdit());
    if (modalCancel) modalCancel.addEventListener('click', () => window.modalsComponent.closeEdit());

    // دکمه بستن ماه و انتقال خودکار مانده
    const closeMonthBtn = document.getElementById('btnCloseMonthBtn');
    if (closeMonthBtn) {
        closeMonthBtn.addEventListener('click', async () => {
            if (!currentCycle) return;
            if (confirm(`آیا از بستن دوره «${currentCycle.title}» مطمئن هستید؟ مانده آزاد نقدینگی محاسبه شده و به دوره بعد منتقل می‌گردد.`)) {
                const remaining = await window.cycleService.closeCycle(currentCycle.id);
                document.getElementById('cycleOpeningBalanceInput').value = remaining;
                document.getElementById('newCycleModal').classList.remove('hidden');
                currentCycle = null;
            }
        });
    }

    // خروجی و پشتیبان‌گیری
    const btnJson = document.getElementById('btnExportJson');
    if (btnJson) {
        btnJson.addEventListener('click', async () => {
            const totalLiquidity = currentCycle ? await window.incomeService.getTotalLiquidity(currentCycle.id) : 0;
            window.backupService.exportToJson(totalLiquidity);
        });
    }

    const importInput = document.getElementById('importJsonInput');
    if (importInput) {
        importInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (confirm('اطلاعات فعلی با داده‌های این فایل جایگزین خواهند شد. ادامه می‌دهید؟')) {
                try {
                    await window.backupService.importFromJson(file);
                    currentCycle = null;
                    await refreshApp();
                    alert('اطلاعات با موفقیت بازیابی شد.');
                } catch (err) {
                    alert(`خطا در بازیابی: ${err.message}`);
                }
            }
            e.target.value = '';
        });
    }

    const btnExcel = document.getElementById('btnExportExcel');
    if (btnExcel) {
        btnExcel.addEventListener('click', async () => {
            const res = await refreshApp();
            if (res) {
                await window.backupService.exportToExcel(res.totalLiquidity, res.budgetsWithStats, res.expenses);
            }
        });
    }

    const btnPdf = document.getElementById('btnExportPdf');
    if (btnPdf) {
        btnPdf.addEventListener('click', async () => {
            const res = await refreshApp();
            if (res) {
                await window.backupService.exportToPdf(res.totalLiquidity, res.budgetsWithStats, res.totalSpent);
            }
        });
    }
}

// ۵. بارگذاری اولیه و مقداردهی کامپوننت‌ها
document.addEventListener('DOMContentLoaded', async () => {
    // سوار کردن المان‌های UI از فایل‌های کامپوننت
    window.statCardsComponent.mount();
    window.budgetViewComponent.mount();
    window.expenseViewComponent.mount();
    window.timelineViewComponent.mount();
    window.incomeViewComponent.mount();
    window.modalsComponent.mount();

    // تنظیم ناوبری تب‌ها و ایونت‌ها
    window.ui.setupTabs();
    setupEventListeners();

    // اجرای بارگذاری اولیه برنامه
    await refreshApp();
});