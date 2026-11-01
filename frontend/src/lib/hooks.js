/**
 * File: src/lib/hooks.js
 * Các React hook dùng chung toàn hệ thống
 */

import { useState, useMemo, useEffect, useRef } from "react";

export function usePagination(items = [], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    total,
    pageCount,
    pagedItems,
    resetPage: () => setPage(1),
  };
}

export function useLiveData(onSync, deps = [], options = {}) {
  const { enabled = true, intervalMs = 0 } = options;
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  });

  useEffect(() => {
    if (!enabled) return;

    let debounceTimer = null;
    const triggerSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          onSyncRef.current?.();
        } catch (err) {
          console.error("Lỗi đồng bộ trong useLiveData:", err);
        }
      }, 50);
    };

    const handleStorage = (e) => {
      if (!e.key || e.key.includes("SMART_SCHEDULING")) {
        triggerSync();
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleCustom = () => {
      triggerSync();
    };
    window.addEventListener("smart_scheduling_db_changed", handleCustom);

    let bc = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel("smart_scheduling_live_sync");
        bc.onmessage = () => triggerSync();
      } catch {
        /* ignore */
      }
    }

    let pollTimer = null;
    if (intervalMs && intervalMs > 0) {
      pollTimer = setInterval(triggerSync, intervalMs);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("smart_scheduling_db_changed", handleCustom);
      if (bc) {
        try {
          bc.close();
        } catch {
          /* ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);
}
