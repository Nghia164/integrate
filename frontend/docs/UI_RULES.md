# Quy Chuẩn Giao Diện Hệ Thống (UI Rules) - Chuẩn Duy Nhất 2026

Tài liệu này xác lập quy chuẩn giao diện người dùng duy nhất, nhất quán cho toàn bộ các màn hình của cả **Quản lý (Manager)** và **Nhân viên (Staff)** trong hệ thống Smart Scheduling.

---

## 0. Bảng Màu Chuẩn (Design Tokens)

Toàn bộ ứng dụng sử dụng các biến CSS tập trung tại `src/index.css` (không hard-code mã màu rải rác):

| Biến CSS | Mã màu | Ứng dụng giao diện |
| :--- | :--- | :--- |
| `--navy` | `#0F172A` | Chữ chính, tiêu đề, nút hành động chính (Primary Button), icon chính |
| `--active-bg` | `#CBE3F0` | Nền mục menu đang chọn, tab SubNav/StatusTabs đang chọn, ô chứa icon trang / avatar initials |
| `--highlight` | `#D9E8F5` | Nền thanh "Ca tiếp theo", cột "Hôm nay" trong lịch tuần/tháng, badge vai trò Logo |
| `--page-bg` | `#F4F7F9` | Nền panel nội dung làm việc (thay thế nền xám đậm hoặc gradient) |
| `--shell-bg` | `#F4F7F9` | Nền ngoài cùng khung vỏ ứng dụng (App Shell), đồng nhất với nền gốc web |
| Thẻ / Khung | `#FFFFFF` | Nền trắng, viền mảnh nhạt `border-slate-200/90`, bo góc lớn `rounded-2xl`, bóng rất nhẹ `shadow-2xs` |

### Quy ước màu Ca làm việc (Bảng màu LẠNH, nhạt, thanh nhã)
Mỗi ca gồm các giá trị chuẩn: nền thẻ, viền trái 4px, chữ/chấm (chữ dùng tông đậm cùng họ màu, độ tương phản > 8:1):
- **Ca Sáng**: Nền `#E6F4FA`, viền trái 4px `#2B9FCF`, chữ `#0C3B54`, chấm `#2B9FCF`, badge `#D4EEF9`, ô nhãn hàng `#F5FAFD`.
- **Ca Chiều**: Nền `#E4F5F1`, viền trái 4px `#2A9D8F`, chữ `#0B4A43`, chấm `#2A9D8F`, badge `#D1EFE9`, ô nhãn hàng `#F4FBF9`.
- **Ca Tối**: Nền `#ECEBF8`, viền trái 4px `#5B5BC4`, chữ `#27276B`, chấm `#5B5BC4`, badge `#DFDEF3`, ô nhãn hàng `#F7F7FD`.
- **Ca tùy chỉnh (Manager cấu hình)**: Dùng sắc lạnh nhạt khác (xanh biển `#EDF3FA`, tím nhạt), tuyệt đối không dùng màu nóng.
- **Nguồn chân lý duy nhất (SSOT)**: Tập trung tại `src/shared/shiftColors.js` (`SHIFT_COLORS`, `getShiftColors`). Landing Page, Lịch Staff, Lịch Manager, WeekShiftGrid, Chú thích ca và Modal đều đọc từ file này, không hard-code mã màu ở nơi khác.

### Quy ước màu Trạng thái nghiệp vụ (5 Tone chuẩn)
| Tone | Tailwind Class | Chấm màu | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| **Thành công** (`success`) | `bg-emerald-50 text-emerald-700 border-emerald-200` | `bg-emerald-500` | Tốt, Đúng giờ, Đang làm việc, Rảnh, Đã duyệt, Đã công bố |
| **Cảnh báo** (`warning`) | `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-500` | Chờ duyệt, Cảnh báo, Nghỉ phép, Đi trễ / Về sớm, Thiếu người |
| **Nguy hiểm** (`error`) | `bg-rose-50 text-rose-700 border-rose-200` | `bg-rose-500` | Bận, Vắng mặt, Từ chối, Đã khóa, Lỗi cấu hình |
| **Trung tính** (`neutral`) | `bg-slate-100 text-slate-700 border-slate-200` | `bg-slate-400` | Chưa có, Chưa đăng ký, Bản nháp, Đã hủy |
| **Thông tin** (`info`) | `bg-sky-50 text-sky-700 border-sky-200` | `bg-sky-500` | Sắp tới (Upcoming), Đang xử lý, Thông tin hệ thống |

