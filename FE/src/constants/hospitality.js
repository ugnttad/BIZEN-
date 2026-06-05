/** Bộ phận/nhóm mặc định cho quán cafe / trà sữa nhỏ ở Đà Nẵng (khớp BE tenants.repository). */
export const hospitalityDepartmentNames = [
  "Quản lý cửa hàng",
  "Pha chế",
  "Thu ngân",
  "Phục vụ / Order",
  "Topping / Bếp nhẹ",
  "Kho / Tạp vụ"
];

/** Chức vụ gợi ý cho quán cafe / trà sữa 10-20 nhân viên. */
export const hospitalityPositions = [
  "Chủ sở hữu",
  "Quản lý cửa hàng",
  "Quản lý ca",
  "Trưởng ca",
  "Pha chế",
  "Barista",
  "Pha chế trà sữa",
  "Nhân viên topping",
  "Thu ngân",
  "Order",
  "Phục vụ",
  "Runner",
  "Nhân viên bán hàng",
  "Thủ kho",
  "Tạp vụ",
  "Giao hàng",
  "Bảo vệ"
];

export const contractTypes = [
  { value: "Toàn thời gian", label: "Toàn thời gian" },
  { value: "Bán thời gian", label: "Bán thời gian" },
  { value: "Thời vụ", label: "Thời vụ (mùa / sự kiện)" },
  { value: "Thử việc", label: "Thử việc" }
];

export const payTypes = [
  { value: "Monthly", label: "Theo tháng" },
  { value: "Hourly", label: "Theo giờ" }
];

export const employeeRoles = [
  { value: "Employee", label: "Nhân viên" },
  { value: "Admin", label: "Chủ sở hữu" }
];

export const cafeShopConstraints = {
  minRecommendedEmployees: 10,
  maxActiveEmployees: 20,
  maxOwners: 1,
  minBaseSalary: 1000000,
  maxBaseSalary: 30000000,
  minHourlyRate: 10000,
  maxHourlyRate: 500000,
  passwordPattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
  phonePattern: /^0?\d{9,10}$/
};
