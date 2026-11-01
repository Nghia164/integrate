// =============================================================================
// File: src/services/reportService.js
// Tầng: Dịch Vụ Báo Cáo (US29 - Manager)
// =============================================================================

import { buildReport, buildOverview } from "../mocks/reportMock.js";

export async function getReportData(type, params) {
  return buildReport(type, params);
}

export async function getReportOverview(params) {
  return buildOverview(params);
}

export default {
  getReportData,
  getReportOverview,
};
