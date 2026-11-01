/**
 * File: src/pages/login/LandingPage.jsx
 * Tầng: Giới thiệu & Điều hướng công khai (Public Landing Page)
 * Chức năng: Giới thiệu hệ thống Smart Scheduling trước khi đăng nhập.
 * Thiết kế: Swiss minimalism kết hợp soft neo-ambient layering:
 *   - Bảng màu: Navy #0F172A, Active #CBE3F0, Highlight #D9E8F5, Page #F4F7F9, Shell #DCEBF5
 *   - Font: Be Vietnam Pro
 *   - Bo góc mềm mại rounded-2xl / rounded-3xl, hairline border border-slate-200/90, shadow-2xs
 *   - Chuyển hướng: Nút "Đăng nhập" dẫn tới /login, đã đăng nhập thì tự chuyển về khu vực theo vai trò
 */

import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Cpu,
  DollarSign,
  Bot,
  ArrowLeftRight,
  UserPlus,
  Sparkles,
  MapPin,
  Lock,
  Check,
} from "lucide-react";
import { Logo } from "../../components/NoticeKit";
import { Button } from "../../components/FormKit";

import { SHIFT_COLORS } from "../../lib/shiftColors";


const FONT = '"Be Vietnam Pro", ui-sans-serif, system-ui, "Segoe UI", sans-serif';

// =============================================================================
// DỮ LIỆU CẤU HÌNH LANDING PAGE (KHAI BÁO MẢNG ĐẦU FILE VÀ MAP RA)
// =============================================================================

// 1. Số liệu ấn tượng (Key Metrics)
const KEY_STATS = [
  {
    value: "85%",
    label: "TIẾT KIỆM THỜI GIAN",
    desc: "Cắt giảm thời gian lập lịch so với bảng tính Excel thủ công",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    value: "98%",
    label: "HÀI LÒNG VỀ CA LÀM",
    desc: "Nhân viên chủ động đăng ký rảnh/bận và hoán đổi ca minh bạch",
    icon: <Users className="w-5 h-5" />,
  },
  {
    value: "100%",
    label: "MINH BẠCH ĐỐI SOÁT",
    desc: "Chấm công GPS bán kính cửa hàng, chống gian lận và lỗi quên checkout",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    value: "< 5 phút",
    label: "TỔNG HỢP BẢNG LƯƠNG",
    desc: "Tự động liên thông số giờ thực tế, hệ số ca đêm và thưởng ca mở",
    icon: <DollarSign className="w-5 h-5" />,
  },
];

// 2. Tính năng cốt lõi (Core Features)
const CORE_FEATURES = [
  {
    icon: <Cpu className="w-6 h-6" />,
    badge: "Công nghệ lõi",
    title: "Xếp lịch tự động bằng OR-Tools",
    desc: "Thuật toán tối ưu hóa ràng buộc của Google: đảm bảo định biên theo vai trò, tôn trọng thời gian rảnh/bận và khoảng nghỉ tối thiểu 12h theo Bộ luật Lao động.",
  },
  {
    icon: <ArrowLeftRight className="w-6 h-6" />,
    badge: "Quy trình 2 bước",
    title: "Hoán đổi ca làm an toàn",
    desc: "Cơ chế đổi ca 2 bước: đồng nghiệp chấp thuận trước, Quản lý phê duyệt sau. Tự động kiểm tra không trùng ca và không cho đổi ca trong kỳ lương đã chốt.",
  },
  {
    icon: <UserPlus className="w-6 h-6" />,
    badge: "Chợ ca linh hoạt",
    title: "Chợ ca trực mở (Open Shifts)",
    desc: "Tự động phát hiện các vị trí còn thiếu người, phát hành ca mở kèm tiền thưởng khuyến khích. Nhân viên đủ điều kiện tự do nhận ca theo nguyên tắc đến trước được trước.",
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    badge: "Định vị chuẩn xác",
    title: "Chấm công GPS & Missing-Checkout",
    desc: "Check-in/Check-out thời gian thực dựa trên bán kính cho phép của cửa hàng. Tự động gắn cờ Missing-Checkout nếu quên điểm danh ra về, không tính khống giờ làm.",
  },
  {
    icon: <Lock className="w-6 h-6" />,
    badge: "Minh bạch tài chính",
    title: "Bảng lương & Chốt sổ bất biến",
    desc: "Tính lương động theo giờ thực tế đã đối soát và hệ số ca. Hỗ trợ Quản lý chốt sổ kỳ lương, lưu trữ bản chụp dữ liệu (Snapshot) bất biến chống sửa đổi hồi tố.",
  },
  {
    icon: <Bot className="w-6 h-6" />,
    badge: "Trợ lý AI",
    title: "Trợ lý thông minh hỗ trợ vận hành",
    desc: "Hỏi đáp tự nhiên về tình hình ca trực, tỷ lệ đi trễ, phân tích nhân sự vắng mặt và gợi ý điều phối nhân sự trực thay tức thì khi có biến động đột xuất.",
  },
];

