export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function getCurrentPayrollMonth(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export function getRecentPayrollMonths(count = 3, date = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(date.getFullYear(), date.getMonth() - (count - 1 - index), 1);
    return getCurrentPayrollMonth(month);
  });
}

export function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

export function findEmployee(employees, id) {
  return employees.find((employee) => employee.id === id);
}
