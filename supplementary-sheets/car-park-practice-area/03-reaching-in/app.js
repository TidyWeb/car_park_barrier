"use strict";

const VEHICLES = 'vehicles = [\n    {"reg": "LT19 KFN", "hours": 4},\n    {"reg": "YB70 XCE", "hours": 6},\n    {"reg": "PK21 RAV", "hours": 1},\n]\n';

const EXERCISES = [
  { id: "01", code: VEHICLES, rest: "Use two print commands for Exercise 01." },
  { id: "02", code: VEHICLES, rest: "Print the three requested values for Exercise 02." },
  { id: "03", code: VEHICLES, rest: "Print the three facts for Exercise 03." },
  { id: "04", code: VEHICLES, rest: "Give the second vehicle a name, then print its three facts in one print command." },
  { id: "05", code: 'vehicles = [\n    {"reg": "LT19 KFN", "hours": 4},\n    {"reg": "YB70 XCE", "hours": 6},\n    {"reg": "PK21 RAV", "hours": 1},\n]\n', rest: "Work out what LT19 KFN owes from each of the two supplied shapes." },
  { id: "06", code: `${VEHICLES}\n# Remove the # from one line at a time, then run it.\n# print(vehicles[5])\n# print(vehicles[0]["registration"])\n# print(vehicles[0]["reg"]["hours"])\n# print(vehicles["0"])`, rest: "Try one broken reach at a time for Exercise 06." },
  { id: "07", code: 'customer = {\n    "name": "Marjorie",\n    "basket": {"apples": 4, "pears": 2},\n    "recent_visits": ["Monday", "Thursday"],\n}\n', rest: "Print the requested facts for Exercise 07." },
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

if (railName) railName.textContent = "Reaching In";

function setStatus(message, state = "") {
  status.textContent = message;
  status.classList.remove("running", "error");
  if (state) status.classList.add(state);
}
function editorValue() { return codeMirrorEditor ? codeMirrorEditor.getValue() : editor.value; }
function setEditorValue(value) { if (codeMirrorEditor) codeMirrorEditor.setValue(value); else editor.value = value; }
function clearConsole(message) { consoleOutput.classList.remove("error-output"); consoleOutput.textContent = message; setStatus("Ready"); }
function selectExercise(id, { scrollToExercise = true } = {}) {
  const exercise = EXERCISES.find((item) => item.id === id);
  if (!exercise) return;
  currentExercise = id;
  setEditorValue(exercise.code);
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
import("../assets/codemirror-editor.js?v=supplementary-sheets-20260729-plain-enter").then(async ({ createPythonEditor }) => { codeMirrorEditor = await createPythonEditor(editor); setEditorValue(EXERCISES.find((item) => item.id === currentExercise).code); }).catch(() => {});
runButton.disabled = true; setStatus("Preparing Python", "running");
window.browserPython.ready.then(() => { runnerAvailable = true; runButton.disabled = false; setStatus("Ready"); }).catch(() => setStatus("Python unavailable", "error"));
