/**
 * components/incomeView.js
 */
window.incomeViewComponent = {
  mount(containerId = 'incomeSection') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="space-y-6">
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
          <h2 class="text-sm font-bold text-slate-200 mb-3">💰 ثبت دریافتی جدید / حقوق</h2>
          <form id="addIncomeForm" class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div class="md:col-span-3">
              <label class="block text-xs text-slate-400 mb-1">تاریخ دریافتی:</label>
              <div class="flex items-center gap-1">
                <input type="text" id="incomeDateInput" required placeholder="۱۴۰۳/۰۱/۰۱"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-emerald-500 text-slate-200">
                <button type="button" id="btnIncomeDatePicker" class="px-2.5 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition">📅</button>
              </div>
            </div>
            <div class="md:col-span-3">
              <label class="block text-xs text-slate-400 mb-1">عنوان دریافتی:</label>
              <input type="text" id="incomeTitleInput" required placeholder="مثال: حقوق اصلی، تسویه کارگاه..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs text-slate-400 mb-1">مبلغ (تومان):</label>
              <input type="number" id="incomeAmountInput" required min="1" placeholder="مثال: ۲۵,۰۰۰,۰۰۰"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
            </div>
            <div class="md:col-span-3 flex items-center h-10">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="isSalaryCheckbox" class="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500">
                <span class="text-xs font-semibold text-emerald-400">حقوق اصلی ماه (روز ۷ام)</span>
              </label>
            </div>
            <div class="md:col-span-1">
              <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl py-2 px-2 text-sm transition">
                + ثبت
              </button>
            </div>
          </form>
        </div>

        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
          <h3 class="text-sm font-bold text-slate-300 mb-3">لیست درآمدهای ثبت‌شده دوره جاری</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse text-sm">
              <thead>
                <tr class="border-b border-slate-700 text-slate-400 text-xs">
                  <th class="py-3 px-3">تاریخ</th>
                  <th class="py-3 px-3">عنوان دریافتی</th>
                  <th class="py-3 px-3">نوع دریافتی</th>
                  <th class="py-3 px-3">مبلغ</th>
                  <th class="py-3 px-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody id="incomeTableBody" class="divide-y divide-slate-700/50"></tbody>
            </table>
          </div>
          <div id="incomeEmptyState" class="text-center py-6 text-slate-500 text-xs hidden">
            درآمدی در این دوره ثبت نشده است.
          </div>
        </div>
      </div>
    `;

    // مقداردهی اولیه فیلد با تاریخ امروز شمسی و اتصال دکمه تقویم
    const dateInput = document.getElementById('incomeDateInput');
    const pickerBtn = document.getElementById('btnIncomeDatePicker');
    if (dateInput && window.persianDatePicker) {
      dateInput.value = window.persianDatePicker.getTodayJalaliString();
    }
    if (pickerBtn && window.persianDatePicker) {
      pickerBtn.addEventListener('click', () => {
        window.persianDatePicker.open('incomeDateInput');
      });
    }
  },

  renderTable(incomes, onDelete) {
    const tbody = document.getElementById('incomeTableBody');
    const emptyState = document.getElementById('incomeEmptyState');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!incomes || incomes.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    const format = (n) => Number(n || 0).toLocaleString('fa-IR');

    incomes.forEach(inc => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-750/50 border-b border-slate-700/40 text-slate-200';
      tr.innerHTML = `
        <td class="py-3 px-3 text-xs text-slate-400 font-mono">${inc.date || '-'}</td>
        <td class="py-3 px-3 font-medium text-slate-100">${inc.title}</td>
        <td class="py-3 px-3">
          ${inc.is_salary
          ? '<span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-xs">حقوق اصلی</span>'
          : '<span class="px-2 py-0.5 bg-slate-950 text-slate-400 rounded-md text-xs">درآمد جانبی</span>'}
        </td>
        <td class="py-3 px-3 text-emerald-400 font-bold">${format(inc.amount)} تومان</td>
        <td class="py-3 px-3 text-center">
          <button data-id="${inc.id}" class="btn-delete-income text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-rose-500/10 rounded-lg">حذف</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-delete-income').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.currentTarget.getAttribute('data-id'));
        onDelete(id);
      });
    });
  }
};