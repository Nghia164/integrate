import { useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../../components/FormKit";
import { PageCard, Pagination, SearchInput, StatusTabs, Toolbar, Alert, inputClass } from "../../../components/PageKit";
import { EmptyState } from "../../../components/TableKit";
import EmployeeModalsContainer from "./EmployeesModals";
import EmployeeTable from "./components/EmployeeTable";
import { ROLES, CONTRACTS } from "./employeeShared";
import { STATUSES, PAGE_SIZES } from "./employeeData";
import { useEmployeeList } from "./hooks/useEmployeeList";
import { usePagination } from "../../../lib/hooks";


/**
 * Quản lý nhân viên (US03 / US04 / US05)
 */
export default function EmployeeListPage() {
  const {
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
  } = useEmployeeList();

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems: pageRows,
    resetPage,
  } = usePagination(rows, 7);

  // Về trang 1 khi đổi bộ lọc
  useEffect(() => {
    resetPage();
  }, [search, roleFilter, contractFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusTabs = useMemo(() => [["", "Tất cả"], ...STATUSES.map((s) => [s, s])], []);
  const statusCounts = useMemo(() => Object.fromEntries([["", countOf("")], ...STATUSES.map((s) => [s, countOf(s)])]), [countOf]);

  return (
    <>
      <PageCard
        icon="users"
        breadcrumb={["Nhân sự", "Danh sách nhân viên"]}
        title="Quản lý nhân viên"
        subtitle="Danh sách nhân viên và thông tin phục vụ việc xếp lịch."
        actions={<Button type="button" size="md" icon={<Plus size={16} />} onClick={() => openModal("add")}>Thêm nhân viên</Button>}
      >
        {notice && (
          <Alert tone="success" className="mb-4">
            {notice}
          </Alert>
        )}

        {/* TAB TRẠNG THÁI + BỘ LỌC (Toolbar chuẩn) */}
        <Toolbar
          tabs={
            <StatusTabs
              tabs={statusTabs}
              value={statusFilter}
              onChange={(s) => {
                setStatusFilter(s);
                resetPage();
              }}
              counts={statusCounts}
            />
          }
          search={
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                resetPage();
              }}
              placeholder="Tìm tên hoặc mã nhân viên..."
            />
          }
          filters={
            <>
              <select
                aria-label="Vai trò"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  resetPage();
                }}
                className={`${inputClass} w-44`}
              >
                <option value="">Tất cả vai trò</option>
                {ROLES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>

              <select
                aria-label="Loại hợp đồng"
                value={contractFilter}
                onChange={(e) => {
                  setContractFilter(e.target.value);
                  resetPage();
                }}
                className={`${inputClass} w-44`}
              >
                <option value="">Tất cả hợp đồng</option>
                {CONTRACTS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </>
          }
          onClear={() => {
            resetFilters();
            resetPage();
          }}
          canClear={canClear}
        />

        {/* BẢNG */}
        {rows.length === 0 ? (
          <EmptyState
            title="Không tìm thấy kết quả phù hợp"
            description="Thử thay đổi từ khóa hoặc bộ lọc"
            onClear={() => {
              resetFilters();
              resetPage();
            }}
            canClear={Boolean(canClear)}
          />
        ) : (
          <EmployeeTable
            pageRows={pageRows}
            onRowClick={(emp) => openModal("edit", emp)}
            menuItems={menuItems}
          />
        )}

        {/* PHÂN TRANG */}
        {rows.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            total={rows.length}
            unit="nhân viên"
            onPage={setPage}
            onPageSize={setPageSize}
            sizes={PAGE_SIZES}
          />
        )}
      </PageCard>

      <EmployeeModalsContainer
        modal={modal}
        employees={employees}
        selected={selected}
        form={form}
        error={error}
        created={created}
        isEmailTaken={isEmailTaken}
        closeModal={closeModal}
        handleChange={handleChange}
        handleAdd={handleAdd}
        handleUpdate={handleUpdate}
        handleCreateAccount={handleCreateAccount}
        confirmDelete={confirmDelete}
      />
    </>
  );
}
