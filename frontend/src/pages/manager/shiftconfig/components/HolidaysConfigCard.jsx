import { useState } from "react";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { Button } from "../../../../components/FormKit";
import { inputClass } from "../../../../components/PageKit";

export default function HolidaysConfigCard({ holidays = [], onChangeHolidays }) {
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "", multiplier: 1.5 });
  const [holidayError, setHolidayError] = useState("");

  const addHoliday = (e) => {
    e.preventDefault();
    if (!newHoliday.name.trim()) {
      setHolidayError("Vui lòng nhập tên ngày lễ.");
      return;
    }
    if (!newHoliday.date) {
      setHolidayError("Vui lòng chọn ngày lễ.");
      return;
    }
    const mult = Number(newHoliday.multiplier);
    if (isNaN(mult) || mult < 1.0 || mult > 3.0) {
      setHolidayError("Hệ số ngày lễ phải từ 1.0 đến 3.0.");
      return;
    }

    if (holidays.some((h) => h.date === newHoliday.date)) {
      setHolidayError(`Đã có ngày lễ cho ngày ${newHoliday.date}.`);
      return;
    }

    const item = {
      id: `h_${Date.now()}`,
      name: newHoliday.name.trim(),
      date: newHoliday.date,
      multiplier: mult,
    };

    onChangeHolidays([...holidays, item]);
    setNewHoliday({ name: "", date: "", multiplier: 1.5 });
    setHolidayError("");
  };

  const removeHoliday = (id) => {
    onChangeHolidays(holidays.filter((h) => h.id !== id));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <DollarSign size={18} />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">Danh mục ngày lễ & Hệ số lương lễ</h3>
          <p className="text-[13px] text-slate-500">
            Các ca làm việc trong những ngày này sẽ được áp dụng hệ số lương ngày lễ tương ứng khi tính lương (US27).
          </p>
        </div>
      </div>

      {/* Danh sách ngày lễ hiện tại */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-600">
              <th className="rounded-l-md px-3.5 py-2.5">Tên ngày lễ</th>
              <th className="px-3.5 py-2.5">Ngày áp dụng</th>
              <th className="px-3.5 py-2.5">Hệ số lương</th>
              <th className="w-16 rounded-r-md px-3.5 py-2.5 text-right">Xóa</th>
            </tr>
          </thead>
          <tbody>
            {holidays.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500">
                  Chưa có ngày lễ nào được thiết lập.
                </td>
              </tr>
            ) : (
              holidays.map((h, idx) => (
                <tr key={h.id || h.date || idx} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/50">
                  <td className="px-3.5 py-3 font-medium text-slate-900">{h.name}</td>
                  <td className="px-3.5 py-3 tabular-nums text-slate-700">{h.date}</td>
                  <td className="px-3.5 py-3">
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[13px] font-semibold text-amber-800">
                      x{Number(h.multiplier || 1.5).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeHoliday(h.id)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Xóa ngày lễ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form thêm ngày lễ mới */}
      <form onSubmit={addHoliday} className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3.5">
        <div className="mb-2 text-[13px] font-medium text-slate-700">Thêm ngày lễ mới:</div>
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Tên ngày lễ (VD: Tết Dương Lịch)"
            value={newHoliday.name}
            onChange={(e) => {
              setNewHoliday({ ...newHoliday, name: e.target.value });
              setHolidayError("");
            }}
            className={inputClass}
          />
          <input
            type="date"
            value={newHoliday.date}
            onChange={(e) => {
              setNewHoliday({ ...newHoliday, date: e.target.value });
              setHolidayError("");
            }}
            className={inputClass}
          />
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[13px] text-slate-500">Hệ số:</span>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="3.0"
              placeholder="1.5"
              value={newHoliday.multiplier}
              onChange={(e) => {
                setNewHoliday({ ...newHoliday, multiplier: e.target.value });
                setHolidayError("");
              }}
              className={inputClass}
            />
          </div>
          <div className="flex items-center">
            <Button type="submit" size="md" variant="outline" icon={<Plus size={15} />} className="w-full sm:w-auto">
              Thêm ngày lễ
            </Button>
          </div>
        </div>
        {holidayError && <p className="mt-2 text-[13px] font-medium text-rose-600">{holidayError}</p>}
      </form>
    </div>
  );
}
