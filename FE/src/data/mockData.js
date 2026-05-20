import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  UserRoundCog,
  UsersRound
} from "lucide-react";

export const departments = [
  { id: "sales", name: "Sales", targetHeadcount: 5 },
  { id: "hr", name: "HR", targetHeadcount: 3 },
  { id: "warehouse", name: "Warehouse", targetHeadcount: 4 },
  { id: "admin", name: "Admin", targetHeadcount: 3 },
  { id: "support", name: "Customer Support", targetHeadcount: 5 }
];

export const webNavItems = [
  { label: "Tổng quan", path: "/web/dashboard", icon: LayoutDashboard },
  { label: "Nhân viên", path: "/web/employees", icon: UsersRound },
  { label: "Chấm công", path: "/web/attendance", icon: Clock3 },
  { label: "Xếp ca AI", path: "/web/scheduling", icon: CalendarCheck2 },
  { label: "Bảng lương", path: "/web/payroll", icon: CreditCard },
  { label: "Nghỉ phép", path: "/web/leaves", icon: FileText },
  { label: "Báo cáo", path: "/web/reports", icon: BarChart3 },
  { label: "Trợ lý AI", path: "/web/assistant", icon: Sparkles },
  { label: "Cài đặt", path: "/web/settings", icon: Settings }
];

