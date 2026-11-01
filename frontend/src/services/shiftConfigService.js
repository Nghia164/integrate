// =============================================================================
// File: src/services/shiftConfigService.js
// Tầng: Dịch Vụ Cấu Hình Ca (Shift Config Service)
// =============================================================================

import {
  getSavedShiftConfig as mockGetSavedShiftConfig,
  saveShiftConfigData as mockSaveShiftConfigData,
  getRoleTags as mockGetRoleTags,
  addRoleTag as mockAddRoleTag,
  updateRoleTag as mockUpdateRoleTag,
  deleteRoleTag as mockDeleteRoleTag,
  STANDARD_ROLES,
} from "../mocks/shiftConfigMock.js";

export { STANDARD_ROLES };

// Ca mẫu + ràng buộc lập lịch
export const getShiftConfig = async () => {
  return mockGetSavedShiftConfig();
};

export const saveShiftConfig = async (data) => {
  // BACKEND: Lưu cấu hình ca làm việc mẫu và các ràng buộc xếp lịch vào bảng shift_configs
  mockSaveShiftConfigData(data);
  return data;
};

// Danh mục vai trò (Role_Tag)
export const getRoleTags = async () => {
  return mockGetRoleTags();
};

export const addRoleTag = async (roleName) => {
  // BACKEND: Thêm vai trò mới vào bảng role_tags
  return mockAddRoleTag(roleName);
};

export const updateRoleTag = async (oldRole, newRole) => {
  // BACKEND: Cập nhật tên vai trò trong bảng role_tags và employee_roles
  return mockUpdateRoleTag(oldRole, newRole);
};

export const deleteRoleTag = async (roleName) => {
  // BACKEND: Xóa vai trò trong bảng role_tags (kiểm tra foreign key employee_roles)
  return mockDeleteRoleTag(roleName);
};

export default {
  getShiftConfig,
  saveShiftConfig,
  getRoleTags,
  addRoleTag,
  updateRoleTag,
  deleteRoleTag,
  STANDARD_ROLES,
};
