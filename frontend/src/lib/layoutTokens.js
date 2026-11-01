/**
 * File: src/lib/layoutTokens.js
 * Quy chuẩn layout cho toàn bộ hệ thống
 */

export const STAFF_LAYOUT = {
  blockGap: "space-y-5",
  flexBlockGap: "flex flex-col gap-5",

  headerCard: "rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs",
  pageCard: "rounded-2xl border border-slate-200/90 bg-white shadow-2xs p-6",
  pageCardInnerGap: "space-y-5",

  toolbar: "flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3",
  toolbarHeight: "h-10",
  toolbarBtn: "inline-flex h-10 items-center justify-center rounded-xl px-4 text-[13.5px] font-medium shadow-2xs transition-all",
  buttonGap: "gap-2",

  noticeBar: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9E8F5] bg-[#F4F7F9] p-4 shadow-2xs transition-all text-[#0F172A]",

  grid: {
    container: "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs",
    table: "w-full table-fixed border-collapse",
    cornerWidth: "150px",
    cornerLabel: "Ca làm việc",
    cornerTh: "border-r border-slate-200 bg-slate-50/80 p-2.5 text-left text-[14px] font-normal text-slate-700",
    dayTh: "border-r border-slate-200 p-2 text-center last:border-r-0 transition-colors h-[85px] align-middle",
    dayNameText: "text-[15px] font-normal leading-snug",
    dayDateText: "text-[16px] font-normal leading-tight mt-0.5",
    todayBg: "bg-[#F0F6FB] text-[#0F172A]",
    defaultDayBg: "bg-slate-50/80 text-slate-800",
    shiftLabelTd: "border-r border-slate-200 p-3 align-middle select-none",
    shiftNameText: "text-[16px] font-medium leading-snug",
    shiftTimeText: "mt-1 flex items-center gap-1 text-[14px] font-normal text-slate-600 tabular-nums",
    cellTd: "border-r border-slate-200 p-2 align-top last:border-r-0 transition-colors",
    cellPadding: "p-2",
    cellBorder: "border-slate-200",
  },

  typography: {
    pageTitle: "text-[22px] font-bold tracking-tight text-[#0F172A] leading-tight",
    pageSubtitle: "text-[13px] text-slate-500 font-normal mt-0.5 leading-normal",
    sectionTitle: "text-[16px] font-semibold text-[#0F172A] leading-snug",
    sectionDesc: "text-[13px] text-slate-500 font-normal leading-normal",
    body: "text-[13.5px] text-slate-700 leading-normal",
    meta: "text-[12px] text-slate-500 leading-normal",
  },
};

export const Z_INDEX = {
  header: 20,
  dropdown: 30,
  modal: 50,
  toast: 60,
};

export const MANAGER_LAYOUT = STAFF_LAYOUT;

STAFF_LAYOUT.STAFF_LAYOUT = STAFF_LAYOUT;
STAFF_LAYOUT.MANAGER_LAYOUT = STAFF_LAYOUT;
STAFF_LAYOUT.Z_INDEX = Z_INDEX;

export default STAFF_LAYOUT;