export const employees = [
  {
    id: "BZN001",
    name: "Nguyễn Minh Anh",
    department: "Sales",
    position: "Sales Lead",
    role: "Manager",
    contractType: "Full-time",
    baseSalary: 18000000,
    status: "Active",
    email: "minhanh@bizen.vn",
    phone: "0905 112 301",
    startDate: "2024-02-12",
    manager: "Lê Hoài Nam",
    shiftId: "morning",
    leaveRemaining: 8,
    address: "Hải Châu, Đà Nẵng"
  },
  {
    id: "BZN002",
    name: "Trần Quốc Bảo",
    department: "Sales",
    position: "Account Executive",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 13500000,
    status: "Active",
    email: "quocbao@bizen.vn",
    phone: "0905 112 302",
    startDate: "2024-04-08",
    manager: "Nguyễn Minh Anh",
    shiftId: "morning",
    leaveRemaining: 6,
    address: "Thanh Khê, Đà Nẵng"
  },
  {
    id: "BZN003",
    name: "Lê Thảo Vy",
    department: "Sales",
    position: "Account Executive",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 12800000,
    status: "Active",
    email: "thaovy@bizen.vn",
    phone: "0905 112 303",
    startDate: "2024-06-17",
    manager: "Nguyễn Minh Anh",
    shiftId: "afternoon",
    leaveRemaining: 9,
    address: "Sơn Trà, Đà Nẵng"
  },
  {
    id: "BZN004",
    name: "Phạm Gia Huy",
    department: "Sales",
    position: "Sales Associate",
    role: "Employee",
    contractType: "Part-time",
    baseSalary: 9000000,
    status: "Active",
    email: "giahuy@bizen.vn",
    phone: "0905 112 304",
    startDate: "2025-01-06",
    manager: "Nguyễn Minh Anh",
    shiftId: "evening",
    leaveRemaining: 5,
    address: "Ngũ Hành Sơn, Đà Nẵng"
  },
  {
    id: "BZN005",
    name: "Hoàng Mỹ Linh",
    department: "Sales",
    position: "Sales Associate",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 11200000,
    status: "On leave",
    email: "mylinh@bizen.vn",
    phone: "0905 112 305",
    startDate: "2023-11-21",
    manager: "Nguyễn Minh Anh",
    shiftId: "morning",
    leaveRemaining: 4,
    address: "Hải Châu, Đà Nẵng"
  },
  {
    id: "BZN006",
    name: "Đỗ Thanh Tâm",
    department: "HR",
    position: "HR Manager",
    role: "HR",
    contractType: "Full-time",
    baseSalary: 19000000,
    status: "Active",
    email: "thanhtam@bizen.vn",
    phone: "0905 112 306",
    startDate: "2023-05-04",
    manager: "Lê Hoài Nam",
    shiftId: "morning",
    leaveRemaining: 10,
    address: "Cẩm Lệ, Đà Nẵng"
  },
  {
    id: "BZN007",
    name: "Võ Ngọc Hân",
    department: "HR",
    position: "HR Executive",
    role: "HR",
    contractType: "Full-time",
    baseSalary: 12500000,
    status: "Active",
    email: "ngo h an@bizen.vn".replaceAll(" ", ""),
    phone: "0905 112 307",
    startDate: "2024-09-10",
    manager: "Đỗ Thanh Tâm",
    shiftId: "morning",
    leaveRemaining: 11,
    address: "Liên Chiểu, Đà Nẵng"
  },
  {
    id: "BZN008",
    name: "Nguyễn Bảo Châu",
    department: "HR",
    position: "Recruiter",
    role: "HR",
    contractType: "Full-time",
    baseSalary: 11800000,
    status: "Active",
    email: "baochau@bizen.vn",
    phone: "0905 112 308",
    startDate: "2024-10-14",
    manager: "Đỗ Thanh Tâm",
    shiftId: "morning",
    leaveRemaining: 7,
    address: "Sơn Trà, Đà Nẵng"
  },
  {
    id: "BZN009",
    name: "Phan Đức Khoa",
    department: "Warehouse",
    position: "Warehouse Supervisor",
    role: "Manager",
    contractType: "Full-time",
    baseSalary: 16000000,
    status: "Active",
    email: "duckhoa@bizen.vn",
    phone: "0905 112 309",
    startDate: "2023-08-02",
    manager: "Lê Hoài Nam",
    shiftId: "warehouse",
    leaveRemaining: 6,
    address: "Hòa Vang, Đà Nẵng"
  },
  {
    id: "BZN010",
    name: "Đặng Văn Lộc",
    department: "Warehouse",
    position: "Warehouse Staff",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 10500000,
    status: "Active",
    email: "vanloc@bizen.vn",
    phone: "0905 112 310",
    startDate: "2025-02-03",
    manager: "Phan Đức Khoa",
    shiftId: "warehouse",
    leaveRemaining: 8,
    address: "Cẩm Lệ, Đà Nẵng"
  },
  {
    id: "BZN011",
    name: "Mai Quang Tín",
    department: "Warehouse",
    position: "Warehouse Staff",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 10800000,
    status: "Active",
    email: "quangtin@bizen.vn",
    phone: "0905 112 311",
    startDate: "2024-12-12",
    manager: "Phan Đức Khoa",
    shiftId: "warehouse",
    leaveRemaining: 9,
    address: "Liên Chiểu, Đà Nẵng"
  },
  {
    id: "BZN012",
    name: "Bùi Kim Ngân",
    department: "Warehouse",
    position: "Inventory Staff",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 11000000,
    status: "Active",
    email: "kimngan@bizen.vn",
    phone: "0905 112 312",
    startDate: "2024-07-22",
    manager: "Phan Đức Khoa",
    shiftId: "afternoon",
    leaveRemaining: 6,
    address: "Thanh Khê, Đà Nẵng"
  },
  {
    id: "BZN013",
    name: "Lê Hoài Nam",
    department: "Admin",
    position: "Operations Admin",
    role: "Admin",
    contractType: "Full-time",
    baseSalary: 22000000,
    status: "Active",
    email: "hoainam@bizen.vn",
    phone: "0905 112 313",
    startDate: "2022-10-18",
    manager: "Board",
    shiftId: "morning",
    leaveRemaining: 12,
    address: "Hải Châu, Đà Nẵng"
  },
  {
    id: "BZN014",
    name: "Trần Nhật Minh",
    department: "Admin",
    position: "Finance Officer",
    role: "HR",
    contractType: "Full-time",
    baseSalary: 14500000,
    status: "Active",
    email: "nhatminh@bizen.vn",
    phone: "0905 112 314",
    startDate: "2024-03-11",
    manager: "Lê Hoài Nam",
    shiftId: "morning",
    leaveRemaining: 8,
    address: "Sơn Trà, Đà Nẵng"
  },
  {
    id: "BZN015",
    name: "Nguyễn Phương Mai",
    department: "Admin",
    position: "Office Coordinator",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 10200000,
    status: "On leave",
    email: "phuongmai@bizen.vn",
    phone: "0905 112 315",
    startDate: "2024-11-25",
    manager: "Lê Hoài Nam",
    shiftId: "morning",
    leaveRemaining: 3,
    address: "Ngũ Hành Sơn, Đà Nẵng"
  },
  {
    id: "BZN016",
    name: "Võ Khánh Linh",
    department: "Customer Support",
    position: "Support Lead",
    role: "Manager",
    contractType: "Full-time",
    baseSalary: 15500000,
    status: "Active",
    email: "khanhlinh@bizen.vn",
    phone: "0905 112 316",
    startDate: "2023-09-19",
    manager: "Lê Hoài Nam",
    shiftId: "afternoon",
    leaveRemaining: 7,
    address: "Hải Châu, Đà Nẵng"
  },
  {
    id: "BZN017",
    name: "Phạm Thanh Đạt",
    department: "Customer Support",
    position: "Support Specialist",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 10300000,
    status: "Active",
    email: "thanhdat@bizen.vn",
    phone: "0905 112 317",
    startDate: "2025-01-20",
    manager: "Võ Khánh Linh",
    shiftId: "afternoon",
    leaveRemaining: 5,
    address: "Thanh Khê, Đà Nẵng"
  },
  {
    id: "BZN018",
    name: "Hồ Thị Yến",
    department: "Customer Support",
    position: "Support Specialist",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 10000000,
    status: "Active",
    email: "thiyen@bizen.vn",
    phone: "0905 112 318",
    startDate: "2024-08-05",
    manager: "Võ Khánh Linh",
    shiftId: "evening",
    leaveRemaining: 9,
    address: "Cẩm Lệ, Đà Nẵng"
  },
  {
    id: "BZN019",
    name: "Châu Anh Thư",
    department: "Customer Support",
    position: "Support Specialist",
    role: "Employee",
    contractType: "Part-time",
    baseSalary: 8500000,
    status: "Active",
    email: "anhthu@bizen.vn",
    phone: "0905 112 319",
    startDate: "2025-03-03",
    manager: "Võ Khánh Linh",
    shiftId: "evening",
    leaveRemaining: 4,
    address: "Sơn Trà, Đà Nẵng"
  },
  {
    id: "BZN020",
    name: "Nguyễn Đức Long",
    department: "Customer Support",
    position: "Support Specialist",
    role: "Employee",
    contractType: "Full-time",
    baseSalary: 10600000,
    status: "Active",
    email: "duclong@bizen.vn",
    phone: "0905 112 320",
    startDate: "2024-05-13",
    manager: "Võ Khánh Linh",
    shiftId: "afternoon",
    leaveRemaining: 8,
    address: "Liên Chiểu, Đà Nẵng"
  }
];

