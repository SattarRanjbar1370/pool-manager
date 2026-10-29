/**
 * components/modals.js
 */
window.modalsComponent = {
    mount(containerId = 'modalsContainer') {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `
      <!-- مودال شروع دوره کاری جدید -->
      <div id="newCycleModal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="text-center pb-2 border-b border-slate-700">
            <h3 class="text-base font-bold text-emerald-400">📅 شروع دوره کاری ماه جدید</h3>
            <p class="text-xs text-slate-400 mt-1">هنوز دوره‌ای فعال نیست یا ماه قبل را بسته‌اید.</p>
          </div>
          <form id="newCycleForm" class="space-y-4">
            <div>
              <label class="block text-xs text-slate-400 mb-1">نام دوره ماهانه:</label>
              <input type="text" id="cycleTitleInput" required placeholder="مثال: آبان ۱۴۰۵"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">موجودی پول نقد فعلی برای شروع (تومان):</label>
              <input type="number" id="cycleOpeningBalanceInput" required min="0" placeholder="مثال: ۱۵,۰۰۰,۰۰۰"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500">
              <p class="text-[11px] text-slate-500 mt-1">اگر حقوق هنوز واریز نشده، موجودی نقد فعلی‌تان را وارد کنید.</p>
            </div>
            <div class="pt-2">
              <button type="submit" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition">
                تأیید و آغاز دوره کاری
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- پاپ‌آپ تصمیم‌گیری حقوق روز هفتم -->
      <div id="salaryPromptModal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-center">
          <div class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
            💰
          </div>
          <h3 class="text-base font-bold text-slate-100">حقوق اصلی ماه ثبت شد!</h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            منبع اصلی بودجه‌بندی ماه تکمیل شد. مایلید سرفصل‌های پاکت‌ها را چگونه تنظیم کنیم؟
          </p>
          <div class="space-y-2 pt-2">
            <button id="btnCopyPreviousBudgets" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition">
              🔄 تکرار الگوی ماه قبل (کپی پاکت‌ها و مبالغ)
            </button>
            <button id="btnStartFreshBudgets" class="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl transition">
              ✏️ تعریف بودجه‌بندی کاملاً جدید
            </button>
          </div>
        </div>
      </div>

      <!-- مودال ویرایش ردیف‌ها -->
      <div id="editModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 id="modalTitle" class="text-base font-bold text-slate-100">ویرایش</h3>
            <button id="modalCloseBtn" class="text-slate-400 hover:text-slate-200 text-lg">✕</button>
          </div>
          <form id="editForm" class="space-y-4">
            <input type="hidden" id="editItemType">
            <input type="hidden" id="editItemId">
            <div id="modalBudgetSelectContainer" class="hidden">
              <label class="block text-xs text-slate-400 mb-1">سرفصل متصل:</label>
              <select id="modalBudgetSelect" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"></select>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">عنوان:</label>
              <input type="text" id="modalInputTitle" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">مبلغ (تومان):</label>
              <input type="number" id="modalInputAmount" required min="1" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none">
            </div>
            <div class="flex justify-end gap-2 pt-3">
              <button type="button" id="modalCancelBtn" class="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition">انصراف</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition">ذخیره تغییرات</button>
            </div>
          </form>
        </div>
      </div>
    `;
    },

    openEdit(type, item) {
        const modal = document.getElementById('editModal');
        const modalTitle = document.getElementById('modalTitle');
        const typeInput = document.getElementById('editItemType');
        const idInput = document.getElementById('editItemId');
        const titleInput = document.getElementById('modalInputTitle');
        const amountInput = document.getElementById('modalInputAmount');
        const budgetSelectContainer = document.getElementById('modalBudgetSelectContainer');

        if (!modal) return;
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
            const bSel = document.getElementById('modalBudgetSelect');
            if (bSel) bSel.value = item.budget_id;
            budgetSelectContainer.classList.remove('hidden');
        }
        modal.classList.remove('hidden');
    },

    closeEdit() {
        const modal = document.getElementById('editModal');
        if (modal) modal.classList.add('hidden');
    }
};