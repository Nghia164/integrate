import { RowActions, StatusPill } from "../../../components/TableKit";
import { STATUS_META, initialsOf, roleLabel } from "./leaveShared";

const th = "px-4 py-3.5 text-left text-[13px] font-semibold text-slate-600 bg-slate-50 border-b border-slate-200";

// Cột "Người thay": tùy trạng thái đơn mà hiện người thay, chữ chờ xác nhận, hoặc nút xem gợi ý.
function Replacement({ req, onOpen }) {
  const { status } = req;
  if (status === "rejected") return <span className="text-slate-400">—</span>;
  if (status === "replacement_confirmed" || status === "replacement_pending")
    return (
      <>
        <span className="block font-medium">{req.replacementName}</span>
        <span className="block text-[12px] text-slate-500">{status === "replacement_pending" ? "Đang chờ xác nhận" : req.replacementRole}</span>
      </>
    );
  if (req.openShiftCreated) return <span>Đã đăng ca trực mở</span>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(req);
      }}
      className="whitespace-nowrap font-medium text-[#0F172A] hover:underline cursor-pointer"
    >
      {status === "pending" ? "Xem gợi ý của AI" : "AI gợi ý người thay"}
    </button>
  );
}

// Bảng danh sách đơn. Bấm vào dòng để mở chi tiết; mọi thao tác khác nằm trong menu "⋮" cuối dòng.
export default function LeaveTable({ rows, onOpen, onApprove, onReject }) {
  const menuItems = (req) => [
    { label: "Xem chi tiết", onClick: () => onOpen(req) },
    ...(req.status === "pending"
      ? [
          { label: "Duyệt đơn", onClick: () => onApprove(req.id) },
          { label: "Từ chối đơn", danger: true, onClick: () => onReject(req) },
        ]
      : []),
  ];

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[920px] text-[14px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className={th}>Nhân viên</th>
              <th className={th}>Ca xin nghỉ</th>
              <th className={th}>Lý do</th>
              <th className={th}>Người thay (AI)</th>
              <th className={th}>Trạng thái</th>
              <th className={`${th} text-right`} />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[14px] text-slate-800">
            {rows.map((req) => {
              const meta = STATUS_META[req.status] ?? { label: req.status, hex: "#94a3b8" };
              return (
                <tr
                  key={req.id}
                  onClick={() => onOpen(req)}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80"
                >
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600">
                        {initialsOf(req.employeeName)}
                      </span>
                      <span>
                        <span className="block font-medium">{req.employeeName}</span>
                        <span className="block text-[12px] text-slate-500">{req.employeeId} • {roleLabel(req.roleTag)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="tabular-nums">{req.shiftDate}</span>
                    <span className="block text-[12px] text-slate-500">
                      {req.shiftName} ({req.shiftTime}) • {req.leaveType === "emergency" ? "Đột xuất" : "Kế hoạch"}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3.5">
                    <span className="line-clamp-2" title={req.reason}>{req.reason}</span>
                    <span className="block text-[12px] text-slate-500">{req.id} • Gửi lúc: {req.createdAt}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5"><Replacement req={req} onOpen={onOpen} /></td>
                  <td className="px-4 py-3.5"><StatusPill hex={meta.hex} className="w-40 justify-center">{meta.label}</StatusPill></td>
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      label={`Thao tác với đơn của ${req.employeeName}`}
                      items={menuItems(req)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