---

## 1. Font Chữ & Trọng Số Chữ (Typography & Weights)
- **Font chữ chuẩn**: `Be Vietnam Pro` cho 100% giao diện, từ thanh menu, header, nút bấm, bảng biểu cho đến sự kiện bên trong lịch FullCalendar (`font-family: inherit`).
- **Thang cỡ chữ chuẩn**:
  - **Tiêu đề trang (Page Title)**: `text-[22px] font-bold text-[#0F172A] tracking-tight`.
  - **Mô tả trang (Sub-title / Description)**: `text-[13.5px] - text-[14px] font-normal text-slate-500`.
  - **Tiêu đề khối / Card Header**: `text-[16px] font-semibold text-[#0F172A]`.
  - **Nội dung chính / Thân bảng**: `text-[14px] - text-[15px] text-slate-800`.
  - **Nhãn nhỏ / Chú thích / Badge**: `text-[11.5px] - text-[13px] font-medium text-slate-600`.
- **Quy tắc trọng số (Weight Rules) trong Lịch & Thời gian**:
  - **Chữ ngày giờ KHÔNG in đậm**: Tiêu đề cột lịch ("Thứ 2 / 26/10", "Thứ 3 / 27/10"...) dùng `font-normal text-[13.5px] - text-[15px]`, không dùng bold/semibold.
  - Trong thanh "Ca tiếp theo": "Thứ 5, 29/10/2026", "06:00 – 12:00", "Tuần này: 5 ca (28h)" dùng `font-normal`, chỉ tên ca nhỉnh hơn (`font-medium`).
  - Giờ trong ô ca và nhãn "Ca làm việc" cũng mang weight nhẹ (`font-normal`).
  - Chỉ badge "Hôm nay" và tiêu đề trang h1 giữ `font-bold / font-semibold`.

---

## 2. Khung Vỏ Ứng Dụng Cố Định (App Shell Architecture)
- **Bố cục tổng thể (Single Container AppShell)**:
  - Chiều cao đúng 100vh: `h-screen w-screen overflow-hidden`.
  - Nền ngoài cùng là nền gốc toàn hệ thống `--shell-bg: #F4F7F9`, có khoảng đệm quanh mép (`p-2.5 sm:p-3.5 gap-3`).
  - **Menu (Sidebar)**: Khung card trắng bo góc lớn (`rounded-2xl border border-slate-200/90 shadow-sm`), nổi bật độc lập trên nền xanh pastel.
  - **Panel làm việc bên phải**: Khung card bo góc lớn nền `--page-bg: #F4F7F9` (`rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col flex-1 h-full min-w-0`).
  - **Header ở trên**: CỐ ĐỊNH, không cuộn (`h-[64px] shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200/70`).
  - **Vùng nội dung bên dưới**: CUỘN ĐỘC LẬP (`flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6`).
  - Cuộn trang thì menu và header đứng yên; body KHÔNG ĐƯỢC có thanh cuộn.
- **Mobile Responsive**:
  - Menu thu thành drawer mở trượt từ mép trái (`fixed inset-y-2.5 left-2.5 z-50 rounded-2xl w-[270px]`), có lớp phủ mờ (backdrop).
  - Header giữ gọn gàng: nút hamburger, ngày giờ rút gọn, chuông thông báo, avatar initials.

---

## 3. Logo Chuẩn
- **Cấu trúc ô vuông cố định**: Đặt logo trong ô vuông 40x40px (`h-10 w-10 rounded-xl bg-[#CBE3F0] p-1.5 shadow-2xs`), logo hình ảnh bên trong co giãn vừa vặn (`object-contain`).
- **Tên thương hiệu**: "Smart Scheduling" chữ navy `#0F172A` đậm.
- **Badge vai trò**: Nhỏ gọn, nền nhạt `bg-[#D9E8F5] text-[#0F172A] rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold`, căn thẳng hàng ngang với tên ứng dụng.

---

