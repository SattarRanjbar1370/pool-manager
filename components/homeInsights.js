/**
 * Read-only home dashboard. All values are derived from existing records.
 * Savings transfers are not counted as expenses.
 */
window.homeInsightsComponent = {
  mount() {
    const root = document.getElementById('homeInsights');
    if (!root) return;
    root.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section class="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-5 shadow-lg">
          <div class="flex items-center justify-between mb-3"><h2 class="font-bold text-emerald-300">✦ نمای پس‌اندازها</h2><span class="text-xs text-slate-400">همه دوره‌ها</span></div>
          <div id="homeSavings" class="text-2xl font-bold text-white">۰ تومان</div>
          <p id="homeSavingsMeta" class="text-xs text-slate-400 mt-2"></p>
        </section>
        <section class="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg">
          <h2 class="font-bold text-cyan-300 mb-3">◈ پاکت‌های بودجه</h2>
          <div id="homeBudgets" class="space-y-3 text-xs text-slate-400"></div>
        </section>
        <section class="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg lg:col-span-2">
          <div class="flex items-center justify-between mb-3"><h2 class="font-bold text-amber-300">▥ خرج روزانه</h2><span class="text-xs text-slate-400">هفت روز اخیر</span></div>
          <p id="homeTodayExpense" class="text-sm text-slate-200 mb-4"></p>
          <div id="homeExpenseBars" class="flex items-end gap-2 h-28"></div>
          <div id="homeRecentExpenses" class="mt-4 text-xs text-slate-400"></div>
        </section>
      </div>`;
  },
  async update(budgets, expenses) {
    const fmt = n => Number(n || 0).toLocaleString('fa-IR');
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const assets = await window.db.assets.toArray();
    const logs = await window.db.asset_logs.toArray();
    const totals = new Map();
    for (const log of logs) totals.set(log.asset_id, (totals.get(log.asset_id) || 0) + Number(log.change_amount || 0));
    const cash = assets.filter(a => a.type === 'cash').reduce((sum, a) => sum + Math.max(0, totals.get(a.id) || 0), 0);
    const cost = assets.filter(a => a.type !== 'cash').reduce((sum, a) => sum + Math.max(0, Number(a.initial_cost || 0)), 0);
    document.getElementById('homeSavings').textContent = fmt(cash) + ' تومان';
    document.getElementById('homeSavingsMeta').textContent = assets.filter(a=>a.type==='cash').length + ' صندوق نقدی • بهای ثبت‌شده سایر دارایی‌ها: ' + fmt(cost) + ' تومان';
    const budgetRoot = document.getElementById('homeBudgets');
    budgetRoot.innerHTML = budgets.length ? budgets.slice(0, 5).map(b => {
      const allocated = Number(b.allocated_amount || 0), spent = Number(b.spent || 0);
      const percent = allocated > 0 ? Math.round(spent / allocated * 100) : 0;
      const color = percent >= 100 ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-400' : 'bg-emerald-400';
      return `<div><div class="flex justify-between gap-2 mb-1"><span class="text-slate-200 truncate">${esc(b.title)}</span><span class="shrink-0">${fmt(allocated-spent)} تومان مانده</span></div><div class="h-2 bg-slate-950 rounded-full overflow-hidden"><div class="${color} h-full rounded-full" style="width:${Math.max(0,Math.min(100,percent))}%"></div></div></div>`;
    }).join('') : 'هنوز پاکتی تعریف نشده است.';
    const today = window.persianDatePicker?.getTodayJalaliString?.() || new Date().toLocaleDateString('fa-IR');
    const daily = new Map();
    const normalize = s => String(s || '').replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c));
    const todayNorm = normalize(today);
    for (const e of expenses) {
      const key = normalize(e.date);
      daily.set(key, (daily.get(key) || 0) + Number(e.amount || 0));
    }
    document.getElementById('homeTodayExpense').textContent = 'هزینه امروز: ' + fmt(daily.get(todayNorm) || 0) + ' تومان';
    const dates = [];
    // Use expense date keys when historical dates are available; always include today.
    const known = [...daily.keys()].filter(Boolean).sort().slice(-6);
    for (const date of [...new Set([...known, todayNorm])].sort().slice(-7)) dates.push(date);
    const max = Math.max(1, ...dates.map(d => daily.get(d) || 0));
    document.getElementById('homeExpenseBars').innerHTML = dates.map(d => {
      const val = daily.get(d) || 0;
      return `<div class="flex-1 flex flex-col items-center justify-end h-full gap-1 min-w-0" title="${esc(d)}: ${fmt(val)} تومان"><span class="text-[10px] text-slate-400 truncate max-w-full">${fmt(val)}</span><div class="w-full max-w-12 bg-cyan-500/80 rounded-t-md" style="height:${Math.max(3,Math.round(val/max*75))}%"></div><span class="text-[10px] text-slate-400 truncate max-w-full">${esc(d.slice(-5))}</span></div>`;
    }).join('') || '<span class="text-slate-500 text-xs">هنوز هزینه‌ای ثبت نشده است.</span>';
    document.getElementById('homeRecentExpenses').innerHTML = expenses.length ? 'آخرین هزینه‌ها: ' + [...expenses].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,3).map(e=>esc(e.title)+' ('+fmt(e.amount)+')').join(' • ') : '';
  }
};