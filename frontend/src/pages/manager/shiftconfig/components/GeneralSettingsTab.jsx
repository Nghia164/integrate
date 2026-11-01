import { useState } from "react";
import { Calendar, Clock, RotateCcw, Save } from "lucide-react";
import { Button } from "../../../../components/FormKit";
import { Field, inputClass } from "../../../../components/PageKit";
import { initialGeneralSettings } from "../shiftConfigData";
import HolidaysConfigCard from "./HolidaysConfigCard";

const DEADLINE_DAYS = [
  { value: "thursday", label: "Thứ Năm (trước tuần làm việc)" },
  { value: "friday", label: "Thứ Sáu (trước tuần làm việc)" },
  { value: "saturday", label: "Thứ Bảy (trước tuần làm việc)" },
  { value: "sunday", label: "Chủ Nhật (trước tuần làm việc)" },
];

export default function GeneralSettingsTab({ saved, onSave }) {
  const [settings, setSettings] = useState(saved || initialGeneralSettings);
  const [dirty, setDirty] = useState(false);

  const update = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleReset = () => {
    setSettings(initialGeneralSettings);
    setDirty(true);
  };

  const handleSave = () => {
    onSave(settings);
    setDirty(false);
  };

  return (
    <div className="space-y-6 pt-1">
      {/* 1. Hạn chót đăng ký lịch rảnh */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CBE3F0] text-[#0F172A]">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">Hạn chót đăng ký lịch rảnh & nguyện vọng</h3>
            <p className="text-[13px] text-slate-500">
              Thời hạn tối đa để nhân viên nộp đăng ký thời gian rảnh trước khi quản lý chốt lịch tuần mới.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ngày trong tuần">
            <select
              value={settings.availabilityDeadlineDay || "friday"}
              onChange={(e) => update("availabilityDeadlineDay", e.target.value)}
              className={inputClass}
            >
              {DEADLINE_DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Giờ chót nộp">
            <input
              type="time"
              value={settings.availabilityDeadlineTime || "23:59"}
              onChange={(e) => update("availabilityDeadlineTime", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* 2. Ân hạn chấm công */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">Thời gian ân hạn chấm công</h3>
            <p className="text-[13px] text-slate-500">
              Số phút cho phép nhân viên check-in trễ hoặc check-out sớm mà không bị tính vi phạm.
            </p>
          </div>
        </div>

        <div className="max-w-xs">
          <Field label="Số phút ân hạn (0 – 30 phút)">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="30"
                value={settings.gracePeriodMin ?? 5}
                onChange={(e) => update("gracePeriodMin", Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
                className={inputClass}
              />
              <span className="shrink-0 text-[14px] font-medium text-slate-600">phút</span>
            </div>
          </Field>
        </div>
        <p className="mt-2 text-[13px] text-slate-500">
          Mặc định hệ thống là 5 phút. Ví dụ ca 06:00, nhân viên check-in lúc 06:05 vẫn được coi là đúng giờ (On-Time).
        </p>
      </div>

      {/* 3. Danh sách ngày lễ & Hệ số lương */}
      <HolidaysConfigCard
        holidays={settings.holidays || []}
        onChangeHolidays={(hols) => update("holidays", hols)}
      />

      {/* Thanh hành động lưu */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <Button type="button" variant="outline" size="lg" icon={<RotateCcw size={16} />} onClick={handleReset}>
          Đặt lại mặc định
        </Button>
        <Button
          type="button"
          size="lg"
          icon={<Save size={16} />}
          disabled={!dirty}
          onClick={handleSave}
        >
          Lưu cấu hình chung
        </Button>
      </div>
    </div>
  );
}
