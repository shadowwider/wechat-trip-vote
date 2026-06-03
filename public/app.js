const imageByLocation = {
  "anji-rafting": "/assets/anji-rafting.jpg",
  "lingang-waterworld": "/assets/lingang-waterworld.jpg",
  "hengsha-red-house": "/assets/hengsha-red-house.jpg"
};

const fallbackOptions = {
  locations: [
    {
      id: "anji-rafting",
      label: "安吉漂流",
      eyebrow: "湖州安吉 · 两天一夜",
      travel: "上海市中心出发约 220-240km，自驾约 3-3.5 小时。",
      description: "黄浦江源片区主打绿水青山和户外运动，漂流、竹林、山路都比较有夏天出逃感。",
      highlights: ["适合想离开城市、玩水又看山", "两天一夜更从容，车程最长但度假感最强"]
    },
    {
      id: "lingang-waterworld",
      label: "临港耀雪水世界",
      eyebrow: "上海临港 · 玩水",
      travel: "上海市中心出发约 70-80km，自驾约 1.5-2 小时。",
      description: "耀雪冰雪世界是临港的一站式度假综合体，包含雪世界、嬉水乐园、酒店和商业，水世界有室内外玩水空间。",
      highlights: ["在上海市内，天气不稳也比较稳", "新场馆、配套集中，适合轻装当天到达"]
    },
    {
      id: "hengsha-red-house",
      label: "崇明横沙岛红房子",
      eyebrow: "横沙岛 · 慢周末",
      travel: "上海市中心到长兴岛再上横沙，约 70-90km；含轮渡通常约 2-2.5 小时，周末排队会更久。",
      description: "横沙岛是上海很特别的留白小岛，红房子连接了城市青年社群和乡村空间，适合聊天、发呆、慢慢玩。",
      highlights: ["氛围感和朋友局最强", "有旺仔这层关系，组织起来可能更有人情味"]
    }
  ],
  dates: [
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
  ]
};

const state = {
  options: fallbackOptions,
  poll: null,
  currentVoteExists: false,
  loadedName: ""
};

const elements = {
  form: document.querySelector("#vote-form"),
  name: document.querySelector("#voter-name"),
  comment: document.querySelector("#comment"),
  submit: document.querySelector("#submit-vote"),
  locationOptions: document.querySelector("#location-options"),
  dateOptions: document.querySelector("#date-options"),
  viewResults: document.querySelector("#view-results"),
  status: document.querySelector("#status"),
  results: document.querySelector("#results"),
  locationResults: document.querySelector("#location-results"),
  dateResults: document.querySelector("#date-results"),
  totalVoters: document.querySelector("#total-voters")
};

let nameCheckTimer = null;
let nameCheckToken = 0;

renderOptions();
loadOptions();
setResultsGate();

elements.name.addEventListener("input", () => {
  state.currentVoteExists = false;
  state.loadedName = "";
  state.poll = null;
  elements.results.hidden = true;
  elements.totalVoters.textContent = "0";
  setResultsGate();
  scheduleNameLookup();
});

elements.name.addEventListener("blur", () => {
  void lookupNameVote();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = normalizeName(elements.name.value);
  const locations = getCheckedValues("locations");
  const dates = getCheckedValues("dates");
  const comment = normalizeName(elements.comment.value);

  if (!name) {
    setStatus("先写一下名字。", "error");
    elements.name.focus();
    return;
  }

  if (locations.length === 0 || dates.length === 0) {
    setStatus("地点和时间都至少选一个。", "error");
    return;
  }

  setBusy(true);
  setStatus(state.currentVoteExists ? "正在更新..." : "正在提交...", "muted");

  try {
    const response = await fetch("/api/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, locations, dates, comment })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "提交失败了。");
    }

    state.poll = data;
    state.currentVoteExists = true;
    state.loadedName = name;
    updateSummary();
    renderResults();
    setResultsGate();
    elements.results.hidden = true;
    setStatus("已记下。现在可以查看结果，也可以继续改完再提交。", "success");
  } catch (error) {
    setStatus(error.message || "提交失败了，再试一次。", "error");
  } finally {
    setBusy(false);
  }
});

elements.viewResults.addEventListener("click", async () => {
  if (!state.currentVoteExists) {
    return;
  }

  setStatus("正在刷新结果...", "muted");
  await refreshPoll({ quiet: false });
  elements.results.hidden = false;
  elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
});

async function loadOptions() {
  try {
    const response = await fetch("/api/options", { headers: { accept: "application/json" } });
    if (!response.ok) {
      throw new Error("选项读取失败。");
    }

    const data = await response.json();
    state.options = data.options || fallbackOptions;
    renderOptions();
  } catch {
    renderOptions();
  }
}

function scheduleNameLookup() {
  window.clearTimeout(nameCheckTimer);
  nameCheckTimer = window.setTimeout(() => {
    void lookupNameVote();
  }, 520);
}

