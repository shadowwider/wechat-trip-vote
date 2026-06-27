import { startKnowledgeGraph } from "./knowledge-graph.js";

const scoreFields = [
  { key: "overallScore", label: "整体收获满意度", bars: "bars-overall" },
  { key: "advancedInterest", label: "参加后续进阶课程意愿", bars: "bars-advanced" },
  { key: "recommendInterest", label: "推荐他人参加意愿", bars: "bars-recommend" }
];

const elements = {
  refresh: document.querySelector("#refresh"),
  downloadCsv: document.querySelector("#download-csv"),
  clear: document.querySelector("#clear"),
  status: document.querySelector("#admin-status"),
  totalResponses: document.querySelector("#total-responses"),
  avgOverall: document.querySelector("#avg-overall"),
  avgAdvanced: document.querySelector("#avg-advanced"),
  avgRecommend: document.querySelector("#avg-recommend"),
  valuableList: document.querySelector("#valuable-list"),
  deeperList: document.querySelector("#deeper-list"),
  complaintList: document.querySelector("#complaint-list"),
  responseList: document.querySelector("#response-list")
};

let adminState = null;

startKnowledgeGraph(document.querySelector("#knowledge-canvas"));
loadAdmin();

elements.refresh.addEventListener("click", loadAdmin);
elements.downloadCsv.addEventListener("click", downloadCsv);
elements.clear.addEventListener("click", clearData);

async function loadAdmin() {
  elements.refresh.disabled = true;
  setStatus("正在读取...", "muted");

  try {
    const response = await fetch("/api/admin/feedback", { headers: { accept: "application/json" } });
    if (!response.ok) {
      throw new Error("后台数据读取失败。");
    }

    adminState = await response.json();
    renderAdmin();
    setStatus("已刷新。", "success");
  } catch (error) {
    setStatus(error.message || "后台数据读取失败。", "error");
  } finally {
    elements.refresh.disabled = false;
  }
}

async function clearData() {
  const firstConfirm = window.confirm("确定要清空所有反馈数据吗？这个操作不能撤回。");
  if (!firstConfirm) {
    return;
  }

  const typed = window.prompt("如果确定清空，请输入：清空");
  if (typed !== "清空") {
    setStatus("没有清空。", "muted");
    return;
  }

  elements.clear.disabled = true;
  elements.refresh.disabled = true;
  setStatus("正在清空...", "muted");

  try {
    const response = await fetch("/api/admin/feedback", { method: "DELETE" });
    if (!response.ok) {
      throw new Error("清空失败。");
    }

    adminState = await response.json();
    renderAdmin();
    setStatus("已清空。", "success");
  } catch (error) {
    setStatus(error.message || "清空失败。", "error");
  } finally {
    elements.clear.disabled = false;
    elements.refresh.disabled = false;
  }
}

function renderAdmin() {
  const responses = adminState.responses || [];

  elements.totalResponses.textContent = adminState.totalResponses;
  elements.avgOverall.textContent = formatAverage(adminState.averages.overallScore);
  elements.avgAdvanced.textContent = formatAverage(adminState.averages.advancedInterest);
  elements.avgRecommend.textContent = formatAverage(adminState.averages.recommendInterest);

  renderInlineBars();

  renderQuoteList(elements.valuableList, responses, "valuableModule", "暂无反馈");
  renderQuoteList(elements.deeperList, responses, "deeperTopics", "暂无反馈");
  renderQuoteList(elements.complaintList, responses, "eventComplaint", "暂无吐槽");

  elements.responseList.innerHTML =
    responses.length === 0 ? emptyTemplate("还没有人提交。") : responses.map(responseTemplate).join("");
}

function renderQuoteList(container, responses, key, emptyText) {
  const items = responses.filter((response) => String(response[key] || "").trim());
  container.innerHTML =
    items.length === 0
      ? emptyTemplate(emptyText)
      : items.map((response) => quoteTemplate(response.name, response[key])).join("");
}

function renderInlineBars() {
  if (!adminState) return;

  for (const field of scoreFields) {
    const container = document.querySelector(`#${field.bars}`);
    const distribution = adminState.distributions[field.key] || [];
    container.innerHTML = distribution
      .map(
        (item) => {
          const width = Math.max(0, Math.min(100, Number(item.percent) || 0));
          const visibleWidth = item.count > 0 ? Math.max(width, 8) : 0;
          return `
            <div class="score-row">
              <span>${item.score} 分</span>
              <div class="bar" aria-hidden="true"><i style="width: ${visibleWidth}%"></i></div>
              <strong>${item.count}</strong>
            </div>
          `;
        }
      )
      .join("");
  }
}

function quoteTemplate(name, text) {
  return `
    <article class="quote-card">
      <p>${escapeHtml(text)}</p>
      <span>${escapeHtml(name)}</span>
    </article>
  `;
}

function responseTemplate(response) {
  const updatedAt = new Date(response.updatedAt).toLocaleString("zh-CN");

  return `
    <article class="response-card">
      <div class="response-head">
        <strong>${escapeHtml(response.name)}</strong>
        <span>${escapeHtml(updatedAt)}</span>
      </div>
      <dl>
        <dt>整体收获</dt>
        <dd>${response.overallScore} / 5</dd>
        <dt>最有价值</dt>
        <dd>${escapeHtml(response.valuableModule)}</dd>
        <dt>希望深入</dt>
        <dd>${escapeHtml(response.deeperTopics)}</dd>
        <dt>进阶课程</dt>
        <dd>${response.advancedInterest} / 5</dd>
        <dt>推荐他人</dt>
        <dd>${response.recommendInterest} / 5</dd>
        <dt>活动吐槽</dt>
        <dd>${escapeHtml(response.eventComplaint || "")}</dd>
      </dl>
    </article>
  `;
}

function downloadCsv() {
  if (!adminState) {
    return;
  }

  const rows = [
    ["姓名/昵称", "整体收获满意度", "最有价值模块", "希望深入内容", "参加进阶课程意愿", "推荐他人参加意愿", "活动吐槽", "首次提交时间", "最近更新时间"],
    ...adminState.responses.map((response) => [
      response.name,
      response.overallScore,
      response.valuableModule,
      response.deeperTopics,
      response.advancedInterest,
      response.recommendInterest,
      response.eventComplaint || "",
      formatDate(response.createdAt),
      formatDate(response.updatedAt)
    ])
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ai-km-workshop-feedback-2026-06-27.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function formatAverage(value) {
  return value === null || value === undefined ? "-" : Number(value).toFixed(2);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("zh-CN") : "";
}

function emptyTemplate(text) {
  return `<p class="empty-state">${escapeHtml(text)}</p>`;
}

function setStatus(message, tone = "muted") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
