export const EMPLOYEE_INSURANCE_RATES = {
  bhxh: 0.08,
  bhyt: 0.015,
  bhtn: 0.01
};

export const PAY_TYPES = {
  monthly: "Monthly",
  hourly: "Hourly"
};

export function getEmployeeInsuranceRates() {
  return { ...EMPLOYEE_INSURANCE_RATES };
}

export function normalizePayType(value) {
  return value === PAY_TYPES.hourly ? PAY_TYPES.hourly : PAY_TYPES.monthly;
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundHours(value) {
  return Math.round(toFiniteNumber(value) * 100) / 100;
}

export function calculatePayrollItem({
  payType = PAY_TYPES.monthly,
  baseSalary = 0,
  hourlyRate = 0,
  workingDays = 0,
  standardDays = 22,
  totalHours = 0,
  overtimeHours = 0,
  bonus = 0,
  otherDeduction = 0
}) {
  const normalizedPayType = normalizePayType(payType);
  const safeBaseSalary = Math.max(0, toFiniteNumber(baseSalary));
  const safeHourlyRate = Math.max(0, toFiniteNumber(hourlyRate));
  const safeWorkingDays = Math.max(0, toFiniteNumber(workingDays));
  const safeStandardDays = Math.max(1, toFiniteNumber(standardDays, 22));
  const safeTotalHours = Math.max(0, toFiniteNumber(totalHours));
  const safeOvertimeHours = Math.max(0, toFiniteNumber(overtimeHours));
  const safeBonus = Math.max(0, toFiniteNumber(bonus));
  const safeOtherDeduction = Math.max(0, toFiniteNumber(otherDeduction));

  let grossFromWork = 0;
  let overtimePay = 0;
  let regularHours = 0;
  let effectiveTotalHours = safeTotalHours;

  if (normalizedPayType === PAY_TYPES.hourly) {
    regularHours = Math.max(0, safeTotalHours - safeOvertimeHours);
    grossFromWork = Math.round(regularHours * safeHourlyRate);
    overtimePay = Math.round(safeOvertimeHours * safeHourlyRate * 1.5);
  } else {
    const dailyRate = safeBaseSalary / safeStandardDays;
    regularHours = roundHours(safeWorkingDays * 8);
    effectiveTotalHours = safeTotalHours || roundHours(regularHours + safeOvertimeHours);
    grossFromWork = Math.round(dailyRate * safeWorkingDays);
    overtimePay = Math.round(safeOvertimeHours * (dailyRate / 8) * 1.5);
  }

  const grossSalary = grossFromWork + overtimePay + safeBonus;
  const insuranceApplies = normalizedPayType === PAY_TYPES.monthly;
  const bhxhEmployee = insuranceApplies ? Math.round(grossSalary * EMPLOYEE_INSURANCE_RATES.bhxh) : 0;
  const bhytEmployee = insuranceApplies ? Math.round(grossSalary * EMPLOYEE_INSURANCE_RATES.bhyt) : 0;
  const bhtnEmployee = insuranceApplies ? Math.round(grossSalary * EMPLOYEE_INSURANCE_RATES.bhtn) : 0;
  const insuranceDeduction = bhxhEmployee + bhytEmployee + bhtnEmployee;
  const deduction = insuranceDeduction + safeOtherDeduction;
  const finalSalary = Math.max(0, grossSalary - deduction);

  return {
    payType: normalizedPayType,
    baseSalary: safeBaseSalary,
    hourlyRate: safeHourlyRate,
    workingDays: safeWorkingDays,
    totalHours: roundHours(effectiveTotalHours),
    regularHours: roundHours(regularHours),
    grossFromWork,
    grossSalary,
    overtimePay,
    bhxhEmployee,
    bhytEmployee,
    bhtnEmployee,
    insuranceDeduction,
    otherDeduction: safeOtherDeduction,
    deduction,
    finalSalary
  };
}
