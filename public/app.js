const form = document.querySelector("#feedback-form");
const status = document.querySelector("#status");
const submit = document.querySelector("#submit");
const successPanel = document.querySelector("#success-panel");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = Object.fromEntries(new FormData(form).entries());
  setBusy(true);
  setStatus("正在提交...", "muted");

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
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setStatus("已提交。", "success");
  } catch (error) {
    setStatus(error.message || "提交失败了，再试一次。", "error");
  } finally {
    setBusy(false);
  }
});

function setBusy(isBusy) {
  submit.disabled = isBusy;
  form.classList.toggle("is-busy", isBusy);
}

function setStatus(message, tone = "muted") {
  status.textContent = message;
  status.dataset.tone = tone;
}
