/**
 * components/timelineView.js
 * تایم‌لاین دوطرفه مدرن، ادغام هوشمند درآمد/خرج/پس‌انداز و بارگذاری مه‌آلود
 */
window.timelineViewComponent = {
  allTransactions: [],
  visibleCount: 10,
  pageSize: 10,

  mount(containerId = 'timelineSection') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div class="flex flex-wrap items-center justify-between border-b border-slate-700/70 pb-3 gap-2">
          <h2 class="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span>📊</span> تایم‌لاین دوطرفه جریان نقدینگی و اندوخته
          </h2>
          <div class="flex items-center gap-2">
            <span id="timelineIncomeBadge" class="text-xs bg-slate-950 text-emerald-400 px-2.5 py-1 rounded-xl border border-slate-800 font-mono">
              ورودی: ۰
            </span>
            <span id="timelineExpenseBadge" class="text-xs bg-slate-950 text-amber-400 px-2.5 py-1 rounded-xl border border-slate-800 font-mono">
              خروجی: ۰
            </span>
          </div>
        </div>

        <!-- راهنمای ۴ جریان رنگی تایم‌لاین -->
        <div class="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> درآمد / ورودی</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> مخارج جاری</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> 🪙 انباشت پس‌انداز</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> ⚠️ برداشت از پس‌انداز</div>
        </div>

        <!-- بدنه اصلی محور تایم‌لاین -->
        <div class="relative pt-4">
          <div class="absolute right-4 sm:right-1/2 top-4 bottom-0 w-0.5 bg-gradient-to-b from-slate-600 via-slate-700 to-transparent -translate-x-1/2 z-0"></div>
          <div id="timelineItemsContainer" class="relative z-10 space-y-6"></div>

          <div id="timelineFadeOverlay" class="relative -mt-16 h-28 bg-gradient-to-t from-slate-800 via-slate-800/80 to-transparent flex items-end justify-center pb-2 z-20 pointer-events-none hidden">
            <button id="btnLoadMoreTimeline" type="button" class="pointer-events-auto px-4 py-1.5 bg-slate-700/90 hover:bg-slate-600 text-slate-200 text-xs rounded-xl shadow-lg border border-slate-600 transition flex items-center gap-1.5">
              <span>⬇</span> بارگذاری موارد قدیمی‌تر
            </button>
          </div>

          <div id="timelineEndNotice" class="text-center py-4 text-slate-500 text-xs hidden">
            🏁 ابتدای دوره مالی — تمام تراکنش‌ها نمایش داده شده‌اند.
          </div>
        </div>

        <div id="timelineEmptyState" class="text-center py-8 text-slate-500 text-xs hidden">
          هنوز هیچ ورودی یا هزینه‌ای برای این دوره ثبت نشده است.
        </div>
      </div>
    `;

    const loadMoreBtn = document.getElementById('btnLoadMoreTimeline');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.visibleCount += this.pageSize;
        this.renderVisible();
      });
    }
  },

  render(expenses = [], incomes = [], budgets = []) {
    const emptyState = document.getElementById('timelineEmptyState');
    const incBadge = document.getElementById('timelineIncomeBadge');
    const expBadge = document.getElementById('timelineExpenseBadge');
    const format = (n) => window.ui ? window.ui.formatNumber(n) : Number(n || 0).toLocaleString('fa-IR');

    const budgetMap = {};
    (budgets || []).forEach(b => {
      budgetMap[b.id] = { title: b.title, type: b.category_type || 'expense' };
    });

    const unified = [];

    // درآمدها و برداشت‌های بازگشتی از اندوخته
    (incomes || []).forEach(inc => {
      const isFromSavings = (inc.title || '').includes('برداشت از اندوخته');
      unified.push({
        id: 'inc_' + inc.id,
        date: inc.date || 'نامشخص',
        title: inc.title,
        amount: Number(inc.amount || 0),
        flow: isFromSavings ? 'out' : 'in', // برداشت از اندوخته در سمت چپ با آیکون اخطار
        theme: isFromSavings ? 'withdrawal' : 'income',
        badgeText: isFromSavings ? 'برداشت به نقدینگی' : (inc.is_salary ? 'حقوق اصلی ماه' : 'درآمد متفرقه'),
        badgeIcon: isFromSavings ? '⚠️' : (inc.is_salary ? '💰' : '💵'),
        created_at: inc.created_at || ''
      });
    });

    // مخارج جاری و واریزها به اندوخته
    (expenses || []).forEach(exp => {
      const isSavingsTransfer = exp.budget_id === 0 || (exp.title || '').includes('انتقال به اندوخته');
      const bInfo = budgetMap[exp.budget_id] || { title: isSavingsTransfer ? 'گاوصندوق اندوخته' : 'سرفصل مصرفی' };

      unified.push({
        id: 'exp_' + exp.id,
        date: exp.date || 'نامشخص',
        title: exp.title,
        amount: Number(exp.amount || 0),
        flow: isSavingsTransfer ? 'in' : 'out', // انباشت دارایی در سمت راست با تم طلایی
        theme: isSavingsTransfer ? 'savings' : 'expense',
        badgeText: isSavingsTransfer ? 'انباشت در اندوخته' : bInfo.title,
        badgeIcon: isSavingsTransfer ? '🪙' : '🛒',
        created_at: exp.created_at || ''
      });
    });

    unified.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    this.allTransactions = unified;
    this.visibleCount = this.pageSize;

    const totalIn = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalOut = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    if (incBadge) incBadge.textContent = `ورودی: ${format(totalIn)} تومان`;
    if (expBadge) expBadge.textContent = `خروجی: ${format(totalOut)} تومان`;

    if (!unified.length) {
      if (emptyState) emptyState.classList.remove('hidden');
      const c = document.getElementById('timelineItemsContainer');
      if (c) c.innerHTML = '';
      document.getElementById('timelineFadeOverlay')?.classList.add('hidden');
      document.getElementById('timelineEndNotice')?.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    this.renderVisible();
  },

  renderVisible() {
    const container = document.getElementById('timelineItemsContainer');
    const overlay = document.getElementById('timelineFadeOverlay');
    const endNotice = document.getElementById('timelineEndNotice');
    if (!container) return;

    container.innerHTML = '';
    const format = (n) => window.ui ? window.ui.formatNumber(n) : Number(n || 0).toLocaleString('fa-IR');
    const itemsToRender = this.allTransactions.slice(0, this.visibleCount);

    const themeConfig = {
      income: {
        dot: 'bg-emerald-500 ring-emerald-950',
        cardBorder: 'border-emerald-500/30 hover:border-emerald-500/60',
        amountText: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        sign: '+'
      },
      savings: {
        dot: 'bg-yellow-400 ring-yellow-950',
        cardBorder: 'border-yellow-500/30 hover:border-yellow-400/60',
        amountText: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
        sign: '🪙'
      },
      withdrawal: {
        dot: 'bg-rose-500 ring-rose-950',
        cardBorder: 'border-rose-500/30 hover:border-rose-500/60',
        amountText: 'text-rose-400',
        badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        sign: '⚠️'
      },
      expense: {
        dot: 'bg-amber-500 ring-amber-950',
        cardBorder: 'border-amber-500/30 hover:border-amber-500/60',
        amountText: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        sign: '-'
      }
    };

    itemsToRender.forEach(item => {
      const isRightSide = item.flow === 'in';
      const cfg = themeConfig[item.theme] || themeConfig.expense;

      const row = document.createElement('div');
      row.className = `relative flex items-center justify-between sm:justify-normal w-full ${isRightSide ? 'sm:flex-row-reverse' : 'sm:flex-row'
        }`;

      row.innerHTML = `
        <div class="w-full sm:w-[46%] pr-10 sm:pr-0">
          <div class="bg-slate-900/90 border ${cfg.cardBorder} rounded-2xl p-3.5 shadow-lg transition">
            <div class="flex items-center justify-between mb-1.5 gap-2">
              <span class="text-xs font-bold text-slate-100 truncate">${item.title}</span>
              <span class="text-[11px] font-mono text-slate-400 flex-shrink-0">📅 ${item.date}</span>
            </div>
            <div class="flex items-center justify-between pt-1">
              <span class="text-[10px] px-2 py-0.5 rounded-md border ${cfg.badgeBg} flex items-center gap-1">
                <span>${item.badgeIcon}</span> ${item.badgeText}
              </span>
              <span class="text-xs font-bold font-mono ${cfg.amountText}">
                ${cfg.sign} ${format(item.amount)} تومان
              </span>
            </div>
          </div>
        </div>

        <div class="absolute right-4 sm:right-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${cfg.dot} ring-4 ring-slate-800 z-10"></div>
        <div class="hidden sm:block sm:w-[46%]"></div>
      `;

      container.appendChild(row);
    });

    if (this.visibleCount < this.allTransactions.length) {
      overlay?.classList.remove('hidden');
      endNotice?.classList.add('hidden');
    } else {
      overlay?.classList.add('hidden');
      endNotice?.classList.remove('hidden');
    }
  }
};