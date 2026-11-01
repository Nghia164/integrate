// =============================================================================
// File: src/pages/notifications/NotificationsPage.jsx
// Tầng: Giao diện Thông báo (Notifications Page - US30)
// Dùng chung cho cả Manager (/manager/notifications) và Staff (/employees/notifications)
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../services/notificationService.js";
import { usePagination, useLiveData } from "../../lib/hooks.js";
import { formatRelativeTime } from "../../lib/formatters.js";
import { PageHeader, PageCard, SearchInput, StatusTabs, Pagination } from "../../components/PageKit.jsx";
import { Button } from "../../components/FormKit.jsx";
import { getNotificationIcon } from "../../components/NoticeKit.jsx";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isManager = user?.role === "manager";
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      const data = await getNotifications();
      const list = Array.isArray(data) ? data : (data?.notifications || []);
      setNotifications(list);
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLiveData(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      showToast("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch {
      showToast("Không thể đánh dấu đã đọc. Vui lòng thử lại.");
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.read_at && !notif.is_read) {
      try {
        await markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
      } catch {
        /* ignore */
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Lọc theo tab và tìm kiếm
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at && !n.is_read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const isUnread = !n.read_at && !n.is_read;
      if (tab === "unread" && !isUnread) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = (n.title || "").toLowerCase().includes(q);
        const contentMatch = (n.content || "").toLowerCase().includes(q);
        if (!titleMatch && !contentMatch) return false;
      }

      return true;
    });
  }, [notifications, tab, search]);

  const {
    page,
    setPage,
    pageSize,
    pageCount,
    pagedItems,
    resetPage,
  } = usePagination(filteredNotifications, 7);

  useEffect(() => {
    resetPage();
  }, [tab, search, resetPage]);

  const tabsConfig = [
    { id: "all", label: "Tất cả", count: notifications.length },
    { id: "unread", label: "Chưa đọc", count: unreadCount },
  ];

  const breadcrumbs = isManager
    ? [{ label: "Tổng quan", to: "/manager/dashboard" }, { label: "Thông báo" }]
    : [{ label: "Trang chủ", to: "/employees/schedule" }, { label: "Thông báo" }];

  return (
    <div className="space-y-5">
      {/* Toast thông báo */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-[14px] font-medium text-white shadow-xl animate-fade-in"
        >
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tiêu đề trang chuẩn PageHeader */}
      <PageHeader
        breadcrumbs={breadcrumbs}
        icon="bell"
        title="Thông báo"
        subtitle="Theo dõi các hoạt động, yêu cầu đổi ca, đơn nghỉ phép và lịch làm việc."
        actions={
          unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5"
            >
              <CheckCheck size={16} className="text-slate-600" />
              <span>Đánh dấu tất cả đã đọc</span>
            </Button>
          )
        }
      />

      <PageCard>
        {/* Thanh công cụ: Tabs trạng thái & Ô tìm kiếm */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <StatusTabs
            tabs={tabsConfig}
            activeTab={tab}
            onChange={setTab}
          />
          <div className="w-full sm:w-64">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm kiếm thông báo..."
            />
          </div>
        </div>

        {/* Danh sách thông báo */}
        {loading ? (
          <div className="py-16 text-center text-[14px] text-slate-500">
            Đang tải danh sách thông báo...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <Bell size={22} />
            </div>
            <p className="text-[14px] font-medium text-slate-800">Không có thông báo nào</p>
            <p className="mt-1 text-[13px] text-slate-500">
              {tab === "unread" ? "Bạn đã đọc hết mọi thông báo." : "Chưa có thông báo nào được gửi tới bạn."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pagedItems.map((n) => {
              const isUnread = !n.read_at && !n.is_read;
              return (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`group flex items-start gap-3.5 p-4 transition-colors cursor-pointer rounded-xl hover:bg-slate-50/80 ${
                    isUnread ? "bg-sky-50/30" : "bg-white"
                  }`}
                >
                  {/* Icon loại thông báo */}
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-colors">
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Nội dung thông báo */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[14px] ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-800"}`}>
                          {n.title}
                        </span>
                        {isUnread && (
                          <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                            Mới
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-slate-400 tabular-nums shrink-0">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>

                    {n.content && (
                      <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">
                        {n.content}
                      </p>
                    )}
                  </div>

                  {/* Hành động xem chi tiết */}
                  <div className="self-center pl-2 text-slate-400 group-hover:text-slate-700 transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phân trang */}
        {filteredNotifications.length > pageSize && (
          <Pagination
            page={page}
            onPage={setPage}
            pageCount={pageCount}
            total={filteredNotifications.length}
            pageSize={pageSize}
            unit="thông báo"
          />
        )}
      </PageCard>
    </div>
  );
}
