/**
 * components/datepicker.js
 * تقویم پاپ‌آپ شمسی سبک، مدرن و بدون وابستگی خارجی
 */
window.persianDatePicker = {
    currentYear: 1403,
    currentMonth: 1, // 1 to 12
    selectedYear: 1403,
    selectedMonth: 1,
    selectedDay: 1,
    targetInputId: null,

    monthNames: [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ],

    weekDays: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],

    // تبدیل تاریخ میلادی به شمسی با استاندارد توکار مرورگر
    getTodayJalaliParts() {
        const parts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }).formatToParts(new Date());

        return {
            year: parseInt(parts.find(p => p.type === 'year').value, 10),
            month: parseInt(parts.find(p => p.type === 'month').value, 10),
            day: parseInt(parts.find(p => p.type === 'day').value, 10)
        };
    },

    getTodayJalaliString() {
        const { year, month, day } = this.getTodayJalaliParts();
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}/${mm}/${dd}`;
    },

    mount(containerId = 'modalsContainer') {
        const parent = document.getElementById(containerId) || document.body;
        if (document.getElementById('persianDatePickerModal')) return;

        const modal = document.createElement('div');
        modal.id = 'persianDatePickerModal';
        modal.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 hidden';
        modal.innerHTML = `
      <div class="bg-slate-800 border border-slate-700 w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4">
        <!-- هدر تقویم -->
        <div class="flex items-center justify-between border-b border-slate-700 pb-3">
          <button id="pdpPrevMonthBtn" type="button" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition">›</button>
          <div class="text-center">
            <span id="pdpMonthYearTitle" class="text-sm font-bold text-emerald-400"></span>
          </div>
          <button id="pdpNextMonthBtn" type="button" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition">‹</button>
        </div>

        <!-- روزهای هفته -->
        <div class="grid grid-cols-7 gap-1 text-center text-slate-400 text-xs font-semibold">
          ${this.weekDays.map(w => `<div class="py-1">${w}</div>`).join('')}
        </div>

        <!-- روزهای ماه -->
        <div id="pdpDaysGrid" class="grid grid-cols-7 gap-1 text-center text-xs"></div>

        <!-- دکمه‌ها -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-700">
          <button id="pdpSelectTodayBtn" type="button" class="text-xs text-emerald-400 hover:text-emerald-300 font-medium">امروز</button>
          <button id="pdpCloseBtn" type="button" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition">بستن</button>
        </div>
      </div>
    `;

        parent.appendChild(modal);
        this.bindEvents();
    },

    bindEvents() {
        const modal = document.getElementById('persianDatePickerModal');
        document.getElementById('pdpCloseBtn').addEventListener('click', () => this.close());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });

        document.getElementById('pdpPrevMonthBtn').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 1) {
                this.currentMonth = 12;
                this.currentYear--;
            }
            this.render();
        });

        document.getElementById('pdpNextMonthBtn').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 12) {
                this.currentMonth = 1;
                this.currentYear++;
            }
            this.render();
        });

        document.getElementById('pdpSelectTodayBtn').addEventListener('click', () => {
            const today = this.getTodayJalaliParts();
            this.selectDate(today.year, today.month, today.day);
        });
    },

    // تخمین تعداد روزهای ماه شمسی
    getDaysInMonth(year, month) {
        if (month <= 6) return 31;
        if (month <= 11) return 30;
        // کبیسه شمسی بر اساس الگوریتم دقیق حسابی
        const isLeap = (((((year - 474) % 2820) + 2820) % 2820) * 682 % 2816) < 682;
        return isLeap ? 30 : 29;
    },

    // محاسبه روز اول ماه برای تعیین خانه شروع هفته
    getFirstDayOfWeek(year, month) {
        // تبدیل تقریبی روز اول ماه شمسی به تاریخ میلادی جهت دریافت روز هفته (۰ = شنبه تا ۶ = جمعه)
        // برای سادگی و هماهنگی دقیق با Intl:
        const gDate = this.jalaliToDate(year, month, 1);
        const day = gDate.getDay(); // 0 = یکشنبه, 6 = شنبه
        return (day + 1) % 7; // هماهنگ با شروع هفته از شنبه (0: ش، 1: ی، ...)
    },

    // تبدیل ساده سال و ماه و روز جلالی به آبجکت Date
    jalaliToDate(jy, jm, jd) {
        let gy = jy <= 979 ? jy + 621 : jy + 621;
        // تخمین روز در سال
        let days = (jm <= 7) ? (jm - 1) * 31 + jd : (6 * 31) + (jm - 7) * 30 + jd;
        let marchDay = 21; // ۲۱ مارس روز ۱ فروردین
        let d = new Date(gy, 2, marchDay);
        d.setDate(d.getDate() + (days - 1));
        return d;
    },

    open(targetInputId) {
        this.targetInputId = targetInputId;
        const input = document.getElementById(targetInputId);
        let initParts = this.getTodayJalaliParts();

        if (input && input.value) {
            const parts = input.value.split('/').map(Number);
            if (parts.length === 3 && !isNaN(parts[0])) {
                initParts = { year: parts[0], month: parts[1], day: parts[2] };
            }
        }

        this.currentYear = initParts.year;
        this.currentMonth = initParts.month;
        this.selectedYear = initParts.year;
        this.selectedMonth = initParts.month;
        this.selectedDay = initParts.day;

        this.render();
        document.getElementById('persianDatePickerModal').classList.remove('hidden');
    },

    close() {
        const modal = document.getElementById('persianDatePickerModal');
        if (modal) modal.classList.add('hidden');
    },

    selectDate(y, m, d) {
        const mm = String(m).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const fullDate = `${y}/${mm}/${dd}`;

        if (this.targetInputId) {
            const input = document.getElementById(this.targetInputId);
            if (input) {
                input.value = fullDate;
                input.dispatchEvent(new Event('input'));
            }
        }
        this.close();
    },

    render() {
        const titleEl = document.getElementById('pdpMonthYearTitle');
        const gridEl = document.getElementById('pdpDaysGrid');
        if (!titleEl || !gridEl) return;

        titleEl.textContent = `${this.monthNames[this.currentMonth - 1]} ${this.currentYear}`;
        gridEl.innerHTML = '';

        const daysCount = this.getDaysInMonth(this.currentYear, this.currentMonth);
        const startOffset = this.getFirstDayOfWeek(this.currentYear, this.currentMonth);
        const today = this.getTodayJalaliParts();

        // خانه‌های خالی قبل از شروع ماه
        for (let i = 0; i < startOffset; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'py-2';
            gridEl.appendChild(emptyDiv);
        }

        // روزهای ماه
        for (let day = 1; day <= daysCount; day++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = day;

            const isToday = (this.currentYear === today.year && this.currentMonth === today.month && day === today.day);
            const isSelected = (this.currentYear === this.selectedYear && this.currentMonth === this.selectedMonth && day === this.selectedDay);

            let btnClass = 'w-8 h-8 mx-auto flex items-center justify-center rounded-xl transition text-xs ';
            if (isSelected) {
                btnClass += 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20';
            } else if (isToday) {
                btnClass += 'border border-emerald-500 text-emerald-400 font-semibold hover:bg-slate-700';
            } else {
                btnClass += 'text-slate-200 hover:bg-slate-700';
            }

            btn.className = btnClass;
            btn.addEventListener('click', () => {
                this.selectDate(this.currentYear, this.currentMonth, day);
            });

            gridEl.appendChild(btn);
        }
    }
};