/**
 * File: src/mocks/employeeMock.js
 * Dữ liệu nhân viên mẫu (Static Mock Data)
 */

export const mockEmployees = [
  {
    id: "NV001",
    userId: "USR-STF-001",
    name: "Nguyễn Văn An",
    phone: "0905123456",
    birthDate: "2002-05-12",
    roles: ["Phục vụ", "Thu ngân"],
    role: "Phục vụ",
    contract: "Toàn thời gian",
    hourlyWage: 35000,
    status: "Đang làm việc",
    email: "nguyenvanan@gmail.com",
    avatar: "",
    account: { email: "nguyenvanan@gmail.com", status: "active" },
  },
  {
    id: "NV002",
    userId: "USR-STF-002",
    name: "Trần Thị Bích",
    phone: "0912345678",
    birthDate: "2003-08-20",
    roles: ["Pha chế"],
    role: "Pha chế",
    contract: "Toàn thời gian",
    hourlyWage: 30000,
    status: "Đang làm việc",
    email: "tranthibich@gmail.com",
    avatar: "",
    account: { email: "tranthibich@gmail.com", status: "active" },
  },
  {
    id: "NV003",
    userId: "USR-STF-003",
    name: "Lê Minh Cường",
    phone: "0987654321",
    birthDate: "2001-11-03",
    roles: ["Thu ngân"],
    role: "Thu ngân",
    contract: "Bán thời gian",
    hourlyWage: 28000,
    status: "Đang làm việc",
    email: "leminhcuong@gmail.com",
    avatar: "",
    account: { email: "leminhcuong@gmail.com", status: "active" },
  },
  {
    id: "NV004",
    userId: "USR-STF-004",
    name: "Phạm Thị Dung",
    phone: "0934567890",
    birthDate: "2004-02-14",
    roles: ["Phục vụ"],
    role: "Phục vụ",
    contract: "Bán thời gian",
    hourlyWage: 25000,
    status: "Tạm nghỉ",
    email: "phamthidung@gmail.com",
    avatar: "",
    account: { email: "phamthidung@gmail.com", status: "active" },
  },
  {
    id: "NV005",
    userId: "USR-STF-005",
    name: "Hoàng Văn Nam",
    phone: "0978901234",
    birthDate: "2000-09-30",
    roles: ["Pha chế", "Phục vụ"],
    role: "Pha chế",
    contract: "Toàn thời gian",
    hourlyWage: 32000,
    status: "Đang làm việc",
    email: "hoangvannam@gmail.com",
    avatar: "",
    account: { email: "hoangvannam@gmail.com", status: "active" },
  },
  {
    id: "NV006",
    userId: "USR-STF-006",
    name: "Đỗ Kim Ngân",
    phone: "0965432109",
    birthDate: "2002-12-25",
    roles: ["Thu ngân"],
    role: "Thu ngân",
    contract: "Bán thời gian",
    hourlyWage: 28000,
    status: "Nghỉ việc",
    email: "dokimngan@gmail.com",
    avatar: "",
    account: { email: "dokimngan@gmail.com", status: "locked" },
  },
  {
    id: "NV007",
    userId: "USR-STF-007",
    name: "Vũ Minh Thảo",
    phone: "0943210987",
    birthDate: "2003-04-18",
    roles: ["Phục vụ"],
    role: "Phục vụ",
    contract: "Toàn thời gian",
    hourlyWage: 26000,
    status: "Đang làm việc",
    email: "vuminhthao@gmail.com",
    avatar: "",
    account: null,
  },
  {
    id: "NV008",
    userId: "USR-STF-008",
    name: "Đặng Hoàng Yến",
    phone: "0921098765",
    birthDate: "2001-07-09",
    roles: ["Pha chế"],
    role: "Pha chế",
    contract: "Bán thời gian",
    hourlyWage: 29000,
    status: "Đang làm việc",
    email: "danghoangyen@gmail.com",
    avatar: "",
    account: { email: "danghoangyen@gmail.com", status: "active" },
  },
];

export function getMockEmployees() {
  return JSON.parse(JSON.stringify(mockEmployees));
}

export function getMockEmployeeById(id) {
  return mockEmployees.find((e) => e.id === id) || null;
}

export const getEmployeeById = getMockEmployeeById;

export function getEmployeeCounts() {
  const total = mockEmployees.filter((e) => e.status !== "Nghỉ việc").length;
  const active = mockEmployees.filter((e) => e.status === "Đang làm việc").length;
  const onLeave = mockEmployees.filter((e) => e.status === "Tạm nghỉ" || e.status === "Nghỉ phép").length;
  const resigned = mockEmployees.filter((e) => e.status === "Nghỉ việc").length;
  return { total, active, onLeave, resigned };
}

export function getMockMyProfile(userOrParams) {
  const id = userOrParams?.employeeId || userOrParams?.id || "NV001";
  return getMockEmployeeById(id) || mockEmployees[0];
}

export default {
  mockEmployees,
  getMockEmployees,
  getMockEmployeeById,
  getEmployeeById,
  getEmployeeCounts,
  getMockMyProfile,
};

