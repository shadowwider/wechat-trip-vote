type LocationId = "anji-rafting" | "lingang-waterworld" | "hengsha-red-house";
type DateId = "jun-final" | "jul-first" | "jul-second";

interface Env {
  ASSETS: Fetcher;
  VOTE_KV: KVNamespace;
}

interface VoteRecord {
  name: string;
  avatar: string;
  locations: LocationId[];
  dates: DateId[];
  comment: string;
  updatedAt: string;
}

interface PollData {
  version: 1;
  updatedAt: string | null;
  votes: Record<string, VoteRecord>;
}

interface PublicOption {
  id: string;
  label: string;
  eyebrow?: string;
  description?: string;
  travel?: string;
  highlights?: string[];
}

const POLL_KEY = "trip-vote:csight-8-summer-2026:v2";

const LOCATION_OPTIONS: PublicOption[] = [
  {
    id: "anji-rafting",
    label: "安吉漂流",
    eyebrow: "湖州安吉 · 两天一夜",
    travel: "上海市中心出发约 220-240km，自驾约 3-3.5 小时。",
    description:
      "黄浦江源片区主打绿水青山和户外运动，漂流、竹林、山路都比较有夏天出逃感。",
    highlights: ["适合想离开城市、玩水又看山", "两天一夜更从容，车程最长但度假感最强"]
  },
  {
    id: "lingang-waterworld",
    label: "临港耀雪水世界",
    eyebrow: "上海临港 · 玩水",
    travel: "上海市中心出发约 70-80km，自驾约 1.5-2 小时。",
    description:
      "耀雪冰雪世界是临港的一站式度假综合体，包含雪世界、嬉水乐园、酒店和商业，水世界有室内外玩水空间。",
    highlights: ["在上海市内，天气不稳也比较稳", "新场馆、配套集中，适合轻装当天到达"]
  },
  {
    id: "hengsha-red-house",
    label: "崇明横沙岛红房子",
    eyebrow: "横沙岛 · 慢周末",
    travel: "上海市中心到长兴岛再上横沙，约 70-90km；含轮渡通常约 2-2.5 小时，周末排队会更久。",
    description:
      "横沙岛是上海很特别的留白小岛，红房子连接了城市青年社群和乡村空间，适合聊天、发呆、慢慢玩。",
    highlights: ["氛围感和朋友局最强", "有旺仔这层关系，组织起来可能更有人情味"]
  }
];

const DATE_OPTIONS: PublicOption[] = [
  {
    id: "jun-final",
    label: "6 月 27 日 - 6 月 28 日",
    eyebrow: "周六 - 周日",
    description: "六月最后一个周末"
  },
  {
    id: "jul-first",
    label: "7 月 4 日 - 7 月 5 日",
    eyebrow: "周六 - 周日",
    description: "七月第一个完整周末"
  },
  {
    id: "jul-second",
    label: "7 月 11 日 - 7 月 12 日",
    eyebrow: "周六 - 周日",
    description: "七月第二个完整周末"
  }
];

const LOCATION_IDS = new Set(LOCATION_OPTIONS.map((option) => option.id));
const DATE_IDS = new Set(DATE_OPTIONS.map((option) => option.id));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "wechat-trip-vote" });
    }

    if (url.pathname === "/") {
      const indexUrl = new URL("/index.html", url.origin);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }

    if (url.pathname === "/api/options" && request.method === "GET") {
      return json({ options: { locations: LOCATION_OPTIONS, dates: DATE_OPTIONS } });
    }

    if (url.pathname === "/api/poll" && request.method === "GET") {
      const poll = await loadPoll(env);
      return json(toPublicPoll(poll));
    }

    if (url.pathname === "/api/my-vote" && request.method === "GET") {
      const poll = await loadPoll(env);
      return json(toMyVote(url, poll));
    }

    if (url.pathname === "/api/admin" && request.method === "GET") {
      const poll = await loadPoll(env);
      return json(toAdminPoll(poll));
    }

    if (url.pathname === "/api/admin" && request.method === "DELETE") {
      await env.VOTE_KV.delete(POLL_KEY);
      return json(toAdminPoll(emptyPoll()));
    }

    if (url.pathname === "/api/vote" && request.method === "POST") {
      return submitVote(request, env);
    }

    if (url.pathname === "/admin-csight-8") {
      const adminUrl = new URL("/admin-csight-8.html", url.origin);
      return env.ASSETS.fetch(new Request(adminUrl, request));
    }

    return env.ASSETS.fetch(request);
  }
};

async function submitVote(request: Request, env: Env): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: "这次提交没有读到内容，再试一次。" }, 400);
  }

  const parsed = parseVote(body);
  if ("error" in parsed) {
    return json({ error: parsed.error }, 400);
  }

  const poll = await loadPoll(env);
  const now = new Date().toISOString();
  poll.votes[parsed.key] = {
    name: parsed.name,
    avatar: firstChar(parsed.name),
    locations: parsed.locations,
    dates: parsed.dates,
    comment: parsed.comment,
    updatedAt: now
  };
  poll.updatedAt = now;

  await env.VOTE_KV.put(POLL_KEY, JSON.stringify(poll));
  return json(toPublicPoll(poll, parsed.key), 201);
}

