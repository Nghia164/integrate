// =============================================================================
// File: src/services/dashboardService.js
// Tầng: Dịch Vụ Dashboard (US28 - Manager)
// =============================================================================

import { buildDashboard } from "../mocks/dashboardMock.js";

export const subscribeDashboard = () => () => {};

export async function getDashboardStats(params) {
  return buildDashboard(params);
}

export default {
  subscribeDashboard,
  getDashboardStats,
};
