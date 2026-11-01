/**
 * Tầng: Thành phần dùng chung (Shared Component)
 * Component: Khung vỏ ứng dụng (AppShell)
 * Quy chuẩn thiết kế 2026:
 * 1. Khung trang cố định: Chiều cao đúng 100vh (h-screen w-screen overflow-hidden).
 * 2. Nền ngoài cùng là xanh pastel nhạt (--shell-bg: #DCEBF5), có khoảng đệm quanh mép (p-2.5 sm:p-3.5).
 * 3. Menu nằm trong khung trắng bo góc lớn (rounded-2xl) nổi trên nền xanh pastel.
 * 4. Panel bên phải là khung bo góc lớn nền #F4F7F9:
 *    - Header ở trên: CỐ ĐỊNH, không cuộn.
 *    - Vùng nội dung bên dưới: cuộn độc lập (overflow-y-auto), body không có thanh cuộn.
 * 5. Trên mobile: menu thu thành drawer trượt từ mép trái, có backdrop mờ.
 */

import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

const FONT = '"Be Vietnam Pro", ui-sans-serif, system-ui, "Segoe UI", sans-serif';

export default function AppShell({
  sidebar,
  collapsed = false,
  mobileOpen = false,
  onMobileClose,
  headerLeft,
  headerSearch,
  headerRight,
  children,
}) {
  const location = useLocation();
  const mainRef = useRef(null);

  // Cuộn trang lên đầu khi chuyển route (US / UI Rule)
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[var(--page-bg,#F4F7F9)] p-2.5 sm:p-3.5 gap-3 text-[#0F172A] select-normal"
      style={{ fontFamily: FONT }}
    >
      {/* Lớp phủ mờ khi mở menu trên thiết bị di động */}
      {mobileOpen && (
        <div
          role="presentation"
          onClick={onMobileClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* THANH BÊN MENU (KHUNG TRẮNG BO GÓC LỚN NỔI TRÊN NỀN SHELL) */}
      <aside
        aria-label="Thanh điều hướng chính"
        className={`fixed inset-y-2.5 left-2.5 z-50 flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xl md:shadow-sm md:static md:inset-auto md:z-auto md:h-full shrink-0 overflow-hidden transition-[transform,width] duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
        } ${collapsed ? "w-20" : "w-[264px]"}`}
      >
        {sidebar}
      </aside>

      {/* PANEL LÀM VIỆC BÊN PHẢI (BO GÓC LỚN NỀN #F4F7F9) */}
      <div className="flex-1 h-full min-w-0 flex flex-col rounded-2xl border border-slate-200/90 bg-[#F4F7F9] shadow-sm overflow-hidden">
        {/* HEADER CỐ ĐỊNH (KHÔNG CUỘN) */}
        <header className="h-[64px] shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {headerLeft}
          </div>

          {headerSearch && (
            <div className="hidden sm:flex flex-1 max-w-md mx-4">
              {headerSearch}
            </div>
          )}

          <div className="flex items-center gap-3 shrink-0">
            {headerRight}
          </div>
        </header>

        {/* VÙNG NỘI DUNG CUỘN ĐỘC LẬP (DUY NHẤT CUỘN TRÊN TRANG) */}
        <main
          ref={mainRef}
          id="app-panel-scroll"
          data-testid="app-main-scroll"
          className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 [scrollbar-width:thin]"
        >
          <div className="mx-auto w-full max-w-[1440px]">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
