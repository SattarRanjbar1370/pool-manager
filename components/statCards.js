/**
 * components/statCards.js
 */
window.statCardsComponent = {
    mount(containerId = 'statCardsContainer') {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <span class="text-xs text-slate-400 font-medium">کل ظرفیت نقدینگی ماه</span>
          <p id="statIncome" class="text-base md:text-lg font-bold text-emerald-400 mt-1">۰ تومان</p>
        </div>
        <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <span class="text-xs text-slate-400 font-medium">مجموع بودجه تخصیص‌یافته</span>
          <p id="statAllocated" class="text-base md:text-lg font-bold text-cyan-400 mt-1">۰ تومان</p>
        </div>
        <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <span class="text-xs text-slate-400 font-medium">مجموع خرج‌کرد واقعی</span>
          <p id="statTotalSpent" class="text-base md:text-lg font-bold text-amber-400 mt-1">۰ تومان</p>
        </div>
        <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
          <span class="text-xs text-slate-400 font-medium">مانده آزاد نقدینگی</span>
          <p id="statFreeBalance" class="text-base md:text-lg font-bold text-emerald-400 mt-1">۰ تومان</p>
        </div>
      </div>
    `;
    },

    update({ income, totalAllocated, totalSpent, netTransfers = 0 }) {
        const freeBalance = income - totalSpent - netTransfers;
        const format = window.ui ? window.ui.formatNumber : (n) => Number(n).toLocaleString('fa-IR');

        const incEl = document.getElementById('statIncome');
        const allocEl = document.getElementById('statAllocated');
        const spentEl = document.getElementById('statTotalSpent');
        const freeEl = document.getElementById('statFreeBalance');

        if (incEl) incEl.textContent = `${format(income)} تومان`;
        if (allocEl) allocEl.textContent = `${format(totalAllocated)} تومان`;
        if (spentEl) spentEl.textContent = `${format(totalSpent)} تومان`;

        if (freeEl) {
            freeEl.textContent = `${format(freeBalance)} تومان`;
            freeEl.className = freeBalance < 0
                ? 'text-base md:text-lg font-bold text-rose-400 mt-1'
                : 'text-base md:text-lg font-bold text-emerald-400 mt-1';
        }
    }
};