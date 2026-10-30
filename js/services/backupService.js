/**
 * js/services/backupService.js
 */
window.backupService = {
    tables: ['cycles', 'incomes', 'budgets', 'expenses', 'assets', 'asset_logs', 'transfers'],

    async hasData() {
        for (const name of this.tables) {
            if (await window.db[name].count()) return true;
        }
        return false;
    },

    async exportToJson() {
        const names = this.tables;
        const data = { format: 'pool-manager-backup', version: 4, exported_at: new Date().toISOString() };
        await window.db.transaction('r', ...names.map(n => window.db[n]), async () => {
            for (const name of names) data[name] = await window.db[name].toArray();
        });
        const json = JSON.stringify(data, null, 2);
        const filename = 'pool_backup_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
        const native = window.Capacitor?.isNativePlatform?.();
        const plugins = window.Capacitor?.Plugins;
        if (native) {
            if (!plugins?.Filesystem || !plugins?.Share) {
                throw new Error('امکان ذخیره نسخه پشتیبان در این نسخه اندروید فعال نیست.');
            }
            const written = await plugins.Filesystem.writeFile({
                path: filename, data: json, directory: 'CACHE', encoding: 'utf8'
            });
            await plugins.Share.share({
                title: 'نسخه پشتیبان Pool Manager',
                text: 'این فایل را در Downloads، Drive یا محل امن دیگری ذخیره کنید.',
                url: written.uri, dialogTitle: 'ذخیره فایل پشتیبان'
            });
            return;
        }
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    },

    async importFromJson(file) {
        if (!file || file.size > 25 * 1024 * 1024) throw new Error('حجم فایل پشتیبان نامعتبر یا بیش از ۲۵ مگابایت است.');
        const data = JSON.parse(await file.text());
        const names = this.tables;
        if (data.version !== 4 || !names.every(n => Array.isArray(data[n]))) {
            throw new Error('فایل پشتیبان کامل نسخه ۴ لازم است.');
        }
        for (const name of names) {
            for (const record of data[name]) {
                if (!record || typeof record !== 'object' || Array.isArray(record)) {
                    throw new Error('ساختار داده‌های فایل پشتیبان معتبر نیست.');
                }
            }
        }
        // All-or-nothing replacement: an invalid record rolls the entire transaction back.
        await window.db.transaction('rw', ...names.map(n => window.db[n]), async () => {
            for (const name of names) await window.db[name].clear();
            for (const name of names) if (data[name].length) await window.db[name].bulkAdd(data[name]);
        });
        return true;
    },

    async exportToExcel(income, budgetsWithStats, expenses) {
        const wb = XLSX.utils.book_new();

        const budgetRows = budgetsWithStats.map((b, i) => ({
            "ردیف": i + 1,
            "عنوان پاکت": b.title,
            "بودجه مصوب (تومان)": b.allocated_amount,
            "خرج‌شده (تومان)": b.spent,
            "باقیمانده (تومان)": b.allocated_amount - b.spent,
            "درصد مصرف": b.allocated_amount > 0 ? `${Math.round((b.spent / b.allocated_amount) * 100)}%` : '۰%'
        }));

        const wsBudgets = XLSX.utils.json_to_sheet(budgetRows);
        XLSX.utils.book_append_sheet(wb, wsBudgets, "بودجه‌ها");

        const expenseRows = expenses.map((e, i) => ({
            "ردیف": i + 1,
            "تاریخ": e.date,
            "عنوان هزینه": e.title,
            "سرفصل مربوطه": e.budget_title,
            "مبلغ پرداختی (تومان)": e.amount
        }));

        const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
        XLSX.utils.book_append_sheet(wb, wsExpenses, "ریز مخارج");

        XLSX.writeFile(wb, `گزارش_مالی_استخر_${new Date().toISOString().slice(0, 10)}.xlsx`);
    },

    async exportToPdf(income, budgetsWithStats, totalSpent) {
        const cycle = await window.cycleService.getCurrentCycle();
        const transfers = cycle ? await window.db.transfers.where('cycle_id').equals(cycle.id).toArray() : [];
        const netTransfers = transfers.reduce((sum, t) => sum + (t.direction === 'out' ? 1 : -1) * Number(t.amount || 0), 0);
        const freeBalance = income - totalSpent - netTransfers;
        const dateStr = new Date().toLocaleDateString('fa-IR');

        const printContainer = document.createElement('div');
        printContainer.style.fontFamily = 'Vazirmatn, sans-serif';
        printContainer.style.direction = 'rtl';
        printContainer.style.padding = '20px';
        printContainer.style.color = '#1e293b';

        let rowsHtml = '';
        budgetsWithStats.forEach((b, i) => {
            rowsHtml += `
        <tr style="border-bottom: 1px solid #cbd5e1;">
          <td style="padding: 8px;">${i + 1}</td>
          <td style="padding: 8px;">${b.title}</td>
          <td style="padding: 8px;">${Number(b.allocated_amount).toLocaleString('fa-IR')}</td>
          <td style="padding: 8px;">${Number(b.spent).toLocaleString('fa-IR')}</td>
          <td style="padding: 8px;">${Number(b.allocated_amount - b.spent).toLocaleString('fa-IR')}</td>
        </tr>
      `;
        });

        printContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="margin: 0; color: #059669;">گزارش جامع وضعیت بودجه و هزینه‌ها</h2>
        <p style="font-size: 12px; color: #64748b; margin-top: 5px;">تاریخ گزارش: ${dateStr}</p>
      </div>

      <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
        <div><strong>موجودی کل:</strong> ${Number(income).toLocaleString('fa-IR')} تومان</div>
        <div><strong>کل خرج‌شده:</strong> ${Number(totalSpent).toLocaleString('fa-IR')} تومان</div>
        <div><strong>مانده آزاد:</strong> ${Number(freeBalance).toLocaleString('fa-IR')} تومان</div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #94a3b8;">
            <th style="padding: 8px;">#</th>
            <th style="padding: 8px;">سرفصل بودجه</th>
            <th style="padding: 8px;">سقف تخصیص (تومان)</th>
            <th style="padding: 8px;">خرج‌شده</th>
            <th style="padding: 8px;">باقیمانده</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

        const opt = {
            margin: 10,
            filename: `گزارش_مالی_${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(printContainer).save();
    }
};