## 4. Tiêu Đề Trang Trong Card Riêng (PageHeader Component)
- **Quy chuẩn bắt buộc**: Tiêu đề trang PHẢI nằm trong 1 card trắng riêng biệt (`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs`), không để trôi nổi trên nền xám.
- **Cấu trúc bên trong Card Tiêu đề**:
  - **Breadcrumb nhỏ phía trên**: Dạng "Nhóm menu / Tên trang" (ví dụ: `Lịch và ca / Lịch của tôi`), chữ xám nhỏ `text-[12px] text-slate-400`, mục cuối cùng in đậm hơn (`font-semibold text-slate-700`).
  - **Icon của trang**: Nằm bên TRÁI tiêu đề, đặt trong 1 ô vuông bo góc `h-11 w-11 rounded-xl bg-[#CBE3F0] text-[#0F172A] shadow-2xs` chứa đúng icon của menu bên trái.
  - **Tiêu đề h1**: `text-[22px] font-bold tracking-tight text-[#0F172A]`.
  - **Mô tả ngắn**: Dòng chữ màu xám `mt-1 text-[13.5px] text-slate-500 font-normal`.
  - **Nút hành động / Bộ chọn kỳ**: Nằm ở góc phải card tiêu đề.
  - **Tab SubNav (nếu có)**: Segmented pill không gạch chân nằm ở hàng dưới.

### 4.1 Quy Tắc Bố Cục Trang Duy Nhất (Single PageCard Architecture)
- **Quy tắc bắt buộc**: "Mọi trang (Staff và Manager) đặt nội dung chính trong MỘT PageCard trắng; tab, thanh công cụ, danh sách, bảng, form nằm trong card đó; chỉ PageHeader và khối thống kê là card riêng bên trên."
- **Cấu trúc phân tầng chuẩn từ trên xuống**:
  1. Card tiêu đề (`PageHeader`): card trắng độc lập chứa breadcrumb, icon, tiêu đề h1, mô tả và nút hành động.
  2. Khối thống kê (`StatStrip` nếu có): lưới các thẻ KPI nhỏ màu trắng độc lập, cách nhau khoảng trống đều `gap-5`.
  3. MỘT khung `PageCard` trắng duy nhất: chứa toàn bộ nội dung thao tác nghiệp vụ (tab trạng thái, thanh tìm kiếm, bộ lọc, lưới dữ liệu, danh sách và form). Tuyệt đối không để tab, danh sách hay form trôi nổi trực tiếp trên nền xám.

---

## 5. Khung Thống Kê & Chỉ Số (StatStrip / KPI Cards)
- **Tách thành Card riêng**: Nằm ở khối riêng biệt, tách rời khỏi card tiêu đề và card nội dung bảng/lịch bằng khoảng trống đều (`gap-5`).
- **Cấu trúc từng thẻ KPI nhỏ**:
  - Card trắng riêng rẽ: `rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3`.
  - Nhãn nhỏ viết hoa: `text-[11.5px] font-semibold uppercase tracking-wider text-slate-500`.
  - Số lớn: `text-[24px] font-bold tabular-nums text-[#0F172A] leading-tight`.
  - Chú thích nhỏ: `text-[12px] font-normal text-slate-500`.
  - Icon: Đặt trong ô vuông bo góc nền `#CBE3F0` ở góc phải card.
  - Bố cục responsive: Xếp 4 cột trên desktop, 2 cột trên tablet/mobile.
- **Khung Thống Kê KPI Trang "Lịch của tôi" (Staff StatStrip)**:
  - 4 thẻ KPI chuẩn thiết kế tối giản Swiss & neo-ambient:
    - Thẻ 1: **Ca tiếp theo** (Tên ca, ngày giờ, đếm ngược còn X giờ/phút hoặc Đang diễn ra, dải footer giờ bắt đầu/kết thúc).
    - Thẻ 2: **Tổng ca tuần này** (Số ca, nhãn Chính thức / Bản nháp, dải footer trạng thái công bố).
    - Thẻ 3: **Giờ làm dự kiến** (Số giờ, % định mức tuần 40h, dải footer chênh lệch định mức +/-).
    - Thẻ 4: **Nghỉ phép tuần này** (Số ngày nghỉ đã duyệt, bảo lưu quyền lợi).
  - Tích hợp dải `it.footer` bo tròn đáy thẻ với nền nhẹ `bg-slate-50/70 border-t border-slate-100/80`.
- **Thanh "Ca tiếp theo" (Trang Lịch của tôi)**:
  - Nền trung tính `#F4F7F9` (hoặc `#EEF4F9`), viền 1px `#D9E8F5`, bo góc lớn `rounded-2xl`, chữ navy `#0F172A`. Không dùng `#D9E8F5` hoặc `#CBE3F0` làm nền cả thanh.
  - Chấm tròn cạnh tên ca dùng đúng màu viền của ca đó (`#2B9FCF`, `#2A9D8F`, `#5B5BC4`).
  - Đặt thành 1 KHỐI RIÊNG độc lập giữa card tiêu đề và card lịch tuần.

