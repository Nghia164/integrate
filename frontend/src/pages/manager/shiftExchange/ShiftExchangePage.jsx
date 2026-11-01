/**
 * Tầng: Trang quản lý (Manager / Shift Exchange)
 * Chức năng: Đối soát và phê duyệt yêu cầu đổi ca giữa nhân viên (US15, US16, US17)
 * Quy tắc: Dùng chung PageCard (tiêu đề h1 ở hàng 1, mô tả ở hàng 2)
 */

import { useEffect, useMemo, useState } from "react";
import {
  getExchangeRequests,
  managerApproveExchange,
  managerRejectExchange,
  subscribeShiftExchange,
} from "../../../services/shiftExchangeService";
import { PageCard, Pagination } from "../../../components/PageKit";
import { EmptyState } from "../../../components/TableKit";
import { ExchangeDetailModal, RejectModal } from "./ExchangeModals";
import ExchangeToolbar from "./ExchangeToolbar";
import ExchangeTable from "./ExchangeTable";
import { DEFAULT_FILTERS, NOTICE_STYLE, PAGE_SIZES, TABS, inTab } from "./exchangeShared";
import { matchesSearch } from "../../../lib/searchUtils";

export default function ShiftExchangePage() {
  const [requests, setRequests] = useState(getExchangeRequests);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const [detail, setDetail] = useState(null); // yêu cầu đang xem chi tiết
  const [rejecting, setRejecting] = useState(null); // yêu cầu đang từ chối
  const [notice, setNotice] = useState(null); // { message, type } hoặc null

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const unsub = subscribeShiftExchange(() => {
      setRequests(getExchangeRequests());
    });
    return unsub;
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const approve = (id) => {
    try {
      managerApproveExchange(id);
      setNotice({ message: "Đã phê duyệt yêu cầu đổi ca", type: "success" });
      setDetail(null);
    } catch (e) {
      setNotice({ message: e.message || "Phê duyệt thất bại", type: "error" });
    }
  };

  const reject = (id, reason) => {
    try {
      managerRejectExchange(id, reason);
      setNotice({ message: "Đã từ chối yêu cầu đổi ca", type: "success" });
      setRejecting(null);
      setDetail(null);
    } catch (e) {
      setNotice({ message: e.message || "Từ chối thất bại", type: "error" });
    }
  };

  const counts = useMemo(() => {
    const acc = {};
    TABS.forEach((t) => {
      const id = Array.isArray(t) ? t[0] : t.id ?? t.value;
      acc[id] = requests.filter((r) => inTab(r, id)).length;
    });
    return acc;
  }, [requests]);

  const rows = useMemo(() => {
    return requests.filter((r) => {
      // Lọc theo tab trạng thái
      if (filters.status && filters.status !== "all" && !inTab(r, filters.status)) {
        return false;
      }
      // Lọc theo vai trò (hỗ trợ cả tên tiếng Việt và Role_Tag)
      if (filters.role && filters.role !== "all") {
        const matchReq = r.requesterRole === filters.role || r.requesterRoleTag === filters.role;
        const matchTgt =
          r.targetEmployeeRole === filters.role ||
          r.targetEmployeeRoleTag === filters.role ||
          r.targetRoleTag === filters.role;
        if (!matchReq && !matchTgt) {
          return false;
        }
      }
      // Tìm kiếm theo từ khóa (hỗ trợ có dấu và không dấu, mã yêu cầu, mã NV, tên, lý do, ca)
      if (
        filters.q &&
        !matchesSearch(filters.q, [
          r.id,
          r.requesterName,
          r.sender_name,
          r.targetEmployeeName,
          r.targetName,
          r.recipient_name,
          r.requesterId,
          r.sender_id,
          r.targetEmployeeId,
          r.recipient_id,
          r.reason,
          r.note,
          r.requesterRole,
          r.targetEmployeeRole,
        ])
      ) {
        return false;
      }
      return true;
    });
  }, [requests, filters]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <PageCard
      icon="swap"
      breadcrumb={["Duyệt yêu cầu", "Đổi ca"]}
      title="Đổi ca"
      subtitle="Xem xét, đối soát ràng buộc và phê duyệt các yêu cầu hoán đổi ca giữa các nhân viên."
    >
      <div>
        {notice && (
          <div
            role={notice.type === "error" ? "alert" : "status"}
            className={`mb-4 rounded-lg border px-4 py-3 text-[14px] ${NOTICE_STYLE[notice.type] ?? NOTICE_STYLE.success}`}
          >
            {notice.message}
          </div>
        )}

        {/* TAB TRẠNG THÁI + BỘ LỌC */}
        <ExchangeToolbar filters={filters} onChange={handleFilterChange} counts={counts} />

        {/* BẢNG */}
        {rows.length === 0 ? (
          <EmptyState
            title="Không tìm thấy kết quả phù hợp"
            description="Thử thay đổi từ khóa hoặc bộ lọc"
            onClear={() => handleFilterChange(DEFAULT_FILTERS)}
            canClear={JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)}
          />
        ) : (
          <ExchangeTable
            rows={pageRows}
            onOpen={setDetail}
            onApprove={approve}
            onReject={setRejecting}
          />
        )}

        {/* PHÂN TRANG */}
        {rows.length > 0 && (
          <Pagination
            page={safePage}
            pageCount={pageCount}
            pageSize={pageSize}
            total={rows.length}
            unit="yêu cầu"
            sizes={PAGE_SIZES}
            onPage={setPage}
            onPageSize={handlePageSizeChange}
          />
        )}
      </div>

      <ExchangeDetailModal
        req={detail}
        onClose={() => setDetail(null)}
        onApprove={approve}
        onReject={(req) => {
          setDetail(null);
          setRejecting(req);
        }}
      />

      <RejectModal
        key={rejecting?.id}
        req={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => rejecting && reject(rejecting.id, reason)}
      />
    </PageCard>
  );
}
