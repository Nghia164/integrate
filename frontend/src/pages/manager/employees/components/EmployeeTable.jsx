import { RowActions, StatusPill, Avatar } from "../../../../components/TableKit";
import { fmtBirth } from "../employeeData";

const th = "px-4 py-3.5 text-left text-[13px] font-semibold text-slate-600 bg-slate-50 border-b border-slate-200";

const STATUS_TONE = {
  "Đang làm việc": "success",
  "Tạm nghỉ": "warning",
  "Nghỉ việc": "error",
};

/**
 * Bảng hiển thị danh sách nhân viên chuẩn UI_RULES
 */
export default function EmployeeTable({
  pageRows = [],
  onRowClick,
  menuItems,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[860px] text-[14px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className={th}>Nhân viên</th>
            <th className={th}>Vai trò</th>
            <th className={th}>Loại hợp đồng</th>
            <th className={th}>Ngày sinh</th>
            <th className={th}>Tài khoản</th>
            <th className={th}>Trạng thái</th>
            <th className={`${th} text-right`} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-[14px] text-slate-800">
          {pageRows.map((emp) => {
            const locked = emp.account?.status === "locked";
            return (
              <tr
                key={emp.id}
                onClick={() => onRowClick(emp)}
                className="cursor-pointer transition-colors hover:bg-slate-50/80"
              >
                <td className="px-4 py-3.5">
                  <span className="flex items-center gap-3">
                    <Avatar name={emp.name} />
                    <span>
                      <span className="block font-medium">{emp.name}</span>
                      <span className="block text-[12px] text-slate-500">
                        {emp.id} • {emp.phone}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {(emp.roles && emp.roles.length > 0 ? emp.roles : [emp.role || "Phục vụ"]).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-700"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">{emp.contract}</td>
                <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">{fmtBirth(emp.birthDate)}</td>
                <td className="px-4 py-3.5">
                  {emp.account ? (
                    <>
                      <StatusPill tone={locked ? "error" : "success"}>{locked ? "Đã khóa" : "Đã cấp"}</StatusPill>
                      <span className="mt-1 block text-[12px] text-slate-500">{emp.account.email}</span>
                    </>
                  ) : (
                    <span className="text-slate-400">Chưa cấp</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <StatusPill tone={STATUS_TONE[emp.status] || "neutral"}>{emp.status}</StatusPill>
                </td>
                <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActions label={`Thao tác với ${emp.name}`} items={menuItems(emp)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