---

## 6. Lưới Lịch Tuần (WeekShiftGrid)
- **Cột "Hôm nay"**: Nền trung tính `#F0F6FB`, đầu cột giữ nhãn "Hôm nay" màu navy `#0F172A`.
- **Ô trống trong lịch**: Nền `#FAFBFC`, viền `#E5ECF1`, bỏ dấu "—" ở ô trống.
- **Ô nhãn bên trái mỗi hàng ca**: Nền gần trắng pha màu ca (~40% độ đậm của nền thẻ), không tô đậm cả ô (`#F5FAFD`, `#F4FBF9`, `#F7F7FD`).
- **Ô Ca làm việc**:
  - Chiều cao chuẩn `min-h-[88px] h-[88px] p-2`, giúp nhãn vai trò `roleTag` có khoảng thở và không bị cắt ở đáy ô.
  - Tên ca: `text-[14px] font-medium leading-tight`.
  - Giờ làm việc: `mt-0.5 text-[12.5px] font-normal text-slate-600 tabular-nums`.
  - Tag vai trò: `mt-1 text-[11px] font-normal px-1.5 py-0.5 rounded leading-none`.
- **Không có thanh cuộn lồng nhau**: Toàn bộ ma trận ca tuần hiển thị phẳng, chỉ duy nhất panel chính cuộn dọc.

---

## 7. Trang Giới Thiệu (Landing Page) & Màn Hình Đăng Nhập

### 7.1 Trang Giới Thiệu Công Khai (Landing Page - Route `/`)
- **Đối tượng & Trạng thái**: Công khai, mở cho tất cả người dùng và khách vãng lai khi chưa đăng nhập. Không có nút chọn vai tắt, dùng thử hay vào thẳng.
- **Phong cách thiết kế**: Swiss minimalism kết hợp soft neo-ambient layering, nền `--page-bg: #F4F7F9` thoáng đãng, đồng bộ bảng màu Navy `#0F172A` và pastel `#CBE3F0` / `#D9E8F5`.
- **Cấu trúc màn hình**:
  - **Thanh điều hướng (Header Sticky)**: Logo hệ thống bên trái, liên kết nhảy neo (Tính năng, Quy trình, Phân hệ, Hiệu quả) và nút hành động chính "Đăng nhập" $\rightarrow$ `/login`.
  - **Khối Hero**: Badge nhãn "Nền tảng Quản lý & Xếp lịch ca thông minh 2026", tiêu đề lớn giới thiệu OR-Tools, đổi ca 2 bước và chốt lương bất biến; nút CTA chính "Vào hệ thống đăng nhập" và "Khám phá tính năng".
  - **Mockup ma trận ca tuần trực quan (WeekShiftGrid Preview Card)**: Card trắng nổi bo góc lớn `rounded-3xl` hiển thị lịch mẫu chuẩn hóa 3 ca (Sáng, Chiều, Tối) đúng bảng màu ca.
  - **Dải chỉ số ấn tượng (Key Metrics)**: 4 chỉ số nổi bật (Tiết kiệm 85% thời gian, Hài lòng 98%, Minh bạch 100%, Lập lương < 5 phút).
  - **Lưới tính năng cốt lõi (Core Features)**: 6 thẻ tính năng card trắng viền mảnh với icon navy trong ô `#CBE3F0`.
  - **Quy trình vận hành 4 bước (Workflow Steps)**: Trực quan hóa lộ trình từ khảo sát rảnh/bận $\rightarrow$ thuật toán OR-Tools $\rightarrow$ vận hành đổi ca / ca mở $\rightarrow$ đối soát GPS & chốt sổ lương.
  - **Phân hệ không gian làm việc (Workspaces Showcase)**: So sánh trực quan giữa Không gian Quản lý (Manager) và Không gian Nhân viên (Staff).
  - **Chân trang (Footer)**: Bản quyền Smart Scheduling 2026.

