import { env } from "../../config/env.js";

const geminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta";

function buildGeminiUrl(action) {
  return `${geminiBaseUrl}/models/${encodeURIComponent(env.geminiModel)}:${action}`;
}

function buildRequestBody({ instructions, input, maxOutputTokens = 900, json = false }) {
  return {
    systemInstruction: instructions
      ? {
          parts: [{ text: instructions }]
        }
      : undefined,
    contents: [
      {
        role: "user",
        parts: [{ text: input }]
      }
    ],
    generationConfig: {
      temperature: 0.35,
      topP: 0.9,
      maxOutputTokens,
      ...(json ? { responseMimeType: "application/json" } : {})
    }
  };
}

async function readError(response) {
  const payload = await response.json().catch(() => null);
  const message = payload?.error?.message || response.statusText || "Gemini request failed";
  const error = new Error(message);
  error.status = response.status;
  error.code = payload?.error?.status || payload?.error?.code || "gemini_error";
  error.payload = payload;
  return error;
}

function extractGeminiText(payload) {
  return (payload?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("")
    .trim();
}

function stripJsonFence(text) {
  return String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonText(text) {
  const cleaned = stripJsonFence(text);
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export function isGeminiReady() {
  return Boolean(env.geminiApiKey);
}

export function describeGeminiIssue(error) {
  if (!env.geminiApiKey) {
    return {
      code: "missing_api_key",
      message: "Gemini API key chưa được cấu hình.",
      action: "Thêm GEMINI_API_KEY từ Google AI Studio vào BE/.env/Vercel rồi redeploy."
    };
  }

  const status = error?.status || null;
  const code = error?.code || error?.payload?.error?.status || "gemini_error";

  if (status === 429) {
    return {
      code,
      status,
      message: "Gemini đã hết free quota hoặc đang bị giới hạn tốc độ.",
      action: "Đợi quota reset, giảm tần suất demo hoặc chuyển sang Gemini paid tier."
    };
  }

  if (status === 401 || status === 403) {
    return {
      code,
      status,
      message: "Gemini API key chưa hợp lệ hoặc project chưa có quyền dùng Gemini API.",
      action: "Tạo key trong Google AI Studio, bật Gemini API và kiểm tra restriction của key."
    };
  }

  return {
    code,
    status,
    message: "Gemini chưa trả lời ổn định.",
    action: "Kiểm tra Gemini API key, model, quota và Google AI Studio trước khi demo."
  };
}

export async function createTextResponse({ instructions, input, maxOutputTokens = 900 }) {
  if (!isGeminiReady()) return null;

  const response = await fetch(buildGeminiUrl("generateContent"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.geminiApiKey
    },
    body: JSON.stringify(buildRequestBody({ instructions, input, maxOutputTokens }))
  });

  if (!response.ok) throw await readError(response);

  const payload = await response.json();
  return {
    output_text: extractGeminiText(payload),
    raw: payload
  };
}

export async function createParsedResponse({ instructions, input, schema, maxOutputTokens = 1500 }) {
  if (!isGeminiReady()) return null;

  const response = await fetch(buildGeminiUrl("generateContent"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.geminiApiKey
    },
    body: JSON.stringify(buildRequestBody({ instructions, input, maxOutputTokens, json: true }))
  });

  if (!response.ok) throw await readError(response);

  const payload = await response.json();
  const parsed = parseJsonText(extractGeminiText(payload));
  return {
    output_parsed: schema ? schema.parse(parsed) : parsed,
    raw: payload
  };
}

export async function* createTextStream({ instructions, input, maxOutputTokens = 900 }) {
  if (!isGeminiReady()) return;

  const response = await fetch(`${buildGeminiUrl("streamGenerateContent")}?alt=sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.geminiApiKey
    },
    body: JSON.stringify(buildRequestBody({ instructions, input, maxOutputTokens }))
  });

  if (!response.ok) throw await readError(response);

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const dataLines = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s*/, ""));

      if (!dataLines.length) continue;
      const data = dataLines.join("\n").trim();
      if (!data || data === "[DONE]") continue;

      const payload = JSON.parse(data);
      const delta = extractGeminiText(payload);
      if (delta) {
        yield {
          type: "response.output_text.delta",
          delta
        };
      }
    }
  }
}
