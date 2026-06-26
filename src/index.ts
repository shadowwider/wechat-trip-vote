type Score = 1 | 2 | 3 | 4 | 5;
type ScoreField = "overallScore" | "advancedInterest" | "recommendInterest";

interface Env {
  ASSETS: Fetcher;
  VOTE_KV: KVNamespace;
}

interface FeedbackRecord {
  name: string;
  overallScore: Score;
  valuableModule: string;
  deeperTopics: string;
  advancedInterest: Score;
  recommendInterest: Score;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackData {
  version: 1;
  updatedAt: string | null;
  responses: Record<string, FeedbackRecord>;
}

interface ParsedFeedback {
  key: string;
  name: string;
  overallScore: Score;
  valuableModule: string;
  deeperTopics: string;
  advancedInterest: Score;
  recommendInterest: Score;
}

const FORM_PATH = "/ai-km-workshop-0627";
const ADMIN_PATH = "/ai-km-workshop-0627/admin";
const FEEDBACK_KEY = "feedback:leadership-ai-km-workshop-2026-06-27:v1";

const SCORE_FIELDS: Array<{ key: ScoreField; label: string }> = [
  { key: "overallScore", label: "课程整体收获满意度" },
  { key: "advancedInterest", label: "参加后续进阶课程意愿" },
  { key: "recommendInterest", label: "推荐他人参加意愿" }
];

const EVENT_META = {
  title: "领导力 AI 兴趣小组工作坊反馈",
  subtitle: "AI 和知识管理 / LLM Wiki",
  date: "2026-06-27",
  formPath: FORM_PATH,
  adminPath: ADMIN_PATH
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "ai-km-workshop-feedback" });
    }

    if (url.pathname === "/") {
      return Response.redirect(new URL(FORM_PATH, url.origin).toString(), 302);
    }

    if (isPath(url.pathname, FORM_PATH)) {
      const indexUrl = new URL("/index.html", url.origin);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    if (isPath(url.pathname, ADMIN_PATH)) {
      const adminUrl = new URL("/admin.html", url.origin);
      return env.ASSETS.fetch(new Request(adminUrl, request));
    }

    if (url.pathname === "/api/feedback" && request.method === "POST") {
      return submitFeedback(request, env);
    }

    if (url.pathname === "/api/admin/feedback" && request.method === "GET") {
      const feedback = await loadFeedback(env);
      return json(toAdminFeedback(feedback));
    }

    if (url.pathname === "/api/admin/feedback" && request.method === "DELETE") {
      await env.VOTE_KV.delete(FEEDBACK_KEY);
      return json(toAdminFeedback(emptyFeedback()));
    }

    return env.ASSETS.fetch(request);
  }
};

async function submitFeedback(request: Request, env: Env): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: "这次提交没有读到内容，再试一次。" }, 400);
  }

  const parsed = parseFeedback(body);
  if ("error" in parsed) {
    return json({ error: parsed.error }, 400);
  }

  const feedback = await loadFeedback(env);
  const now = new Date().toISOString();
  const existing = feedback.responses[parsed.key];

  feedback.responses[parsed.key] = {
    name: parsed.name,
    overallScore: parsed.overallScore,
    valuableModule: parsed.valuableModule,
    deeperTopics: parsed.deeperTopics,
    advancedInterest: parsed.advancedInterest,
    recommendInterest: parsed.recommendInterest,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  feedback.updatedAt = now;

  await env.VOTE_KV.put(FEEDBACK_KEY, JSON.stringify(feedback));
  return json({ ok: true, event: EVENT_META }, existing ? 200 : 201);
}

