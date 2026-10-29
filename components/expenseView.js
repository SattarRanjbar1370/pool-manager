/**
 * components/expenseView.js
 */
window.expenseViewComponent = {
    mount(containerId = 'expenseSection') {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `
      <div class="space-y-6">
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
          <h2 class="text-sm font-bold text-slate-200 mb-3">💳 ثبت خرج‌کرد روزانه</h2>
          <form id="addExpenseForm" class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div class="md:col-span-4">
              <label class="block text-xs text-slate-400 mb-1">انتخاب پاکت بودجه:</label>
              <select id="expenseBudgetSelect" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200">
                <option value="">-- انتخاب سرفصل --</option>
              </select>
            </div>
            <div class="md:col-span-4">
              <label class="block text-xs text-slate-400 mb-1">بابت چه کاری / خریدی؟</label>
              <input type="text" id="expenseTitleInput" required placeholder="مثال: خرید مواد غذایی، بنزین..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs text-slate-400 mb-1">مبلغ (تومان):</label>
              <input type="number" id="expenseAmountInput" required min="1" placeholder="مثال: ۱۲۰,۰۰۰"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
            </div>
            <div class="md:col-span-2">
              <button type="submit" class="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl py-2 px-3 text-sm transition">
                + ثبت هزینه
              </button>
            </div>
          </form>
        </div>

        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
          <h3 class="text-sm font-bold text-slate-300 mb-3">ریز مخارج ثبت‌شده این دوره</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse text-sm">
              <thead>
                <tr class="border-b border-slate-700 text-slate-400 text-xs">
                  <th class="py-3 px-3">تاریخ</th>
                  <th class="py-3 px-3">شرح خرج</th>
                  <th class="py-3 px-3">پاکت متصل</th>
                  <th class="py-3 px-3">مبلغ پرداختی</th>
                  <th class="py-3 px-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody id="expenseTableBody" class="divide-y divide-slate-700/50"></tbody>
            </table>
          </div>
          <div id="expenseEmptyState" class="text-center py-6 text-slate-500 text-xs hidden">
            هنوز هیچ هزینه‌ای در این دوره کاری ثبت نشده است.
          </div>
        </div>
      </div>
    `;
    },

    populateBudgetDropdown(budgets) {
        const sel = document.getElementById('expenseBudgetSelect');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- انتخاب سرفصل --</option>';
        budgets.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.title;
            sel.appendChild(opt);
        });
    },

    renderTable(expenses, onEdit, onDelete) {
        const tbody = document.getElementById('expenseTableBody');
        const emptyState = document.getElementById('expenseEmptyState');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!expenses || expenses.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        const format = (n) => Number(n || 0).toLocaleString('fa-IR');

        expenses.forEach(exp => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-750/50 border-b border-slate-700/40 text-slate-200';
            tr.innerHTML = `
        <td class="py-3 px-3 text-xs text-slate-400">${exp.date || '-'}</td>
        <td class="py-3 px-3 font-medium text-slate-100">${exp.title}</td>
        <td class="py-3 px-3"><span class="px-2 py-0.5 bg-slate-950 text-cyan-400 rounded-md text-xs">${exp.budget_title || '-'}</span></td>
        <td class="py-3 px-3 text-amber-400 font-bold">${format(exp.amount)} تومان</td>
        <td class="py-3 px-3 text-center space-x-reverse space-x-1">
          <button data-id="${exp.id}" class="btn-edit-expense text-amber-400 hover:text-amber-300 text-xs px-2 py-1 bg-amber-500/10 rounded-lg">ویرایش</button>
          <button data-id="${exp.id}" class="btn-delete-expense text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-rose-500/10 rounded-lg">حذف</button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-edit-expense').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                const item = expenses.find(x => x.id === id);
                onEdit(item);
            });
        });

        tbody.querySelectorAll('.btn-delete-expense').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                onDelete(id);
            });
        });
    }
};