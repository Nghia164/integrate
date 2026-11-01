import { FilterSelect } from "../../../components/PageKit";

import { SearchInput, StatusTabs, Toolbar } from "../../../components/PageKit";
import { DEFAULT_FILTERS, ROLE_OPTIONS, TABS } from "./exchangeShared";

// Hàng tab trạng thái (kèm số yêu cầu) + ô tìm kiếm + bộ lọc vai trò (Toolbar chuẩn trên cùng 1 hàng)
// filters = { status, role, q }; counts = số yêu cầu theo từng tab.
export default function ExchangeToolbar({ filters, onChange, counts }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: value });
  const canClear = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <Toolbar
      tabs={<StatusTabs tabs={TABS} value={filters.status} onChange={set("status")} counts={counts} />}
      search={
        <SearchInput
          value={filters.q}
          onChange={set("q")}
          placeholder="Tìm tên nhân viên, mã yêu cầu, lý do..."
        />
      }
      filters={<FilterSelect label="Vai trò" value={filters.role} onChange={set("role")} options={ROLE_OPTIONS} />}
      onClear={() => onChange(DEFAULT_FILTERS)}
      canClear={canClear}
    />
  );
}
