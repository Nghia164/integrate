import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "../../../../components/FormKit";
import { CATEGORY, initialConstraints, constraintWarnings } from "../shiftConfigData";

// Tab "Ràng buộc": chỉnh nháp, bấm "Lưu cấu hình" mới áp dụng.
// Ràng buộc bắt buộc (cứng) luôn được áp dụng, chỉ chỉnh được giá trị; ràng buộc ưu tiên (mềm) bật/tắt được.

const HINT = {
  hard: "Thuật toán không bao giờ vi phạm các quy tắc này.",
  soft: "Thuật toán cố gắng đáp ứng, nhưng có thể bỏ qua nếu không đủ nhân sự.",
};

// Ràng buộc có giá trị thì phải là số nguyên trong khoảng min–max.
const isValid = (c) => c.value === undefined || (Number.isInteger(c.value) && c.value >= c.min && c.value <= c.max);

function Switch({ checked, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${checked ? "bg-[#0F172A]" : "bg-slate-300"}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

// Mỗi dòng chia 3 cột cố định (mô tả | giá trị | trạng thái) để các dòng thẳng hàng với nhau.
function ConstraintRow({ c, warning, onChange }) {
  const hard = c.category === "hard";
  const bad = c.enabled && !isValid(c);

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="max-w-xl">
        <p className="font-medium text-slate-900">{c.name}</p>
        <p className="mt-0.5 text-[14px] text-slate-600">{c.desc}</p>
      </div>

      {/* Hai cột cố định chiều rộng để mọi dòng thẳng hàng: [ô số + đơn vị] [Luôn áp dụng / công tắc] */}
      <div className="flex items-center gap-4">
        <div className="flex w-40 items-center justify-end gap-2">
          {c.value !== undefined && c.enabled && (
            <>
              <input
                type="number"
                aria-label={c.name}
                min={c.min}
                max={c.max}
                value={c.value}
                onChange={(e) => onChange({ value: e.target.value === "" ? "" : Number(e.target.value) })}
                className={`h-10 w-20 rounded-md border bg-white px-2 text-center text-[15px] font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-[#0F172A]/20 ${bad ? "border-rose-500" : "border-slate-300 focus:border-[#0F172A]"}`}
              />
              <span className="w-16 text-[14px] text-slate-600">{c.unit}</span>
            </>
          )}
        </div>
        <div className="flex w-28 justify-end">
          {hard ? (
            <span className="text-[14px] text-slate-600">Luôn áp dụng</span>
          ) : (
            <Switch checked={c.enabled} label={c.name} onChange={() => onChange({ enabled: !c.enabled })} />
          )}
        </div>
      </div>

      {warning && !bad && <p className="basis-full text-[13px] font-medium text-amber-700">{warning}</p>}
      {bad && <p role="alert" className="basis-full text-[13px] font-medium text-rose-700">Nhập số nguyên từ {c.min} đến {c.max}.</p>}
    </li>
  );
}

// saved = cấu hình đang áp dụng; shifts = danh sách ca (để cảnh báo ràng buộc không hợp với độ dài ca); onSave(draft) báo lên trang cha khi bấm Lưu.
export default function ConstraintsTab({ saved, shifts, onSave }) {
  const [draft, setDraft] = useState(saved);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const invalid = draft.some((c) => c.enabled && !isValid(c));
  const warnings = constraintWarnings(draft, shifts);
  const update = (id, patch) => setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Ràng buộc xếp ca - sau này nạp vào Python OR-Tools (US08 / US10) */}
        <p className="max-w-2xl text-[15px] text-slate-600">
          Các ràng buộc này được nạp vào thuật toán tối ưu OR-Tools mỗi khi tạo lịch tự động.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-[14px] text-slate-700">
            <span className={`h-2.5 w-2.5 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`} />
            {dirty ? "Có thay đổi chưa lưu" : "Đã lưu"}
          </span>
          <Button type="button" variant="outline" size="lg" icon={<RotateCcw size={16} />} onClick={() => setDraft(initialConstraints)}>
            Về mặc định
          </Button>
          <Button type="button" size="lg" icon={<Save size={16} />} disabled={!dirty || invalid} onClick={() => onSave(draft)}>
            Lưu cấu hình
          </Button>
        </div>
      </div>

      {Object.entries(CATEGORY).map(([key, label]) => (
        <section key={key}>
          <h3 className="text-[16px] font-semibold text-slate-900">{label}</h3>
          <p className="mb-1 text-[14px] text-slate-600">{HINT[key]}</p>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {draft.filter((c) => c.category === key).map((c) => (
              <ConstraintRow key={c.id} c={c} warning={warnings[c.id]} onChange={(patch) => update(c.id, patch)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
