import { computePayroll } from '../../src/mocks/payrollMock.js';
import { buildDashboard } from '../../src/mocks/dashboardMock.js';
import { buildReport } from '../../src/mocks/reportMock.js';

const p = computePayroll();
console.log('Payroll totals:', p.totals);

const d = buildDashboard({ from: '2026-10-26', to: '2026-11-01' });
console.log('Dashboard laborCost:', d.laborCost, 'cards.payrollCost:', d.cards?.payrollCost);

const rPay = buildReport('payroll', { from: '2026-10-26', to: '2026-11-01' });
console.log('Report payroll totals:', rPay.totals);

const rOverview = buildReport('overview', { period: 'week', from: '2026-10-26', to: '2026-11-01' });
console.log('Report overview laborCost:', rOverview.laborCost);
