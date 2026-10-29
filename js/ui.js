/**
 * js/ui.js
 * ماژول مدیریت رابط کاربری و تعاملات بصری
 */
window.ui = {
    // فرمت اعداد به صورت سه رقم سه رقم فارسی
    formatNumber(num) {
        return Number(num || 0).toLocaleString('fa-IR');
    },

    // به‌روزرسانی کارت‌های آمار بالای صفحه
    updateStatCards({ income, totalAllocated, totalSpent }) {
        const freeBalance = income - totalSpent;
        document.getElementById('statIncome').textContent = `${this.formatNumber(income)} تومان`;
        document.getElementById('statAllocated').textContent = `${this.formatNumber(totalAllocated)} تومان`;
        document.getElementById('statTotalSpent').textContent = `${this.formatNumber(totalSpent)} تومان`;

        const freeEl = document.getElementById('statFreeBalance');
        freeEl.textContent = `${this.formatNumber(freeBalance)} تومان`;

        if (freeBalance < 0) {
            freeEl.className = 'text-lg font-bold text-rose-400 mt-1';
        } else {
            freeEl.className = 'text-lg font-bold text-emerald-400 mt-1';
        }
    },

    // رندر جدول پاکت‌های بودجه به همراه دکمه‌های ویرایش و حذف
    renderBudgetTable(budgetsWithStats, onEditBudget, onDeleteBudget) {
        const tbody = document.getElementById('budgetTableBody');
        const emptyState = document.getElementById('budgetEmptyState');
        tbody.innerHTML = '';

        if (!budgetsWithStats || budgetsWithStats.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        budgetsWithStats.forEach(b => {
            const remaining = b.allocated_amount - b.spent;
            const percent = b.allocated_amount > 0 ? Math.min(Math.round((b.spent / b.allocated_amount) * 100), 100) : 0;
            const isOverBudget = remaining < 0;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-750/50 transition border-b border-slate-700/40 text-slate-200';
            tr.innerHTML = `
        <td class="py-3 px-3 font-semibold text-slate-100">${b.title}</td>
        <td class="py-3 px-3">${this.formatNumber(b.allocated_amount)}</td>
        <td class="py-3 px-3 text-amber-400">${this.formatNumber(b.spent)}</td>
        <td class="py-3 px-3 ${isOverBudget ? 'text-rose-400 font-bold' : 'text-emerald-400'}">
          ${this.formatNumber(remaining)}
        </td>
        <td class="py-3 px-3 w-40">
          <div class="flex items-center gap-2">
            <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div class="h-full ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${percent}%"></div>
            </div>
            <span class="text-xs text-slate-400">${percent}%</span>
          </div>
        </td>
        <td class="py-3 px-3 text-center space-x-reverse space-x-1">
          <button data-id="${b.id}" class="btn-edit-budget text-amber-400 hover:text-amber-300 text-xs px-2 py-1 bg-amber-500/10 rounded-lg transition">
            ویرایش
          </button>
          <button data-id="${b.id}" class="btn-delete-budget text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-rose-500/10 rounded-lg transition">
            حذف
          </button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        // رویداد کلیک دکمه ویرایش بودجه
        tbody.querySelectorAll('.btn-edit-budget').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                const item = budgetsWithStats.find(b => b.id === id);
                onEditBudget(item);
            });
        });

        // رویداد کلیک دکمه حذف بودجه
        tbody.querySelectorAll('.btn-delete-budget').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                if (confirm('با حذف این سرفصل، کلیه تراکنش‌های خرج متصل به آن نیز حذف خواهند شد. ادامه می‌دهید؟')) {
                    onDeleteBudget(id);
                }
            });
        });
    },

    // پر کردن Dropdown سرفصل‌ها در فرم ثبت خرج و مودال ویرایش
    populateBudgetSelect(budgets) {
        const select = document.getElementById('expenseBudgetSelect');
        const modalSelect = document.getElementById('modalBudgetSelect');
        select.innerHTML = '<option value="">-- انتخاب سرفصل --</option>';
        if (modalSelect) modalSelect.innerHTML = '';

        budgets.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.title;
            select.appendChild(opt);

            if (modalSelect) {
                const optModal = document.createElement('option');
                optModal.value = b.id;
                optModal.textContent = b.title;
                modalSelect.appendChild(optModal);
            }
        });
    },

    // رندر جدول تراکنش‌های خرج‌کرد روزانه به همراه دکمه‌های ویرایش و حذف
    renderExpenseTable(expenses, onEditExpense, onDeleteExpense) {
        const tbody = document.getElementById('expenseTableBody');
        const emptyState = document.getElementById('expenseEmptyState');
        tbody.innerHTML = '';

        if (!expenses || expenses.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        expenses.forEach(exp => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-750/50 transition border-b border-slate-700/40 text-slate-200';
            tr.innerHTML = `
        <td class="py-3 px-3 text-xs text-slate-400">${exp.date || '-'}</td>
        <td class="py-3 px-3 font-medium text-slate-100">${exp.title}</td>
        <td class="py-3 px-3"><span class="px-2 py-0.5 bg-slate-950 text-cyan-400 rounded-md text-xs">${exp.budget_title}</span></td>
        <td class="py-3 px-3 text-amber-400 font-bold">${this.formatNumber(exp.amount)} تومان</td>
        <td class="py-3 px-3 text-center space-x-reverse space-x-1">
          <button data-id="${exp.id}" class="btn-edit-expense text-amber-400 hover:text-amber-300 text-xs px-2 py-1 bg-amber-500/10 rounded-lg transition">
            ویرایش
          </button>
          <button data-id="${exp.id}" class="btn-delete-expense text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-rose-500/10 rounded-lg transition">
            حذف
          </button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        // رویداد کلیک دکمه ویرایش هزینه
        tbody.querySelectorAll('.btn-edit-expense').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                const item = expenses.find(x => x.id === id);
                onEditExpense(item);
            });
        });

        // رویداد کلیک دکمه حذف هزینه
        tbody.querySelectorAll('.btn-delete-expense').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                onDeleteExpense(id);
            });
        });
    },

    // باز کردن مودال ویرایش و پر کردن فیلدها با اطلاعات ردیف انتخاب‌شده
    openEditModal(type, item) {
        const modal = document.getElementById('editModal');
        const modalTitle = document.getElementById('modalTitle');
        const typeInput = document.getElementById('editItemType');
        const idInput = document.getElementById('editItemId');
        const titleInput = document.getElementById('modalInputTitle');
        const amountInput = document.getElementById('modalInputAmount');
        const budgetSelectContainer = document.getElementById('modalBudgetSelectContainer');
        const budgetSelect = document.getElementById('modalBudgetSelect');

        typeInput.value = type;
        idInput.value = item.id;
        titleInput.value = item.title;

        if (type === 'budget') {
            modalTitle.textContent = 'ویرایش پاکت بودجه';
            amountInput.value = item.allocated_amount;
            budgetSelectContainer.classList.add('hidden');
        } else {
            modalTitle.textContent = 'ویرایش تراکنش هزینه';
            amountInput.value = item.amount;
            if (budgetSelect) budgetSelect.value = item.budget_id;
            budgetSelectContainer.classList.remove('hidden');
        }

        modal.classList.remove('hidden');
    },

    // بستن مودال ویرایش
    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) modal.classList.add('hidden');
    },

    // مدیریت تب‌های برنامه
    setupTabs() {
        const tabBudget = document.getElementById('tabBudgetBtn');
        const tabExpense = document.getElementById('tabExpenseBtn');
        const tabBackup = document.getElementById('tabBackupBtn');

        const secBudget = document.getElementById('budgetSection');
        const secExpense = document.getElementById('expenseSection');
        const secBackup = document.getElementById('backupSection');

        function activate(activeBtn, activeSec) {
            [tabBudget, tabExpense, tabBackup].forEach(b => {
                b.className = 'px-5 py-2.5 font-medium text-sm rounded-t-xl transition border-b-2 border-transparent text-slate-400 hover:text-slate-200';
            });
            [secBudget, secExpense, secBackup].forEach(s => s.classList.add('hidden'));

            activeBtn.className = 'px-5 py-2.5 font-medium text-sm rounded-t-xl transition border-b-2 border-emerald-500 bg-slate-800 text-emerald-400';
            activeSec.classList.remove('hidden');
        }

        tabBudget.addEventListener('click', () => activate(tabBudget, secBudget));
        tabExpense.addEventListener('click', () => activate(tabExpense, secExpense));
        tabBackup.addEventListener('click', () => activate(tabBackup, secBackup));
    },

    // رندر جدول درآمدها
  renderIncomeTable(incomes, onDeleteIncome) {
        const tbody = document.getElementById('incomeTableBody');
        const emptyState = document.getElementById('incomeEmptyState');
        tbody.innerHTML = '';

        if (!incomes || incomes.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        incomes.forEach(inc => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-750/50 transition border-b border-slate-700/40 text-slate-200';
            tr.innerHTML = `
        <td class="py-3 px-3 text-xs text-slate-400">${inc.date || '-'}</td>
        <td class="py-3 px-3 font-medium text-slate-100">${inc.title}</td>
        <td class="py-3 px-3">
          ${inc.is_salary
                    ? '<span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs">حقوق اصلی</span>'
                    : '<span class="px-2 py-0.5 bg-slate-950 text-slate-400 rounded-md text-xs">درآمد جانبی</span>'}
        </td>
        <td class="py-3 px-3 text-emerald-400 font-bold">${this.formatNumber(inc.amount)} تومان</td>
        <td class="py-3 px-3 text-center">
          <button data-id="${inc.id}" class="btn-delete-income text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-rose-500/10 rounded-lg transition">
            حذف
          </button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-delete-income').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                onDeleteIncome(id);
            });
        });
    },

    // به‌روزرسانی مدیریت تب‌ها
    setupTabs() {
        const tabBudget = document.getElementById('tabBudgetBtn');
        const tabExpense = document.getElementById('tabExpenseBtn');
        const tabIncome = document.getElementById('tabIncomeBtn');
        const tabBackup = document.getElementById('tabBackupBtn');

        const secBudget = document.getElementById('budgetSection');
        const secExpense = document.getElementById('expenseSection');
        const secIncome = document.getElementById('incomeSection');
        const secBackup = document.getElementById('backupSection');

        const tabs = [
            { btn: tabBudget, sec: secBudget },
            { btn: tabExpense, sec: secExpense },
            { btn: tabIncome, sec: secIncome },
            { btn: tabBackup, sec: secBackup }
        ];

        tabs.forEach(({ btn, sec }) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                tabs.forEach(t => {
                    if (t.btn) t.btn.className = 'px-5 py-2.5 font-medium text-sm rounded-t-xl transition border-b-2 border-transparent text-slate-400 hover:text-slate-200';
                    if (t.sec) t.sec.classList.add('hidden');
                });
                btn.className = 'px-5 py-2.5 font-medium text-sm rounded-t-xl transition border-b-2 border-emerald-500 bg-slate-800 text-emerald-400';
                sec.classList.remove('hidden');
            });
        });
    }
};