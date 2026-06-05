import { env } from "../../config/env.js";

const groqChatUrl = "https://api.groq.com/openai/v1/chat/completions";

function buildMessages({ instructions, input }) {
  return [
    ...(instructions ? [{ role: "system", content: instructions }] : []),
    { role: "user", content: input }
  ];
}

function buildRequestBody({ instructions, input, maxOutputTokens = 900, json = false, stream = false }) {
  return {
    model: env.groqModel,
    messages: buildMessages({ instructions, input }),
    temperature: 0.35,
    top_p: 0.9,
    max_tokens: maxOutputTokens,
    stream,
    ...(json ? { response_format: { type: "json_object" } } : {})
  };
}

async function readError(response) {
  const payload = await response.json().catch(() => null);
  const message = payload?.error?.message || response.statusText || "Groq request failed";
  const error = new Error(message);
  error.status = response.status;
  error.code = payload?.error?.type || payload?.error?.code || "groq_error";
  error.payload = payload;
  return error;
}

function extractText(payload) {
  return String(payload?.choices?.[0]?.message?.content || "").trim();
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

export function isGroqReady() {
  return Boolean(env.groqApiKey);
}

export function describeGroqIssue(error) {
  if (!env.groqApiKey) {
    return {
      code: "missing_api_key",
      message: "Groq API key chưa được cấu hình.",
      action: "Thêm GROQ_API_KEY vào BE/.env/Vercel rồi redeploy."
    };
  }

  const status = error?.status || null;
  const code = error?.code || error?.payload?.error?.type || "groq_error";

  if (status === 429) {
    return {
      code,
      status,
      message: "Groq đã hết free quota hoặc đang bị rate limit.",
      action: "Đợi quota reset, giảm tần suất demo hoặc đổi sang provider fallback."
    };
  }

  if (status === 401 || status === 403) {
    return {
      code,
      status,
      message: "Groq API key chưa hợp lệ hoặc chưa có quyền gọi model này.",
      action: "Tạo key trong Groq Console và kiểm tra model/free plan limit."
    };
  }

  return {
    code,
    status,
    message: "Groq chưa trả lời ổn định.",
    action: "Kiểm tra GROQ_API_KEY, model và quota trước khi demo."
  };
}

export async function createTextResponse({ instructions, input, maxOutputTokens = 900 }) {
  if (!isGroqReady()) return null;

  const response = await fetch(groqChatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.groqApiKey}`
    },
    body: JSON.stringify(buildRequestBody({ instructions, input, maxOutputTokens }))
  });

  if (!response.ok) throw await readError(response);

  const payload = await response.json();
  return {
    output_text: extractText(payload),
    raw: payload
  };
}

export async function createParsedResponse({ instructions, input, schema, maxOutputTokens = 1500 }) {
  if (!isGroqReady()) return null;

  const response = await fetch(groqChatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.groqApiKey}`
    },
    body: JSON.stringify(buildRequestBody({ instructions, input, maxOutputTokens, json: true }))
  });

  if (!response.ok) throw await readError(response);

  const payload = await response.json();
  const parsed = parseJsonText(extractText(payload));
  return {
    output_parsed: schema ? schema.parse(parsed) : parsed,
    raw: payload
  };
}

export async function* createTextStream({ instructions, input, maxOutputTokens = 900 }) {
  if (!isGroqReady()) return;

  const response = await fetch(groqChatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.groqApiKey}`
    },
    body: JSON.stringify(buildRequestBody({ instructions, input, maxOutputTokens, stream: true }))
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
      const delta = payload?.choices?.[0]?.delta?.content || "";
      if (delta) {
        yield {
          type: "response.output_text.delta",
          delta
        };
      }
    }
  }
}
