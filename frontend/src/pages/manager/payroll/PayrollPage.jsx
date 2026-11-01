// =============================================================================
// File: src/pages/manager/payroll/PayrollPage.jsx
// Tầng: Giao diện (Page) - Quản lý bảng lương và chốt sổ kỳ lương
// Liên quan: US27 (Bảng lương & Chốt kỳ lương)
// =============================================================================

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Loading } from "../../../components/FormKit";
import { ErrorMessage } from "../../../components/FormKit";
import { Button } from "../../../components/FormKit";
import { Table, EmptyState } from "../../../components/TableKit";
import { Modal } from "../../../components/FormKit";
import { StatusBadge } from "../../../components/TableKit";
import {
  PageCard,
  StatStrip,
  PeriodControl,
  DateRangeInputs,
  SearchInput,
  ExportButton,
  Toolbar,
  Alert,
  NoticeBar,
  Pagination,
  contractLabel,
  inputClass,
} from "../../../components/PageKit";
import PayrollDetailModal from "./PayrollDetailModal";
import { formatMoney, fmtHours } from "../../../lib/formatters";

import { PERIOD_OPTIONS, CONTRACTS, PAY_COLORS, I } from "./payrollData";
import { getPayrollColumns, getPayrollFooter } from "./payrollColumns";
import { exportPayrollExcel } from "./exportPayrollExcel";
import { usePayrollData } from "./hooks/usePayrollData";
import { usePagination } from "../../../lib/hooks";

import { lockPayrollPeriod, unlockPayrollPeriod } from "../../../services/payrollService";

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/**
 * US27 - Bảng lương (Manager)
 * Khôi phục đầy đủ 5 thẻ thống kê, bộ lọc, bảng, nút Chốt kỳ lương, Xuất Excel
 */