async function lookupNameVote() {
  const name = normalizeName(elements.name.value);
  const token = ++nameCheckToken;

  window.clearTimeout(nameCheckTimer);

  if (!name) {
    state.currentVoteExists = false;
    state.loadedName = "";
    setResultsGate();
    return;
  }

  try {
    const response = await fetch(`/api/my-vote?name=${encodeURIComponent(name)}`, {
      headers: { accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error("读取你的投票失败。");
    }

    const data = await response.json();
    if (token !== nameCheckToken || normalizeName(elements.name.value) !== name) {
      return;
    }

    state.currentVoteExists = Boolean(data.found);
    state.loadedName = data.found ? name : "";
    setResultsGate();

    if (data.found && data.vote) {
      applyVoteToForm(data.vote);
      setStatus("找到你之前的投票了，可以修改后再提交。", "success");
    } else if (elements.status.textContent.includes("找到你之前")) {
      setStatus("", "muted");
    }
  } catch {
    if (token === nameCheckToken) {
      state.currentVoteExists = false;
      state.loadedName = "";
      setResultsGate();
    }
  }
}

async function refreshPoll({ quiet }) {
  try {
    const response = await fetch("/api/poll", { headers: { accept: "application/json" } });
    if (!response.ok) {
      throw new Error("结果读取失败。");
    }

    const data = await response.json();
    state.poll = data;
    updateSummary();
    renderResults();
    if (!quiet) {
      setStatus("结果已刷新。", "success");
    }
  } catch (error) {
    if (!quiet) {
      setStatus(error.message || "结果读取失败。", "error");
    }
  }
}

function renderOptions() {
  elements.locationOptions.innerHTML = state.options.locations
    .map((option) => locationOptionTemplate(option))
    .join("");
  elements.dateOptions.innerHTML = state.options.dates.map((option) => dateOptionTemplate(option)).join("");
}

function applyVoteToForm(vote) {
  for (const input of document.querySelectorAll("input[name='locations'], input[name='dates']")) {
    input.checked = false;
  }

  for (const id of vote.locations || []) {
    const input = document.querySelector(`input[name="locations"][value="${cssEscape(id)}"]`);
    if (input) input.checked = true;
  }

  for (const id of vote.dates || []) {
    const input = document.querySelector(`input[name="dates"][value="${cssEscape(id)}"]`);
    if (input) input.checked = true;
  }

  elements.comment.value = vote.comment || "";
}

function locationOptionTemplate(option) {
  const highlights = Array.isArray(option.highlights)
    ? `<ul class="option-highlights">${option.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

  return `
    <label class="option-card location-card">
      <input type="checkbox" name="locations" value="${escapeHtml(option.id)}" />
      <span class="checkmark" aria-hidden="true"></span>
      <img src="${imageByLocation[option.id]}" alt="" loading="lazy" />
      <span class="option-body">
        <span class="option-meta">${escapeHtml(option.eyebrow || "")}</span>
        <span class="option-title">${escapeHtml(option.label)}</span>
        <span class="travel-line">${escapeHtml(option.travel || "")}</span>
        <span class="option-copy">${escapeHtml(option.description || "")}</span>
        ${highlights}
      </span>
    </label>
  `;
}

function dateOptionTemplate(option) {
  return `
    <label class="option-card date-card">
      <input type="checkbox" name="dates" value="${escapeHtml(option.id)}" />
      <span class="checkmark" aria-hidden="true"></span>
      <span class="date-main">${escapeHtml(option.label)}</span>
      <span class="option-title">${escapeHtml(option.eyebrow || "")}</span>
      <span class="option-copy">${escapeHtml(option.description || "")}</span>
    </label>
  `;
}

function renderResults() {
  const poll = state.poll;
  if (!poll) {
    return;
  }

  elements.locationResults.innerHTML = poll.results.locations
    .map((result) => resultTemplate(result, poll.totalVoters))
    .join("");
  elements.dateResults.innerHTML = poll.results.dates
    .map((result) => resultTemplate(result, poll.totalVoters))
    .join("");
}

function resultTemplate(result, totalVoters) {
  const percent = totalVoters === 0 ? 0 : Math.round((result.count / totalVoters) * 100);
  const chips =
    result.voters.length === 0
      ? `<span class="empty-voters">还没人选</span>`
      : result.voters.map((voter) => voterChipTemplate(voter)).join("");

  return `
    <article class="result-item">
      <div class="result-topline">
        <strong>${escapeHtml(result.label)}</strong>
        <span>${result.count} 人 · ${percent}%</span>
      </div>
      <div class="bar" aria-hidden="true">
        <span style="width: ${percent}%"></span>
      </div>
      <div class="voter-list">${chips}</div>
    </article>
  `;
}

function voterChipTemplate(voter) {
  const avatar = voter.avatar || "?";
  return `
    <span class="voter-chip avatar-only" title="一位已投票的小伙伴">
      <span class="avatar" style="--avatar-bg: ${avatarColor(avatar)}">${escapeHtml(avatar)}</span>
    </span>
  `;
}

function updateSummary() {
  elements.totalVoters.textContent = state.poll?.totalVoters ?? 0;
}

function setResultsGate() {
  elements.viewResults.hidden = !state.currentVoteExists;
  elements.submit.textContent = state.currentVoteExists ? "修改我的选择" : "提交我的选择";
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function setBusy(isBusy) {
  elements.form.classList.toggle("is-busy", isBusy);
  for (const button of elements.form.querySelectorAll("button")) {
    button.disabled = isBusy;
  }
}

function setStatus(message, tone = "muted") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function avatarColor(value) {
  const palette = ["#0f3b4a", "#2b7a78", "#7a3e2b", "#6b5b95", "#b94937", "#5d963d", "#1f5f8b"];
  const code = Array.from(value).reduce((sum, char) => sum + char.codePointAt(0), 0);
  return palette[code % palette.length];
}

function cssEscape(value) {
  if (window.CSS?.escape) {
    return CSS.escape(value);
  }

  return String(value).replace(/"/g, '\\"');
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
