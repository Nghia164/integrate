import { FilterSelect } from "../../../components/PageKit";

import { SearchInput, StatusTabs, Toolbar } from "../../../components/PageKit";
import { DEFAULT_FILTERS, ROLE_OPTIONS, TABS, TYPE_OPTIONS } from "./leaveShared";

// Hàng tab trạng thái (kèm số đơn) + ô tìm kiếm + bộ lọc chuẩn UI_RULES (Toolbar chuẩn trên cùng 1 hàng)
export default function LeaveToolbar({ filters, onChange, counts }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: value });
  const canClear = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <Toolbar
      tabs={<StatusTabs tabs={TABS} value={filters.status} onChange={set("status")} counts={counts} />}
      search={
        <SearchInput
          value={filters.q}
          onChange={set("q")}
          placeholder="Tìm tên nhân viên, mã đơn, lý do..."
        />
      }
      filters={
        <>
          <FilterSelect label="Vị trí" value={filters.role} onChange={set("role")} options={ROLE_OPTIONS} />
          <FilterSelect label="Loại nghỉ" value={filters.type} onChange={set("type")} options={TYPE_OPTIONS} />
        </>
      }
      onClear={() => onChange(DEFAULT_FILTERS)}
      canClear={canClear}
    />
  );
}
