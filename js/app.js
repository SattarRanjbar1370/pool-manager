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
        if (window.modalsComponent && window.modalsComponent.prepareNewCycleModal) {
            window.modalsComponent.prepareNewCycleModal();
        }
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

    // دریافت اطلاعات پایه
    const totalLiquidity = await window.incomeService.getTotalLiquidity(cycleId);
    const budgets = await window.db.budgets.where('cycle_id').equals(cycleId).toArray();
    const rawExpenses = await window.db.expenses.where('cycle_id').equals(cycleId).toArray();
    const incomes = await window.incomeService.getIncomesByCycle(cycleId);
    const transfers = await window.db.transfers.where('cycle_id').equals(cycleId).toArray();

    const budgetMap = {};
    budgets.forEach(b => { budgetMap[b.id] = b.title; });

    const expenses = rawExpenses.map(e => ({
        ...e,
        budget_title: budgetMap[e.budget_id] || (e.budget_id === 0 ? 'انتقال به اندوخته' : 'سرفصل نامشخص')
    }));

    const budgetsWithStats = await Promise.all(
        budgets.map(async (b) => {
            const spent = await window.expenseService.getSpentByBudget(b.id);
            return { ...b, spent };
        })
    );

    const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated_amount || 0), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // انتقال پس‌انداز از نقدینگی کسر می‌شود ولی هزینه نیست
    const netTransfers = transfers.reduce((sum, t) => sum + (t.direction === 'out' ? Number(t.amount || 0) : -Number(t.amount || 0)), 0);
    window.statCardsComponent.update({ income: totalLiquidity, totalAllocated, totalSpent, netTransfers });
    if (window.homeInsightsComponent) await window.homeInsightsComponent.update(budgetsWithStats, expenses);

    // بروزرسانی کامپوننت‌ها
    window.budgetViewComponent.renderTable(budgetsWithStats, handleEditBudget, handleDeleteBudget);
    window.expenseViewComponent.populateBudgetDropdown(budgets);
    if (window.modalsComponent && window.modalsComponent.populateModalBudgets) {
        window.modalsComponent.populateModalBudgets(budgets);
    }
    window.expenseViewComponent.renderTable(expenses, handleEditExpense, handleDeleteExpense);
    window.incomeViewComponent.renderTable(incomes, handleDeleteIncome);
    window.timelineViewComponent.render(expenses, incomes, budgets);

    if (window.assetsViewComponent) {
        await window.assetsViewComponent.refresh();
    }

    return { budgetsWithStats, expenses, totalSpent, totalLiquidity };
}

window.refreshApp = refreshApp;

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

