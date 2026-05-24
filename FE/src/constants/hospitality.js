/** Bộ phận/nhóm mặc định khi tạo tenant F&B / khách sạn (khớp BE tenants.repository). */
export const hospitalityDepartmentNames = [
  "Phục vụ",
  "Pha chế / Bar",
  "Bếp",
  "Thu ngân",
  "Lễ tân",
  "Buồng phòng",
  "Kho / Tạp vụ"
];

/** Chức vụ gợi ý cho quán cafe, nhà hàng, khách sạn nhỏ. */
export const hospitalityPositions = [
  "Phục vụ",
  "Pha chế",
  "Barista",
  "Đầu bếp",
  "Phụ bếp",
  "Thu ngân",
  "Lễ tân",
  "Nhân viên buồng phòng",
  "Quản lý ca",
  "Quản lý nhà hàng",
  "Giám sát bếp",
  "Nhân viên giao hàng",
  "Bảo vệ",
  "Kế toán cửa hàng",
  "Nhân sự"
];

export const contractTypes = [
  { value: "Toàn thời gian", label: "Toàn thời gian" },
  { value: "Bán thời gian", label: "Bán thời gian" },
  { value: "Thời vụ", label: "Thời vụ (mùa / sự kiện)" },
  { value: "Thử việc", label: "Thử việc" }
];

export const employeeRoles = [
  { value: "Employee", label: "Nhân viên" },
  { value: "Manager", label: "Quản lý ca" },
  { value: "HR", label: "Nhân sự (phụ quyền)" },
  { value: "Admin", label: "Admin doanh nghiệp" }
];
