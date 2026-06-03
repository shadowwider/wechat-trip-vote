const elements = {
  refresh: document.querySelector("#refresh-admin"),
  clear: document.querySelector("#clear-admin"),
  status: document.querySelector("#admin-status"),
  summary: document.querySelector("#admin-summary"),
  locationResults: document.querySelector("#admin-location-results"),
  dateResults: document.querySelector("#admin-date-results"),
  votes: document.querySelector("#admin-votes")
};

let adminState = null;

loadAdmin();
elements.refresh.addEventListener("click", loadAdmin);
elements.clear.addEventListener("click", clearAdminData);

async function loadAdmin() {
  elements.refresh.disabled = true;

  try {
    const response = await fetch("/api/admin", { headers: { accept: "application/json" } });
    if (!response.ok) {
      throw new Error("后台数据读取失败。");
    }

    adminState = await response.json();
    renderAdmin();
  } catch (error) {
    elements.summary.innerHTML = `<p class="status" data-tone="error">${escapeHtml(error.message || "后台数据读取失败。")}</p>`;
  } finally {
    elements.refresh.disabled = false;
  }
}

async function clearAdminData() {
  const firstConfirm = window.confirm("确定要清空所有投票数据吗？这个操作不能撤回。");
  if (!firstConfirm) {
    return;
  }

  const typed = window.prompt("如果确定清空，请输入：清空");
  if (typed !== "清空") {
    setAdminStatus("没有清空。", "muted");
    return;
  }

  elements.clear.disabled = true;
  elements.refresh.disabled = true;
  setAdminStatus("正在清空...", "muted");

  try {
    const response = await fetch("/api/admin", { method: "DELETE" });
    if (!response.ok) {
      throw new Error("清空失败。");
    }

    adminState = await response.json();
    renderAdmin();
    setAdminStatus("已清空。现在可以重新测试或正式发起投票。", "success");
  } catch (error) {
    setAdminStatus(error.message || "清空失败。", "error");
  } finally {
    elements.clear.disabled = false;
    elements.refresh.disabled = false;
  }
}

function renderAdmin() {
  const updatedAt = adminState.updatedAt ? new Date(adminState.updatedAt).toLocaleString("zh-CN") : "暂无";
  elements.summary.innerHTML = `
    <div class="summary-card">
      <strong>${adminState.totalVoters}</strong>
      <span>人已投</span>
    </div>
    <div class="summary-card">
      <strong>${escapeHtml(updatedAt)}</strong>
      <span>最近更新</span>
    </div>
  `;

  elements.locationResults.innerHTML = adminState.results.locations
    .map((result) => resultTemplate(result, adminState.totalVoters))
    .join("");
  elements.dateResults.innerHTML = adminState.results.dates
    .map((result) => resultTemplate(result, adminState.totalVoters))
    .join("");

  elements.votes.innerHTML =
    adminState.votes.length === 0
      ? `<p class="empty-voters">还没有人提交。</p>`
      : adminState.votes.map((vote) => voteTemplate(vote)).join("");
}

function resultTemplate(result, totalVoters) {
  const percent = totalVoters === 0 ? 0 : Math.round((result.count / totalVoters) * 100);
  const names =
    result.voters.length === 0
      ? `<span class="empty-voters">还没人选</span>`
      : result.voters.map((voter) => `<span class="admin-name">${escapeHtml(voter.name)}</span>`).join("");

  return `
    <article class="result-item">
      <div class="result-topline">
        <strong>${escapeHtml(result.label)}</strong>
        <span>${result.count} 人 · ${percent}%</span>
      </div>
      <div class="bar" aria-hidden="true">
        <span style="width: ${percent}%"></span>
      </div>
      <div class="voter-list">${names}</div>
    </article>
  `;
}

function voteTemplate(vote) {
  const locationLabels = labelsFor(vote.locations, adminState.options.locations);
  const dateLabels = labelsFor(vote.dates, adminState.options.dates);
  const updatedAt = new Date(vote.updatedAt).toLocaleString("zh-CN");

  return `
    <article class="admin-vote-card">
      <div class="admin-vote-head">
        <span class="avatar" style="--avatar-bg: ${avatarColor(vote.avatar)}">${escapeHtml(vote.avatar)}</span>
        <div>
          <strong>${escapeHtml(vote.name)}</strong>
          <span>${escapeHtml(updatedAt)}</span>
        </div>
      </div>
      <dl>
        <dt>地点</dt>
        <dd>${escapeHtml(locationLabels.join("、"))}</dd>
        <dt>时间</dt>
        <dd>${escapeHtml(dateLabels.join("、"))}</dd>
        <dt>意见</dt>
        <dd>${vote.comment ? escapeHtml(vote.comment) : "无"}</dd>
      </dl>
    </article>
  `;
}

function labelsFor(ids, options) {
  return ids.map((id) => options.find((option) => option.id === id)?.label || id);
}

function setAdminStatus(message, tone = "muted") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function avatarColor(value) {
  const palette = ["#0f3b4a", "#2b7a78", "#7a3e2b", "#6b5b95", "#b94937", "#5d963d", "#1f5f8b"];
  const code = Array.from(value).reduce((sum, char) => sum + char.codePointAt(0), 0);
  return palette[code % palette.length];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
