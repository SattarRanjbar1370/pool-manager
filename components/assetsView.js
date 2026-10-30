/**
 * components/assetsView.js
 * سیستم ویجت‌های سبد دارایی با منطق هوشمند ثبت تراکنش (نقدی vs سرمایه‌ای)
 */
window.assetsViewComponent = {
    mount(containerId = 'assetsSection') {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `
      <div class="space-y-6">
        <!-- هدر و دکمه ایجاد ویجت -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-base font-bold text-yellow-400 flex items-center gap-2">
              <span>🪙</span> سبد دارایی و گاوصندوق اندوخته
            </h2>
            <p class="text-xs text-slate-400 mt-1">مدیریت هوشمند اندوخته با اتصال دوطرفه به نقدینگی و نمودار پیوسته روزانه</p>
          </div>
          <button id="btnOpenNewWidgetModal" type="button" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-yellow-500/10">
            <span>+</span> تعریف ویجت جدید (نمودار / جدول)
          </button>
        </div>

        <!-- کارت‌های سرجمع کلان -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
            <span class="text-xs text-slate-400">کل پس‌انداز نقدی موجود</span>
            <p id="totalCashSavingsDisplay" class="text-lg font-bold text-yellow-400 mt-1 font-mono">۰ تومان</p>
          </div>
          <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
            <span class="text-xs text-slate-400">بهای تمام‌شده دارایی‌های فیزیکی/سهام</span>
            <p id="totalAssetsCostDisplay" class="text-lg font-bold text-cyan-400 mt-1 font-mono">۰ تومان</p>
          </div>
          <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
            <span class="text-xs text-slate-400">مجموع کل ارزش سبد اندوخته</span>
            <p id="grandTotalWealthDisplay" class="text-lg font-bold text-emerald-400 mt-1 font-mono">۰ تومان</p>
          </div>
        </div>

        <div id="dynamicWidgetsContainer" class="space-y-6"></div>

        <div id="assetsEmptyNotice" class="text-center py-12 text-slate-500 text-xs hidden">
          هنوز هیچ ویجت یا دارایی تعریف نشده است. با دکمه بالا اولین نمودار یا جدول را ایجاد کنید.
        </div>
      </div>

      <!-- مودال ایجاد ویجت جدید -->
      <div id="newWidgetModal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 class="text-sm font-bold text-yellow-400">✨ ساخت ویجت جدید دارایی</h3>
            <button id="btnCloseWidgetModal" type="button" class="text-slate-400 hover:text-slate-200">✕</button>
          </div>
          <form id="createWidgetForm" class="space-y-3">
            <div>
              <label class="block text-xs text-slate-400 mb-1">نوع نمایش ویجت:</label>
              <select id="widgetDisplayType" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none">
                <option value="chart">📈 نمودار خطی روند (گره‌های روزانه)</option>
                <option value="table">📋 جدول اقلام و دارایی‌ها</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">نوع دارایی:</label>
              <select id="widgetCategoryType" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none">
                <option value="cash">🪙 پس‌انداز ریالی / حساب بانکی</option>
                <option value="gold">🥇 طلا و مسکوکات</option>
                <option value="stock">📈 سهام / صندوق بورسی</option>
                <option value="fixed">📦 دارایی متفرقه / تجهیزات</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">عنوان ویجت:</label>
              <input type="text" id="widgetTitleInput" required placeholder="مثال: پس‌انداز اضطراری، طلای آب‌شده..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500">
            </div>
            <div id="widgetUnitContainer">
              <label class="block text-xs text-slate-400 mb-1">واحد اندازه‌گیری:</label>
              <input type="text" id="widgetUnitInput" value="تومان" required
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-500">
            </div>
            <div class="pt-2">
              <button type="submit" class="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-xs transition">
                ایجاد ویجت
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- مودال هوشمند شارژ و برداشت دارایی -->
      <div id="chargeWidgetModal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 id="chargeModalTitle" class="text-sm font-bold text-yellow-400">ثبت تراکنش دارایی</h3>
            <button id="btnCloseChargeModal" type="button" class="text-slate-400 hover:text-slate-200">✕</button>
          </div>
          <form id="chargeWidgetForm" class="space-y-3">
            <input type="hidden" id="chargeAssetId">
            <input type="hidden" id="chargeAssetType">

            <div id="chargeBalanceNoticeBox" class="bg-slate-900 border border-yellow-500/30 rounded-xl p-2.5 text-xs flex justify-between items-center text-slate-300">
              <span>موجودی فعلی این صندوق:</span>
              <b id="chargeCurrentBalanceDisplay" class="text-yellow-400 font-mono">۰</b>
            </div>

            <!-- بخش انتخابگر منبع تامین وجه برای دارایی غیر نقدی -->
            <div id="chargeFundingSourceRow" class="hidden">
              <label class="block text-xs text-slate-400 mb-1">محل تامین مبلغ خرید:</label>
              <select id="chargeFundingSourceSelect" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none">
                <option value="liquidity">💳 کسر مستقیم از نقدینگی جاری ماه</option>
                <!-- گزینه‌های صندوق پس‌انداز اینجا توسط جاوااسکریپت اضافه می‌شوند -->
              </select>
            </div>

            <div>
              <label class="block text-xs text-slate-400 mb-1">تاریخ تراکنش:</label>
              <div class="flex items-center gap-1">
                <input type="text" id="chargeDateInput" required
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-center font-mono text-slate-200 focus:outline-none">
                <button type="button" id="btnChargeDatePicker" class="px-2.5 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs">📅</button>
              </div>
            </div>

            <div>
              <label class="block text-xs text-slate-400 mb-1">نوع عملیات:</label>
              <select id="chargeActionSelect" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none">
                <option value="add">➕ واریز / خرید دارایی</option>
                <option value="subtract">➖ برداشت / فروش دارایی</option>
              </select>
            </div>

            <div id="chargeNoteRow">
              <label class="block text-xs text-slate-400 mb-1" id="chargeNoteLabel">شرح تراکنش (عنوان دارایی):</label>
              <input type="text" id="chargeNoteInput" placeholder="مثال: خرید موتور سیکلت، سکه..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none">
            </div>

            <div id="chargeQuantityRow">
              <label class="block text-xs text-slate-400 mb-1" id="chargeQuantityLabel">مقدار / تعداد دارایی:</label>
              <input type="number" id="chargeQuantityInput" step="any" placeholder="مثلاً: ۱"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs text-slate-400 mb-1" id="chargeAmountLabel">مبلغ ریالی (تومان):</label>
              <input type="number" id="chargeAmountInput" required min="1" placeholder="مثال: ۵,۰۰۰,۰۰۰"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none">
              <p id="chargeImpactNotice" class="text-[11px] text-amber-400/90 mt-1">این مبلغ از نقدینگی جاری ماه کسر خواهد شد.</p>
            </div>

            <div class="pt-2">
              <button type="submit" id="btnSubmitCharge" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition">
                ثبت تراکنش
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

        this.bindEvents();
    },

    bindEvents() {
        const modal = document.getElementById('newWidgetModal');
        const chargeModal = document.getElementById('chargeWidgetModal');
        const openBtn = document.getElementById('btnOpenNewWidgetModal');
        const closeBtn = document.getElementById('btnCloseWidgetModal');
        const closeChargeBtn = document.getElementById('btnCloseChargeModal');
        const catSelect = document.getElementById('widgetCategoryType');
        const unitInput = document.getElementById('widgetUnitInput');
        const pickerBtn = document.getElementById('btnChargeDatePicker');
        const actionSelect = document.getElementById('chargeActionSelect');
        const impactNotice = document.getElementById('chargeImpactNotice');
        const fundingSelect = document.getElementById('chargeFundingSourceSelect');

        if (openBtn) openBtn.onclick = () => modal?.classList.remove('hidden');
        if (closeBtn) closeBtn.onclick = () => modal?.classList.add('hidden');
        if (closeChargeBtn) closeChargeBtn.onclick = () => chargeModal?.classList.add('hidden');

        if (catSelect && unitInput) {
            catSelect.onchange = (e) => {
                const val = e.target.value;
                if (val === 'cash') unitInput.value = 'تومان';
                else if (val === 'gold') unitInput.value = 'گرم';
                else if (val === 'stock') unitInput.value = 'سهم';
                else unitInput.value = 'عدد';
            };
        }

        const updateImpactText = () => {
            const isAdd = actionSelect.value === 'add';
            const isCashAsset = document.getElementById('chargeAssetType').value === 'cash';
            const source = fundingSelect ? fundingSelect.value : 'liquidity';

            if (isAdd) {
                if (isCashAsset || source === 'liquidity') {
                    impactNotice.textContent = 'این مبلغ از نقدینگی آزاد جاری ماه کسر خواهد شد.';
                    impactNotice.className = 'text-[11px] text-amber-400/90 mt-1';
                } else {
                    const selectedText = fundingSelect.options[fundingSelect.selectedIndex].text;
                    impactNotice.textContent = `این مبلغ مستقیماً از موجودی صندوق «${selectedText}» کسر خواهد شد.`;
                    impactNotice.className = 'text-[11px] text-yellow-400/90 mt-1';
                }
            } else {
                impactNotice.textContent = 'این مبلغ مستقیماً به نقدینگی آزاد جاری ماه اضافه خواهد شد.';
                impactNotice.className = 'text-[11px] text-emerald-400/90 mt-1';
            }
        };

        if (actionSelect && impactNotice) {
            actionSelect.onchange = updateImpactText;
        }
        if (fundingSelect) {
            fundingSelect.onchange = updateImpactText;
        }

        if (pickerBtn && window.persianDatePicker) {
            pickerBtn.onclick = () => window.persianDatePicker.open('chargeDateInput');
        }

        // فرم ایجاد ویجت
        const createForm = document.getElementById('createWidgetForm');
        if (createForm) {
            createForm.onsubmit = async (e) => {
                e.preventDefault();
                const displayType = document.getElementById('widgetDisplayType').value;
                const categoryType = document.getElementById('widgetCategoryType').value;
                const title = document.getElementById('widgetTitleInput').value.trim();
                const unit = document.getElementById('widgetUnitInput').value.trim();

                await window.db.assets.add({
                    title,
                    type: categoryType,
                    unit: unit || 'تومان',
                    current_quantity: 0,
                    initial_cost: 0,
                    notes: displayType,
                    created_at: new Date().toISOString()
                });

                modal?.classList.add('hidden');
                createForm.reset();
                await this.refresh();
            };
        }

        // فرم ثبت تراکنش
        const chargeForm = document.getElementById('chargeWidgetForm');
        if (chargeForm) {
            chargeForm.onsubmit = async (e) => {
                e.preventDefault();
                const cycle = await window.cycleService.getCurrentCycle();
                if (!cycle) {
                    alert('ابتدا یک دوره کاری فعال را آغاز کنید.');
                    return;
                }

                const assetId = Number(document.getElementById('chargeAssetId').value);
                const date = document.getElementById('chargeDateInput').value.trim();
                const action = document.getElementById('chargeActionSelect').value;
                const noteInput = document.getElementById('chargeNoteInput');
                const qty = Number(document.getElementById('chargeQuantityInput').value) || 0;
                const amount = Number(document.getElementById('chargeAmountInput').value) || 0;
                const fundingSource = document.getElementById('chargeFundingSourceSelect').value;

                const targetAsset = await window.db.assets.get(assetId);
                if (!targetAsset) return;

                const isCash = targetAsset.type === 'cash';
                const isAdd = action === 'add';

                // مقداردهی خودکار عنوان در صورت مخفی بودن
                let note = noteInput.value.trim();
                if (isCash) {
                    note = isAdd ? 'انتقال از نقدینگی' : 'برداشت به نقدینگی';
                } else if (!note) {
                    alert('لطفاً عنوان دارایی خریداری شده را وارد کنید.');
                    return;
                }

                const currentBalance = await this.calculateAssetBalance(assetId, isCash);

                if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(qty) || qty < 0 || (!isCash && qty <= 0)) {
                    alert('مبلغ و تعداد دارایی باید معتبر و مثبت باشند.');
                    return;
                }

                try {
                    await window.db.transaction('rw', window.db.assets, window.db.asset_logs,
                        window.db.transfers, window.db.expenses, window.db.incomes, async () => {
                        const balance = await this.calculateAssetBalance(assetId, isCash);
                        if (!isAdd && (isCash ? amount > balance.cost : qty > balance.quantity)) {
                            throw new Error('موجودی دارایی برای برداشت کافی نیست.');
                        }

                        let sourceVaultId = null;
                        if (isAdd && !isCash && fundingSource !== 'liquidity') {
                            sourceVaultId = Number(fundingSource);
                            const sourceVault = await window.db.assets.get(sourceVaultId);
                            if (!sourceVault || sourceVault.type !== 'cash' || sourceVaultId === assetId) {
                                throw new Error('صندوق پس‌انداز منبع معتبر نیست.');
                            }
                            const sourceBalance = await this.calculateAssetBalance(sourceVaultId, true);
                            if (amount > sourceBalance.cost) throw new Error('موجودی صندوق منبع کافی نیست.');
                        } else if (isAdd) {
                            const totalLiquidity = await window.incomeService.getTotalLiquidity(cycle.id);
                            const expenses = await window.db.expenses.where('cycle_id').equals(cycle.id).toArray();
                            const transfers = await window.db.transfers.where('cycle_id').equals(cycle.id).toArray();
                            const spent = expenses.reduce((sum, x) => sum + Number(x.amount || 0), 0);
                            const moved = transfers.reduce((sum, x) => sum + (x.direction === 'out' ? 1 : -1) * Number(x.amount || 0), 0);
                            if (amount > totalLiquidity - spent - moved) throw new Error('نقدینگی جاری برای این عملیات کافی نیست.');
                        }

                        const now = new Date().toISOString();
                        let sourceLogId = null;
                        if (sourceVaultId !== null) {
                            const sourceVault = await window.db.assets.get(sourceVaultId);
                            sourceLogId = await window.db.asset_logs.add({
                                asset_id: sourceVaultId, date, quantity: 0, change_amount: -amount,
                                note: `تأمین خرید: ${targetAsset.title}`, created_at: now
                            });
                            await window.db.assets.update(sourceVaultId, {
                                initial_cost: Number(sourceVault.initial_cost || 0) - amount
                            });
                        }

                        const changeCost = isAdd ? amount : -amount;
                        const changeQty = isAdd ? qty : -qty;
                        const logId = await window.db.asset_logs.add({
                            asset_id: assetId, date, quantity: changeQty, change_amount: changeCost,
                            note, source_log_id: sourceLogId, created_at: now
                        });
                        const liveAsset = await window.db.assets.get(assetId);
                        await window.db.assets.update(assetId, {
                            current_quantity: Number(liveAsset.current_quantity || 0) + changeQty,
                            initial_cost: Number(liveAsset.initial_cost || 0) + changeCost
                        });

                        // انتقال نقدی فقط در صورت جابه‌جایی واقعی با نقدینگی جاری
                        if (sourceVaultId === null) {
                            await window.db.transfers.add({
                                cycle_id: cycle.id, asset_id: assetId, asset_log_id: logId,
                                amount, direction: isAdd ? 'out' : 'in', date, created_at: now
                            });
                        }
                    });
                } catch (error) {
                    console.error('خطا در ثبت تراکنش دارایی:', error);
                    alert(error.message || 'ثبت تراکنش انجام نشد.');
                    return;
                }

                chargeModal?.classList.add('hidden');
                chargeForm.reset();
                await this.refresh();

                if (window.refreshApp) {
                    await window.refreshApp();
                }
            };
        }
    },

    async calculateAssetBalance(assetId, isCash) {
        const logs = await window.db.asset_logs.where('asset_id').equals(assetId).toArray();
        let totalCost = 0;
        let totalQty = 0;
        logs.forEach(l => {
            totalCost += Number(l.change_amount || 0);
            totalQty += Number(l.quantity || 0);
        });
        return {
            cost: Math.max(0, totalCost),
            quantity: Math.max(0, totalQty)
        };
    },

    renderSvgLineChart(history = [], unit = 'تومان') {
        if (!history || history.length === 0) {
            return '<div class="text-xs text-slate-500 py-8 text-center">هنوز تراکنشی برای این ویجت ثبت نشده است.</div>';
        }

        const format = (n) => Number(n || 0).toLocaleString('fa-IR');
        const height = 180;
        const padding = 40;
        const width = Math.max(550, history.length * 75);

        const values = history.map(h => Number(h.value || 0));
        const maxVal = Math.max(...values, 1);
        const minVal = 0;
        const range = (maxVal - minVal) || 1;

        const points = history.map((h, i) => {
            const x = padding + (i * ((width - (padding * 2)) / Math.max(history.length - 1, 1)));
            const y = height - padding - (((h.value - minVal) / range) * (height - (padding * 2)));
            return { x, y, date: h.date, value: h.value };
        });

        const pathD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

        return `
      <div class="overflow-x-auto">
        <svg width="${width}" height="${height}" class="overflow-visible mx-auto">
          <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="#334155" stroke-dasharray="3" />
          <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#475569" />
          <path d="${pathD}" fill="none" stroke="#eab308" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          ${points.map(p => `
            <g class="cursor-pointer group">
              <circle cx="${p.x}" cy="${p.y}" r="5" fill="#facc15" stroke="#0f172a" stroke-width="2" />
              <text x="${p.x}" y="${p.y - 10}" fill="#facc15" font-size="10" font-family="monospace" text-anchor="middle" font-weight="bold">${format(p.value)} ${unit}</text>
              <text x="${p.x}" y="${height - 12}" fill="#94a3b8" font-size="9" text-anchor="middle">${p.date}</text>
            </g>
          `).join('')}
        </svg>
      </div>
    `;
    },

    async refresh() {
        const container = document.getElementById('dynamicWidgetsContainer');
        const emptyNotice = document.getElementById('assetsEmptyNotice');
        if (!container) return;

        const assets = await window.db.assets.toArray();
        const logs = await window.db.asset_logs.toArray();
        const format = (n) => window.ui ? window.ui.formatNumber(n) : Number(n || 0).toLocaleString('fa-IR');

        let totalCash = 0;
        let totalOther = 0;

        container.innerHTML = '';
        emptyNotice?.classList.toggle('hidden', assets.length > 0);

        const cashAssets = assets.filter(a => a.type === 'cash');

        assets.forEach(asset => {
            const isChart = asset.notes === 'chart' || !asset.notes;
            const isCash = asset.type === 'cash';

            const assetLogs = logs.filter(l => l.asset_id === asset.id).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

            const dailyMap = new Map();
            assetLogs.forEach(l => {
                const d = l.date || 'نامشخص';
                const change = isCash ? Number(l.change_amount || 0) : Number(l.quantity || 0);
                dailyMap.set(d, (dailyMap.get(d) || 0) + change);
            });

            let runningVal = 0;
            const history = [];
            dailyMap.forEach((change, date) => {
                runningVal = Math.max(0, runningVal + change);
                history.push({ date, value: runningVal });
            });

            let liveCost = 0;
            let liveQty = 0;
            assetLogs.forEach(l => {
                liveCost += Number(l.change_amount || 0);
                liveQty += Number(l.quantity || 0);
            });
            liveCost = Math.max(0, liveCost);
            liveQty = Math.max(0, liveQty);

            if (isCash) totalCash += liveCost;
            else totalOther += liveCost;

            const card = document.createElement('div');
            card.className = 'bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4';

            card.innerHTML = `
        <div class="flex flex-wrap items-center justify-between border-b border-slate-700/80 pb-3 gap-2">
          <div class="flex items-center gap-2">
            <span class="text-base">${isCash ? '🪙' : asset.type === 'gold' ? '🥇' : asset.type === 'stock' ? '📈' : '📦'}</span>
            <h3 class="text-sm font-bold text-slate-100">${asset.title}</h3>
            <span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-400">
              ${isChart ? 'نمودار رشد' : 'جدول اقلام'} | واحد: ${asset.unit || 'تومان'}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button data-id="${asset.id}" data-type="${asset.type}" data-balance="${isCash ? liveCost : liveQty}" type="button" class="btn-charge-widget px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-xs font-semibold transition">
              + شارژ / تراکنش
            </button>
            <button data-id="${asset.id}" type="button" class="btn-delete-widget text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-rose-500/10 rounded-lg">
              حذف
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-400 px-1">
          ${isCash ? `
            <span class="text-slate-300">موجودی فعلی اندوخته: <b class="text-yellow-400 font-mono text-sm">${format(liveCost)} تومان</b></span>
            <span class="text-[11px] text-slate-500 font-mono">تعداد تراکنش: ${assetLogs.length}</span>
          ` : `
            <span>بهای خرید تمام‌شده: <b class="text-cyan-400 font-mono">${format(liveCost)} تومان</b></span>
            <span>موجودی دارایی: <b class="text-yellow-400 font-mono text-sm">${format(liveQty)} ${asset.unit || ''}</b></span>
          `}
        </div>

        <div>
          ${isChart ? this.renderSvgLineChart(history, asset.unit) : `
            <div class="overflow-x-auto">
              <table class="w-full text-right text-xs">
                <thead>
                  <tr class="border-b border-slate-700 text-slate-400">
                    <th class="py-2 px-2">تاریخ</th>
                    <th class="py-2 px-2">شرح</th>
                    <th class="py-2 px-2">نوع</th>
                    <th class="py-2 px-2">تغییر مقدار</th>
                    <th class="py-2 px-2">مبلغ تراکنش</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/40">
                  ${assetLogs.map(l => {
                const isPlus = (l.change_amount || 0) >= 0;
                return `
                      <tr>
                        <td class="py-2 px-2 font-mono text-slate-400">${l.date}</td>
                        <td class="py-2 px-2 text-slate-200">${l.note || '-'}</td>
                        <td class="py-2 px-2 ${isPlus ? 'text-emerald-400' : 'text-rose-400'} font-semibold">${isPlus ? 'واریز ➕' : 'برداشت ➖'}</td>
                        <td class="py-2 px-2 font-mono text-yellow-400">${l.quantity ? `${format(Math.abs(l.quantity))} ${asset.unit}` : '-'}</td>
                        <td class="py-2 px-2 font-mono ${isPlus ? 'text-cyan-400' : 'text-rose-400'}">${format(Math.abs(l.change_amount))} تومان</td>
                      </tr>
                    `;
            }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;

            container.appendChild(card);
        });

        document.getElementById('totalCashSavingsDisplay').textContent = `${format(totalCash)} تومان`;
        document.getElementById('totalAssetsCostDisplay').textContent = `${format(totalOther)} تومان`;
        document.getElementById('grandTotalWealthDisplay').textContent = `${format(totalCash + totalOther)} تومان`;

        container.querySelectorAll('.btn-charge-widget').forEach(btn => {
            btn.onclick = (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                const target = assets.find(a => a.id === id);
                if (!target) return;

                const isCash = target.type === 'cash';
                const balance = e.currentTarget.getAttribute('data-balance');

                document.getElementById('chargeAssetId').value = target.id;
                document.getElementById('chargeAssetType').value = target.type;
                document.getElementById('chargeModalTitle').textContent = `ثبت تراکنش برای «${target.title}»`;
                document.getElementById('chargeCurrentBalanceDisplay').textContent = `${format(balance)} ${target.unit || 'تومان'}`;

                // کنترل نمایش هوشمند فیلدها
                const qtyRow = document.getElementById('chargeQuantityRow');
                const qtyInput = document.getElementById('chargeQuantityInput');
                const noteRow = document.getElementById('chargeNoteRow');
                const noteInput = document.getElementById('chargeNoteInput');
                const fundingRow = document.getElementById('chargeFundingSourceRow');
                const fundingSelect = document.getElementById('chargeFundingSourceSelect');
                const actionSelect = document.getElementById('chargeActionSelect');

                if (isCash) {
                    if (qtyRow) qtyRow.style.display = 'none';
                    if (qtyInput) qtyInput.value = '';
                    if (noteRow) noteRow.style.display = 'none';
                    if (noteInput) noteInput.required = false;
                    if (fundingRow) fundingRow.style.display = 'none';
                } else {
                    if (qtyRow) qtyRow.style.display = 'block';
                    if (noteRow) noteRow.style.display = 'block';
                    if (noteInput) noteInput.required = true;
                    if (fundingRow) {
                        fundingRow.style.display = 'block';
                        fundingSelect.innerHTML = '<option value="liquidity">💳 کسر مستقیم از نقدینگی جاری ماه</option>';
                        cashAssets.forEach(ca => {
                            fundingSelect.innerHTML += `<option value="${ca.id}">🪙 کسر از صندوق پس‌انداز: ${ca.title}</option>`;
                        });
                    }
                }

                if (actionSelect) {
                    actionSelect.dispatchEvent(new Event('change'));
                }

                if (window.persianDatePicker) {
                    document.getElementById('chargeDateInput').value = window.persianDatePicker.getTodayJalaliString();
                }
                document.getElementById('chargeWidgetModal')?.classList.remove('hidden');
            };
        });

        // مدیریت خطای احتمالی در حذف دارایی
        container.querySelectorAll('.btn-delete-widget').forEach(btn => {
            btn.onclick = async (e) => {
                const id = Number(e.currentTarget.getAttribute('data-id'));
                if (confirm('با حذف این ویجت، تمام سوابق و لاگ‌های آن حذف می‌شوند. آیا ادامه می‌دهید؟')) {
                    try {
                        await window.db.transaction('rw', window.db.assets, window.db.asset_logs,
                            window.db.transfers, window.db.expenses, window.db.incomes, async () => {
                            const relatedLogs = await window.db.asset_logs.where('asset_id').equals(id).toArray();
                            const allLogs = await window.db.asset_logs.toArray();
                            const logIds = new Set(relatedLogs.map(l => l.id));
                            if (allLogs.some(l => l.source_log_id && logIds.has(l.source_log_id))) {
                                throw new Error('این صندوق برای خرید دارایی دیگری استفاده شده است؛ ابتدا دارایی وابسته را حذف کنید.');
                            }
                            for (const log of relatedLogs) {
                                if (log.source_log_id) {
                                    const sourceLog = await window.db.asset_logs.get(log.source_log_id);
                                    if (sourceLog) {
                                        const source = await window.db.assets.get(sourceLog.asset_id);
                                        if (source) await window.db.assets.update(source.id, {
                                            initial_cost: Number(source.initial_cost || 0) - Number(sourceLog.change_amount || 0)
                                        });
                                        await window.db.asset_logs.delete(sourceLog.id);
                                    }
                                }
                                await window.db.transfers.where('asset_log_id').equals(log.id).delete();
                                await window.db.expenses.where('asset_log_id').equals(log.id).delete();
                                await window.db.incomes.where('asset_log_id').equals(log.id).delete();
                            }
                            await window.db.asset_logs.where('asset_id').equals(id).delete();
                            await window.db.assets.delete(id);
                        });

                        await this.refresh();
                        if (window.refreshApp) await window.refreshApp();
                    } catch (error) {
                        console.error("خطا در هنگام حذف دارایی: ", error);
                        alert(error.message || "خطایی هنگام حذف دارایی رخ داد.");
                    }
                }
            };
        });
    }
};