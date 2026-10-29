/**
 * js/services/backupService.js
 */
window.backupService = {
    async exportToJson(income) {
        const budgets = await window.db.budgets.toArray();
        const expenses = await window.db.expenses.toArray();

        const backupData = {
            version: 1,
            exported_at: new Date().toISOString(),
            income: Number(income) || 0,
            budgets,
            expenses
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pool_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importFromJson(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!data.budgets || !data.expenses) {
                        throw new Error('ساختار فایل پشتیبان نامعتبر است.');
                    }

                    await window.db.transaction('rw', window.db.budgets, window.db.expenses, async () => {
                        await window.db.budgets.clear();
                        await window.db.expenses.clear();

                        await window.db.budgets.bulkAdd(data.budgets);
                        await window.db.expenses.bulkAdd(data.expenses);
                    });

                    resolve(data.income || 0);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
            reader.readAsText(file);
        });
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
        const freeBalance = income - totalSpent;
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