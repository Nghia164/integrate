import { useState } from "react";
import { CheckCircle2, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { Button } from "../../../components/FormKit";
import { PageCard, SearchInput, StatusTabs, Toolbar, Alert, inputClass } from "../../../components/PageKit";
import { SHIFT_STATUS } from "./shiftConfigData";
import ConstraintsTab from "./components/ConstraintsTab";
import GeneralSettingsTab from "./components/GeneralSettingsTab";
import ShiftTemplatesTab from "./components/ShiftTemplatesTab";
import { ShiftFormModal, DeleteShiftModal } from "./components/ShiftModals";
import { useShiftConfig } from "./hooks/useShiftConfig";

function Toast({ message }) {
  return (
    <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-[14px] font-medium text-white shadow-lg">
      <CheckCircle2 size={16} className="text-emerald-400" />
      {message}
    </div>
  );
}

export default function ShiftConfigPage() {
  const {
    tab,
    setTab,
    shifts,
    constraints,
    generalSettings,
    loading,
    offline,
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    editing,
    setEditing,
    deleting,
    setDeleting,
    toast,
    rows,
    pageRows,
    canClear,
    resetFilters,
    isShiftUsedInSchedule,
    saveShift,
    pauseShift,
    deleteShift,
    saveConstraints,
    saveGeneral,
    roleTags,
    roleError,
    handleRoleAdd,
    handleRoleUpdate,
    handleRoleDelete,
    tabs,
  } = useShiftConfig();

  const statusCounts = Object.fromEntries(tabs.map(([id, , count]) => [id, count]));
  const tabDefs = tabs.map(([id, label]) => [id, label]);

  return (
    <>
      <PageCard
        icon="sliders"
        breadcrumb={["Cấu hình", "Ca & ràng buộc"]}
        title="Ca & ràng buộc"
        subtitle="Ca làm việc mẫu, quy tắc xếp lịch tự động và cấu hình chung hệ thống."
        actions={
          tab === "shifts" && (
            <Button type="button" size="md" icon={<Plus size={16} />} onClick={() => setEditing("new")}>
              Thêm ca mẫu
            </Button>
          )
        }
      >
        {offline && (
          <Alert tone="error" className="mb-4">
            Không kết nối được máy chủ, đang hiển thị cấu hình mặc định. Thay đổi sẽ chưa lưu được.
          </Alert>
        )}

        {/* TAB + BỘ LỌC (Toolbar chuẩn) */}
        <Toolbar
          tabs={<StatusTabs tabs={tabDefs} value={tab} onChange={setTab} counts={statusCounts} />}
          search={
            tab === "shifts" ? (
              <SearchInput
                value={filters.q}
                onChange={(val) => {
                  setFilters((f) => ({ ...f, q: val }));
                  setPage(1);
                }}
                placeholder="Tìm tên ca..."
              />
            ) : null
          }
          filters={
            tab === "shifts" ? (
              <select
                aria-label="Trạng thái"
                value={filters.status}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, status: e.target.value }));
                  setPage(1);
                }}
                className={`${inputClass} w-44`}
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(SHIFT_STATUS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            ) : null
          }
          onClear={tab === "shifts" && canClear ? resetFilters : null}
        />

        {loading ? (
          <p className="py-16 text-center text-[15px] text-slate-500">Đang tải cấu hình...</p>
        ) : tab === "shifts" ? (
          <ShiftTemplatesTab
            shifts={shifts}
            rows={rows}
            pageRows={pageRows}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        ) : tab === "roles" ? (
          <div className="pb-6">
            <RoleTagsTab
              roleTags={roleTags}
              onAdd={handleRoleAdd}
              onUpdate={handleRoleUpdate}
              onDelete={handleRoleDelete}
              error={roleError}
            />
          </div>
        ) : tab === "constraints" ? (
          <div className="pb-6">
            <ConstraintsTab saved={constraints} shifts={shifts} onSave={saveConstraints} />
          </div>
        ) : (
          <div className="pb-6">
            <GeneralSettingsTab saved={generalSettings} onSave={saveGeneral} />
          </div>
        )}
      </PageCard>

      {editing && (
        <ShiftFormModal
          shift={editing === "new" ? null : editing}
          shifts={shifts}
          onClose={() => setEditing(null)}
          onSave={saveShift}
        />
      )}

      {deleting && (
        <DeleteShiftModal
          shift={deleting}
          inUse={isShiftUsedInSchedule(deleting.id)}
          onClose={() => setDeleting(null)}
          onConfirmDelete={deleteShift}
          onConfirmPause={pauseShift}
        />
      )}

      {toast && <Toast message={toast} />}
    </>
  );
}

// =============================================================================
// TAB QUẢN LÝ DANH MỤC VAI TRÒ ROLE_TAG (US05)
// =============================================================================

const roleTh = "px-4 py-3.5 text-left text-[13px] font-semibold text-slate-600 bg-slate-50 border-b border-slate-200";

function RoleTagsTab({
  roleTags = [],
  onAdd,
  onUpdate,
  onDelete,
  error,
}) {
  const [newRole, setNewRole] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    onAdd(newRole.trim());
    setNewRole("");
  };

  const startEdit = (role) => {
    setEditingRole(role);
    setEditValue(role);
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setEditValue("");
  };

  const saveEdit = (oldRole) => {
    if (!editValue.trim() || editValue.trim() === oldRole) {
      cancelEdit();
      return;
    }
    onUpdate(oldRole, editValue.trim());
    cancelEdit();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[14px] text-rose-800 font-medium">
          {error}
        </div>
      )}

      {/* Form thêm vai trò mới */}
      <form onSubmit={handleAddSubmit} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="Nhập tên vai trò mới (ví dụ: Pha chế)..."
          className={`${inputClass} max-w-sm`}
        />
        <Button type="submit" size="md" icon={<Plus size={16} />}>
          Thêm Role_Tag
        </Button>
      </form>

      {/* Bảng danh sách vai trò */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[500px] text-[14px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className={`${roleTh} w-16`}>STT</th>
              <th className={roleTh}>Tên vai trò (Role_Tag)</th>
              <th className={`${roleTh} text-right w-36`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[14px] text-slate-800">
            {roleTags.map((role, idx) => {
              const isEditing = editingRole === role;
              return (
                <tr key={role} className="transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 text-slate-500 tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-900">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className={`${inputClass} max-w-xs h-8 text-[13px]`}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(role)}
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                          title="Lưu"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100"
                          title="Hủy"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[13px] font-medium text-slate-700">
                        {role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {!isEditing && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(role)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="Đổi tên"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(role)}
                          className="rounded p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
