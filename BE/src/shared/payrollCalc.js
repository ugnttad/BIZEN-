/** Tỷ lệ đóng BHXH/BHYT/BHTN phần người lao động (tham chiếu luật VN, làm tròn VND). */
export const EMPLOYEE_INSURANCE_RATES = {
  bhxh: 0.08,
  bhyt: 0.015,
  bhtn: 0.01
};

export function getEmployeeInsuranceRates() {
  return { ...EMPLOYEE_INSURANCE_RATES };
}

/**
 * @param {object} input
 * @param {number} input.baseSalary - Lương cơ bản tháng
 * @param {number} input.workingDays - Ngày công thực tế
 * @param {number} [input.standardDays=22]
 * @param {number} [input.overtimeHours=0]
 * @param {number} [input.bonus=0]
 * @param {number} [input.otherDeduction=0] - Trừ khác (đi trễ, nghỉ không phép…)
 */
export function calculatePayrollItem({
  baseSalary,
  workingDays,
  standardDays = 22,
  overtimeHours = 0,
  bonus = 0,
  otherDeduction = 0
}) {
  const dailyRate = baseSalary / standardDays;
  const grossFromWork = Math.round(dailyRate * workingDays);
  const overtimePay = Math.round(overtimeHours * (dailyRate / 8) * 1.5);
  const grossSalary = grossFromWork + overtimePay + bonus;

  const bhxhEmployee = Math.round(grossSalary * EMPLOYEE_INSURANCE_RATES.bhxh);
  const bhytEmployee = Math.round(grossSalary * EMPLOYEE_INSURANCE_RATES.bhyt);
  const bhtnEmployee = Math.round(grossSalary * EMPLOYEE_INSURANCE_RATES.bhtn);
  const insuranceDeduction = bhxhEmployee + bhytEmployee + bhtnEmployee;
  const deduction = insuranceDeduction + otherDeduction;
  const finalSalary = Math.max(0, grossSalary - deduction);

  return {
    grossSalary,
    overtimePay,
    bhxhEmployee,
    bhytEmployee,
    bhtnEmployee,
    insuranceDeduction,
    otherDeduction,
    deduction,
    finalSalary
  };
}
