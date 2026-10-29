/**
 * js/ui.js
 * مدیریت تعاملات سراسری، سایدبار هوشمند و فرمت داده‌ها
 */
window.ui = {
    formatNumber(num) {
        return Number(num || 0).toLocaleString('fa-IR');
    },

    setupTabs() {
        const sidebar = document.getElementById('appSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const btnToggleDesktop = document.getElementById('btnToggleSidebar');
        const layoutWrapper = document.getElementById('layoutWrapper'); // کانتینر اصلی
        const links = document.querySelectorAll('.sidebar-link');

        const sections = [
            'dashboardSection', 'budgetSection', 'expenseSection',
            'timelineSection', 'assetsSection', 'incomeSection', 'backupSection'
        ];

        let isExpandedDesktop = false;
        let isExpandedMobile = false;
        let overlayTimeout = null;

        const updateToggleIcon = (isOpen) => {
            if (!btnToggleDesktop) return;

            const path = btnToggleDesktop.querySelector('path');

            if (path) {
                path.setAttribute(
                    'd',
                    isOpen
                        ? 'M6 18L18 6M6 6l12 12'
                        : 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                );
            }

            btnToggleDesktop.setAttribute('aria-expanded', String(isOpen));
            btnToggleDesktop.setAttribute(
                'aria-label',
                isOpen ? 'بستن منو' : 'باز کردن منو'
            );
        };

        // تغییر وضعیت برای دسکتاپ
        const toggleSidebarDesktop = () => {
            if (!sidebar) return;

            isExpandedDesktop = !isExpandedDesktop;

            if (isExpandedDesktop) {
                // سایدبار باز شود
                sidebar.classList.remove('sidebar-collapsed', 'md:w-16');
                sidebar.classList.add('sidebar-expanded', 'md:w-64');

                // محتوا به اندازه ۲۵۶ پیکسل فاصله بگیرد
                if (layoutWrapper) {
                    layoutWrapper.classList.remove('md:pr-16');
                    layoutWrapper.classList.add('md:pr-64');
                }
            } else {
                // سایدبار جمع شود
                sidebar.classList.add('sidebar-collapsed', 'md:w-16');
                sidebar.classList.remove('sidebar-expanded', 'md:w-64');

                // محتوا به اندازه ۶۴ پیکسل فاصله بگیرد
                if (layoutWrapper) {
                    layoutWrapper.classList.remove('md:pr-64');
                    layoutWrapper.classList.add('md:pr-16');
                }
            }

            updateToggleIcon(isExpandedDesktop);
        };

        // تغییر وضعیت سایدبار موبایل
        const toggleSidebarMobile = () => {
            if (!sidebar) return;

            isExpandedMobile = !isExpandedMobile;

            // جلوگیری از تداخل تایمرهای قبلی Overlay
            if (overlayTimeout) {
                clearTimeout(overlayTimeout);
                overlayTimeout = null;
            }

            if (isExpandedMobile) {
                // حالت باز: منوی کامل روی محتوا قرار می‌گیرد
                sidebar.classList.remove(
                    'translate-x-full',
                    'sidebar-collapsed',
                    'w-16'
                );

                sidebar.classList.add(
                    'translate-x-0',
                    'sidebar-expanded',
                    'w-64'
                );

                if (overlay) {
                    overlay.classList.remove('hidden');

                    requestAnimationFrame(() => {
                        overlay.classList.remove('opacity-0');
                    });
                }

            } else {
                // حالت بسته: نوار آیکن‌ها کنار محتوای اصلی باقی می‌ماند
                sidebar.classList.remove(
                    'sidebar-expanded',
                    'w-64',
                    'translate-x-full'
                );

                sidebar.classList.add(
                    'sidebar-collapsed',
                    'w-16',
                    'translate-x-0'
                );

                if (overlay) {
                    overlay.classList.add('opacity-0');

                    overlayTimeout = setTimeout(() => {
                        overlay.classList.add('hidden');
                        overlayTimeout = null;
                    }, 300);
                }
            }

            updateToggleIcon(isExpandedMobile);
        };
        // بستن سایدبار موبایل
        const closeSidebarMobile = () => {
            if (window.innerWidth < 768 && isExpandedMobile) {
                toggleSidebarMobile();
            }
        };

        // اتصال دکمه‌های کنترل سایدبار
        if (btnToggleDesktop) {
            btnToggleDesktop.addEventListener('click', () => {
                if (window.innerWidth >= 768) {
                    toggleSidebarDesktop();
                } else {
                    toggleSidebarMobile();
                }
            });
        }


        // بستن منو با کلیک روی Overlay
        if (overlay) {
            overlay.addEventListener('click', closeSidebarMobile);
        }

        // مسیریابی تب‌های داخلی
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');

                // مخفی کردن تمام بخش‌ها
                sections.forEach(secId => {
                    const secEl = document.getElementById(secId);
                    if (secEl) secEl.classList.add('hidden');
                });

                // غیرفعال کردن تمام لینک‌ها
                links.forEach(l => {
                    l.className = 'sidebar-link w-full flex items-center px-2 py-3 text-sm font-medium rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition';
                });

                // نمایش بخش انتخاب‌شده
                const targetEl = document.getElementById(targetId);
                if (targetEl) targetEl.classList.remove('hidden');

                // فعال کردن لینک انتخاب‌شده
                e.currentTarget.className = 'sidebar-link w-full flex items-center px-2 py-3 text-sm font-medium rounded-xl bg-emerald-500/10 text-emerald-400 transition';

                // بستن سایدبار موبایل پس از انتخاب تب
                closeSidebarMobile();
            });
        });
    }
};