### 7.2 Màn Hình Đăng Nhập Smart Scheduling (Route `/login`)
- **Bố cục 1 card căn giữa (Centered Card)**: Toàn màn hình nền gốc `--page-bg: #F4F7F9`, card trắng bo góc lớn `rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm` nổi ở giữa màn hình trên nền `#F4F7F9`. Phía trên có Top Header với Logo Smart Scheduling chuẩn và liên kết "← Quay lại Trang Chủ" cùng email hỗ trợ.
- **Form đăng nhập chuẩn hóa**:
  - Không phân chia tab vai trò: 1 form duy nhất với Email đăng nhập và Mật khẩu, vai trò do hệ thống tài khoản (`users.role`) quyết định.
  - Ô 1: Email đăng nhập (`name="email"`, `id="email"`, icon `Mail`, placeholder `name@company.com`).
  - Ô 2: Mật khẩu (`name="password"`, `id="password"`, icon `Lock`, nút toggle ẩn/hiện mật khẩu).
  - Checkbox: "Ghi nhớ đăng nhập trên thiết bị này".
  - Nút submit chính nền navy `#0F172A` chữ trắng, bo góc `rounded-xl`, hover `#1E293B`, có trạng thái xoay loading và vô hiệu hóa chống click đúp (`disabled`).
  - Ghi chú hỗ trợ chân card: "Quên mật khẩu? Liên hệ Quản lý để được cấp lại." và "Tài khoản nhân sự mới do Quản lý cấp trực tiếp trong hệ thống."
  - Chân trang (Footer): `© 2026 Smart Scheduling • Đồ án C1SE_57` và email hỗ trợ kỹ thuật `lethanhhien414@gmail.com`.
- **Bảo mật và Xác thực**:
  - Tự động focus vào ô tài khoản khi nạp trang.
  - Client-side validation: để trống hiển thị thông báo lỗi màu đỏ ngay dưới ô nhập liệu (`#account-error`, `#password-error`).
  - Sai tài khoản hoặc mật khẩu: hiển thị banner cảnh báo chung an toàn `"Tài khoản hoặc mật khẩu không đúng."`.
  - Tài khoản nghỉ việc/bị vô hiệu hóa: hiển thị banner riêng `"Tài khoản không còn hoạt động."`.
- **Bảo vệ route hai chiều & Điều hướng thông minh**:
  - Chưa đăng nhập vào route nội bộ $\rightarrow$ chuyển hướng về `/login` kèm `state.from`.
  - Đăng nhập thành công khi có `state.from` hợp lệ $\rightarrow$ tự động đưa người dùng quay lại đúng trang ban đầu yêu cầu (ví dụ `/employees/leave`).
  - Chưa đăng nhập vào `/` $\rightarrow$ hiển thị trang Landing Page công khai.
  - Đã đăng nhập vào `/` hoặc `/login` $\rightarrow$ tự động chuyển tiếp về không gian làm việc tương ứng (`/manager/dashboard` cho Quản lý, `/employees/schedule` cho Nhân viên).
  - Staff cố truy cập `/manager/*` $\rightarrow$ bị chặn và chuyển về `/employees/schedule`.
  - Manager cố truy cập `/employees/*` $\rightarrow$ bị chặn và chuyển về `/manager/dashboard`.
  - Đăng xuất $\rightarrow$ xóa sạch phiên (`localStorage`) và quay trở lại `/login`.

### 7.3 Trang Đổi Ca Trực Nhân Viên (Route `/employees/shift-exchange`)
- **Phong cách thiết kế**: Bố cục Swiss minimalism & soft neo-ambient, đồng bộ nền `--shell-bg: #F4F7F9` và thẻ trắng bo góc `rounded-2xl border border-slate-200/90 shadow-2xs`.
- **Card Tiêu đề (PageHeader)**: Breadcrumb `["Lịch và ca", "Đổi ca"]`, icon `swap` trong ô `#CBE3F0`, tiêu đề `Đổi ca` (khớp menuConfig.js), mô tả ngắn đúng nghiệp vụ: "Gửi yêu cầu hoán đổi ca làm việc cho đồng nghiệp và theo dõi tiến trình phê duyệt của Quản lý.", nút hành động `Lịch sử đổi ca` và `Tạo yêu cầu đổi ca`. Tuyệt đối không dùng nhãn AI trang trí.
- **Dải chỉ số thực tế (StatStrip - 4 Thẻ KPI)**: 4 thẻ riêng biệt cách nhau gap-5, hiển thị số liệu thực tế (Yêu cầu đến cần xử lý, Đang chờ đồng nghiệp, Đang chờ Quản lý duyệt, Đổi ca thành công), không dùng footer văn bản trang trí tĩnh hay hard-code "chi nhánh".
- **MỘT PageCard trắng duy nhất chứa TOÀN BỘ nội dung chính**:
  - Hàng đầu: `StatusTabs` ("Tất cả yêu cầu", "Yêu cầu đến (cần duyệt)", "Yêu cầu của tôi", "Lịch sử đã xong") bên trái, ô `SearchInput` bên phải. Cho phép cuộn riêng trên màn hình nhỏ và co giãn linh hoạt, không gây tràn ngang.
  - Bên dưới (Desktop): 2 cột trong cùng card. Cột trái là danh sách thẻ yêu cầu đổi ca `ShiftExchangeCard` (có đếm số yêu cầu, cuộn trong vùng riêng nếu dài). Cột phải là form "Tạo yêu cầu đổi ca", ngăn cách bằng đường kẻ dọc mảnh `border-l border-slate-200 pl-6`, KHÔNG phải card nổi thứ hai ngoài khung trắng.
  - Mobile (< 1024px): Bố cục xếp dọc, form tạo yêu cầu chuyển thành nút "Tạo yêu cầu đổi ca" mở `Modal` chuẩn hóa.
