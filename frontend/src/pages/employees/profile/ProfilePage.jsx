/** FILE NÀY LÀM GÌ: Xem & cập nhật thông tin cá nhân, Đổi mật khẩu | Loại: Giao diện Staff | US: US07, US02 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  getMyProfile,
  updateMyProfile,
  update as updateEmployee,
} from "../../../services/employeeService";
import { PageHeader, PageCard } from "../../../components/PageKit";
import { Button } from "../../../components/FormKit";
import { StatusBadge, initialsOf } from "../../../components/TableKit";
import STAFF_LAYOUT from "../../../lib/layoutTokens.js";
import {
  MAX_AVATAR_SIZE,
  normalizeProfile,
} from "./profileHelpers";
import { validatePhone, validateAddress } from "../../../lib/validators";
import { CancelEditModal, ChangePasswordModal } from "./ProfileModals";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const [feedback, setFeedback] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // US07: Staff chỉ xem hồ sơ của chính mình
  const queryId = searchParams.get("id") || searchParams.get("employeeId");
  const myEmpId = user?.employeeId || user?.id || "NV001";
  const isUnauthorized = Boolean(queryId && String(queryId).trim().toUpperCase() !== String(myEmpId).trim().toUpperCase());

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getMyProfile(user);
      const data = normalizeProfile(res, user);
      setProfile(data);
      setPhone(data.phone);
      setAddress(data.address);
      setAvatarPreview(data.avatarUrl);
    } catch (err) {
      setLoadError(err?.message || "Không thể tải hồ sơ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => () => {
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      phone.trim() !== (profile.phone || "").trim() ||
      address.trim() !== (profile.address || "").trim() ||
      avatarFile !== null ||
      avatarPreview !== profile.avatarUrl
    );
  }, [profile, phone, address, avatarFile, avatarPreview]);

  const handleStartEdit = () => {
    setPhone(profile?.phone || "");
    setAddress(profile?.address || "");
    setAvatarFile(null);
    setAvatarPreview(profile?.avatarUrl || "");
    setPhoneError("");
    setAvatarError("");
    setEditing(true);
  };

  const confirmCancel = () => {
    setPhone(profile?.phone || "");
    setAddress(profile?.address || "");
    setAvatarFile(null);
    setAvatarPreview(profile?.avatarUrl || "");
    setPhoneError("");
    setAvatarError("");
    setEditing(false);
    setShowCancelModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setAvatarError("Ảnh đại diện phải có định dạng JPG hoặc PNG.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Dung lượng ảnh đại diện tối đa là 2 MB.");
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview("");
    setAvatarError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setPhoneError("");
    setAddressError("");
    setAvatarError("");
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      setPhoneError(phoneCheck.error);
      return;
    }
    const addressCheck = validateAddress(address, { required: false, maxLength: 200 });
    if (!addressCheck.valid) {
      setAddressError(addressCheck.error);
      return;
    }

    setSaving(true);
    try {
      const updates = { phone: phoneCheck.value, address: addressCheck.value, avatar: avatarFile, avatar_url: avatarPreview };
      const res = await updateMyProfile(updates, user);
      const updated = normalizeProfile(res, user);
      const empId = user?.employeeId || user?.id;
      if (empId) {
        try {
          await updateEmployee(empId, { phone: phoneCheck.value, address: addressCheck.value, avatar: avatarPreview });
        } catch { /* ignore */ }
      }
      setProfile(updated);
      setPhone(updated.phone);
      setAddress(updated.address);
      setAvatarPreview(updated.avatarUrl);
      setAvatarFile(null);
      setEditing(false);
      setFeedback({ type: "success", text: "Cập nhật thành công" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Không thể cập nhật hồ sơ." });
    } finally {
      setSaving(false);
    }
  };

  if (isUnauthorized) {
    return (
      <div className={STAFF_LAYOUT.blockGap}>
        {/* ===== TIÊU ĐỀ TRANG TỪ CHỐI QUYỀN ===== */}
        <PageHeader
          breadcrumbs={[{ label: "Cá nhân", to: "/employees" }, { label: "Thông tin cá nhân" }]}
          icon="user"
          title="Thông tin cá nhân"
          subtitle="Xem thông tin của bạn và cập nhật thông tin liên hệ."
        />
        {/* ===== THÔNG BÁO TỪ CHỐI QUYỀN ===== */}
        <PageCard>
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-900">Bạn không có quyền xem hồ sơ này</h3>
            <p className="text-sm text-slate-500">Bạn chỉ có thể xem và chỉnh sửa thông tin hồ sơ của chính mình.</p>
            <Button variant="primary" size="md" className="mt-2" onClick={() => navigate("/employees/profile")}>
              Về hồ sơ của tôi
            </Button>
          </div>
        </PageCard>
      </div>
    );
  }

  return (
    <div className={STAFF_LAYOUT.blockGap}>
      {/* ===== THÔNG BÁO PHẢN HỒI ===== */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-[14px] ${
            feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ===== THÔNG BÁO LỖI TẢI DỮ LIỆU ===== */}
      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{loadError}</span>
          <button type="button" onClick={loadProfile} className="inline-flex items-center gap-1 font-medium cursor-pointer">
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )}

      {/* ===== TIÊU ĐỀ TRANG VÀ NÚT THAO TÁC ===== */}
      <PageHeader
        breadcrumbs={[{ label: "Cá nhân", to: "/employees" }, { label: "Thông tin cá nhân" }]}
        icon="user"
        title="Thông tin cá nhân"
        subtitle="Xem thông tin của bạn và cập nhật thông tin liên hệ."
        actions={
          !editing ? (
            <>
              <Button
                variant="outline"
                size="md"
                className="h-10 border-[#CBE3F0] text-slate-700 bg-white hover:bg-slate-50"
                icon={<KeyRound size={16} />}
                onClick={() => setShowPasswordModal(true)}
                disabled={loading || !profile}
              >
                Đổi mật khẩu
              </Button>
              <Button
                variant="primary"
                size="md"
                className="h-10"
                icon={<Pencil size={16} />}
                onClick={handleStartEdit}
                disabled={loading || !profile}
              >
                Chỉnh sửa
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="md" className="h-10" icon={<X size={16} />} onClick={() => (hasChanges ? setShowCancelModal(true) : setEditing(false))} disabled={saving}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="md"
                className="h-10"
                icon={saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                onClick={handleSave}
                disabled={saving || !hasChanges || !!phoneError || !!avatarError}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
            </>
          )
        }
      />

      {/* ===== NỘI DUNG THẺ HỒ SƠ ===== */}
      <PageCard>
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Đang tải hồ sơ...
          </div>
        ) : !profile ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-[14px] text-slate-600">Không thể tải thông tin hồ sơ của bạn.</p>
            <Button variant="outline" size="sm" onClick={loadProfile}>Thử lại</Button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* ===== CỘT 1: THẺ NHÂN VIÊN (CHỈ ĐỌC, KHÓA) ===== */}
            <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] border-b border-slate-100 pb-2">Thông tin nhân viên</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-[#CBE3F0] text-[#0F172A] grid place-items-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={profile.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold">{initialsOf(profile.fullName)}</span>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-[15px] font-bold text-slate-900">{profile.fullName}</span>
                    <StatusBadge tone="neutral">{profile.employeeId}</StatusBadge>
                  </div>
                  <p className="text-[13px] text-slate-500">{profile.email}</p>
                  {editing && (
                    <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleAvatarChange} className="sr-only" />
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" icon={<Camera size={13} />} onClick={() => fileInputRef.current?.click()}>
                        Đổi ảnh
                      </Button>
                      {avatarPreview && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-rose-600 hover:bg-rose-50" icon={<Trash2 size={13} />} onClick={handleRemoveAvatar}>
                          Gỡ ảnh
                        </Button>
                      )}
                    </div>
                  )}
                  {editing && <p className="text-[11.5px] text-slate-400">JPG hoặc PNG, tối đa 2 MB</p>}
                  {avatarError && <p className="text-[12px] text-rose-600 font-medium">{avatarError}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <ReadOnlyField label="Mã nhân viên" value={profile.employeeId} icon={UserRound} />
                <ReadOnlyField label="Họ và tên" value={profile.fullName} icon={UserRound} />
                <ReadOnlyField label="Email" value={profile.email} icon={Mail} />
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 select-none cursor-default">
                  <p className="text-[12px] font-medium text-slate-500">Vị trí / Vai trò (Role_Tag)</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(profile.roles && profile.roles.length > 0 ? profile.roles : [profile.roleTag || "Nhân viên"]).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center rounded-lg bg-[#CBE3F0] px-2.5 py-1 text-[13px] font-semibold text-[#0F172A]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <ReadOnlyField label="Loại hợp đồng" value={profile.contractType} icon={UserRound} />
              </div>

              <p className="text-[13px] text-slate-500 italic pt-1">Liên hệ Quản lý nếu cần thay đổi các thông tin này.</p>
            </div>

            {/* ===== CỘT 2: THÔNG TIN LIÊN HỆ (ĐƯỢC SỬA) ===== */}
            <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] border-b border-slate-100 pb-2">Thông tin liên hệ</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">
                    Số điện thoại {!editing && <span className="text-slate-400 font-normal">(Được sửa)</span>}
                  </label>
                  {!editing ? (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 flex items-center gap-2.5 select-none cursor-default">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className={`text-[14px] ${profile.phone ? "font-semibold text-slate-800 tabular-nums" : "text-slate-400 italic"}`}>
                        {profile.phone || "Chưa cập nhật"}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(""); }}
                          placeholder="0912345678"
                          className="h-10 w-full rounded-xl border border-[#CBE3F0] bg-white pl-9 pr-3 text-[14px] text-slate-900 outline-none transition focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/15"
                        />
                      </div>
                      {phoneError && <p className="mt-1 text-[12.5px] text-rose-600 font-medium">{phoneError}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">
                    Địa chỉ {!editing && <span className="text-slate-400 font-normal">(Được sửa)</span>}
                  </label>
                  {!editing ? (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 flex items-start gap-2.5 select-none cursor-default">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className={`text-[14px] leading-relaxed ${profile.address ? "font-medium text-slate-800 whitespace-pre-wrap" : "text-slate-400 italic"}`}>
                        {profile.address || "Chưa cập nhật"}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <textarea
                          rows={3}
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            if (addressError) setAddressError("");
                          }}
                          placeholder="Nhập địa chỉ cư trú của bạn..."
                          className={`w-full resize-none rounded-xl border bg-white pl-9 pr-3 py-2.5 text-[14px] text-slate-900 outline-none transition leading-relaxed ${
                            addressError
                              ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                              : "border-[#CBE3F0] focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/15"
                          }`}
                        />
                      </div>
                      {addressError && <p className="mt-1 text-[12.5px] text-rose-600 font-medium">{addressError}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </PageCard>

      {/* ===== MODAL XÁC NHẬN HỦY THAY ĐỔI ===== */}
      <CancelEditModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
      />

      {/* ===== MODAL ĐỔI MẬT KHẨU (US02) ===== */}
      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
          setFeedback({ type: "success", text: "Đổi mật khẩu thành công" });
        }}
      />
    </div>
  );
}

function ReadOnlyField({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 select-none cursor-default">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-slate-500">{label}</p>
          <p className="mt-0.5 text-[14px] font-semibold text-slate-800 truncate">{value || "Chưa cập nhật"}</p>
        </div>
      </div>
    </div>
  );
}
