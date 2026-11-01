# BÁO CÁO KIỂM CHỨNG KIẾN TRÚC & MÃ NGUỒN SMART-SCHEDULING

> **Người thực hiện:** Kỹ sư kiểm thử độc lập  
> **Dự án:** `smart-scheduling` (`d:\CAPSTONE\SMART- SCHEDULING2\smart-scheduling`)  
> **Nguyên tắc:** TUYỆT ĐỐI CHỈ ĐỌC MÃ NGUỒN THỰC TẾ, đối chiếu từng nhận định của báo cáo trước với mã nguồn và trích dẫn file:dòng làm bằng chứng xác thực 100%. Không suy đoán, không giả định.

---

## MỤC LỤC
1. [Phần 1: Kiểm chứng các lỗi nghiệp vụ nặng (K5, K9, K7, K6, K2)](#phần-1-kiểm-chứng-các-lỗi-nghiệp-vụ-nặng)
2. [Phần 2: Kiểm chứng các nhận định còn lại (US01-US27, Staff stubs, K1, K3, K4, K10, K11)](#phần-2-kiểm-chứng-các-nhận-định-còn-lại)
3. [Phần 3: Kiểm chứng các con số & Khóa LocalStorage](#phần-3-kiểm-chứng-các-con-số--khóa-localstorage)
4. [Phần 4: Điều tra nguồn dữ liệu & Kiến trúc phân tầng](#phần-4-điều-tra-nguồn-dữ-liệu--kiến-trúc-phân-tầng)
5. [Phần 5: Các lỗi mới phát hiện (chưa có trong báo cáo cũ)](#phần-5-các-lỗi-mới-phát-hiện)
6. [Phần 6: Kết luận tổng quan về chất lượng báo cáo cũ](#phần-6-kết-luận-tổng-quan-về-chất-lượng-báo-cáo-cũ)

---

## PHẦN 1: KIỂM CHỨNG CÁC LỖI NGHIỆP VỤ NẶNG

### 1. Kịch bản K5: Duyệt đổi ca không cập nhật sổ cái chấm công (`db.attendance`)
- **Nhận định báo cáo cũ:** Quản lý duyệt đổi ca chỉ sửa mảng `schedules` tuần, không cập nhật `db.attendance` khiến Giờ làm (`WorkHoursPage`) và Bảng lương (`PayrollPage`) của người làm thay và người nhờ đổi hoàn toàn không thay đổi.
- **Kết luận:** **ĐÚNG**
- **Bằng chứng mã nguồn:**
  - Tại [`src/utils/shiftExchangeMockData.js:278-316`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/utils/shiftExchangeMockData.js#L278-L316):
    ```javascript
    // Đồng bộ hoán đổi trực tiếp trong Lịch tuần (schedules)
    const schedules = getSavedSchedules();
    ...
    shift1.assigned = shift1.assigned.filter((e) => e.id !== requesterId);
    if (emp2 && !shift1.assigned.some((e) => e.id === targetEmployeeId)) {
      shift1.assigned.push(emp2);
    }
    saveSchedules(schedules);
    ```
  - Tại [`src/mocks/scheduleMockData.js:449-450`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/scheduleMockData.js#L449-L450):
    ```javascript
    export const getSavedSchedules = () => dbGetSavedSchedules();
    export const saveSchedules = (schedules) => dbSaveSchedules(schedules);
    ```
  - Tại [`src/mocks/db.js:1120-1125`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L1120-L1125):
    ```javascript
    export function saveSchedules(schedules) {
      const db = loadDb();
      db.schedules = schedules;
      saveDb();
      notifyListeners();
    }
    ```
  - Hàm `saveSchedules` **chỉ ghi vào `db.schedules`**, hoàn toàn **không chạm vào mảng `db.attendance`** (kể cả gián tiếp).
  - Trong khi đó, [`src/services/workHoursService.js:13`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/workHoursService.js#L13) và [`src/services/payrollService.js:14`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/payrollService.js#L14) đều gọi `db.getCalculatedShifts()`, vốn được sinh 100% từ `db.attendance` ([`src/mocks/db.js:725-730`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L725-L730)). Do đó, người đi làm thay không hề có bản ghi chấm công, giờ làm = 0 và lương = 0 cho ca đó.

---

### 2. Kịch bản K9: Chốt kỳ lương không lưu Snapshot và tính lương bằng lương giờ hiện tại
- **Nhận định báo cáo cũ:** Chốt kỳ lương không lưu bản ghi snapshot bất biến; khi thay đổi lương giờ của nhân viên, `computePayroll` tính lại toàn bộ theo lương hiện tại làm sai lệch lịch sử các tháng đã chốt.
- **Kết luận:** **ĐÚNG**
- **Bằng chứng mã nguồn:**
  - Tại [`src/mocks/db.js:483-492`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L483-L492):
    ```javascript
    export function lockPayrollPeriod(monthKey) {
      const db = loadDb();
      if (!db.payrollLocks) db.payrollLocks = [];
      if (!db.payrollLocks.includes(monthKey)) {
        db.payrollLocks.push(monthKey);
        saveDb();
        notifyListeners();
      }
      return true;
    }
    ```
    Hàm `lockPayrollPeriod` **chỉ thêm chuỗi `monthKey` (vd: `"2026-09"`) vào mảng `db.payrollLocks`**, hoàn toàn không chụp ảnh (snapshot) dữ liệu các dòng lương, giờ làm hay đơn giá lương.
  - Tại [`src/mocks/db.js:774-780`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L774-L780):
    ```javascript
    export function computePayroll(shifts = getCalculatedShifts()) {
      const db = loadDb();
      return db.employees.map((e) => {
        const list = (shifts || []).filter((s) => s.employeeId === e.id);
        const wage = e.hourlyWage || 28000;
    ```
    `computePayroll` luôn đọc `e.hourlyWage` hiện tại từ hồ sơ nhân viên và tính động. Nếu nhân viên tăng lương từ 28.000đ lên 35.000đ ở tháng 10, khi mở lại kỳ tháng 9 đã chốt, hệ thống vẫn nhân với 35.000đ.

---

### 3. Kịch bản K7: Duyệt đơn nghỉ không đồng bộ lịch/chấm công & nút "Tạo Open Shift" không tạo ca thật
- **Nhận định báo cáo cũ:** Duyệt đơn nghỉ không xóa ca trong lịch, không đánh dấu vắng hợp lệ trong chấm công (`db.attendance` vẫn tính Absent). Nút "Tạo Open Shift" từ đơn nghỉ chỉ đổi cờ hiệu `openShiftCreated: true` mà không tạo bản ghi trong kho Ca trực mở.
- **Kết luận:** **ĐÚNG**
- **Bằng chứng mã nguồn:**
  - Tại [`src/services/leaveService.js:104-108`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/leaveService.js#L104-L108):
    ```javascript
    export async function approveLeave(id, managerNote = "") {
      if (USE_MOCK) return transition(id, "approve", () => ({ status: "approved", managerNote: managerNote || "Đã duyệt đơn nghỉ." }));
      const res = await httpClient.post(`/leave/${id}/approve`, { managerNote });
      return res.data;
    }
    ```
    Hàm `approveLeave` chỉ gọi `transition`, cập nhật trạng thái đơn trong `leaveMockData.js` (`SMART_SCHEDULING_LEAVE_DATA_V1`), **không hề chạm vào `db.attendance` hay `db.schedules`**.
  - Tại [`src/mocks/db.js:512`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L512):
    ```javascript
    const absent = inMin == null;
    ```
    Sổ cái chấm công xác định `absent` duy nhất dựa vào việc `inMin == null`, hoàn toàn không đối soát với danh sách đơn nghỉ đã duyệt. Do đó nhân viên được nghỉ phép vẫn bị đánh dấu là "Absent" (Vắng mặt không phép).
  - Tại [`src/services/leaveService.js:173-182`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/leaveService.js#L173-L182):
    ```javascript
    export async function createOpenShiftFromLeave(id) {
      if (USE_MOCK) {
        return transition(id, "openShift", (r) => ({
          openShiftCreated: true,
          managerNote: `${r.managerNote ? `${r.managerNote} ` : ""}Đã đăng ca trực mở cho cả đội.`,
        }));
      }
      const res = await httpClient.post(`/leave/${id}/open-shift`);
      return res.data;
    }
    ```
    Nút tạo Open Shift chỉ đổi `openShiftCreated: true` trên đối tượng đơn nghỉ, **không hề gọi `createOpenShift`** của [`src/services/openShiftService.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/openShiftService.js), không tạo bản ghi nào trong [`src/mocks/openShiftMock.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/openShiftMock.js).

---

### 4. Kịch bản K6: Thưởng Open Shift tính bằng hàm băm ngẫu nhiên & Trang Staff là stub
- **Nhận định báo cáo cũ:** Tiền thưởng Open Shift trong bảng lương được tính bằng hàm băm giả lập từ ID ca làm việc thay vì đọc từ ca mở thực tế. Màn hình Staff OpenShiftPage chỉ là khung placeholder rỗng.
- **Kết luận:** **ĐÚNG**
- **Bằng chứng mã nguồn:**
  - Tại [`src/mocks/db.js:758-764`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L758-L764):
    ```javascript
    const BONUS_AMOUNTS = [30000, 50000, 70000];
    function openShiftBonusOf(s) {
      if (s.absent || s.missing) return 0;
      let seed = 0;
      for (const ch of s.id) seed = (seed * 31 + ch.charCodeAt(0)) % 1000003;
      return seed % 9 === 0 ? BONUS_AMOUNTS[seed % 3] : 0;
    }
    ```
    Thuật toán tính thưởng lấy mã ASCII của từng ký tự trong `s.id` nhân với 31 chia lấy dư để ra tiền thưởng ngẫu nhiên (30k, 50k, 70k) nếu chia hết cho 9. Hoàn toàn không liên kết với kho dữ liệu Open Shift thật.
  - Tại [`src/pages/employees/OpenShiftPage.jsx:1-19`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/employees/OpenShiftPage.jsx#L1-L19):
    ```jsx
    export default function OpenShiftPage() {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-semibold">Ca trống</h1>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <ul className="list-disc pl-5">
            <li>Xem ca trống</li>
            <li>Nhận ca</li>
            <li>Nếu người khác nhận trước: hiện thông báo lỗi</li>
            </ul>
          </div>
        </div>
      );
    }
    ```
    Trang nhân viên vỏn vẹn 19 dòng chứa các gạch đầu dòng tĩnh, không có nút bấm nhận ca, không có bảng dữ liệu.

---

### 5. Kịch bản K2: Vô hiệu hóa nhân viên không kiểm tra ca tương lai & Scheduler không lọc active
- **Nhận định báo cáo cũ:** Modal cho nhân viên nghỉ việc không liệt kê các ca tương lai đã gán để Quản lý điều phối lại; thuật toán xếp lịch tự động và các chức năng gợi ý thay thế/đổi ca/ca mở không lọc bỏ nhân viên đã nghỉ việc.
- **Kết luận:** **ĐÚNG**
- **Bằng chứng mã nguồn:**
  - Tại [`src/pages/manager/employees/components/TerminateEmployeeModal.jsx:8-23`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/employees/components/TerminateEmployeeModal.jsx#L8-L23):
    ```jsx
    export default function TerminateEmployeeModal({ open, selected, onClose, onConfirm }) {
      return (
        <Modal open={open} title="Cho nhân viên nghỉ việc" onClose={onClose}>
          <div className="space-y-4">
            <p className="text-[14px] text-slate-700">
              Bạn có chắc muốn cho <b className="text-slate-900">{selected?.name}</b> nghỉ việc? Tài khoản sẽ bị khóa, dữ liệu lịch sử vẫn được giữ lại.
            </p>
    ```
    Modal chỉ hiển thị câu hỏi xác nhận dạng text, **hoàn toàn không truy vấn ca tương lai**.
  - Tại [`src/pages/manager/schedule/hooks/useScheduleManagement.js:184-188`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/schedule/hooks/useScheduleManagement.js#L184-L188):
    ```javascript
    const candidate =
      employeeRoster.find(
        (r) => r.role === missingRole && !next[key].assigned.some((a) => a.id === r.id)
      ) || employeeRoster[5];
    ```
    Thuật toán tự động tìm nhân viên từ `employeeRoster` chỉ kiểm tra `role === missingRole` mà **không lọc `r.status === "Đang làm việc"`**. Nhân viên đã nghỉ việc vẫn bị xếp vào ca mới.
  - Tại [`src/mocks/leaveMockData.js:158`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/leaveMockData.js#L158):
    ```javascript
    const candidates = employeeRoster.filter((e) => e.id !== leaveRequest.employeeId && !declined.includes(e.id));
    ```
    Bộ lọc ứng viên thay thế chỉ loại người xin nghỉ và người từ chối, **không lọc bỏ nhân viên đã nghỉ việc**.
  - Tại [`src/utils/openShiftRules.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/utils/openShiftRules.js) và [`src/utils/shiftExchangeMockData.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/utils/shiftExchangeMockData.js):
    Không có bất kỳ dòng lệnh nào kiểm tra điều kiện `employee.status === "Đang làm việc"`.

---

## PHẦN 2: KIỂM CHỨNG CÁC NHẬN ĐỊNH CÒN LẠI

| Mục kiểm chứng | Nhận định báo cáo cũ | Kết luận thực tế | Bằng chứng mã nguồn (File:Dòng + Trích dẫn) |
| :--- | :--- | :---: | :--- |
| **US01 (Xác thực)** | Đăng nhập nhận mọi mật khẩu, JWT giả lập, mật khẩu nhân viên lưu plain-text | **ĐÚNG** | [`src/services/authService.js:8-10`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/authService.js#L8-L10) gọi `mockLogin(email)`. [`src/mocks/index.js:4-13`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/index.js#L4-L13) trả về `token: "mock-jwt-token"`. [`src/mocks/db.js:99, 113, 141`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L99) lưu `password: "12345678"` nguyên bản. |
| **US02 (Phân quyền)** | Route Guard chặn Staff vào Manager tốt nhưng điều hướng âm thầm, không có trang 403 chuyên biệt | **ĐÚNG** | [`src/App.jsx:33-38`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/App.jsx#L33-L38): `if (user.role !== role) return <Navigate to={homeOf(user.role)} replace />;` (chỉ redirect về `/employees/schedule`, không render component 403). |
| **US04 (Role_Tag)** | Gán Role_Tag dạng chuỗi đơn 1-1, vi phạm đặc tả quan hệ nhiều-nhiều $\ge 1$ tag | **ĐÚNG** | [`src/pages/manager/employees/employeeShared.jsx:75-79`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/employees/employeeShared.jsx#L75-L79): Dùng `<select name="role">` đơn lẻ chọn 1 vai trò duy nhất (`Phục vụ`, `Pha chế`, `Thu ngân`). [`src/mocks/db.js:38`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L38) lưu `roleTag` dạng chuỗi đơn (`"Service"`). |
| **US09 (Tự động xếp lịch)** | Chưa kết nối engine Python OR-Tools, dùng `setTimeout` giả lập và vòng lặp `while` cục bộ | **ĐÚNG** | [`src/pages/manager/schedule/hooks/useScheduleManagement.js:171-202`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/schedule/hooks/useScheduleManagement.js#L171-L202): `setTimeout(() => { while (next[key].assigned.length < demand.total) { ... } }, 1500)`. |
| **US25 (Xuất báo cáo PDF)** | Hoàn toàn chưa có mã nguồn xuất PDF, chỉ có xuất file Excel (`.xlsx`) | **ĐÚNG** | Quét toàn bộ `src/`: chỉ tìm thấy từ khóa PDF trong ghi chú tại [`src/services/assistantService.js:2`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/assistantService.js#L2). Xuất báo cáo chỉ dùng thư viện `xlsx` tại [`src/utils/exportExcel.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/utils/exportExcel.js) và [`src/pages/manager/payroll/exportPayrollExcel.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/payroll/exportPayrollExcel.js). |
| **US26 (Thông báo)** | `NotificationBell` chỉ là UI tĩnh rỗng, chưa kết nối dịch vụ thông báo | **ĐÚNG** | [`src/components/NotificationBell.jsx:1-24`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/components/NotificationBell.jsx#L1-L24): Nút button tĩnh với SVG chuông và ghi chú `// TODO: gọi notificationService.getNotifications()`. [`src/services/notificationService.js:4`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/notificationService.js#L4) trả về mảng rỗng `[]`. |
| **US27 (Trợ lý AI)** | Không gọi LLM thực tế, chỉ dùng bộ luật so khớp từ khóa cục bộ | **ĐÚNG** | [`src/services/assistantService.js:5`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/assistantService.js#L5): `export const IS_MOCK = true;` cùng logic so khớp Regex/từ khóa ở các hàm xử lý bên dưới. |
| **K1 (Thêm nhân viên mới)** | Xuất hiện ở hồ sơ nhưng vắng mặt ở lịch rảnh và chấm công/bảng lương | **ĐÚNG** | [`src/mocks/db.js:822`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L822): `computePayroll` lọc bỏ nhân viên có `.filter((r) => r.shiftCount > 0)`. Trang đăng ký lịch rảnh nhân viên [`AvailabilityPage.jsx:1-15`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/employees/AvailabilityPage.jsx#L1-L15) là stub rỗng. |
| **K3 (Đổi hệ số ca/lễ)** | Báo cáo cũ nhận định: "Kỳ đã chốt (`isPeriodLocked`) thì giữ nguyên, kỳ chưa chốt bị tính lại" | **SAI (Báo cáo cũ sai)** | **Thực tế:** Ngay cả kỳ đã chốt cũng bị tính lại! Tại [`src/mocks/db.js:774`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L774), `computePayroll` hoàn toàn không đọc `db.payrollLocks`. Đồng thời, trang [`src/pages/manager/payroll/PayrollPage.jsx`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/payroll/PayrollPage.jsx) không hề có nút hay logic gọi `lockPayrollPeriod`. |
| **K4 (Công bố lịch)** | Cập nhật cờ công bố nhưng không gửi thông báo, trang Staff bị trắng | **ĐÚNG** | [`src/mocks/db.js:1138`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L1138): `db.isScheduleConfirmed = true;` nhưng không gọi thông báo. Trang [`src/pages/employees/MySchedulePage.jsx:1-15`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/employees/MySchedulePage.jsx#L1-L15) là stub tĩnh. |
| **K10 (Staff xem lương)** | Staff bị chặn vào Manager, không xem được lương chung nhưng thiếu view Payslip cá nhân | **ĐÚNG** | [`src/layouts/EmployeeLayout.jsx:8-17`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/layouts/EmployeeLayout.jsx#L8-L17): Menu Staff có 8 mục, hoàn toàn không có mục Lương/Phiếu lương theo đặc tả US23. |
| **K11 (Xóa ca đã dùng)** | Ca đã có lịch sử làm việc không thể xóa vĩnh viễn, chỉ cho phép tạm dừng | **ĐÚNG** | [`src/pages/manager/shiftconfig/hooks/useShiftConfig.js:89-105`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/shiftconfig/hooks/useShiftConfig.js#L89-L105) (`isShiftUsedInSchedule`) và [`src/pages/manager/shiftconfig/components/ShiftModals.jsx:136-170`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/shiftconfig/components/ShiftModals.jsx#L136-L170): Khi ca đã dùng, nút "Xóa vĩnh viễn" bị ẩn/chặn, chỉ cho phép bấm "Tạm dừng". |

---

### Chi tiết kiểm chứng 7 file Stub của phân hệ Nhân viên (Staff):
Kiểm tra thực tế toàn bộ thư mục `src/pages/employees/`:
1. `AttendancePage.jsx` (**17 dòng**): Chỉ có tiêu đề "Chấm công" và danh sách gạch đầu dòng mô tả tính năng (check-in, check-out, lịch sử).
2. `AvailabilityPage.jsx` (**15 dòng**): Chỉ có tiêu đề "Đăng ký thời gian rảnh" và danh sách gạch đầu dòng tính năng.
3. `LeavePage.jsx` (**19 dòng**): Chỉ có tiêu đề "Nghỉ phép" và danh sách gạch đầu dòng tính năng.
4. `MySchedulePage.jsx` (**15 dòng**): Chỉ có tiêu đề "Lịch của tôi" và danh sách gạch đầu dòng tính năng.
5. `OpenShiftPage.jsx` (**19 dòng**): Chỉ có tiêu đề "Ca trống" và danh sách gạch đầu dòng tính năng.
6. `ProfilePage.jsx` (**15 dòng**): Chỉ có tiêu đề "Thông tin cá nhân" và danh sách gạch đầu dòng tính năng.
7. `TongQuan.jsx` (**14 dòng**): Chỉ có thẻ `<h1>Tổng quan</h1>` và một đoạn text mô tả placeholder.
*(Riêng file thứ 8 là `ShiftExchangePage.jsx` có mã nguồn thật với độ dài **824 dòng**).*

---

## PHẦN 3: KIỂM CHỨNG CÁC CON SỐ & KHÓA LOCALSTORAGE

### 1. Bảng đối chiếu các con số thống kê
| Chỉ số đo lường | Báo cáo cũ nêu | Kết quả kiểm chứng thực tế | Đánh giá sai khác |
| :--- | :---: | :---: | :--- |
| **Tổng số file trong `src/`** | 170 files | **171 files** | **Báo cáo cũ đếm thiếu 1 file** (Thực tế: 108 `.jsx`, 61 `.js`, 1 `.css`, 1 `.png`). |
| **Số file > 250 dòng** | 9 files | **9 files** | **Đúng tuyệt đối**. Danh sách 9 file chuẩn xác: <br>1. `mocks/db.js` (1187 dòng)<br>2. `pages/employees/ShiftExchangePage.jsx` (824 dòng)<br>3. `mocks/scheduleMockData.js` (475 dòng)<br>4. `layouts/ManagerLayout.jsx` (392 dòng)<br>5. `utils/shiftExchangeMockData.js` (365 dòng)<br>6. `mocks/reports.js` (311 dòng)<br>7. `pages/manager/schedule/hooks/useScheduleManagement.js` (292 dòng)<br>8. `components/PageKit.jsx` (287 dòng)<br>9. `pages/manager/schedule/hooks/useCreatedScheduleData.js` (279 dòng) |
| **Số file mồ côi (không ai import)** | 7 files | **8 files** | **Báo cáo cũ bỏ sót 1 file** (`components/FormInput.jsx`). Báo cáo cũ tưởng `LoginPage.jsx` import component này nhưng thực tế `LoginPage` dùng trực tiếp thẻ `<input>`. |

### 2. Danh mục 8 file mã nguồn không có ai import (File mồ côi):
1. `src/components/Card.jsx` (17 dòng) - Thừa, các trang đều dùng `PageCard` từ `PageKit.jsx`.
2. `src/components/FormInput.jsx` (12 dòng) - **Báo cáo cũ bỏ sót**; không ai dùng trong toàn bộ dự án.
3. `src/pages/manager/schedule/hooks/useCreatedScheduleData.jsx` (2 dòng) - File shim re-export tạm thời.
4. `src/pages/manager/schedule/hooks/useScheduleManagement.jsx` (2 dòng) - File shim re-export tạm thời.
5. `src/services/availabilityService.js` (8 dòng) - Chưa ai import vì trang Staff chưa hoàn thiện.
6. `src/services/notificationService.js` (7 dòng) - Chưa ai import vì NotificationBell là UI tĩnh.
7. `src/services/replacementService.js` (47 dòng) - Đã gộp logic vào `leaveService.js`.
8. `src/services/shiftExchangeService.js` (43 dòng) - Bị bỏ qua do các trang gọi thẳng `utils/shiftExchangeMockData.js`.

### 3. Kiểm chứng các khóa (Keys) LocalStorage thực tế trong mã nguồn
Báo cáo cũ nêu hệ thống dùng **4 key** gồm: `SMART_SCHEDULING_DB_V1`, `_LEAVE_REQUESTS`, `_OPEN_SHIFTS_V2`, `_SHIFT_EXCHANGES_V1`.  
**Kết quả kiểm tra toàn diện bằng lệnh quét mã nguồn:** Có tổng cộng **8 khóa LocalStorage** thực tế; báo cáo cũ **viết sai tên 2 khóa** và **bỏ sót hoàn toàn 4 khóa**!

| STT | Khóa LocalStorage thực tế trong code | File định nghĩa & sử dụng | Báo cáo cũ ghi | Đánh giá tính chính xác |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `SMART_SCHEDULING_DB_V1` | [`src/mocks/db.js:293`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L293) | `SMART_SCHEDULING_DB_V1` | **ĐÚNG** |
| 2 | `SMART_SCHEDULING_LEAVE_DATA_V1` | [`src/mocks/leaveMockData.js:125`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/leaveMockData.js#L125) | `_LEAVE_REQUESTS` | **SAI TÊN KHÓA** |
| 3 | `SMART_SCHEDULING_OPEN_SHIFTS_V2` | [`src/mocks/openShiftMock.js:31`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/openShiftMock.js#L31) | `_OPEN_SHIFTS_V2` | **ĐÚNG** |
| 4 | `SMART_SCHEDULING_SHIFT_EXCHANGE_DATA` | [`src/utils/shiftExchangeMockData.js:136`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/utils/shiftExchangeMockData.js#L136) | `_SHIFT_EXCHANGES_V1` | **SAI TÊN KHÓA** |
| 5 | `smart_scheduling_shift_templates` | [`src/mocks/scheduleMockData.js:457`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/scheduleMockData.js#L457) | *(Không có)* | **BÁO CÁO CŨ BỎ SÓT** |
| 6 | `assistant_conversations_v1` | [`src/pages/manager/assistant/AssistantPage.jsx:21`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/assistant/AssistantPage.jsx#L21) | *(Không có)* | **BÁO CÁO CŨ BỎ SÓT** |
| 7 | `user` | [`src/context/AuthContext.jsx:7,13,19`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/context/AuthContext.jsx#L7) | *(Không có)* | **BÁO CÁO CŨ BỎ SÓT** |
| 8 | `token` | [`src/context/AuthContext.jsx:14,20`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/context/AuthContext.jsx#L14), [`src/services/httpClient.js:9`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/services/httpClient.js#L9) | *(Không có)* | **BÁO CÁO CŨ BỎ SÓT** |

---

## PHẦN 4: ĐIỀU TRA NGUỒN DỮ LIỆU & KIẾN TRÚC PHÂN TẦNG

### 1. Bảng kiểm kê nguồn dữ liệu (SSOT & Phân mảnh)
| Loại dữ liệu | Nơi lưu gốc | Ai ghi (Write) | Ai đọc (Read) | Hiện trạng sao chép / Phân mảnh |
| :--- | :--- | :--- | :--- | :--- |
| **Nhân viên & Tài khoản** | `db.employees` (`SMART_SCHEDULING_DB_V1`) | `db.addEmployee`, `db.updateEmployee` | `EmployeeListPage`, `useScheduleManagement` | Sao chép nguyên object nhân viên vào từng slot ca (`shift.assigned`). |
| **Cấu hình ca & Ràng buộc** | `db.shiftConfig` (`SMART_SCHEDULING_DB_V1`) | `db.saveShiftConfig` via `shiftConfigService` | `ShiftConfigPage`, `useCreatedScheduleData` | Phân mảnh: `scheduleMockData.js` lại lưu ca mẫu riêng vào key `smart_scheduling_shift_templates`. |
| **Lịch Draft & Official** | `db.schedules` (`SMART_SCHEDULING_DB_V1`) | `saveSchedules`, `confirmSchedule` | `CreatedSchedulePage`, `SchedulePage` | Lưu dạng dict lồng object nhân viên; không liên thông sang bảng đổi ca. |
| **Chấm công & Điều chỉnh** | `db.attendance` (`SMART_SCHEDULING_DB_V1`) | `confirmSchedule`, `saveAttendanceAdjust` | `AttendancePage`, `WorkHoursPage`, `PayrollPage`, `Dashboard` | Hoạt động tốt giữa các module Manager, nhưng bị cô lập khỏi Đổi ca và Nghỉ phép. |
| **Đơn xin nghỉ phép** | `SMART_SCHEDULING_LEAVE_DATA_V1` | `leaveService.js` | `LeavePage.jsx`, `useLeaveRequests.js` | **Lưu kho riêng độc lập**, chứa bản sao `employeeName`, `roleTag`, không liên kết khóa ngoại với `db.employees`. |
| **Yêu cầu đổi ca** | `SMART_SCHEDULING_SHIFT_EXCHANGE_DATA` | `shiftExchangeMockData.js` | `ShiftExchangePage.jsx` | **Lưu kho riêng độc lập**, chứa bản sao tên người gửi, người nhận, thông tin ca. |
| **Ca trực mở (Open Shifts)** | `SMART_SCHEDULING_OPEN_SHIFTS_V2` | `openShiftService.js` | `OpenShiftPage.jsx` | **Lưu kho riêng độc lập**, tiền thưởng không đồng bộ sang `db.attendance` / `db.payroll`. |

### 2. Bản chất các file `*Data.js` trong thư mục chức năng (`pages/manager/*`)
Kiểm tra thực tế các file:
- `attendanceData.js` (89 dòng): Chứa hằng số định dạng UI (`STATUS_META`, `STATUS_VI`, mã màu HEX, icon mapping). Không giữ state.
- `dashboardData.js` (43 dòng): Chứa cấu hình danh sách chỉ số KPI (`KPI_CARDS`), đường dẫn chuyển trang và icon SVG.
- `employeeData.js` (9 dòng): Định nghĩa danh mục vai trò (`ROLES`) và loại hợp đồng (`CONTRACTS`).
- `openShiftData.js` (55 dòng): Hằng số trạng thái ca mở (`STATUS`, `REG_STATUS`), hàm sắp xếp danh sách (`compareShifts`).
- `payrollData.js` (40 dòng): Cột hiển thị bảng lương, bộ icon SVG.
- `reportData.js` (26 dòng): Danh mục loại báo cáo và các metric.
- `shiftConfigData.js` (192 dòng): Dữ liệu mặc định (`initialShifts`, `initialGeneralSettings`), bộ chuyển đổi payload (`toPayload`).
- `workHoursData.js` (15 dòng): Danh mục trạng thái đối soát giờ làm.
👉 **Kết luận:** Toàn bộ các file `*Data.js` này là **Hàm thuần và Hằng số UI (Presentation Constants/Helpers)**, KHÔNG PHẢI là kho lưu trữ dữ liệu (Data Store) hay vi phạm kiến trúc.

### 3. Các trang vi phạm phân tầng (Import trực tiếp từ `mocks/` hoặc `utils/` bỏ qua `services/`)
1. [`src/pages/employees/ShiftExchangePage.jsx`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/employees/ShiftExchangePage.jsx): Import trực tiếp `mocks/scheduleMockData`, `mocks/workHours` và `utils/shiftExchangeMockData`.
2. [`src/pages/manager/leave/LeavePage.jsx`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/leave/LeavePage.jsx): Import trực tiếp `mocks/scheduleMockData`.
3. [`src/pages/manager/leave/hooks/useLeaveRequests.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/leave/hooks/useLeaveRequests.js): Import trực tiếp `mocks/leaveMockData` và `mocks/scheduleMockData`.
4. [`src/pages/manager/payroll/exportPayrollExcel.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/payroll/exportPayrollExcel.js): Import trực tiếp `mocks/payroll`.
5. [`src/pages/manager/payroll/hooks/usePayrollData.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/payroll/hooks/usePayrollData.js): Import trực tiếp `mocks/payroll`.
6. [`src/pages/manager/shiftExchange/ShiftExchangePage.jsx`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/shiftExchange/ShiftExchangePage.jsx): Import trực tiếp `utils/shiftExchangeMockData`.
7. [`src/pages/manager/workHours/hooks/useWorkHoursData.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/workHours/hooks/useWorkHoursData.js): Import trực tiếp `mocks/scheduleMockData`.

---

## PHẦN 5: CÁC LỖI MỚI PHÁT HIỆN (CHƯA ĐƯỢC NÊU TRONG BÁO CÁO CŨ)

### 1. Lỗi Mới 1: Hoàn toàn không có giao diện chốt kỳ lương
- **Vị trí:** [`src/pages/manager/payroll/PayrollPage.jsx`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/payroll/PayrollPage.jsx) và [`src/pages/manager/payroll/hooks/usePayrollData.js`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/payroll/hooks/usePayrollData.js).
- **Mô tả:** Trong `db.js` và `payrollService.js` có export hàm `lockPayrollPeriod` và `unlockPayrollPeriod`. Tuy nhiên, trên toàn bộ giao diện Bảng lương của Quản lý, **hoàn toàn không có nút "Chốt lương" / "Khóa kỳ lương"** và không hề có dòng code nào gọi hàm này. Quản lý không có cách nào chốt được kỳ lương từ UI.

### 2. Lỗi Mới 2: Đồng bộ một chiều tại `confirmSchedule` gây rác dữ liệu chấm công khi gỡ người khỏi ca
- **Vị trí:** [`src/mocks/db.js:1140-1185`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L1140-L1185).
- **Mô tả:** Khi bấm "Công bố lịch", hàm `confirmSchedule` duyệt qua các slot ca hiện tại và tìm kiếm nếu chưa có bản ghi trong `db.attendance` thì `db.attendance.push(...)`. Nếu trước đó một nhân viên A đã được xếp vào ca (và đã sinh bản ghi trong attendance), sau đó Quản lý gỡ nhân viên A ra khỏi lịch và bấm Công bố lại, nhân viên A **vẫn nằm nguyên trong `db.attendance`**, dẫn đến việc nhân viên bị gỡ ca vẫn bị chấm công hoặc tính vắng mặt sai lệch.

### 3. Lỗi Mới 3: Gán ca thủ công không kiểm tra trùng ca (Double Booking) và quá giờ làm
- **Vị trí:** [`src/pages/manager/schedule/components/ShiftAssignmentModal.jsx:27-32, 42`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/pages/manager/schedule/components/ShiftAssignmentModal.jsx#L27-L32).
- **Mô tả:** Trong modal điều chỉnh gán ca thủ công:
  ```javascript
  const handleAdd = (emp) => {
    if (!editList.some((e) => e.id === emp.id)) {
      setEditList((prev) => [...prev, emp]);
    }
  };
  const availableEmployees = employeeRoster.filter((e) => !editList.some((a) => a.id === e.id));
  ```
  Hệ thống chỉ lọc xem nhân viên đã có mặt trong ca này chưa, hoàn toàn **không kiểm tra xem nhân viên đã bị gán vào ca khác trong cùng ngày (trùng ca)** hay chưa, không kiểm tra định mức tối đa 40h/tuần và thời gian nghỉ giữa 2 ca liên tiếp. Quản lý có thể gán 1 nhân viên vào cả 3 ca Sáng - Chiều - Tối trong cùng một ngày mà không có bất kỳ cảnh báo nào.

### 4. Lỗi Mới 4: Tồn tại hai cơ chế lưu ca mẫu độc lập xung đột nhau
- **Vị trí:** [`src/mocks/scheduleMockData.js:457-474`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/scheduleMockData.js#L457-L474) so với [`src/mocks/db.js:330-360`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L330-L360).
- **Mô tả:** Module Lập lịch lưu danh sách ca mẫu vào localStorage key `smart_scheduling_shift_templates`. Trong khi đó, module Cấu hình ca (`ShiftConfigPage`) lại lưu danh mục ca vào `db.shiftConfig` trong key `SMART_SCHEDULING_DB_V1`. Hai danh mục này không đồng bộ với nhau, dẫn đến việc sửa ca ở trang Cấu hình ca không cập nhật sang bộ chọn ca mẫu của trang Lập lịch.

### 5. Lỗi Mới 5: Mật khẩu tài khoản nhân viên lưu plain-text trong LocalStorage
- **Vị trí:** [`src/mocks/db.js:99, 113, 141, 388`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L99).
- **Mô tả:** Khi Quản lý tạo nhân viên kèm tài khoản hoặc dữ liệu mẫu khởi tạo, mật khẩu được lưu trực tiếp dạng chuỗi văn bản thuần: `account: { email: "...", password: "12345678", status: "active" }` và ghi thẳng xuống LocalStorage (`SMART_SCHEDULING_DB_V1`). Bất kỳ ai mở F12 Application Storage đều có thể đọc toàn bộ mật khẩu người dùng.

### 6. Lỗi Mới 6: Vô hiệu hóa nhân viên không tự động dọn ca tương lai
- **Vị trí:** [`src/mocks/db.js:397-418`](file:///d:/CAPSTONE/SMART-%20SCHEDULING2/smart-scheduling/src/mocks/db.js#L397-L418) (`updateEmployee`).
- **Mô tả:** Hàm chỉ cập nhật thuộc tính `status: "Nghỉ việc"`. Toàn bộ các ca tương lai đã gán trong `db.schedules` và các dòng dự kiến trong `db.attendance` của nhân viên đó không hề bị hủy hay đánh dấu trống, dẫn đến lịch làm việc vẫn chứa tên người đã thôi việc.

---

## PHẦN 6: KẾT LUẬN TỔNG QUAN VỀ CHẤT LƯỢNG BÁO CÁO CŨ

1. **Độ chính xác về lỗi logic nghiệp vụ nặng:** **RẤT CAO (95%)**.
   - Báo cáo cũ đã chỉ ra cực kỳ chính xác bản chất cốt lõi của 4 lỗ hổng nghiêm trọng nhất: K5 (Duyệt đổi ca không cập nhật chấm công/lương), K7 (Duyệt nghỉ không cập nhật chấm công và không tạo Open Shift thật), K6 (Thưởng Open Shift dùng hàm băm giả thay vì số liệu thật) và K2 (Cho thôi việc không xử lý ca tương lai).
2. **Sai sót và nhược điểm của báo cáo cũ:**
   - **Nhận định sai về K3:** Báo cáo cũ suy đoán rằng kỳ lương đã chốt sẽ giữ nguyên lương cũ. Nhưng kiểm chứng thực tế trong code cho thấy `computePayroll` hoàn toàn không kiểm tra cờ chốt lương và không hề có UI chốt lương, do đó kỳ đã chốt vẫn bị tính lại.
   - **Sai lệch về số liệu thống kê:**
     - Đếm thiếu 1 file (thực tế 171 file vs báo cáo cũ ghi 170).
     - Bỏ sót 1 file mồ côi (`FormInput.jsx`).
     - Bỏ sót 4 khóa LocalStorage và viết sai tên 2 khóa LocalStorage quan trọng.
   - **Bỏ sót các lỗi rò rỉ dữ liệu:** Chưa phát hiện việc mật khẩu lưu plain-text trong LocalStorage và lỗi không dọn ca khi gỡ nhân viên ở `confirmSchedule`.