- **Hộp thoại (Modal)**: Modal tạo yêu cầu đổi ca (trên mobile), Modal từ chối yêu cầu kèm lý do và Modal xác nhận hủy yêu cầu.

---

## 8. Bảng Tổng Hợp Component Dùng Chung

| Thành phần UI | Tên Component | File nguồn | Đặc tả giao diện mới |
| :--- | :--- | :--- | :--- |
| **Trang giới thiệu** | `LandingPage` | `src/pages/login/LandingPage.jsx` | Trang landing công khai tại `/`, phong cách Swiss minimalism, đầy đủ Hero, Features, Workflow, Workspaces, CTA |
| **Trang đăng nhập** | `LoginPage` | `src/pages/login/LoginPage.jsx` | Card trắng giữa màn hình, link về trang giới thiệu, form email/mật khẩu thật |
| **Khung vỏ ứng dụng** | `AppShell` | `src/components/AppShell.jsx` | Cao 100vh cố định, nền `--shell-bg: #DCEBF5`, menu nổi, panel phải cuộn riêng |
| **Đầu trang card riêng** | `PageHeader` | `src/components/PageKit.jsx` | Card trắng `rounded-2xl`, breadcrumb nhỏ, icon trong ô `#CBE3F0`, tiêu đề 22px |
| **Khung trang chia khối** | `PageCard` | `src/components/PageKit.jsx` | Tự động phân tách PageHeader, Stats và Content thành các Card riêng với `gap-5` |
| **Khung chỉ số KPI** | `StatStrip` | `src/components/PageKit.jsx` | Lưới các card nhỏ trắng riêng rẽ `rounded-2xl`, nhãn uppercase, icon trong ô `#CBE3F0` |
| **Tab điều hướng** | `SubNav` | `src/components/PageKit.jsx` | Segmented pill không gạch chân: active nền `#CBE3F0` chữ `#0F172A` |
| **Thanh công cụ** | `Toolbar` | `src/components/PageKit.jsx` | Hàng ngang chứa tìm kiếm bo tròn, lọc dropdown bo `rounded-xl` |
| **Tab đếm trạng thái** | `StatusTabs` | `src/components/StatusTabs.jsx` | Tab active nền `#CBE3F0`, chữ `#0F172A`, bo `rounded-xl` |
| **Nút bấm** | `Button` | `src/components/Button.jsx` | Primary nền `#0F172A` chữ trắng hover `#1E293B`, bo `rounded-xl` |
| **Bảng dữ liệu** | `Table` | `src/components/Table.jsx` | Bo góc lớn `rounded-2xl border-slate-200/90`, bóng `shadow-2xs` |
| **Lưới lịch tuần** | `WeekShiftGrid` | `src/shared/WeekShiftGrid.jsx` | Cột hôm nay `#D9E8F5`, ô ca cao 88px, chữ ngày giờ font-normal |
| **Hộp thoại** | `Modal` | `src/components/Modal.jsx` | Bo góc `rounded-2xl`, nút đóng tròn, tiêu đề `#0F172A` |
| **Ảnh đại diện** | `Avatar` | `src/components/TableKit.jsx` | Vòng tròn chữ cái đầu (initials) nền `#CBE3F0`, chữ `#0F172A` font-bold |
| **Nhãn trạng thái** | `StatusBadge` | `src/components/TableKit.jsx` | Bo tròn kèm chấm màu theo chuẩn 5 tone |
| **Logo chuẩn** | `Logo` | `src/components/Logo.jsx` | Ô vuông 40x40px nền `#CBE3F0`, chữ navy `#0F172A`, badge vai trò `#D9E8F5` |
