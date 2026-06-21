export const ownerPositions = ["Chủ sở hữu", "Chủ doanh nghiệp", "Owner", "Founder"];

const adminPositions = ["Chủ sở hữu", "Quản lý vận hành", "Quản lý cửa hàng", "Quản lý chi nhánh", "Trưởng bộ phận"];

const genericPositions = [
  "Quản lý ca",
  "Trưởng ca",
  "Nhân viên vận hành",
  "Nhân viên bán hàng",
  "Chăm sóc khách hàng",
  "Kế toán",
  "Thủ kho",
  "Tạp vụ",
  "Bảo vệ"
];

const positionOptionsByDepartment = {
  "Quan ly cua hang": ["Quản lý vận hành", "Quản lý cửa hàng", "Quản lý ca", "Trưởng ca"],
  "Quan ly / van hanh": ["Quản lý vận hành", "Quản lý chi nhánh", "Trưởng bộ phận", "Quản lý ca"],
  "Van phong / nhan su": ["Nhân sự", "Kế toán", "Hành chính", "Chăm sóc khách hàng"],
  "Hanh chinh / van phong": ["Nhân sự", "Kế toán", "Hành chính", "Chăm sóc khách hàng"],
  "Pha che": ["Pha chế", "Barista", "Pha chế trà sữa", "Trưởng ca pha chế"],
  "Pha che / Bar": ["Pha chế", "Barista", "Pha chế trà sữa", "Bartender", "Trưởng ca pha chế"],
  "Thu ngan": ["Thu ngân", "Thu ngân trưởng", "Kế toán cửa hàng"],
  "Phuc vu": ["Phục vụ", "Order", "Runner", "Trưởng ca phục vụ"],
  "Phuc vu / Order": ["Phục vụ", "Order", "Runner", "Nhân viên bán hàng", "Trưởng ca phục vụ"],
  "Phuc vu / ban hang": ["Phục vụ", "Order", "Runner", "Nhân viên bán hàng", "Trưởng ca phục vụ"],
  "Topping / Bep nhe": ["Nhân viên topping", "Chuẩn bị nguyên liệu", "Bếp nhẹ", "Phụ bếp"],
  Bep: ["Đầu bếp", "Phụ bếp", "Bếp chính", "Sơ chế", "Chuẩn bị nguyên liệu"],
  "Bep / kho": ["Đầu bếp", "Phụ bếp", "Chuẩn bị nguyên liệu", "Thủ kho"],
  "Kho / Tap vu": ["Thủ kho", "Tạp vụ", "Giao hàng", "Bảo vệ"],
  "Le tan": ["Lễ tân", "Thu ngân", "Chăm sóc khách hàng"],
  "Phong kham": ["Bác sĩ", "Điều dưỡng", "Kỹ thuật viên", "Lễ tân phòng khám", "Dược sĩ"],
  "San xuat": ["Tổ trưởng sản xuất", "Công nhân sản xuất", "Kỹ thuật viên", "QC / Kiểm hàng"],
  "Ban hang": ["Nhân viên bán hàng", "Thu ngân", "Tư vấn bán hàng", "Kho vận"]
};

const businessPositionCatalogs = {
  fnb: [
    "Quản lý cửa hàng",
    "Quản lý ca",
    "Trưởng ca",
    "Pha chế",
    "Barista",
    "Pha chế trà sữa",
    "Bartender",
    "Thu ngân",
    "Order",
    "Phục vụ",
    "Runner",
    "Bếp chính",
    "Phụ bếp",
    "Nhân viên topping",
    "Chuẩn bị nguyên liệu",
    "Thủ kho",
    "Tạp vụ",
    "Giao hàng",
    "Bảo vệ"
  ],
  healthcare: [
    "Quản lý phòng khám",
    "Bác sĩ",
    "Điều dưỡng",
    "Kỹ thuật viên",
    "Lễ tân phòng khám",
    "Thu ngân",
    "Chăm sóc khách hàng",
    "Dược sĩ",
    "Phụ tá nha khoa",
    "Kỹ thuật viên xét nghiệm",
    "Tạp vụ",
    "Bảo vệ"
  ],
  beauty: [
    "Quản lý spa/salon",
    "Lễ tân",
    "Tư vấn viên",
    "Kỹ thuật viên spa",
    "Chuyên viên nail",
    "Stylist",
    "Thợ phụ",
    "Thu ngân",
    "Chăm sóc khách hàng",
    "Tạp vụ"
  ],
  workshop: [
    "Quản đốc xưởng",
    "Tổ trưởng sản xuất",
    "Công nhân sản xuất",
    "Kỹ thuật viên",
    "QC / Kiểm hàng",
    "Đóng gói",
    "Thủ kho",
    "Bảo trì máy",
    "Giao nhận",
    "Bảo vệ"
  ],
  retail: [
    "Quản lý cửa hàng",
    "Quản lý ca",
    "Nhân viên bán hàng",
    "Tư vấn bán hàng",
    "Thu ngân",
    "Kho vận",
    "Online sales",
    "Chăm sóc khách hàng",
    "Giao hàng",
    "Bảo vệ"
  ],
  education: [
    "Quản lý trung tâm",
    "Giáo viên",
    "Trợ giảng",
    "Tư vấn tuyển sinh",
    "Chăm sóc học viên",
    "Lễ tân",
    "Kế toán",
    "Bảo vệ"
  ],
  hospitality: [
    "Quản lý cơ sở",
    "Lễ tân",
    "Buồng phòng",
    "Tạp vụ",
    "Bảo trì",
    "Thu ngân",
    "Chăm sóc khách hàng",
    "Bảo vệ"
  ],
  logistics: [
    "Quản lý kho",
    "Thủ kho",
    "Nhân viên kho",
    "Soạn hàng",
    "Đóng gói",
    "Giao nhận",
    "Điều phối",
    "Tài xế",
    "Bảo vệ"
  ],
  generic: genericPositions
};

function stripVietnamese(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getDepartmentKey(name = "") {
  return stripVietnamese(name);
}

function getBusinessTypeKey(value = "") {
  const normalized = stripVietnamese(value).toLowerCase();
  if (/cafe|coffee|tra sua|f&b|nha hang|quan an|bar|bakery|banh|food|do uong/.test(normalized)) return "fnb";
  if (/phong kham|clinic|nha khoa|dental|nha thuoc|duoc|y te|health/.test(normalized)) return "healthcare";
  if (/spa|salon|nail|toc|beauty|tham my|gym|fitness|yoga/.test(normalized)) return "beauty";
  if (/xuong|san xuat|may|gia cong|garage|sua chua|factory|workshop/.test(normalized)) return "workshop";
  if (/ban le|shop|cua hang|sieu thi|tap hoa|retail|store|thoi trang/.test(normalized)) return "retail";
  if (/giao duc|truong|lop|trung tam|education|school|gia su/.test(normalized)) return "education";
  if (/khach san|homestay|hotel|hostel|luu tru/.test(normalized)) return "hospitality";
  if (/logistics|kho van|van chuyen|giao nhan|warehouse/.test(normalized)) return "logistics";
  return "generic";
}

export function getPositionOptions(departmentName, role, businessType = "") {
  if (role === "Admin") return adminPositions;

  const departmentOptions = positionOptionsByDepartment[getDepartmentKey(departmentName)] || [];
  const businessOptions = businessPositionCatalogs[getBusinessTypeKey(businessType)] || businessPositionCatalogs.generic;
  return unique([...departmentOptions, ...businessOptions, ...genericPositions]);
}
