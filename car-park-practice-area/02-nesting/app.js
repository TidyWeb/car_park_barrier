"use strict";

const STARTER_CODE = "";

const storageKey = "car-park-practice-area:test:code";
const editor = document.querySelector("#code-editor");
const consoleOutput = document.querySelector("#console-output");
const runButton = document.querySelector("#run-code");
const resetButton = document.querySelector("#reset-code");
const clearButton = document.querySelector("#clear-console");
const status = document.querySelector("#runner-status");
const promptButton = document.querySelector("#copy-prompt");
let runnerAvailable = false;
let codeMirrorEditor;

function setStatus(message, state = "") {
  status.textContent = message;
  status.className = `runner-status ${state}`.trim();
}
function editorValue() { return codeMirrorEditor ? codeMirrorEditor.getValue() : editor.value; }
function setEditorValue(value) { if (codeMirrorEditor) { codeMirrorEditor.setValue(value); const lastLine = codeMirrorEditor.lastLine(); codeMirrorEditor.setCursor({ line: lastLine, ch: codeMirrorEditor.getLine(lastLine).length }); } else { editor.value = value; editor.selectionStart = editor.selectionEnd = value.length; } }
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
