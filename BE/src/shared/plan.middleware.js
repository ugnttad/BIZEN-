import { getCompanyById, getCompanyIdForUser } from "../modules/companies/company.repository.js";
import { countEmployeesByCompanyId } from "../modules/employees/employees.repository.js";
import { httpError } from "./httpError.js";

/**
 * Middleware to check if the current company is in one of the allowed plan tiers.
 * @param {string[]} allowedTiers Array of allowed tiers (e.g. ['PRO', 'ENTERPRISE'])
 * @param {object} options Optional settings (e.g. { allowCredits: true })
 */
export function requirePlanTier(allowedTiers, options = {}) {
  return async (req, res, next) => {
    try {
      const companyId = await getCompanyIdForUser(req.user);
      const company = await getCompanyById(companyId);

      if (!company) {
        throw httpError(404, "Không tìm thấy thông tin công ty.");
      }

      if (!allowedTiers.includes(company.planTier)) {
        if (options.allowCredits && company.aiCreditsRemaining > 0) {
          req.useAiCredit = true;
        } else {
          throw httpError(403, `Tính năng này chỉ dành cho gói ${allowedTiers.join(" hoặc ")}. Vui lòng nâng cấp gói dịch vụ để sử dụng.`);
        }
      }

      // Check expiry date if applicable
      if (company.planExpiryDate && new Date() > new Date(company.planExpiryDate)) {
        throw httpError(403, "Gói dịch vụ của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware to check if the company has reached its maximum employee limit.
 */
export async function requireEmployeeLimit(req, res, next) {
  try {
    const companyId = await getCompanyIdForUser(req.user);
    const company = await getCompanyById(companyId);

    if (!company) {
      throw httpError(404, "Không tìm thấy thông tin công ty.");
    }

    const currentCount = await countEmployeesByCompanyId(companyId);

    if (currentCount >= company.maxEmployees) {
      throw httpError(403, `Bạn đã đạt giới hạn nhân viên (${company.maxEmployees}) của gói ${company.planTier}. Vui lòng nâng cấp gói để thêm nhân viên mới.`);
    }

    next();
  } catch (err) {
    next(err);
  }
}
