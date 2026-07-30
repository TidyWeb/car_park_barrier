"use strict";

const EXERCISES = [
  { id: "01", code: 'vehicle = {"reg": "YB70 XCE", "height": 2.4}\n', rest: "Write the height question for Exercise 01, then run it." },
  { id: "02", code: 'stay = 5\n\nif stay > 1:\n    print("Standard rate")\nelif stay > 4:\n    print("Long stay rate")\nelse:\n    print("Free")\n', rest: "Reorder the chain for Exercise 02, then run it." },
  { id: "03", code: 'vehicle = {"reg": "PK21 RAV", "height": 2.0}\n', rest: "Write the boundary question for Exercise 03, then run it." },
  { id: "04", code: 'vehicle = {"reg": "LT19 KFN", "height": 2.4, "permit": False}\n\nif vehicle["height"] > 2.0:\n    print("Use the side entrance")\nelif vehicle["permit"] == False:\n    print("Pay at the machine")\n', rest: "Separate the two questions in Exercise 04, then run them." },
  { id: "05", code: 'vehicle_one = {"reg": "YB70 XCE", "permit": True}\nvehicle_two = {"reg": "PK21 RAV", "permit": True}\nvehicle_three = {"reg": "LT19 KFN", "permit": False}\n', rest: "Write the three permit decisions for Exercise 05, then run them." },
  { id: "06", code: 'vehicle_one = {"reg": "LT19 KFN", "height": 2.0, "stay": 5, "permit": False}\nvehicle_two = {"reg": "YB70 XCE", "height": 1.6, "stay": 2, "permit": True}\nvehicle_three = {"reg": "PK21 RAV", "height": 2.4, "stay": 1, "permit": True}\n', rest: "Work through one vehicle at a time for Exercise 06." },
];

const editor = document.querySelector("#code-editor");
const consoleOutput = document.querySelector("#console-output");
const runButton = document.querySelector("#run-code");
const clearButton = document.querySelector("#clear-console");
const status = document.querySelector("#runner-status");
const exerciseStrip = document.querySelector("#exercise-strip");
const railName = document.querySelector(".rail .brand-name");
let codeMirrorEditor;
let runnerAvailable = false;
let currentExercise = "01";

if (railName) railName.textContent = "Conditionals";
function setStatus(message, state = "") { status.textContent = message; status.classList.remove("running", "error"); if (state) status.classList.add(state); }
function editorValue() { return codeMirrorEditor ? codeMirrorEditor.getValue() : editor.value; }
function setEditorValue(value) { if (codeMirrorEditor) { codeMirrorEditor.setValue(value); const lastLine = codeMirrorEditor.lastLine(); codeMirrorEditor.setCursor({ line: lastLine, ch: codeMirrorEditor.getLine(lastLine).length }); } else { editor.value = value; editor.selectionStart = editor.selectionEnd = value.length; } }
function draftStorageKey(id) { return `supplementary-sheets:${location.pathname}:exercise-${id}`; }
function readDraft(id) { try { return window.localStorage.getItem(draftStorageKey(id)); } catch { return null; } }
function saveDraft(id, value) { try { window.localStorage.setItem(draftStorageKey(id), value); } catch { /* Starter code remains available if browser storage cannot be used. */ } }
function exerciseCode(exercise) { const draft = readDraft(exercise.id); return draft === null ? exercise.code : draft; }
function clearConsole(message) { consoleOutput.classList.remove("error-output"); consoleOutput.textContent = message; setStatus("Ready"); }
function selectExercise(id, { scrollToExercise = true } = {}) {
  const exercise = EXERCISES.find((item) => item.id === id);
  if (!exercise) return;
  if (currentExercise !== id) saveDraft(currentExercise, editorValue());
  currentExercise = id;
  setEditorValue(exerciseCode(exercise));
  clearConsole(exercise.rest);
  exerciseStrip.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.exercise === id)));
  if (scrollToExercise) document.querySelector(`#exercise-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  codeMirrorEditor?.focus();
}
EXERCISES.forEach((exercise) => {
  const button = document.createElement("button");
  button.type = "button"; button.dataset.exercise = exercise.id; button.textContent = exercise.id;
  button.setAttribute("aria-label", `Exercise ${exercise.id}`); button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => selectExercise(exercise.id)); exerciseStrip.append(button);
});
async function runCode() {
  if (!runnerAvailable) return;
  runButton.disabled = true; setStatus("Running", "running"); consoleOutput.classList.remove("error-output"); consoleOutput.textContent = "Running…";
  try {
    const result = await window.browserPython.run(editorValue());
    const output = [result.stdout, result.stderr].filter(Boolean).join("").trimEnd();
    consoleOutput.textContent = output || "Program finished without output.";
    if (result.timedOut || result.exitCode !== 0) { consoleOutput.classList.add("error-output"); setStatus(result.timedOut ? "Timed out" : "Check the error", "error"); } else setStatus("Finished");
  } catch (error) { consoleOutput.classList.add("error-output"); consoleOutput.textContent = `Python could not start in this browser.\n\n${error.message}`; setStatus("Runner offline", "error"); }
  finally { runButton.disabled = false; }
}
window.addEventListener("python-editor-run", runCode);
runButton.addEventListener("click", runCode);
clearButton.addEventListener("click", () => clearConsole("Console cleared."));
selectExercise(currentExercise, { scrollToExercise: false });
import("../assets/codemirror-editor.js?v=supplementary-sheets-20260729-plain-enter").then(async ({ createPythonEditor }) => { codeMirrorEditor = await createPythonEditor(editor); setEditorValue(exerciseCode(EXERCISES.find((item) => item.id === currentExercise))); }).catch(() => {});
runButton.disabled = true; setStatus("Preparing Python", "running");
window.browserPython.ready.then(() => { runnerAvailable = true; runButton.disabled = false; setStatus("Ready"); }).catch(() => setStatus("Python unavailable", "error"));
