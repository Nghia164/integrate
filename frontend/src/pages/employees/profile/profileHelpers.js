/** FILE NÀY LÀM GÌ: Hàm hỗ trợ chuẩn hóa và kiểm tra dữ liệu hồ sơ nhân viên | Loại: Giao diện Staff | US: US07 */

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

export function normalizeProfile(source, user) {
  const s = source?.profile ?? source?.user ?? source?.data ?? source ?? {};
  const avatar = s.avatar_url ?? s.avatarUrl ?? s.avatar ?? user?.avatar_url ?? user?.avatarUrl ?? "";
  const roles = (Array.isArray(s.roles) && s.roles.length > 0)
    ? s.roles
    : (Array.isArray(s.roleTags) && s.roleTags.length > 0)
    ? s.roleTags
    : (Array.isArray(user?.roles) && user.roles.length > 0)
    ? user.roles
    : [s.role_tag ?? s.roleTag ?? s.role ?? user?.roleTag ?? user?.role ?? "Phục vụ"].filter(Boolean);
  const roleTag = roles[0] || "Nhân viên";

  return {
    id: s.id ?? user?.id,
    employeeId: s.employee_id ?? s.employeeId ?? s.code ?? user?.employeeId ?? user?.id ?? "NV001",
    fullName: s.full_name ?? s.fullName ?? s.name ?? user?.full_name ?? user?.name ?? "Nhân viên",
    email: s.email ?? user?.email ?? "Chưa cập nhật",
    phone: s.phone ?? s.phone_number ?? s.mobile ?? user?.phone ?? "",
    address: s.address ?? s.home_address ?? user?.address ?? "",
    contractType: s.contract_type ?? s.contractType ?? user?.contract_type ?? user?.contractType ?? "Toàn thời gian",
    roles,
    roleTag,
    avatarUrl: typeof avatar === "string" ? avatar : avatar?.url ?? "",
  };
}

export function validateVietnamesePhone(raw) {
  const clean = String(raw || "").replace(/[\s().-]/g, "");
  if (!clean) return { valid: false, error: "Vui lòng nhập số điện thoại." };
  if (!/^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/.test(clean)) {
    return { valid: false, error: "Số điện thoại không hợp lệ (10 số Việt Nam, ví dụ: 0912345678)." };
  }
  return { valid: true, value: clean.startsWith("+84") ? "0" + clean.slice(3) : clean };
}
