// Popup script: handles toggle, mode switching, and stats display.

const toggleBtn = document.getElementById("toggleBtn");
const statsEl = document.getElementById("stats");
const modesEl = document.getElementById("modes");
const spinnerEl = document.getElementById("spinner");
const statusTextEl = document.getElementById("statusText");
const totalEl = document.getElementById("totalSentences");
const highEl = document.getElementById("highSignal");
const lowEl = document.getElementById("lowSignal");
const densityFill = document.getElementById("densityFill");
const densityPct = document.getElementById("densityPct");

let isActive = false;

function setStatus(text, showSpinner) {
  statusTextEl.textContent = text;
  if (showSpinner) {
    spinnerEl.classList.add("visible");
  } else {
    spinnerEl.classList.remove("visible");
  }
}

// Ensure the content script is injected, then send a message
async function ensureContentScript(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "get_status" });
    return response;
  } catch (e) {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["styles.css"] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    await new Promise((r) => setTimeout(r, 100));
    return null;
  }
}

// Check current state on popup open
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  if (!tabs[0]) return;
  try {
    const response = await ensureContentScript(tabs[0].id);
    if (response?.active) {
      isActive = true;
      toggleBtn.textContent = "Turn off";
      toggleBtn.classList.add("active");
    }
  } catch (e) {
    // ignore
  }
});

// Toggle button
toggleBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (!isActive) {
    setStatus("Loading model and analyzing...", true);
    toggleBtn.disabled = true;
  }

  try {
    await ensureContentScript(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { type: "toggle" });

    if (response?.active === "pending") {
      toggleBtn.textContent = "Analyzing...";
      toggleBtn.classList.add("active");
      toggleBtn.disabled = true;
      setStatus("Loading model and analyzing...", true);
    } else if (response?.active === false) {
      isActive = false;
      toggleBtn.textContent = "Dim the slop";
      toggleBtn.classList.remove("active");
      toggleBtn.disabled = false;
      statsEl.classList.remove("visible");
      modesEl.classList.remove("visible");
      setStatus("Click to dim the slop", false);
    } else {
      isActive = response?.active || false;
      toggleBtn.disabled = false;
    }
  } catch (e) {
    const msg = e.message || "";
    if (msg.includes("chrome://") || msg.includes("Cannot access")) {
      setStatus("Can't analyze this page", false);
    } else {
      setStatus("Error: " + msg, false);
    }
    toggleBtn.disabled = false;
  }
});

// Mode buttons
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");

    const mode = btn.dataset.mode;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { type: "set_mode", mode });
  });
});

// Listen for analysis completion
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "analysis_complete" && msg.stats) {
    const { totalSentences, highSignal, lowSignal, avgScore } = msg.stats;
    const signalPct = Math.round((highSignal / totalSentences) * 100);

    totalEl.textContent = totalSentences;
    highEl.textContent = highSignal;
    lowEl.textContent = lowSignal;
    densityPct.textContent = signalPct + "%";

    let color;
    if (signalPct >= 60) color = "#1a7f37";
    else if (signalPct >= 35) color = "#bf8700";
    else color = "#cf222e";

    densityFill.style.width = signalPct + "%";
    densityFill.style.background = color;

    const cls = signalPct >= 60 ? "high" : signalPct >= 35 ? "mid" : "low";
    densityPct.className = "stat-value " + cls;

    statsEl.classList.add("visible");
    modesEl.classList.add("visible");
    setStatus("Active", false);
    isActive = true;
    toggleBtn.textContent = "Turn off";
    toggleBtn.classList.add("active");
    toggleBtn.disabled = false;
  }

  if (msg.type === "analysis_error") {
    setStatus("Analysis failed", false);
    isActive = false;
    toggleBtn.textContent = "Dim the slop";
    toggleBtn.classList.remove("active");
    toggleBtn.disabled = false;
  }
});
