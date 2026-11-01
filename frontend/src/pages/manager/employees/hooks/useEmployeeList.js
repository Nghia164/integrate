import { useState, useEffect, useMemo } from "react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  terminateEmployee,
  reactivateEmployee,
  resetPassword,
  subscribeEmployees,
} from "../../../../services/employeeService";
import { generateTempPassword } from "../../../../lib/formatters";
import { matchesSearch } from "../../../../lib/searchUtils";
import {
  validateName,
  validatePhone,
  validateEmail,
  validateHourlyWage,
} from "../../../../lib/validators";

/**
 * Hook quản lý danh sách và nghiệp vụ CRUD nhân viên (US03 / US04 / US05)
 */
export function useEmployeeList() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = () => {
      getEmployees()
        .then((data) => {
          if (isMounted) setEmployees(data || []);
        })
        .catch((err) => console.error("Lỗi tải danh sách nhân viên:", err));
    };

    loadData();
    const unsub = subscribeEmployees(loadData);
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Bộ lọc
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal state: null | "add" | "edit" | "account" | "success" | "delete"
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const baseFiltered = useMemo(
    () =>
      employees.filter(
        (e) =>
          matchesSearch(search, [
            e.id,
            e.name,
            ...(Array.isArray(e.roles) ? e.roles : [e.role]),
            e.phone,
            e.email,
            e.account?.email,
            e.contract,
            e.status,
          ]) &&
          (!roleFilter || (e.roles ? e.roles.includes(roleFilter) : e.role === roleFilter)) &&
          (!contractFilter || e.contract === contractFilter)
      ),
    [employees, search, roleFilter, contractFilter]
  );

  const rows = useMemo(
    () =>
      baseFiltered.filter((e) =>
        !statusFilter ? e.status !== "Nghỉ việc" : e.status === statusFilter
      ),
    [baseFiltered, statusFilter]
  );

  // Thống kê đếm chuẩn: "Tất cả" = toàn bộ nhân viên trừ "Nghỉ việc"
  const countOf = (s) =>
    s
      ? baseFiltered.filter((e) => e.status === s).length
      : baseFiltered.filter((e) => e.status !== "Nghỉ việc").length;
  const canClear = search || roleFilter || contractFilter || statusFilter;

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setContractFilter("");
    setStatusFilter("");
  };

  const openModal = (type, emp = null) => {
    setSelected(emp);
    setError("");
    const defaultRoles = emp?.roles || (emp?.role ? [emp.role] : ["Phục vụ"]);
    setForm(
      emp
        ? {
            ...emp,
            roles: defaultRoles,
            role: defaultRoles[0] || "Phục vụ",
            email: emp.account?.email || emp.email || "",
            password: "", // Để trống khi sửa theo yêu cầu bảo mật
            hourlyWage: emp.hourlyWage ?? 28000,
            changePasswordFirstLogin: true,
          }
        : {
            roles: ["Phục vụ"],
            role: "Phục vụ",
          }
    );
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError("");
    setCreated(null); // US02: Đóng dialog là xóa mật khẩu tạm, không thể xem lại được nữa
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const isEmailTaken = (email, exceptId) =>
    employees.some(
      (e) => e.id !== exceptId && e.account?.email?.toLowerCase() === email.trim().toLowerCase()
    );

  const handleAdd = async (emp) => {
    const roles = emp.roles || (emp.role ? [emp.role] : []);
    if (roles.length === 0) {
      setError("Nhân viên phải có ít nhất một Role_Tag");
      return;
    }
    try {
      const added = await createEmployee({
        ...emp,
        roles,
        role: roles[0] || "Phục vụ",
      });
      if (emp.account) {
        setCreated({
          name: added.name,
          email: emp.account.email,
          tempPassword: emp.account.tempPassword,
          isReset: false,
        });
        setModal("success");
      } else {
        setNotice(`Đã thêm nhân viên ${added.name}.`);
      }
    } catch (err) {
      setError(err.message || "Lỗi khi thêm nhân viên.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const hasAccount = !!selected.account;
    const nameCheck = validateName(form.name);
    if (!nameCheck.valid) return setError(nameCheck.error);
    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) return setError(phoneCheck.error);
    const roles = form.roles || (form.role ? [form.role] : []);
    if (roles.length === 0) return setError("Nhân viên phải có ít nhất một Role_Tag");
    if (hasAccount) {
      const emailCheck = validateEmail(form.email);
      if (!emailCheck.valid) return setError(emailCheck.error);
      if (isEmailTaken(form.email, selected.id))
        return setError("Email đã được sử dụng.");
    }

    const wageCheck = form.hourlyWage ? validateHourlyWage(form.hourlyWage) : { valid: true, value: selected.hourlyWage || 28000 };
    if (!wageCheck.valid) return setError(wageCheck.error);

    try {
      await updateEmployee(selected.id, {
        ...selected,
        name: nameCheck.value,
        phone: phoneCheck.value,
        birthDate: form.birthDate,
        contract: form.contract,
        roles,
        role: roles[0] || "Phục vụ",
        hourlyWage: wageCheck.value,
        status: form.status || selected.status,
        email: hasAccount ? form.email.trim() : selected.email,
      });
      setNotice(`Đã lưu thay đổi cho ${form.name.trim()}.`);
      closeModal();
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật nhân viên.");
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) return setError(emailCheck.error);
    if (isEmailTaken(form.email)) return setError("Email này đã được dùng cho tài khoản khác.");

    const tempPassword = generateTempPassword(10);
    try {
      await updateEmployee(selected.id, {
        account: {
          email: form.email.trim(),
          password: tempPassword,
          status: "active",
          mustChangePassword: true,
        },
      });
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selected.id
            ? {
                ...emp,
                account: {
                  email: form.email.trim(),
                  password: tempPassword,
                  status: "active",
                  mustChangePassword: true,
                },
              }
            : emp
        )
      );
      setCreated({
        name: selected.name,
        email: form.email.trim(),
        tempPassword,
        isReset: false,
      });
      setSelected(null);
      setModal("success");
    } catch (err) {
      setError(err.message || "Lỗi khi cấp tài khoản.");
    }
  };

  const handleResetPassword = async (emp) => {
    const tempPassword = generateTempPassword(10);
    try {
      await resetPassword(emp.id, tempPassword);
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id
            ? {
                ...e,
                account: {
                  ...(e.account || {}),
                  email: e.account?.email || e.email,
                  password: tempPassword,
                  status: "active",
                  mustChangePassword: true,
                },
              }
            : e
        )
      );
      setCreated({
        name: emp.name,
        email: emp.account?.email || emp.email,
        tempPassword,
        isReset: true,
      });
      setModal("success");
    } catch (err) {
      setNotice(`Lỗi khi đặt lại mật khẩu: ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    try {
      await terminateEmployee(selected.id);
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === selected.id
            ? { ...e, status: "Nghỉ việc", account: e.account ? { ...e.account, status: "locked" } : null }
            : e
        )
      );
      setNotice(`Đã chuyển ${selected.name} sang trạng thái nghỉ việc và giải phóng ca tương lai.`);
      closeModal();
    } catch (err) {
      setError(err.message || "Lỗi khi cho nghỉ việc.");
    }
  };

  const handleReactivate = async (emp) => {
    try {
      await reactivateEmployee(emp.id);
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id
            ? { ...e, status: "Đang làm việc", account: e.account ? { ...e.account, status: "active" } : null }
            : e
        )
      );
      setNotice(`Đã kích hoạt lại nhân viên ${emp.name}.`);
    } catch (err) {
      setError(err.message || "Lỗi khi kích hoạt lại.");
    }
  };

  const menuItems = (emp) => [
    { label: "Sửa thông tin", onClick: () => openModal("edit", emp) },
    ...(!emp.account ? [{ label: "Cấp tài khoản", onClick: () => openModal("account", emp) }] : []),
    ...(emp.account ? [{ label: "Đặt lại mật khẩu", onClick: () => handleResetPassword(emp) }] : []),
    ...(emp.status !== "Nghỉ việc"
      ? [{ label: "Cho nghỉ việc", danger: true, onClick: () => openModal("delete", emp) }]
      : [{ label: "Kích hoạt lại", onClick: () => handleReactivate(emp) }]),
  ];

  return {
    employees,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    contractFilter,
    setContractFilter,
    statusFilter,
    setStatusFilter,
    rows,
    countOf,
    canClear,
    resetFilters,
    modal,
    selected,
    form,
    error,
    created,
    notice,
    openModal,
    closeModal,
    handleChange,
    isEmailTaken,
    handleAdd,
    handleUpdate,
    handleCreateAccount,
    confirmDelete,
    menuItems,
  };
}