// 3. Quy trình vận hành 4 bước khép kín (Workflow Steps)
const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Khảo sát khả năng làm việc",
    desc: "Nhân viên gửi ma trận ca rảnh/bận cho tuần kế tiếp trước hạn chót Thứ Sáu 23:59:59. Hệ thống khóa nộp tự động khi hết hạn.",
    tag: "Staff Portal",
  },
  {
    step: "02",
    title: "Tạo lịch bằng OR-Tools",
    desc: "Quản lý thiết lập định biên số lượng cho từng ca, kích hoạt thuật toán OR-Tools sinh phương án lịch tối ưu trong vài giây và công bố chính thức.",
    tag: "Manager Portal",
  },
  {
    step: "03",
    title: "Điều phối & Vận hành ca",
    desc: "Nhân viên xem ca làm việc trên lịch cá nhân, chủ động tạo yêu cầu đổi ca với đồng nghiệp hoặc nhận ca trực mở có thưởng khi phát sinh thiếu người.",
    tag: "Staff Portal",
  },
  {
    step: "04",
    title: "Chấm công & Chốt sổ lương",
    desc: "Điểm danh GPS tại quán, đối soát giờ vào - ra thực tế, điều chỉnh sai sót có lưu vết lịch sử và tự động kết xuất bảng lương chi tiết.",
    tag: "Manager Portal",
  },
];

// 4. Hai phân hệ Workspace chuyên biệt
const ROLES_SHOWCASE = [
  {
    role: "Quản lý cửa hàng (Manager)",
    badge: "Điều hành & Phê duyệt",
    accent: "bg-[#0F172A] text-white",
    desc: "Toàn quyền cấu hình định biên, tự động hóa xếp lịch, giám sát kỷ luật lao động và phê duyệt chi phí vận hành.",
    highlights: [
      "Dashboard điều hành với biểu đồ giờ làm & chi phí lương",
      "Cấu hình ca mẫu (Sáng, Chiều, Tối), hệ số ca & ràng buộc BLLĐ",
      "Xếp lịch tự động bằng thuật toán OR-Tools chuẩn hóa",
      "Phê duyệt đơn xin nghỉ & xem xét AI gợi ý người trực thay",
      "Kiểm duyệt đổi ca 2 bước và quản lý ca trực mở (Open Shifts)",
      "Đối soát chấm công, điều chỉnh giờ có lịch sử kiểm toán",
      "Chốt sổ kỳ lương, khóa chỉnh sửa và xuất báo cáo Excel",
    ],
  },
  {
    role: "Nhân viên (Staff)",
    badge: "Chủ động & Linh hoạt",
    accent: "bg-[#CBE3F0] text-[#0F172A]",
    desc: "Giao diện tinh gọn, dễ sử dụng trên cả điện thoại và máy tính, giúp nhân viên luôn làm chủ thời gian biểu của mình.",
    highlights: [
      "Xem lịch cá nhân trực quan theo tuần, ngày, tháng",
      "Thanh 'Ca tiếp theo' đếm ngược giờ và thông báo ca sắp tới",
      "Đăng ký rảnh/bận 7 ngày x 3 ca tuần tới trước hạn chót",
      "Tự do tạo và phản hồi yêu cầu đổi ca với đồng nghiệp",
      "Nhận thêm ca trực mở để gia tăng thu nhập và nhận tiền thưởng",
      "Gửi đơn xin nghỉ phép đột xuất kèm lý do minh bạch",
      "Chấm công GPS bán kính an toàn kèm đồng hồ thời gian thực",
    ],
  },
];

