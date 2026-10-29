/**
 * js/ui.js
 * مدیریت تعاملات سراسری، تب‌ها و فرمت داده‌ها
 */
window.ui = {
    // فرمت اعداد به صورت ارقام سه‌رقمی فارسی
    formatNumber(num) {
        return Number(num || 0).toLocaleString('fa-IR');
    },

    // سوئیچ بین تب‌های مختلف بدون تداخل
    setupTabs() {
        const tabButtons = [
            { btn: document.getElementById('tabBudgetBtn'), sec: document.getElementById('budgetSection') },
            { btn: document.getElementById('tabExpenseBtn'), sec: document.getElementById('expenseSection') },
            { btn: document.getElementById('tabTimelineBtn'), sec: document.getElementById('timelineSection') },
            { btn: document.getElementById('tabIncomeBtn'), sec: document.getElementById('incomeSection') },
            { btn: document.getElementById('tabBackupBtn'), sec: document.getElementById('backupSection') }
        ];

        tabButtons.forEach(({ btn, sec }) => {
            if (!btn || !sec) return;
            btn.addEventListener('click', () => {
                tabButtons.forEach(t => {
                    if (t.btn) {
                        t.btn.className = 'tab-btn px-5 py-2.5 font-medium text-sm rounded-t-xl transition border-b-2 border-transparent text-slate-400 hover:text-slate-200';
                    }
                    if (t.sec) {
                        t.sec.classList.add('hidden');
                    }
                });

                btn.className = 'tab-btn px-5 py-2.5 font-medium text-sm rounded-t-xl transition border-b-2 border-emerald-500 bg-slate-800 text-emerald-400';
                sec.classList.remove('hidden');
            });
        });
    }
};