function parseVote(body: unknown):
  | { key: string; name: string; locations: LocationId[]; dates: DateId[]; comment: string }
  | { error: string } {
  if (!isObject(body)) {
    return { error: "提交内容格式不对。" };
  }

  const name = normalizeName(body.name);
  if (!name) {
    return { error: "先写一下你的名字。" };
  }

  if (Array.from(name).length > 16) {
    return { error: "名字太长啦，16 个字以内就好。" };
  }

  const locations = normalizeIds<LocationId>(body.locations, LOCATION_IDS);
  if (locations.length === 0) {
    return { error: "地点至少选一个。" };
  }

  const dates = normalizeIds<DateId>(body.dates, DATE_IDS);
  if (dates.length === 0) {
    return { error: "时间至少选一个。" };
  }

  return {
    key: name.toLocaleLowerCase("zh-CN"),
    name,
    locations,
    dates,
    comment: normalizeComment(body.comment)
  };
}

async function loadPoll(env: Env): Promise<PollData> {
  const stored = await env.VOTE_KV.get<PollData>(POLL_KEY, "json");
  if (stored && stored.version === 1 && isObject(stored.votes)) {
    return {
      version: 1,
      updatedAt: stored.updatedAt ?? null,
      votes: Object.fromEntries(
        Object.entries(stored.votes).map(([key, vote]) => [
          key,
          {
            name: vote.name,
            avatar: vote.avatar || firstChar(vote.name),
            locations: normalizeIds<LocationId>(vote.locations, LOCATION_IDS),
            dates: normalizeIds<DateId>(vote.dates, DATE_IDS),
            comment: typeof vote.comment === "string" ? vote.comment : "",
            updatedAt: vote.updatedAt
          }
        ])
      )
    };
  }

  return emptyPoll();
}

function emptyPoll(): PollData {
  return {
    version: 1,
    updatedAt: null,
    votes: {}
  };
}

function toPublicPoll(poll: PollData, currentKey?: string) {
  const votes = sortedVotes(poll);
  const currentVote = currentKey ? poll.votes[currentKey] : null;

  return {
    options: {
      locations: LOCATION_OPTIONS,
      dates: DATE_OPTIONS
    },
    updatedAt: poll.updatedAt,
    totalVoters: votes.length,
    myVote: currentVote ? toEditableVote(currentVote) : null,
    results: {
      locations: buildPublicResults(LOCATION_OPTIONS, votes, "locations"),
      dates: buildPublicResults(DATE_OPTIONS, votes, "dates")
    }
  };
}

function toAdminPoll(poll: PollData) {
  const votes = sortedVotes(poll);
  return {
    options: {
      locations: LOCATION_OPTIONS,
      dates: DATE_OPTIONS
    },
    updatedAt: poll.updatedAt,
    totalVoters: votes.length,
    votes,
    results: {
      locations: buildAdminResults(LOCATION_OPTIONS, votes, "locations"),
      dates: buildAdminResults(DATE_OPTIONS, votes, "dates")
    }
  };
}

function toMyVote(url: URL, poll: PollData) {
  const name = normalizeName(url.searchParams.get("name"));
  if (!name) {
    return { found: false, vote: null };
  }

  const vote = poll.votes[name.toLocaleLowerCase("zh-CN")];
  return {
    found: Boolean(vote),
    vote: vote ? toEditableVote(vote) : null
  };
}

function sortedVotes(poll: PollData): VoteRecord[] {
  return Object.values(poll.votes).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function buildPublicResults(
  options: PublicOption[],
  votes: VoteRecord[],
  field: "locations" | "dates"
) {
  return options.map((option) => {
    const voters = votes
      .filter((vote) => vote[field].includes(option.id as never))
      .map((vote) => ({
        avatar: vote.avatar,
        updatedAt: vote.updatedAt
      }));

    return {
      id: option.id,
      label: option.label,
      count: voters.length,
      voters
    };
  });
}

function buildAdminResults(
  options: PublicOption[],
  votes: VoteRecord[],
  field: "locations" | "dates"
) {
  return options.map((option) => {
    const voters = votes
      .filter((vote) => vote[field].includes(option.id as never))
      .map((vote) => ({
        name: vote.name,
        avatar: vote.avatar,
        comment: vote.comment,
        updatedAt: vote.updatedAt
      }));

    return {
      id: option.id,
      label: option.label,
      count: voters.length,
      voters
    };
  });
}

function toEditableVote(vote: VoteRecord) {
  return {
    avatar: vote.avatar,
    locations: vote.locations,
    dates: vote.dates,
    comment: vote.comment,
    updatedAt: vote.updatedAt
  };
}

function normalizeIds<T extends string>(value: unknown, allowedIds: Set<string>): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueIds = new Set<T>();
  for (const item of value) {
    if (typeof item === "string" && allowedIds.has(item)) {
      uniqueIds.add(item as T);
    }
  }

  return Array.from(uniqueIds);
}

function normalizeName(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function normalizeComment(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, 300);
}

function firstChar(name: string): string {
  return Array.from(name.trim())[0] ?? "?";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