export default function PayrollPage() {
  const { user } = useAuth();
  const {
    period,
    setPeriod,
    month,
    setMonth,
    weekMonday,
    prevWeek,
    nextWeek,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    contract,
    setContract,
    search,
    setSearch,
    canClear,
    resetFilters,
    rangeError,
    query,
    data,
    rows,
    totals,
    missing,
    calculated,
    partial,
    loading,
    error,
    runCalculation,
  } = usePayrollData();

  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // "lock" | "unlock" | null
  const [lockLoading, setLockLoading] = useState(false);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pagedItems: pageRows,
    resetPage,
  } = usePagination(rows, 7);

  // Về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    resetPage();
  }, [period, month, weekMonday, fromDate, toDate, contract, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const share = (v) => (totals.total > 0 ? Math.round((v / totals.total) * 100) : 0);

  const statItems =
    calculated && !rangeError
      ? [
          {
            key: "employees",
            icon: <Icon d={I.users} />,
            dot: "#0F172A",
            label: "Số nhân viên",
            value: `${totals.employeeCount || 0} người`,
            note: totals.employeeCount > 0 ? "Có dòng phát sinh lương" : "Chưa có phát sinh",
            footer: (
              <>
                <span className="whitespace-nowrap">Tạm nghỉ:</span>
                <span className="font-semibold text-slate-500 tabular-nums whitespace-nowrap">0 công</span>
              </>
            ),
          },
          {
            key: "total",
            icon: <Icon d={I.wallet} />,
            dot: "#0F172A",
            label: "Tổng chi phí lương",
            value: formatMoney(totals.total || 0),
            note: `${totals.employeeCount || 0} nhân viên`,
            footer: (
              <>
                <span className="whitespace-nowrap">Trung bình/người:</span>
                <span className="font-semibold text-[#0F172A] tabular-nums whitespace-nowrap">
                  {totals.employeeCount > 0 ? formatMoney(Math.round(totals.total / totals.employeeCount)) : "0 ₫"}
                </span>
              </>
            ),
          },
          {
            key: "base",
            icon: <Icon d={I.coins} />,
            dot: PAY_COLORS.base,
            label: "Lương cơ bản",
            value: formatMoney(totals.basePay || 0),
            note: `${share(totals.basePay || 0)}% tổng quỹ`,
            footer: (
              <>
                <span className="whitespace-nowrap">Tỷ trọng:</span>
                <span className="font-semibold text-emerald-700 tabular-nums whitespace-nowrap">{share(totals.basePay || 0)}% tổng quỹ</span>
              </>
            ),
          },
          {
            key: "sur",
            icon: <Icon d={I.trend} />,
            dot: PAY_COLORS.surcharge,
            label: "Tăng theo hệ số",
            value: formatMoney(totals.surcharge || 0),
            note: `${share(totals.surcharge || 0)}% tổng quỹ`,
            footer: (
              <>
                <span className="whitespace-nowrap">Tỷ trọng:</span>
                <span className="font-semibold text-[#0F172A] tabular-nums whitespace-nowrap">{share(totals.surcharge || 0)}% tổng quỹ</span>
              </>
            ),
          },
          {
            key: "bonus",
            icon: <Icon d={I.gift} />,
            dot: PAY_COLORS.bonus,
            label: "Thưởng ca trực mở",
            value: formatMoney(totals.openShiftBonus || 0),
            note: `${share(totals.openShiftBonus || 0)}% tổng quỹ`,
            footer: (
              <>
                <span className="whitespace-nowrap">Tỷ trọng:</span>
                <span className="font-semibold text-purple-700 tabular-nums whitespace-nowrap">{share(totals.openShiftBonus || 0)}% tổng quỹ</span>
              </>
            ),
          },
          {
            key: "hours",
            icon: <Icon d={I.clock} />,
            dot: "#64748B",
            label: "Giờ thực tế",
            value: `${fmtHours(totals.actualHours || 0)} giờ`,
            note: `${totals.shiftCount || 0} ca đối soát`,
            footer: (
              <>
                <span className="whitespace-nowrap">Đơn giá TB:</span>
                <span className="font-semibold text-[#0F172A] tabular-nums whitespace-nowrap">
                  {totals.actualHours > 0 ? `${formatMoney(Math.round(totals.total / totals.actualHours))}/h` : "0 ₫/h"}
                </span>
              </>
            ),
          },
        ]
      : null;

  const handleRun = async () => {
    try {
      const d = await runCalculation();
      if (d) setNotice(`Đã tính lương ${d.periodLabel}`);
    } catch {
      // Error handled inside hook
    }
  };

  const handleExport = () => {
    if (!calculated || rows.length === 0) return;
    setExporting(true);
    setExportError("");
    try {
      exportPayrollExcel({ data, rows, totals, partial, search, contract, user });
    } catch {
      setExportError("Không tạo được file Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const handleToggleLock = async () => {
    if (!data?.periodKey) return;
    setLockLoading(true);
    try {
      if (confirmModal === "lock") {
        await lockPayrollPeriod(data.periodKey);
        setNotice(`Đã chốt sổ kỳ lương ${data.periodLabel} thành công.`);
      } else {
        await unlockPayrollPeriod(data.periodKey);
        setNotice(`Đã mở chốt kỳ lương ${data.periodLabel}. Bảng lương sẽ được tính lại.`);
      }
      setConfirmModal(null);
    } catch (err) {
      setExportError(err.message || "Thao tác chốt kỳ lương không thành công.");
      setConfirmModal(null);
    } finally {
      setLockLoading(false);
    }
  };

  const lockDisabledReason = useMemo(() => {
    if (loading || lockLoading) return "Đang xử lý dữ liệu...";
    if (rangeError) return rangeError;
    if (!calculated || rows.length === 0) return "Chưa có dữ liệu bảng lương để chốt sổ.";
    if (data?.isEnded === false) return "Kỳ lương chưa kết thúc (ngày hiện tại chưa qua ngày cuối kỳ), không thể chốt sổ.";
    if (data?.overlapError) return data.overlapError;
    return "";
  }, [loading, lockLoading, rangeError, calculated, rows.length, data]);

  const calcDisabledReason = useMemo(() => {
    if (loading) return "Đang tải dữ liệu...";
    if (rangeError) return rangeError;
    return "";
  }, [loading, rangeError]);

  const columns = getPayrollColumns({ onOpenDetail: setDetailId });
  const footer = getPayrollFooter(totals);

  return (
    <PageCard
      icon="wallet"
      breadcrumb={["Chấm công & Giờ làm", "Tính lương"]}
      title="Tính lương"
      subtitle="Tính lương theo giờ thực tế đã đối soát và hệ số ca"
      actions={
        <PeriodControl label="Kiểu chọn kỳ lương" options={PERIOD_OPTIONS} value={period} onChange={setPeriod}>
          {period === "month" ? (
            <input aria-label="Tháng/năm" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="min-w-[170px] bg-transparent text-[14px] outline-none cursor-pointer" />
          ) : period === "range" ? (
            <DateRangeInputs from={fromDate} to={toDate} onFrom={setFromDate} onTo={setToDate} />
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Tuần trước"
                onClick={prevWeek}
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold"
              >
                ‹
              </button>
              <span className="whitespace-nowrap tabular-nums text-[13.5px] font-medium">{data?.periodLabel ?? query.label ?? "—"}</span>
              <button
                type="button"
                aria-label="Tuần sau"
                onClick={nextWeek}
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold"
              >
                ›
              </button>
            </div>
          )}
        </PeriodControl>
      }
      stats={statItems && <StatStrip items={statItems} />}
      notices={
        missing > 0 && !rangeError && (
          <NoticeBar
            label="Cảnh báo"
            message={`Có ${missing} ca thiếu giờ ra nên đang được tính 0 giờ. Vào trang Chấm công, chọn “Điều chỉnh” để nhập giờ ra, bảng lương sẽ tự tính lại.`}
            badgeTone="warning"
            action={
              <Link to="/manager/attendance" className="font-semibold text-[#0F172A] underline underline-offset-2 hover:text-slate-600">
                Đến trang Chấm công
              </Link>
            }
          />
        )
      }
    >
      {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}

      {/* THANH CÔNG CỤ (Toolbar chuẩn) */}
      <Toolbar
        search={<SearchInput value={search} onChange={setSearch} />}
        filters={
          <select aria-label="Loại hợp đồng" value={contract} onChange={(e) => setContract(e.target.value)} className={`${inputClass} w-44`}>
            <option value="all">Tất cả hợp đồng</option>
            {CONTRACTS.map((c) => (
              <option key={c} value={c}>{contractLabel(c)}</option>
            ))}
          </select>
        }
        onClear={resetFilters}
        canClear={canClear}
        actions={
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <ExportButton onClick={handleExport} disabled={!calculated || rows.length === 0 || exporting || !!rangeError} loading={exporting} />
              <span title={calcDisabledReason || undefined} className="inline-block">
                <Button type="button" size="md" onClick={handleRun} disabled={Boolean(calcDisabledReason) || loading} loading={loading}>
                  Tính lương
                </Button>
              </span>
              {data?.isLocked ? (
                <Button type="button" variant="outline" size="md" onClick={() => setConfirmModal("unlock")} disabled={loading || lockLoading}>
                  Mở chốt
                </Button>
              ) : (
                <span title={lockDisabledReason || undefined} className="inline-block">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => {
                      if (data?.isEnded === false) {
                        setExportError("Kỳ lương chưa kết thúc (ngày hiện tại chưa qua ngày cuối kỳ), không thể chốt sổ.");
                        return;
                      }
                      if (data?.overlapError) {
                        setExportError(data.overlapError);
                        return;
                      }
                      setConfirmModal("lock");
                    }}
                    disabled={Boolean(lockDisabledReason) || loading || lockLoading}
                  >
                    Chốt kỳ lương
                  </Button>
                </span>
              )}
            </div>
            {lockDisabledReason && !data?.isLocked && calculated && (
              <p className="text-[12px] font-medium text-amber-700">
                * {lockDisabledReason}
              </p>
            )}
          </div>
        }
      />

      {(rangeError || exportError) && <Alert tone="error">{rangeError || exportError}</Alert>}

      {/* BẢNG */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
          <span className="font-medium text-slate-800">{calculated ? data.periodLabel : query.label ?? "—"}</span>
          {data?.isLocked && <StatusBadge tone="danger">Đã chốt</StatusBadge>}
          {partial && !data?.isLocked && <span className="font-medium text-amber-700">• Kỳ chưa kết thúc, số liệu tạm tính</span>}
          <span className="hidden lg:inline">• Bấm vào dòng để xem lương từng ca • Dữ liệu lương chỉ dùng nội bộ</span>
        </div>

        {error && <ErrorMessage message={error} />}
        {loading && !error && <Loading text="Đang tính lương..." />}
        {!loading && !error && rangeError && <p className="py-10 text-center text-[15px] text-slate-500">{rangeError}</p>}

        {!loading && !error && !rangeError && calculated &&
          (data.rows.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu trong kỳ đã chọn"
              description="Chưa có ca làm việc nào kết thúc để tính lương trong kỳ này."
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title="Không tìm thấy kết quả phù hợp"
              description="Thử thay đổi từ khóa hoặc bộ lọc"
              onClear={resetFilters}
              canClear={Boolean(canClear)}
            />
          ) : (
            <>
              <Table variant="clean" minWidth={1000} columns={columns} rows={pageRows} footer={footer} onRowClick={(r) => setDetailId(r.employeeId)} />
              <Pagination
                page={page}
                pageCount={pageCount}
                total={rows.length}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={setPageSize}
                unit="nhân viên"
              />
            </>
          ))}
      </div>

      <PayrollDetailModal open={!!detailId} employeeId={detailId} query={query} periodLabel={data?.periodLabel} onClose={() => setDetailId(null)} />

      {/* Hộp thoại xác nhận chốt / mở chốt kỳ lương */}
      <Modal open={Boolean(confirmModal)} title={confirmModal === "lock" ? "Xác nhận chốt kỳ lương" : "Xác nhận mở chốt kỳ lương"} onClose={() => !lockLoading && setConfirmModal(null)} maxWidth="max-w-md">
        <div className="space-y-4 text-[14px] text-slate-600">
          <p>
            {confirmModal === "lock"
              ? `Bạn có chắc chắn muốn chốt kỳ lương "${data?.periodLabel}"? Sau khi chốt, dữ liệu sẽ được lưu cố định làm snapshot và các thao tác sửa chấm công, đổi ca, duyệt nghỉ trong kỳ sẽ bị khóa.`
              : `Bạn có chắc chắn muốn mở chốt kỳ lương "${data?.periodLabel}"? Snapshot sẽ bị giải phóng và số liệu bảng lương sẽ được tính toán lại theo mức lương và chấm công mới nhất.`}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" onClick={() => setConfirmModal(null)} disabled={lockLoading}>Hủy</Button>
            <Button variant={confirmModal === "lock" ? "primary" : "outline"} size="md" onClick={handleToggleLock} loading={lockLoading}>
              {confirmModal === "lock" ? "Chốt kỳ lương" : "Mở chốt"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageCard>
  );
}