// =============================================================================
// MAIN COMPONENT: LANDING PAGE
// =============================================================================
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-[#F4F7F9] text-[#0F172A] selection:bg-[#CBE3F0] selection:text-[#0F172A]"
      style={{ fontFamily: FONT }}
    >
      {/* ===================================================================== */}
      {/* 1. THANH ĐẦU TRANG (STICKY NAVBAR)                                    */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 h-[72px] border-b border-slate-200/80 bg-white/85 px-4 sm:px-8 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="outline-none">
            <Logo />
          </Link>

          {/* Liên kết điều hướng nhanh trên máy tính */}
          <nav className="hidden md:flex items-center gap-7 text-[14px] font-medium text-slate-600">
            <a href="#features" className="hover:text-[#0F172A] transition-colors">
              Tính năng
            </a>
            <a href="#workflow" className="hover:text-[#0F172A] transition-colors">
              Quy trình
            </a>
            <a href="#roles" className="hover:text-[#0F172A] transition-colors">
              Phân hệ
            </a>
            <a href="#stats" className="hover:text-[#0F172A] transition-colors">
              Hiệu quả
            </a>
          </nav>

          {/* Nút đăng nhập */}
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/login")}
              className="px-5 font-semibold"
            >
              <span>Đăng nhập</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. HERO SECTION                                                       */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#DCEBF5] via-[#E8F1F5]/60 to-[#F4F7F9] pt-14 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C5DCF0] bg-white/80 px-4 py-1.5 text-[13px] font-medium text-[#0F172A] shadow-2xs backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-[#0F172A]" />
            <span>Nền tảng Quản lý & Xếp lịch ca thông minh 2026</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto mt-6 max-w-4xl text-[36px] font-bold tracking-tight text-[#0F172A] leading-[1.18] sm:text-[54px]">
            Tự động hóa xếp ca, đối soát chấm công & tính lương chính xác từng phút
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-[16px] sm:text-[18px] font-normal leading-relaxed text-slate-600">
            Ứng dụng thuật toán tối ưu hóa OR-Tools, kết nối thông suốt hai chiều giữa Quản lý và Nhân viên:
            từ đăng ký rảnh/bận, đổi ca 2 bước đến đối soát GPS và chốt bảng lương bất biến.
          </p>

          {/* CTA Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/login")}
              className="px-7 py-3 text-[15px] font-semibold shadow-sm"
            >
              <span>Vào hệ thống đăng nhập</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <a
              href="#features"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[15px] font-medium text-[#0F172A] shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98]"
            >
              <span>Khám phá tính năng</span>
            </a>
          </div>

          {/* ================================================================= */}
          {/* MOCK SHOWCASE PREVIEW (MÔ PHỎNG GIAO DIỆN CHUẨN XÁC)               */}
          {/* ================================================================= */}
          <div className="mx-auto mt-14 max-w-5xl text-left">
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xl">
              {/* Thanh tiêu đề mini của thẻ mô phỏng */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#CBE3F0] text-[#0F172A] shadow-2xs">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#0F172A]">Lịch làm việc chuẩn hóa tuần</h3>
                    <p className="text-[12.5px] text-slate-500">Áp dụng thuật toán OR-Tools định biên tự động</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                    ● Đã công bố
                  </span>
                  <span className="rounded-full bg-[#D9E8F5] px-3 py-1 text-[12px] font-semibold text-[#0F172A]">
                    Lấp ca: 98%
                  </span>
                </div>
              </div>

              {/* Lưới ca mô phỏng trực quan */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Ca Sáng */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: SHIFT_COLORS.morning.bg,
                    borderColor: SHIFT_COLORS.morning.border,
                    borderLeftWidth: "4px",
                    borderLeftColor: SHIFT_COLORS.morning.dot,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold" style={{ color: SHIFT_COLORS.morning.text }}>
                      Ca Sáng
                    </span>
                    <span className="text-[12px] font-medium text-slate-600 tabular-nums">06:00 – 12:00</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="rounded px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: SHIFT_COLORS.morning.badgeBg,
                        color: SHIFT_COLORS.morning.badgeText,
                      }}
                    >
                      2/2 Nhân sự
                    </span>
                    <span className="text-[12px] text-slate-600">Đã đủ quân</span>
                  </div>
                </div>

                {/* Ca Chiều */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: SHIFT_COLORS.afternoon.bg,
                    borderColor: SHIFT_COLORS.afternoon.border,
                    borderLeftWidth: "4px",
                    borderLeftColor: SHIFT_COLORS.afternoon.dot,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold" style={{ color: SHIFT_COLORS.afternoon.text }}>
                      Ca Chiều
                    </span>
                    <span className="text-[12px] font-medium text-slate-600 tabular-nums">12:00 – 17:00</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="rounded px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: SHIFT_COLORS.afternoon.badgeBg,
                        color: SHIFT_COLORS.afternoon.badgeText,
                      }}
                    >
                      2/2 Nhân sự
                    </span>
                    <span className="text-[12px] text-slate-600">Đã đủ quân</span>
                  </div>
                </div>

                {/* Ca Tối */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: SHIFT_COLORS.evening.bg,
                    borderColor: SHIFT_COLORS.evening.border,
                    borderLeftWidth: "4px",
                    borderLeftColor: SHIFT_COLORS.evening.dot,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold" style={{ color: SHIFT_COLORS.evening.text }}>
                      Ca Tối
                    </span>
                    <span className="text-[12px] font-medium text-slate-600 tabular-nums">17:00 – 22:00</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="rounded px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: SHIFT_COLORS.evening.badgeBg,
                        color: SHIFT_COLORS.evening.badgeText,
                      }}
                    >
                      1/1 Quản lý ca
                    </span>
                    <span className="text-[12px] text-slate-600">Hệ số x1.2</span>
                  </div>
                </div>
              </div>

              {/* Dải thông tin bổ trợ phía dưới thẻ demo */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 text-[13px] text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Tuân thủ tối thiểu 12 giờ nghỉ giữa 2 ca liên tiếp</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-600" />
                  <span>Đồng bộ tức thì với cổng chấm công GPS nhân viên</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. DẢI SỐ LIỆU ẤN TƯỢNG (KEY METRICS / STAT STRIP)                     */}
      {/* ===================================================================== */}
      <section id="stats" className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KEY_STATS.map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </p>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#CBE3F0] text-[#0F172A] shadow-2xs">
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <p className="text-[32px] font-bold tabular-nums text-[#0F172A] leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[13px] text-slate-500 leading-snug">
                    {stat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. TÍNH NĂNG CỐT LÕI (CORE FEATURES)                                  */}
      {/* ===================================================================== */}
      <section id="features" className="py-16 sm:py-24 bg-[var(--page-bg,#F4F7F9)] border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
              GIẢI PHÁP VẬN HÀNH TOÀN DIỆN
            </span>
            <h2 className="mt-2 text-[28px] sm:text-[36px] font-bold tracking-tight text-[#0F172A]">
              Các tính năng cốt lõi của Smart Scheduling
            </h2>
            <p className="mt-3 text-[15px] text-slate-600">
              Được thiết kế dựa trên các bài toán thực tiễn phức tạp của mô hình chuỗi bán lẻ và dịch vụ ăn uống F&B.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_FEATURES.map((item, idx) => (
              <div
                key={idx}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-[#F4F7F9]/50 p-6 shadow-2xs transition-all hover:bg-white hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#CBE3F0] text-[#0F172A] shadow-2xs transition-transform group-hover:scale-105">
                      {item.icon}
                    </div>
                    <span className="rounded-full bg-[#D9E8F5] px-2.5 py-0.5 text-[11px] font-semibold text-[#0F172A]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-[18px] font-bold text-[#0F172A]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. QUY TRÌNH VẬN HÀNH 4 BƯỚC (WORKFLOW)                               */}
      {/* ===================================================================== */}
      <section id="workflow" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
              VÒNG LẶP LIÊN THÔNG DỮ LIỆU
            </span>
            <h2 className="mt-2 text-[28px] sm:text-[36px] font-bold tracking-tight text-[#0F172A]">
              Quy trình làm việc 4 bước khép kín
            </h2>
            <p className="mt-3 text-[15px] text-slate-600">
              Từ khảo sát nguyện vọng đến khi kết xuất bảng lương, mọi dữ liệu đều tự động và minh bạch.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[28px] font-bold tabular-nums text-slate-300">
                      {step.step}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {step.tag}
                    </span>
                  </div>

                  <h3 className="mt-4 text-[17px] font-bold text-[#0F172A]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-[12px] font-semibold text-slate-500">
                  <span>Bước {idx + 1} của quy trình</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. PHÂN HỆ VAI TRÒ (ROLES SHOWCASE: MANAGER & STAFF)                   */}
      {/* ===================================================================== */}
      <section id="roles" className="py-16 sm:py-24 bg-[var(--page-bg,#F4F7F9)] border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
              KHÔNG GIAN LÀM VIỆC CHUYÊN BIỆT
            </span>
            <h2 className="mt-2 text-[28px] sm:text-[36px] font-bold tracking-tight text-[#0F172A]">
              Hai phân hệ độc lập cho Quản lý & Nhân viên
            </h2>
            <p className="mt-3 text-[15px] text-slate-600">
              Mỗi vai trò đều có không gian làm việc chuyên biệt, an toàn và tối ưu cho công việc hàng ngày.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {ROLES_SHOWCASE.map((role, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200/90 bg-[#F4F7F9]/50 p-7 sm:p-9 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${role.accent}`}>
                      {role.badge}
                    </span>
                    <span className="text-[12.5px] text-slate-400 font-medium">Bảo mật đa tầng</span>
                  </div>

                  <h3 className="mt-4 text-[22px] font-bold text-[#0F172A]">
                    {role.role}
                  </h3>
                  <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
                    {role.desc}
                  </p>

                  <div className="mt-6 space-y-3">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Chức năng chính:
                    </p>
                    <ul className="space-y-2.5">
                      {role.highlights.map((item, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2.5 text-[13.5px] text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-[#0F172A] mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate("/login")}
                    className="w-full justify-center text-[14px] font-semibold"
                  >
                    <span>Truy cập cổng {idx === 0 ? "Quản lý" : "Nhân viên"}</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. CTA BANNER (KÊU GỌI HÀNH ĐỘNG)                                     */}
      {/* ===================================================================== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="rounded-3xl bg-[#0F172A] p-8 sm:p-14 text-white text-center shadow-xl">
            <h2 className="text-[28px] sm:text-[40px] font-bold tracking-tight leading-tight">
              Sẵn sàng tối ưu hóa lịch làm việc cho cửa hàng của bạn?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] sm:text-[17px] text-slate-300 font-normal">
              Đăng nhập ngay để bắt đầu sử dụng toàn bộ tính năng xếp lịch OR-Tools, đổi ca hai bước,
              chấm công GPS và bảng lương tự động.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-white text-[#0F172A] hover:bg-slate-100 px-8 py-3.5 text-[15.5px] font-bold rounded-xl shadow-md"
              >
                <span>Đăng nhập hệ thống ngay</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. FOOTER                                                             */}
      {/* ===================================================================== */}
      <footer className="border-t border-slate-200/80 bg-[var(--page-bg,#F4F7F9)] py-10 px-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <Logo />
          <p className="text-[13px] text-slate-500">
            © 2026 Smart Scheduling System. Nền tảng xếp lịch thông minh cho chuỗi bán lẻ & F&B.
          </p>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-600">
            <Link to="/login" className="hover:text-[#0F172A] transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
