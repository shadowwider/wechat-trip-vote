import { startKnowledgeGraph } from "./knowledge-graph.js";

const form = document.querySelector("#feedback-form");
const status = document.querySelector("#status");
const submit = document.querySelector("#submit");
const next = document.querySelector("#next-step");
const prev = document.querySelector("#prev-step");
const progressBar = document.querySelector("#progress-bar");
const stepIndicator = document.querySelector("#step-indicator");
const successPanel = document.querySelector("#success-panel");
const restart = document.querySelector("#restart-form");
const steps = Array.from(document.querySelectorAll(".survey-step"));

let currentStep = 0;

startKnowledgeGraph(document.querySelector("#knowledge-canvas"));
updateStep();

next.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;
  currentStep = Math.min(currentStep + 1, steps.length - 1);
  updateStep();
});

prev.addEventListener("click", () => {
  currentStep = Math.max(currentStep - 1, 0);
  updateStep();
});

restart.addEventListener("click", () => {
  successPanel.hidden = true;
  form.hidden = false;
  currentStep = 0;
  updateStep();
  document.querySelector("#name").focus();
});

form.addEventListener("change", (event) => {
  if (event.target.matches("input[type='radio']")) {
    setStatus("", "muted");
  }
});

form.addEventListener("input", () => {
  setStatus("", "muted");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateAll()) return;

  const payload = Object.fromEntries(new FormData(form).entries());
  setBusy(true);
  setStatus("正在把反馈写入知识地图...", "muted");

  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "提交失败了。");
    }

    form.reset();
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    setStatus("", "success");
  } catch (error) {
    setStatus(error.message || "提交失败了，再试一次。", "error");
  } finally {
    setBusy(false);
  }
});

function updateStep() {
  steps.forEach((step, index) => {
    step.classList.toggle("is-active", index === currentStep);
  });

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  prev.disabled = isFirst;
  next.hidden = isLast;
  submit.hidden = !isLast;
  stepIndicator.textContent = `${String(currentStep + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
  progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  setStatus("", "muted");

  const focusable = steps[currentStep].querySelector("input, textarea");
  window.setTimeout(() => focusable?.focus({ preventScroll: true }), 80);
}

function validateAll() {
  for (let index = 0; index < steps.length; index += 1) {
    if (!validateStep(index)) {
      currentStep = index;
      updateStep();
      validateStep(index);
      return false;
    }
  }

  return true;
}

function validateStep(index) {
  const step = steps[index];
  const field = step.dataset.field;
  const value = fieldValue(field);

  if (!value) {
    setStatus(messageFor(field), "error");
    step.querySelector("input, textarea")?.focus();
    return false;
  }

  return true;
}

function fieldValue(field) {
  if (["overallScore", "advancedInterest", "recommendInterest"].includes(field)) {
    return form.querySelector(`input[name="${field}"]:checked`)?.value || "";
  }

  return String(form.elements[field]?.value || "").trim();
}

function messageFor(field) {
  const messages = {
    name: "先写一下姓名或昵称。",
    overallScore: "请给课程整体收获打一个分数。",
    valuableModule: "请写一个最有价值的具体模块。",
    deeperTopics: "请写一个希望进一步深入的方向。",
    advancedInterest: "请给后续进阶课程意愿打一个分数。",
    recommendInterest: "请给推荐他人参加意愿打一个分数。",
    eventComplaint: "请写一句关于这次活动的吐槽或建议。"
  };

  return messages[field] || "这一题还没有填写。";
}

function setBusy(isBusy) {
  submit.disabled = isBusy;
  next.disabled = isBusy;
  prev.disabled = isBusy || currentStep === 0;
  form.classList.toggle("is-busy", isBusy);
}

function setStatus(message, tone = "muted") {
  status.textContent = message;
  status.dataset.tone = tone;
}
