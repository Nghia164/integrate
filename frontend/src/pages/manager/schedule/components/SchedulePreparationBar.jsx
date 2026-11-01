import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { NoticeBar } from "../../../../components/NoticeKit";

import { getWeeklyStaffAvailability } from "../../../../services/availabilityService";
import { useLiveData } from "../../../../lib/hooks";


export default function SchedulePreparationBar({ weekMonday, fallbackCount = 5 }) {
  const [syncKey, setSyncKey] = useState(0);
  useLiveData(() => {
    setSyncKey((k) => k + 1);
  });

  const prep = useMemo(() => {
    // Đọc syncKey để làm mới khi kho dữ liệu cập nhật
    if (syncKey < 0) return null;
    return getWeeklyStaffAvailability(weekMonday);
  }, [weekMonday, syncKey]);
  const total = prep?.summary?.totalEmployees || fallbackCount;
  const registered = prep?.summary?.registeredCount || 0;
  const unregistered = prep?.summary?.unregisteredCount || 0;

  return (
    <NoticeBar
      label="Tình trạng chuẩn bị"
      message={`${total} nhân viên đang làm việc · ${registered}/${total} đã gửi lịch rảnh${
        unregistered > 0 ? ` (${unregistered} chưa đăng ký)` : ""
      }`}
      badgeTone={unregistered > 0 ? "warning" : "success"}
      badge={unregistered > 0 ? `${unregistered} chưa nộp` : "Đủ lịch"}
      action={
        <Link
          to={weekMonday ? `/manager/availability?week=${weekMonday}` : "/manager/availability"}
          className="font-semibold text-[#0F172A] underline underline-offset-2 hover:text-slate-600"
        >
          Xem khả năng làm việc
        </Link>
      }
    />
  );
}