// ۴. اتصال شنونده‌های رویدادهای اصلی
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

    // فرم افزودن پاکت بودجه مصرفی
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
                category_type: 'expense',
                allocated_amount: Number(amount),
                month: currentCycle.title,
                created_at: new Date().toISOString()
            });

            addBudgetForm.reset();
            await refreshApp();
        });
    }

    // ثبت سریع هزینه از داشبورد
    const quickModal = document.getElementById('quickExpenseModal');
    const quickForm = document.getElementById('quickExpenseForm');
    const quickOpen = document.getElementById('btnQuickExpense');
    const quickClose = () => quickModal.classList.add('hidden');
    document.getElementById('btnCloseQuickExpense')?.addEventListener('click', quickClose);
    quickModal?.addEventListener('click', e => { if (e.target === quickModal) quickClose(); });
    quickOpen?.addEventListener('click', async () => {
        if (!currentCycle) {
            alert('ابتدا یک دوره کاری ایجاد کنید.');
            return;
        }
        const budgets = await window.db.budgets.where('cycle_id').equals(currentCycle.id).toArray();
        if (!budgets.length) {
            alert('ابتدا یک پاکت بودجه ایجاد کنید.');
            return;
        }
        const select = document.getElementById('quickExpenseBudget');
        select.replaceChildren();
        budgets.forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = b.title;
            select.appendChild(option);
        });
        quickForm.reset();
        quickModal.classList.remove('hidden');
        document.getElementById('quickExpenseTitle').focus();
    });
    quickForm?.addEventListener('submit', async e => {
        e.preventDefault();
        if (!currentCycle) return;
        const budgetId = Number(document.getElementById('quickExpenseBudget').value);
        const title = document.getElementById('quickExpenseTitle').value.trim();
        const amount = Number(document.getElementById('quickExpenseAmount').value);
        if (!title || !Number.isSafeInteger(amount) || amount <= 0) return;
        const budget = await window.db.budgets.get(budgetId);
        if (!budget || budget.cycle_id !== currentCycle.id) {
            alert('پاکت انتخاب‌شده معتبر نیست.');
            return;
        }
        const submit = quickForm.querySelector('[type="submit"]');
        submit.disabled = true;
        try {
            await window.db.expenses.add({
                cycle_id: currentCycle.id, budget_id: budgetId, title, amount,
                date: window.persianDatePicker ? window.persianDatePicker.getTodayJalaliString() : new Date().toLocaleDateString('fa-IR'),
                created_at: new Date().toISOString()
            });
            quickClose();
            await refreshApp();
        } catch (error) {
            alert('ثبت هزینه ناموفق بود: ' + error.message);
        } finally {
            submit.disabled = false;
        }
    });

    // فرم ثبت هزینه روزانه
    const addExpenseForm = document.getElementById('addExpenseForm');
    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentCycle) return;

            const budgetId = document.getElementById('expenseBudgetSelect').value;
            const title = document.getElementById('expenseTitleInput').value;
            const amount = document.getElementById('expenseAmountInput').value;
            const dateInput = document.getElementById('expenseDateInput');
            const dateValue = (dateInput && dateInput.value.trim())
                ? dateInput.value.trim()
                : (window.persianDatePicker ? window.persianDatePicker.getTodayJalaliString() : new Date().toLocaleDateString('fa-IR'));

            await window.db.expenses.add({
                cycle_id: currentCycle.id,
                budget_id: Number(budgetId),
                title: title.trim(),
                amount: Number(amount),
                date: dateValue,
                created_at: new Date().toISOString()
            });

            addExpenseForm.reset();
            if (dateInput && window.persianDatePicker) {
                dateInput.value = window.persianDatePicker.getTodayJalaliString();
            }
            await refreshApp();
        });
    }

    // فرم ثبت درآمد جدید
    const addIncomeForm = document.getElementById('addIncomeForm');
    if (addIncomeForm) {
        addIncomeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentCycle) return;

            const title = document.getElementById('incomeTitleInput').value;
            const amount = document.getElementById('incomeAmountInput').value;
            const isSalary = document.getElementById('isSalaryCheckbox').checked;
            const dateInput = document.getElementById('incomeDateInput');
            const dateValue = (dateInput && dateInput.value.trim())
                ? dateInput.value.trim()
                : (window.persianDatePicker ? window.persianDatePicker.getTodayJalaliString() : new Date().toLocaleDateString('fa-IR'));

            await window.incomeService.addIncome(currentCycle.id, title, amount, isSalary, dateValue);
            addIncomeForm.reset();
            if (dateInput && window.persianDatePicker) {
                dateInput.value = window.persianDatePicker.getTodayJalaliString();
            }
            await refreshApp();

            if (isSalary) {
                document.getElementById('salaryPromptModal').classList.remove('hidden');
            }
        });
    }

    // پاپ‌آپ تصمیم‌گیری حقوق
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
                if (!budgetId) {
                    alert('لطفاً سرفصل متصل را انتخاب کنید.');
                    return;
                }
                await window.expenseService.updateExpense(id, Number(budgetId), title, amount);
            }

            window.modalsComponent.closeEdit();
            await refreshApp();
        });
    }

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
                if (window.modalsComponent && window.modalsComponent.prepareNewCycleModal) {
                    window.modalsComponent.prepareNewCycleModal();
                }
                document.getElementById('newCycleModal').classList.remove('hidden');
                currentCycle = null;
            }
        });
    }

    // دکمه‌های پشتیبان‌گیری
    const btnJson = document.getElementById('btnExportJson');
    if (btnJson) {
        btnJson.addEventListener('click', async () => {
            const totalLiquidity = currentCycle ? await window.incomeService.getTotalLiquidity(currentCycle.id) : 0;
            try {
                await window.backupService.exportToJson();
            } catch (err) {
                alert("خروجی پشتیبان انجام نشد: " + err.message);
            }
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

async function handleFirstLaunch() {
    // Never offer a destructive fresh start when records already exist.
    if (await window.backupService.hasData()) return;
    const modal = document.getElementById('firstLaunchModal');
    const input = document.getElementById('firstLaunchFile');
    const error = document.getElementById('firstLaunchError');
    modal.classList.remove('hidden');
    await new Promise(resolve => {
        const finish = () => { modal.classList.add('hidden'); resolve(); };
        document.getElementById('firstLaunchFresh').addEventListener('click', finish, { once: true });
        document.getElementById('firstLaunchRestore').addEventListener('click', () => input.click());
        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;
            error.textContent = '';
            try {
                await window.backupService.importFromJson(file);
                currentCycle = null;
                finish();
            } catch (err) {
                error.textContent = 'بازیابی انجام نشد: ' + err.message;
            } finally {
                input.value = '';
            }
        });
    });
}

// ۵. بارگذاری اولیه یکتا
document.addEventListener('DOMContentLoaded', async () => {
    window.statCardsComponent.mount();
    window.homeInsightsComponent.mount();
    window.budgetViewComponent.mount();
    window.expenseViewComponent.mount();
    window.timelineViewComponent.mount();
    window.incomeViewComponent.mount();
    window.assetsViewComponent.mount();
    window.modalsComponent.mount();

    if (window.persianDatePicker) {
        window.persianDatePicker.mount();
    }

    window.ui.setupTabs();
    setupEventListeners();

    await handleFirstLaunch();
    await refreshApp();
});