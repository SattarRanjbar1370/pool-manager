/**
 * components/timelineView.js
 */
window.timelineViewComponent = {
    mount(containerId = 'timelineSection') {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-700/70 pb-3">
          <h2 class="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span>📊</span> تایم‌لاین بصری جریان مخارج
          </h2>
          <span id="timelineTotalBadge" class="text-xs bg-slate-950 text-amber-400 px-3 py-1 rounded-xl border border-slate-700">
            مجموع: ۰ تومان
          </span>
        </div>
        <div id="timelineContent" class="relative border-r-2 border-emerald-500/30 mr-4 space-y-6 pt-2"></div>
        <div id="timelineEmptyState" class="text-center py-8 text-slate-500 text-xs hidden">
          تراکنشی برای نمایش در تایم‌لاین ثبت نشده است.
        </div>
      </div>
    `;
    },

    render(expenses) {
        const container = document.getElementById('timelineContent');
        const emptyState = document.getElementById('timelineEmptyState');
        const badge = document.getElementById('timelineTotalBadge');
        if (!container) return;
        container.innerHTML = '';

        if (!expenses || expenses.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (badge) badge.textContent = 'مجموع: ۰ تومان';
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        const format = (n) => Number(n || 0).toLocaleString('fa-IR');
        const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        if (badge) badge.textContent = `مجموع: ${format(totalSpent)} تومان`;

        // دسته‌بندی هزینه‌ها بر اساس تاریخ
        const grouped = {};
        expenses.forEach(exp => {
            const d = exp.date || 'نامشخص';
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(exp);
        });

        Object.keys(grouped).forEach(date => {
            const dayExpenses = grouped[date];
            const dayTotal = dayExpenses.reduce((s, x) => s + (x.amount || 0), 0);

            const block = document.createElement('div');
            block.className = 'relative pr-6';
            block.innerHTML = `
        <div class="absolute -right-[9px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-slate-800"></div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/60">
            📅 ${date}
          </span>
          <span class="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
            جمع روز: ${format(dayTotal)} تومان
          </span>
        </div>
        <div class="space-y-2">
          ${dayExpenses.map(item => `
            <div class="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between hover:border-slate-600 transition">
              <div>
                <span class="text-xs font-medium text-slate-100">${item.title}</span>
                <span class="text-[11px] text-cyan-400 mr-2 bg-slate-950 px-2 py-0.5 rounded">${item.budget_title || '-'}</span>
              </div>
              <span class="text-xs font-bold text-amber-400">${format(item.amount)} تومان</span>
            </div>
          `).join('')}
        </div>
      `;
            container.appendChild(block);
        });
    }
};