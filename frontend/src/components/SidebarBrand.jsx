/**
 * File: src/components/SidebarBrand.jsx
 * Component Brand Block dùng chung cho Sidebar của Staff và Manager:
 * - Bố cục ngang: [ô logo] [khối chữ]
 * - Ô logo: vuông 44x44px, bo góc 12px, viền mảnh + nền trắng, padding 4px, chứa logo chuẩn từ src/assets/logo.png
 * - Khối chữ: 2 dòng căn trái, cách ô logo 12px:
 *     + Dòng 1: "Smart Scheduling" 18px font-bold, màu chữ đậm hệ thống (#0F172A), không cắt "..."
 *     + Dòng 2: subtitle viết hoa 11px font-semibold tracking-wider màu xám (slate-500)
 *         Staff: "CỔNG NHÂN VIÊN"
 *         Manager: "CỔNG QUẢN LÝ"
 * - Không còn huy hiệu role nhỏ cạnh tên
 * - Khi thu gọn (collapsed): chỉ hiện ô logo căn giữa
 */

import { Link } from "react-router-dom";
import logoUrl from "../assets/logo.png";

export function SidebarBrand({ subtitle = "", collapsed = false, to, className = "" }) {
  const content = (
    <div
      data-testid="sidebar-brand"
      className={`flex items-center gap-3 select-none ${collapsed ? "justify-center" : ""} ${className}`}
    >
      {/* Ô logo vuông 44x44px, bo góc 12px, viền mảnh + nền trắng, padding 4px */}
      <div
        data-testid="brand-logo-box"
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] border border-slate-200/80 bg-white p-1 shadow-2xs"
      >
        <img
          src={logoUrl}
          alt="Smart Scheduling"
          className="h-full w-full object-contain"
        />
      </div>

      {/* Khối chữ 2 dòng, căn trái, cách ô logo 12px, không rớt dòng */}
      {!collapsed && (
        <div data-testid="brand-text-block" className="flex flex-col min-w-0 text-left">
          <span className="whitespace-nowrap text-[18px] font-bold tracking-tight text-[#0F172A] leading-tight">
            Smart Scheduling
          </span>
          {subtitle && (
            <span className="whitespace-nowrap text-[11px] font-semibold tracking-wider text-slate-500 uppercase leading-none mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="outline-none focus:outline-none flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

export default SidebarBrand;