export const shifts = [
  {
    id: "morning",
    name: "Ca sáng",
    time: "08:00 - 17:00",
    shortTime: "08:00",
    required: 8,
    color: "blue"
  },
  {
    id: "afternoon",
    name: "Ca chiều",
    time: "13:00 - 21:00",
    shortTime: "13:00",
    required: 6,
    color: "violet"
  },
  {
    id: "evening",
    name: "Ca tối",
    time: "18:00 - 22:00",
    shortTime: "18:00",
    required: 4,
    color: "indigo"
  },
  {
    id: "warehouse",
    name: "Kho sớm",
    time: "06:00 - 14:00",
    shortTime: "06:00",
    required: 4,
    color: "cyan"
  }
];

export const attendanceToday = [
  { employeeId: "BZN001", checkIn: "07:56", checkOut: "17:08", totalHours: 8.2, status: "Present", location: "Hải Châu", note: "Đúng giờ" },
  { employeeId: "BZN002", checkIn: "08:18", checkOut: "17:04", totalHours: 7.8, status: "Late", location: "Thanh Khê", note: "Trễ 18 phút" },
  { employeeId: "BZN003", checkIn: "12:55", checkOut: "21:02", totalHours: 8.1, status: "Present", location: "Sơn Trà", note: "Đúng giờ" },
  { employeeId: "BZN004", checkIn: "17:52", checkOut: "22:45", totalHours: 4.9, status: "Overtime", location: "Ngũ Hành Sơn", note: "OT 45 phút" },
  { employeeId: "BZN005", checkIn: "-", checkOut: "-", totalHours: 0, status: "Leave", location: "-", note: "Nghỉ phép đã duyệt" },
  { employeeId: "BZN006", checkIn: "07:48", checkOut: "17:05", totalHours: 8.3, status: "Present", location: "Cẩm Lệ", note: "Đúng giờ" },
  { employeeId: "BZN007", checkIn: "07:59", checkOut: "17:01", totalHours: 8.0, status: "Present", location: "Liên Chiểu", note: "Đúng giờ" },
  { employeeId: "BZN008", checkIn: "08:31", checkOut: "17:15", totalHours: 7.7, status: "Late", location: "Sơn Trà", note: "Trễ 31 phút" },
  { employeeId: "BZN009", checkIn: "05:54", checkOut: "14:08", totalHours: 8.2, status: "Present", location: "Hòa Vang", note: "Đúng giờ" },
  { employeeId: "BZN010", checkIn: "-", checkOut: "-", totalHours: 0, status: "Absent", location: "-", note: "Chưa có đơn" },
  { employeeId: "BZN011", checkIn: "05:58", checkOut: "15:20", totalHours: 9.1, status: "Overtime", location: "Liên Chiểu", note: "OT 80 phút" },
  { employeeId: "BZN012", checkIn: "12:58", checkOut: "21:04", totalHours: 8.1, status: "Present", location: "Thanh Khê", note: "Đúng giờ" },
  { employeeId: "BZN013", checkIn: "07:50", checkOut: "17:20", totalHours: 8.5, status: "Present", location: "Hải Châu", note: "Đúng giờ" },
  { employeeId: "BZN014", checkIn: "08:00", checkOut: "17:03", totalHours: 8.0, status: "Present", location: "Sơn Trà", note: "Đúng giờ" },
  { employeeId: "BZN015", checkIn: "-", checkOut: "-", totalHours: 0, status: "Leave", location: "-", note: "Nghỉ phép đã duyệt" },
  { employeeId: "BZN016", checkIn: "12:50", checkOut: "21:06", totalHours: 8.2, status: "Present", location: "Hải Châu", note: "Đúng giờ" },
  { employeeId: "BZN017", checkIn: "13:22", checkOut: "21:01", totalHours: 7.4, status: "Late", location: "Thanh Khê", note: "Trễ 22 phút" },
  { employeeId: "BZN018", checkIn: "17:54", checkOut: "22:03", totalHours: 4.1, status: "Present", location: "Cẩm Lệ", note: "Đúng giờ" },
  { employeeId: "BZN019", checkIn: "17:58", checkOut: "-", totalHours: 3.2, status: "Present", location: "Sơn Trà", note: "Thiếu check-out" },
  { employeeId: "BZN020", checkIn: "12:49", checkOut: "22:20", totalHours: 9.5, status: "Overtime", location: "Liên Chiểu", note: "OT 90 phút" }
];

