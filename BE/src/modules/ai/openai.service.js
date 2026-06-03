import OpenAI from "openai";
import { env } from "../../config/env.js";

let openaiClient;

export function getOpenAiClient() {
  if (!env.openaiApiKey) return null;

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.openaiApiKey });
  }

  return openaiClient;
}

export function isOpenAiReady() {
  return Boolean(getOpenAiClient());
}

export function describeOpenAiIssue(error) {
  if (!env.openaiApiKey) {
    return {
      code: "missing_api_key",
      message: "OpenAI API key chưa được cấu hình.",
      action: "Thêm OPENAI_API_KEY vào môi trường deploy rồi redeploy."
    };
  }

  const status = error?.status || error?.response?.status || null;
  const code = error?.code || error?.type || error?.error?.code || error?.error?.type || "openai_error";

  if (status === 429 && code === "insufficient_quota") {
    return {
      code: "insufficient_quota",
      status,
      message: "OpenAI đã hết quota/credit hoặc chạm monthly budget.",
      action: "Nạp credit hoặc tăng usage limit trong OpenAI Platform Billing."
    };
  }

  if (status === 429) {
    return {
      code: "rate_limited",
      status,
      message: "OpenAI đang giới hạn tốc độ gọi API.",
      action: "Giảm tần suất request hoặc tăng usage tier/rate limit."
    };
  }

  if (status === 401 || status === 403) {
    return {
      code: "auth_error",
      status,
      message: "OpenAI API key không hợp lệ hoặc không có quyền dùng model hiện tại.",
      action: "Kiểm tra API key, project, organization và quyền model trong OpenAI Platform."
    };
  }

  return {
    code,
    status,
    message: "OpenAI chưa trả lời ổn định.",
    action: "Kiểm tra billing, model, network và OpenAI status trước khi demo."
  };
}

export async function createTextResponse({ instructions, input, maxOutputTokens = 900 }) {
  const client = getOpenAiClient();
  if (!client) return null;

  return client.responses.create({
    model: env.openaiModel,
    instructions,
    input,
    max_output_tokens: maxOutputTokens
  });
}

export async function createParsedResponse({ instructions, input, textFormat, maxOutputTokens = 1500 }) {
  const client = getOpenAiClient();
  if (!client) return null;

  return client.responses.parse({
    model: env.openaiModel,
    instructions,
    input,
    text: {
      format: textFormat
    },
    max_output_tokens: maxOutputTokens
  });
}

export async function createTextStream({ instructions, input, maxOutputTokens = 900 }) {
  const client = getOpenAiClient();
  if (!client) return null;

  return client.responses.create({
    model: env.openaiModel,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
    stream: true
  });
}
