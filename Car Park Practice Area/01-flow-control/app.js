"use strict";

const STARTER_CODE = [
  "# ---- SECTION 1: the customers and their baskets ----",
  "customers = [",
  "    {\"name\": \"Marjorie\", \"basket\": {\"apples\": 4.50, \"bread\": 3.20}, \"loyalty_card\": True, \"bags\": 2},",
  "    {\"name\": \"Dev\", \"basket\": {\"cheese\": 12.00, \"olives\": 6.50, \"juice\": 3.80}, \"loyalty_card\": False, \"bags\": 1},",
  "    {\"name\": \"Aisha\", \"basket\": {\"hamper\": 32.00, \"tea\": 4.50}, \"loyalty_card\": True, \"bags\": 3},",
  "]",
  "# Comment this section out: Python will not know any customers.",
  "",
  "day_total = 0",
  "",
  "for customer in customers:",
  "    basket_total = 0",
  "    for price in customer[\"basket\"].values():",
  "        basket_total += price",
  "",
  "    # ---- SECTION 2: the loyalty discount ----",
  "    if customer[\"loyalty_card\"]:",
  "        basket_total = basket_total * 0.90",
  "    # Comment this section out: loyalty customers pay full price.",
  "",
  "    # ---- SECTION 3: the bag charge ----",
  "    if basket_total <= 30:",
  "        basket_total += customer[\"bags\"] * 0.20",
  "    # Comment this section out: bag charges disappear for smaller shops.",
  "",
  "    day_total += basket_total",
  "    print(f'{customer[\"name\"]}: £{basket_total:.2f}')",
  "",
  "print(f'Day total: £{day_total:.2f}')",
].join("\n");

const storageKey = "car-park-practice-area:worked-example:code";
const editor = document.querySelector("#code-editor");
const consoleOutput = document.querySelector("#console-output");
const runButton = document.querySelector("#run-code");
const resetButton = document.querySelector("#reset-code");
const clearButton = document.querySelector("#clear-console");
const status = document.querySelector("#runner-status");
const promptButton = document.querySelector("#copy-prompt");
let runnerAvailable = false;
let codeMirrorEditor;

const railScenarioName = document.querySelector(".rail .brand-name");
if (railScenarioName) railScenarioName.textContent = "Saturday Market Stall";

function setStatus(message, state = "") {
  status.textContent = message;
  status.className = `runner-status ${state}`.trim();
}
function editorValue() { return codeMirrorEditor ? codeMirrorEditor.getValue() : editor.value; }
function setEditorValue(value) { if (codeMirrorEditor) codeMirrorEditor.setValue(value); else editor.value = value; }
function restoreCode() { setEditorValue(localStorage.getItem(storageKey) ?? STARTER_CODE); }
function saveCode() { localStorage.setItem(storageKey, editorValue()); }

async function runCode() {
  if (!runnerAvailable) return;
  saveCode();
  runButton.disabled = true;
  setStatus("Running", "running");
  consoleOutput.classList.remove("error-output");
  consoleOutput.textContent = "Running…";
  try {
    const result = await window.browserPython.run(editorValue());
    const output = [result.stdout, result.stderr].filter(Boolean).join("").trimEnd();
    consoleOutput.textContent = output || "Program finished without output.";
    if (result.timedOut || result.exitCode !== 0) {
      consoleOutput.classList.add("error-output");
      setStatus(result.timedOut ? "Timed out" : "Check the error", "error");
    } else setStatus("Finished");
  } catch (error) {
    consoleOutput.classList.add("error-output");
    consoleOutput.textContent = `Python could not start in this browser.\n\n${error.message}`;
    setStatus("Runner offline", "error");
  } finally { runButton.disabled = false; }
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const fallback = document.createElement("textarea");
  fallback.value = value; fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed"; fallback.style.opacity = "0";
  document.body.append(fallback); fallback.select();
  const copied = document.execCommand("copy");
  fallback.remove();
  if (!copied) throw new Error("Clipboard copy was not available.");
}

async function copyPrompt() {
  const currentCode = editor.value.trim();
  const attempt = currentCode ? `\n\nHere is what I have written so far:\n\n\`\`\`python\n${currentCode}\n\`\`\`` : "";
  const prompt = `Do not give me the solution. Do not write the code for me.\n\nI am practising Python. Here is the exercise I am working on:\n\n${promptButton.dataset.brief}\n\nI am only allowed to use these Python features:\n${promptButton.dataset.toolkit}${attempt}\n\nAsk me ONE question that helps me see what is wrong, or point me at the single line to look at again. Keep it under three sentences. Do not rewrite my code.\n\nMy question is:`;
  const originalLabel = promptButton.textContent;
  try {
    await copyText(prompt);
    promptButton.textContent = "Copied";
  } catch {
    promptButton.textContent = "Copy failed";
  }
  setTimeout(() => { promptButton.textContent = originalLabel; }, 2000);
}

editor.addEventListener("input", saveCode);
window.addEventListener("python-editor-run", runCode);
runButton.addEventListener("click", runCode);
clearButton.addEventListener("click", () => {
  consoleOutput.classList.remove("error-output");
  consoleOutput.textContent = "Console cleared."; setStatus("Ready");
});
resetButton.addEventListener("click", () => {
  if (!window.confirm("Reset this drill to its starter code?")) return;
  localStorage.removeItem(storageKey); restoreCode();
  consoleOutput.classList.remove("error-output");
  consoleOutput.textContent = "Starter code restored."; setStatus("Ready");
});
if (promptButton) promptButton.addEventListener("click", copyPrompt);
restoreCode();
import("../assets/codemirror-editor.js").then(async ({ createPythonEditor }) => {
  codeMirrorEditor = await createPythonEditor(editor);
}).catch(() => { /* The plain editor remains available if the optional editor cannot load. */ });
runButton.disabled = true; setStatus("Preparing Python", "running");
window.browserPython.ready.then(() => {
  runnerAvailable = true; runButton.disabled = false; setStatus("Ready");
}).catch(() => setStatus("Python unavailable", "error"));