export const weeklyAttendance = [
  { day: "T2", present: 18, late: 2, leave: 1, absent: 1 },
  { day: "T3", present: 17, late: 3, leave: 2, absent: 1 },
  { day: "T4", present: 16, late: 3, leave: 2, absent: 1 },
  { day: "T5", present: 18, late: 1, leave: 1, absent: 0 },
  { day: "T6", present: 17, late: 2, leave: 1, absent: 0 },
  { day: "T7", present: 11, late: 1, leave: 0, absent: 0 }
];

export const payrollTrend = [
  { month: "01/26", payroll: 238000000, overtime: 11200000 },
  { month: "02/26", payroll: 244000000, overtime: 13600000 },
  { month: "03/26", payroll: 251000000, overtime: 15100000 },
  { month: "04/26", payroll: 247000000, overtime: 12800000 },
  { month: "05/26", payroll: 256800000, overtime: 17300000 }
];

export const departmentHeadcount = [
  { department: "Sales", employees: 5, productivity: 88, leaveRate: 5 },
  { department: "HR", employees: 3, productivity: 92, leaveRate: 3 },
  { department: "Warehouse", employees: 4, productivity: 84, leaveRate: 4 },
  { department: "Admin", employees: 3, productivity: 89, leaveRate: 6 },
  { department: "Support", employees: 5, productivity: 86, leaveRate: 5 }
];

