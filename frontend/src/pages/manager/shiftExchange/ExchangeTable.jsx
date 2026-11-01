import { RowActions, StatusPill } from "../../../components/TableKit";
import { STATUS_META, dateBrief, initialsOf, shiftBrief } from "./exchangeShared";

const th = "whitespace-nowrap px-4 py-3.5 text-left text-[13px] font-semibold text-slate-600 bg-slate-50 border-b border-slate-200";
const td = "whitespace-nowrap px-4 py-3.5 align-middle";

// Người trong yêu cầu: avatar chữ cái + tên + vai trò
function Person({ name, role, tag }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600">
        {initialsOf(name)}
      </span>
      <span>
        <span className="block font-medium">{name}</span>
        <span className="block text-[12px] text-slate-500">{role} • {tag}</span>
      </span>
    </span>
  );
}

// Ca làm: ngày ở trên, tên ca và giờ ở dưới. Không có ca nghĩa là người nhận chỉ trực thay.
function Shift({ shift }) {
  if (!shift) {
    return (
      <>
        <span className="block">Trực thay ca</span>
        <span className="block text-[12px] text-slate-500">Không đổi lại ca</span>
      </>
    );
  }
  return (
    <>
      <span className="block tabular-nums">{dateBrief(shift.date)}</span>
      <span className="block text-[12px] text-slate-500">{shiftBrief(shift)}</span>
    </>
  );
}

// Bảng yêu cầu đổi ca. Bấm vào dòng để mở chi tiết; thao tác khác nằm trong menu "⋮" cuối dòng.
export default function ExchangeTable({ rows, onOpen, onApprove, onReject }) {
  const menuItems = (req) => [
    { label: "Xem chi tiết", onClick: () => onOpen(req) },
    ...(req.status === "pending_manager"
      ? [
          { label: "Phê duyệt", onClick: () => onApprove(req.id) },
          { label: "Từ chối", danger: true, onClick: () => onReject(req) },
        ]
      : []),
  ];

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className={th}>Người xin đổi</th>
              <th className={th}>Ca xin đổi</th>
              <th className={th}>Người nhận đổi</th>
              <th className={th}>Ca nhận</th>
              <th className={th}>Hình thức & lý do</th>
              <th className={th}>Trạng thái</th>
              <th className={`${th} text-right`} />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[14px] text-slate-800">
            {rows.map((req) => {
              const meta = STATUS_META[req.status] ?? STATUS_META.cancelled;
              return (
                <tr
                  key={req.id}
                  onClick={() => onOpen(req)}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80"
                >
                  <td className={td}><Person name={req.requesterName} role={req.requesterRole} tag={req.requesterRoleTag} /></td>
                  <td className={td}><Shift shift={req.requesterShift} /></td>
                  <td className={td}><Person name={req.targetEmployeeName} role={req.targetEmployeeRole} tag={req.targetEmployeeRoleTag} /></td>
                  <td className={td}><Shift shift={req.targetShift} /></td>
                  <td className="min-w-[170px] max-w-xs px-2.5 py-3.5 align-middle">
                    <span className="block font-medium">{req.exchangeType === "swap" ? "Hoán đổi 2 ca" : "Nhờ làm thay ca"}</span>
                    <span className="line-clamp-2 text-slate-700" title={req.reason}>{req.reason || "Không ghi lý do."}</span>
                    {req.rejectReason && <span className="block text-[12px] font-medium text-rose-600">Lý do từ chối: {req.rejectReason}</span>}
                    <span className="block text-[12px] text-slate-500">{req.id} • {req.createdAt}</span>
                  </td>
                  <td className={td}>
                    <StatusPill hex={meta.hex} className="w-40 justify-center">{meta.label}</StatusPill>
                    {req.status === "pending_manager" && req.peerRespondedAt && (
                      <span className="mt-1 block text-[12px] text-slate-500">Đồng nghiệp OK {req.peerRespondedAt.split(" ")[1]}</span>
                    )}
                  </td>
                  <td className="px-2.5 py-3.5 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      label={`Thao tác với yêu cầu ${req.id}`}
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