function parseFeedback(body: unknown): ParsedFeedback | { error: string } {
  if (!isObject(body)) {
    return { error: "提交内容格式不对。" };
  }

  const name = normalizeText(body.name, 32);
  if (!name) {
    return { error: "请填写姓名或昵称。" };
  }

  const overallScore = normalizeScore(body.overallScore);
  if (!overallScore) {
    return { error: "请选择课程整体收获满意度。" };
  }

  const valuableModule = normalizeText(body.valuableModule, 500);
  if (!valuableModule) {
    return { error: "请填写你认为最有价值的具体模块。" };
  }

  const deeperTopics = normalizeText(body.deeperTopics, 500);
  if (!deeperTopics) {
    return { error: "请填写你希望进一步深入的 AI 课程内容。" };
  }

  const advancedInterest = normalizeScore(body.advancedInterest);
  if (!advancedInterest) {
    return { error: "请选择参加后续进阶课程意愿。" };
  }

  const recommendInterest = normalizeScore(body.recommendInterest);
  if (!recommendInterest) {
    return { error: "请选择推荐他人参加意愿。" };
  }

  return {
    key: name.toLocaleLowerCase("zh-CN"),
    name,
    overallScore,
    valuableModule,
    deeperTopics,
    advancedInterest,
    recommendInterest
  };
}

async function loadFeedback(env: Env): Promise<FeedbackData> {
  const stored = await env.VOTE_KV.get<FeedbackData>(FEEDBACK_KEY, "json");
  if (!stored || stored.version !== 1 || !isObject(stored.responses)) {
    return emptyFeedback();
  }

  return {
    version: 1,
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : null,
    responses: Object.fromEntries(
      Object.entries(stored.responses)
        .map(([key, response]) => {
          const normalized = normalizeStoredResponse(response);
          return normalized ? [key, normalized] : null;
        })
        .filter((entry): entry is [string, FeedbackRecord] => Boolean(entry))
    )
  };
}

function normalizeStoredResponse(value: unknown): FeedbackRecord | null {
  if (!isObject(value)) {
    return null;
  }

  const name = normalizeText(value.name, 32);
  const overallScore = normalizeScore(value.overallScore);
  const valuableModule = normalizeText(value.valuableModule, 500);
  const deeperTopics = normalizeText(value.deeperTopics, 500);
  const advancedInterest = normalizeScore(value.advancedInterest);
  const recommendInterest = normalizeScore(value.recommendInterest);
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";
  const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : createdAt;

  if (
    !name ||
    !overallScore ||
    !valuableModule ||
    !deeperTopics ||
    !advancedInterest ||
    !recommendInterest ||
    !updatedAt
  ) {
    return null;
  }

  return {
    name,
    overallScore,
    valuableModule,
    deeperTopics,
    advancedInterest,
    recommendInterest,
    createdAt: createdAt || updatedAt,
    updatedAt
  };
}

function emptyFeedback(): FeedbackData {
  return {
    version: 1,
    updatedAt: null,
    responses: {}
  };
}

function toAdminFeedback(feedback: FeedbackData) {
  const responses = sortedResponses(feedback);
  return {
    event: EVENT_META,
    updatedAt: feedback.updatedAt,
    totalResponses: responses.length,
    averages: Object.fromEntries(
      SCORE_FIELDS.map((field) => [field.key, averageScore(responses, field.key)])
    ),
    distributions: Object.fromEntries(
      SCORE_FIELDS.map((field) => [field.key, scoreDistribution(responses, field.key)])
    ),
    responses
  };
}

function sortedResponses(feedback: FeedbackData): FeedbackRecord[] {
  return Object.values(feedback.responses).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function averageScore(responses: FeedbackRecord[], field: ScoreField): number | null {
  if (responses.length === 0) {
    return null;
  }

  const total = responses.reduce((sum, response) => sum + response[field], 0);
  return Number((total / responses.length).toFixed(2));
}

function scoreDistribution(responses: FeedbackRecord[], field: ScoreField) {
  return ([1, 2, 3, 4, 5] as Score[]).map((score) => {
    const count = responses.filter((response) => response[field] === score).length;
    const percent = responses.length === 0 ? 0 : Math.round((count / responses.length) * 100);
    return { score, count, percent };
  });
}

function normalizeScore(value: unknown): Score | null {
  const numberValue = typeof value === "string" ? Number(value) : value;
  if (
    typeof numberValue === "number" &&
    Number.isInteger(numberValue) &&
    numberValue >= 1 &&
    numberValue <= 5
  ) {
    return numberValue as Score;
  }

  return null;
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPath(pathname: string, expected: string): boolean {
  return pathname === expected || pathname === `${expected}/`;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders()
    }
  });
}

function corsHeaders(): HeadersInit {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type"
  };
}