export const scheduleWeek = [
  {
    date: "18/05",
    day: "Thứ 2",
    shifts: [
      { shiftId: "morning", employees: ["BZN001", "BZN002", "BZN006", "BZN007", "BZN013", "BZN014"] },
      { shiftId: "afternoon", employees: ["BZN003", "BZN012", "BZN016", "BZN017"] },
      { shiftId: "evening", employees: ["BZN004", "BZN018", "BZN019"] },
      { shiftId: "warehouse", employees: ["BZN009", "BZN010", "BZN011"] }
    ]
  },
  {
    date: "19/05",
    day: "Thứ 3",
    shifts: [
      { shiftId: "morning", employees: ["BZN001", "BZN002", "BZN006", "BZN008", "BZN013"] },
      { shiftId: "afternoon", employees: ["BZN003", "BZN012", "BZN016", "BZN020"] },
      { shiftId: "evening", employees: ["BZN004", "BZN018", "BZN019"] },
      { shiftId: "warehouse", employees: ["BZN009", "BZN010", "BZN011"] }
    ]
  },
  {
    date: "20/05",
    day: "Hôm nay",
    shifts: [
      { shiftId: "morning", employees: ["BZN001", "BZN002", "BZN006", "BZN007", "BZN008", "BZN013", "BZN014"] },
      { shiftId: "afternoon", employees: ["BZN003", "BZN012", "BZN016", "BZN017", "BZN020"] },
      { shiftId: "evening", employees: ["BZN004", "BZN018", "BZN019"] },
      { shiftId: "warehouse", employees: ["BZN009", "BZN010", "BZN011"] }
    ]
  },
  {
    date: "21/05",
    day: "Thứ 5",
    shifts: [
      { shiftId: "morning", employees: ["BZN001", "BZN002", "BZN006", "BZN007", "BZN013", "BZN014"] },
      { shiftId: "afternoon", employees: ["BZN003", "BZN012", "BZN016", "BZN017"] },
      { shiftId: "evening", employees: ["BZN004", "BZN018", "BZN020"] },
      { shiftId: "warehouse", employees: ["BZN009", "BZN011"] }
    ]
  },
  {
    date: "22/05",
    day: "Thứ 6",
    shifts: [
      { shiftId: "morning", employees: ["BZN001", "BZN002", "BZN006", "BZN008", "BZN013", "BZN014"] },
      { shiftId: "afternoon", employees: ["BZN003", "BZN012", "BZN016", "BZN017", "BZN020"] },
      { shiftId: "evening", employees: ["BZN004", "BZN018", "BZN019"] },
      { shiftId: "warehouse", employees: ["BZN009", "BZN010", "BZN011"] }
    ]
  },
  {
    date: "23/05",
    day: "Thứ 7",
    shifts: [
      { shiftId: "morning", employees: ["BZN001", "BZN006", "BZN013"] },
      { shiftId: "afternoon", employees: ["BZN016", "BZN020"] },
      { shiftId: "evening", employees: ["BZN018", "BZN019"] },
      { shiftId: "warehouse", employees: ["BZN009", "BZN011"] }
    ]
  },
  {
    date: "24/05",
    day: "CN",
    shifts: [
      { shiftId: "morning", employees: ["BZN006", "BZN013"] },
      { shiftId: "afternoon", employees: ["BZN016"] },
      { shiftId: "evening", employees: ["BZN018"] },
      { shiftId: "warehouse", employees: ["BZN009"] }
    ]
  }
];

export const aiScheduleReasons = [
  "Không xếp Hoàng Mỹ Linh và Nguyễn Phương Mai vì đang nghỉ phép.",
  "Giảm ca tối cho Phạm Gia Huy vì đã có 6.5 giờ OT trong tuần.",
  "Bổ sung Nguyễn Đức Long vào ca chiều Support để đủ 5 người.",
  "Giữ Phan Đức Khoa ở ca kho sớm để bảo toàn năng lực vận hành."
];

export const aiAlerts = [
  { id: 1, type: "warning", title: "Warehouse thiếu 1 người ngày 21/05", detail: "Ca kho sớm chỉ có 2/4 nhân sự khả dụng." },
  { id: 2, type: "danger", title: "3 nhân viên đi trễ hôm nay", detail: "Quốc Bảo, Bảo Châu, Thanh Đạt cần HR nhắc nhở." },
  { id: 3, type: "info", title: "OT Support tăng 14%", detail: "Ca chiều đang vượt ngưỡng 40 giờ/tuần." }
];

