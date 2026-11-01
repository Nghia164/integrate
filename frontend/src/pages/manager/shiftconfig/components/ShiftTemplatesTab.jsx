import { RowActions, StatusPill } from "../../../../components/TableKit";
import { Pagination } from "../../../../components/PageKit";
import {
  SHIFT_STATUS,
  fmtDuration,
  getShiftDurationMin,
  isOvernightShift,
} from "../shiftConfigData";

const th = "px-4 py-3.5 text-left text-[13px] font-semibold text-slate-600 bg-slate-50 border-b border-slate-200";

const STATUS_TONE = {
  active: "success",
  inactive: "neutral",
};

export default function ShiftTemplatesTab({
  shifts,
  rows,
  pageRows,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-[15px] text-slate-500">
        {shifts.length === 0 ? "Chưa có ca mẫu nào. Bấm “Thêm ca mẫu” để tạo." : "Không có ca mẫu phù hợp với bộ lọc hiện tại."}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-[14px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className={th}>Tên ca</th>
              <th className={th}>Giờ làm</th>
              <th className={th}>Thời lượng</th>
              <th className={th}>Hệ số lương</th>
              <th className={th}>Trạng thái</th>
              <th className={`${th} text-right`} />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[14px] text-slate-800">
            {pageRows.map((s) => {
              const duration = getShiftDurationMin(s.startTime, s.endTime);
              const isOvernight = isOvernightShift(s.startTime, s.endTime);
              return (
                <tr
                  key={s.id}
                  onClick={() => onEdit(s)}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3.5 font-medium text-slate-900">{s.name}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                    {s.startTime} – {s.endTime}
                    {isOvernight && (
                      <span className="ml-1.5 text-[12px] font-medium text-indigo-600">(hôm sau)</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                    {fmtDuration(duration)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-700">
                      x{Number(s.multiplier || 1.0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill tone={STATUS_TONE[s.status] || "neutral"}>
                      {SHIFT_STATUS[s.status]?.label || s.status}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      label={`Thao tác với ca ${s.name}`}
                      items={[
                        { label: "Sửa ca mẫu", onClick: () => onEdit(s) },
                        { label: "Xóa ca mẫu", danger: true, onClick: () => onDelete(s) },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={rows.length}
        unit="ca mẫu"
        onPage={onPageChange}
        onPageSize={onPageSizeChange}
      />
    </>
  );
}
