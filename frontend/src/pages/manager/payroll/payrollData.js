import { pad } from "../../../lib/formatters";
import { getNow } from "../../../lib/dateUtils";

export const PERIOD_OPTIONS = [
  { value: "month", label: "Theo tháng" },
  { value: "week", label: "Theo tuần" },
  { value: "range", label: "Khoảng ngày" },
];

export const CONTRACTS = ["Full-time", "Part-time"];

export const PAY_COLORS = {
  base: "#3b5bfd",
  surcharge: "#f59e0b",
  bonus: "#14b8a6",
};

export const currentMonth = () => {
  const d = getNow();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

/**
 * Đổi chuỗi "2026-10" thành { from: "2026-10-01", to: "2026-10-31", label: "Tháng 10/2026" }
 */
export function monthRange(ym) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return {
    from: `${y}-${pad(m)}-01`,
    to: `${y}-${pad(m)}-${pad(last)}`,
    label: `Tháng ${pad(m)}/${y}`,
  };
}

export const I = {
  wallet: "M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h15a2 2 0 0 1 2 2v2m0 0h-4a2 2 0 0 0 0 4h4v-4Z",
  coins: "M12 6c4.4 0 8-1.1 8-2.5S16.4 1 12 1 4 2.1 4 3.5 7.6 6 12 6Zm8 2.5C20 9.9 16.4 11 12 11S4 9.9 4 8.5M20 13.5c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5M20 3.5v15c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5v-15",
  trend: "m3 17 6-6 4 4 8-8M15 7h6v6",
  gift: "M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Zm0 0h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
};