export const payrollRows = employees.map((employee, index) => {
  const workingDays = [22, 21, 22, 20, 0, 22, 22, 21, 22, 18, 22, 22, 22, 22, 0, 22, 21, 22, 20, 22][index];
  const overtimeHours = [4, 0, 2, 7, 0, 1, 0, 0, 3, 0, 8, 2, 4, 1, 0, 5, 0, 1, 2, 9][index];
  const bonus = [1200000, 400000, 600000, 300000, 0, 900000, 300000, 200000, 700000, 0, 650000, 350000, 1500000, 500000, 0, 800000, 200000, 250000, 100000, 900000][index];
  const deduction = [0, 350000, 0, 0, 480000, 0, 0, 420000, 0, 900000, 0, 0, 0, 0, 460000, 0, 380000, 0, 0, 0][index];
  const dailyRate = employee.baseSalary / 22;
  const overtimePay = overtimeHours * (dailyRate / 8) * 1.5;
  const finalSalary = Math.round(dailyRate * workingDays + overtimePay + bonus - deduction);
  const statuses = ["Paid", "Draft", "Reviewed", "Approved", "Draft", "Paid", "Reviewed", "Reviewed", "Approved", "Draft", "Paid", "Reviewed", "Paid", "Approved", "Draft", "Reviewed", "Draft", "Reviewed", "Draft", "Approved"];

  return {
    employeeId: employee.id,
    month: "05/2026",
    baseSalary: employee.baseSalary,
    workingDays,
    overtimeHours,
    overtimePay: Math.round(overtimePay),
    bonus,
    deduction,
    finalSalary,
    status: statuses[index]
  };
});

export const leaveRequests = [
  {
    id: "LR-1001",
    employeeId: "BZN005",
    type: "Annual leave",
    from: "20/05/2026",
    to: "21/05/2026",
    days: 2,
    reason: "Việc gia đình",
    status: "Approved",
    approver: "Nguyễn Minh Anh"
  },
  {
    id: "LR-1002",
    employeeId: "BZN015",
    type: "Sick leave",
    from: "20/05/2026",
    to: "20/05/2026",
    days: 1,
    reason: "Khám sức khỏe",
    status: "Approved",
    approver: "Lê Hoài Nam"
  },
  {
    id: "LR-1003",
    employeeId: "BZN017",
    type: "Annual leave",
    from: "23/05/2026",
    to: "23/05/2026",
    days: 1,
    reason: "Việc cá nhân",
    status: "Pending",
    approver: "Võ Khánh Linh"
  },
  {
    id: "LR-1004",
    employeeId: "BZN011",
    type: "Unpaid leave",
    from: "24/05/2026",
    to: "24/05/2026",
    days: 1,
    reason: "Nghỉ không lương",
    status: "Pending",
    approver: "Phan Đức Khoa"
  },
  {
    id: "LR-1005",
    employeeId: "BZN003",
    type: "Annual leave",
    from: "18/05/2026",
    to: "18/05/2026",
    days: 1,
    reason: "Bận cá nhân",
    status: "Rejected",
    approver: "Nguyễn Minh Anh"
  }
];

export const notifications = [
  { id: 1, title: "Nhắc check-in", body: "Ca chiều bắt đầu lúc 13:00", time: "12:30", type: "reminder" },
  { id: 2, title: "Lịch làm mới", body: "Bạn được xếp ca chiều ngày 22/05", time: "09:15", type: "schedule" },
  { id: 3, title: "Đơn nghỉ phép", body: "Đơn LR-1003 đang chờ duyệt", time: "Hôm qua", type: "leave" },
  { id: 4, title: "Bảng lương", body: "Bảng lương tháng 05/2026 đang ở trạng thái Draft", time: "18/05", type: "payroll" }
];

export const mobileEmployeeId = "BZN017";

export const attendanceHistory = [
  { date: "20/05/2026", shift: "Ca chiều", checkIn: "13:22", checkOut: "21:01", hours: 7.4, status: "Late" },
  { date: "19/05/2026", shift: "Ca chiều", checkIn: "12:58", checkOut: "21:02", hours: 8.1, status: "Present" },
  { date: "18/05/2026", shift: "Ca chiều", checkIn: "13:04", checkOut: "21:00", hours: 7.9, status: "Present" },
  { date: "17/05/2026", shift: "Ca tối", checkIn: "17:55", checkOut: "22:06", hours: 4.2, status: "Overtime" }
];

export const roleDashboards = [
  { role: "Admin", focus: "Chi phí, cấu hình, cảnh báo rủi ro" },
  { role: "HR", focus: "Chấm công, hồ sơ, lương, nghỉ phép" },
  { role: "Manager", focus: "Ca làm, hiệu suất, thiếu nhân sự" },
  { role: "Employee", focus: "Check-in, lịch làm, lương, phép" }
];
