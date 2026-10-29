/**
 * components/budgetView.js
 * مدیریت پاکت‌های بودجه مصرفی جاری
 */
window.budgetViewComponent = {
  mount(containerId = 'budgetSection') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="space-y-6">
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
          <h2 class="text-sm font-bold text-slate-200 mb-3">📦 تعریف پاکت بودجه مصرفی جدید</h2>
          <form id="addBudgetForm" class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div class="md:col-span-6">
              <label class="block text-xs text-slate-400 mb-1">عنوان سرفصل مصرفی:</label>
              <input type="text" id="budgetTitleInput" required placeholder="مثال: اجاره، خوراک، بنزین، قطعات..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100">
            </div>
            <div class="md:col-span-4">
              <label class="block text-xs text-slate-400 mb-1">سقف تخصیص ماهانه (تومان):</label>
              <input type="number" id="budgetAmountInput" required min="1" placeholder="مثال: ۵,۰۰۰,۰۰۰"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-100">
            </div>
            <div class="md:col-span-2">
              <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl py-2 px-3 text-sm transition">
                + ایجاد پاکت
              </button>
            </div>
          </form>
        </div>

        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
          <h3 class="text-sm font-bold text-slate-300 mb-3">لیست پاکت‌های مصرفی این دوره</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse text-sm">
              <thead>
                <tr class="border-b border-slate-700 text-slate-400 text-xs">
                  <th class="py-3 px-3">عنوان پاکت</th>
                  <th class="py-3 px-3">سقف تخصیص</th>
                  <th class="py-3 px-3">خرج‌شده</th>
                  <th class="py-3 px-3">مانده</th>
                  <th class="py-3 px-3">وضعیت مصرف</th>
                  <th class="py-3 px-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody id="budgetTableBody" class="divide-y divide-slate-700/50"></tbody>
            </table>
          </div>
          <div id="budgetEmptyState" class="text-center py-6 text-slate-500 text-xs hidden">
            هنوز هیچ پاکت بودجه‌ای برای این دوره ساخته نشده است.
          </div>
        </div>
      </div>
    `;
  },

  renderTable(budgetsWithStats, onEdit, onDelete) {
    const tbody = document.getElementById('budgetTableBody');
    const emptyState = document.getElementById('budgetEmptyState');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!budgetsWithStats || budgetsWithStats.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    const format = (n) => Number(n || 0).toLocaleString('fa-IR');

    budgetsWithStats.forEach(b => {
      const allocated = Number(b.allocated_amount || 0);
      const spent = Number(b.spent || 0);
      const rawPercent = allocated > 0 ? (spent / allocated) * 100 : 0;
      const displayPercent = Math.round(rawPercent);
      const remaining = allocated - spent;
      const isOver = remaining < 0;

      let barColor = 'bg-emerald-500';
      let pulseClass = '';

      if (displayPercent >= 100) {
        barColor = 'bg-rose-500';
        if (isOver) pulseClass = 'animate-pulse';
      } else if (displayPercent >= 70) {
        barColor = 'bg-amber-500';
      }

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-750/50 border-b border-slate-700/40 text-slate-200';
      tr.innerHTML = `
              <td class="py-3 px-3 font-semibold text-slate-100">${b.title}</td>
              <td class="py-3 px-3 font-mono">${format(allocated)}</td>
              <td class="py-3 px-3 font-mono text-amber-400">${format(spent)}</td>
              <td class="py-3 px-3 font-mono">${isOver ? `<span class="text-rose-400 font-bold">${format(Math.abs(remaining))} مازاد!</span>` : `<span class="text-emerald-400">${format(remaining)}</span>`}</td>
              <td class="py-3 px-3 w-40">
                <div class="flex items-center gap-2">
                  <div class="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                    <div class="h-full ${barColor} ${pulseClass}" style="width: ${Math.min(displayPercent, 100)}%"></div>
                  </div>
                  <span class="text-xs ${isOver ? 'text-rose-400 font-bold' : 'text-slate-400'} font-mono">${displayPercent}%</span>
                </div>
              </td>
              <td class="py-3 px-3 text-center space-x-reverse space-x-1">
                <button data-id="${b.id}" class="btn-edit-budget text-amber-400 hover:text-amber-300 text-xs px-2 py-1 bg-amber-500/10 rounded-lg">ویرایش</button>
                <button data-id="${b.id}" class="btn-delete-budget text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-rose-500/10 rounded-lg">حذف</button>
              </td>
            `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit-budget').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.currentTarget.getAttribute('data-id'));
        const item = budgetsWithStats.find(b => b.id === id);
        onEdit(item);
      });
    });

    tbody.querySelectorAll('.btn-delete-budget').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.currentTarget.getAttribute('data-id'));
        if (confirm('با حذف این سرفصل تمام مخارج متصل به آن حذف می‌شوند. ادامه می‌دهید؟')) {
          onDelete(id);
        }
      });
    });
  }
};