"use strict";

class BrowserPythonRunner extends EventTarget {
  constructor() {
    super();
    this.workerUrl = new URL("pyodide-worker.mjs", document.currentScript.src);
    this.nextId = 1;
    this.active = null;
    this.start();
    this.installWorkbenchUI();
    this.installPanelSplitter();
    this.installConsoleSplitter();
  }

  start() {
    this.worker = new Worker(this.workerUrl, { type: "module" });
    this.ready = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    this.worker.addEventListener("message", ({ data }) => this.onMessage(data));
    this.worker.addEventListener("error", (event) => this.rejectReady(new Error(event.message || "Python could not load.")));
  }

  onMessage(data) {
    if (data.type === "ready") return this.resolveReady();
    if (data.type === "init-error") return this.rejectReady(new Error(data.error));
    if (!this.active || data.id !== this.active.id) return;
    if (data.type === "stdout" || data.type === "stderr") {
      this.active[data.type] += data.text;
      this.dispatchEvent(new CustomEvent(data.type, { detail: data.text }));
    } else if (data.type === "input-request") {
      clearTimeout(this.active.timer);
      this.active.timer = null;
      this.dispatchEvent(new Event("input-request"));
    } else if (data.type === "result") {
      this.finish(data);
    }
  }

  async run(code, files = {}) {
    this.cancel(false);
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.active = { id, resolve, timer: null, stdout: "", stderr: "" };
      this.armTimeout();
      this.worker.postMessage({ type: "run", id, code, files });
    });
  }

  submitInput(value) {
    if (!this.active || this.active.timer) return false;
    this.active.stdout += `${value}\n`;
    this.worker.postMessage({ type: "input-response", id: this.active.id, value });
    this.armTimeout();
    return true;
  }

  armTimeout() {
    if (!this.active) return;
    clearTimeout(this.active.timer);
    this.active.timer = setTimeout(() => {
      const resolve = this.active.resolve;
      this.stopWorker();
      resolve({ stdout: "", stderr: "Program stopped after four seconds. Check for an endless loop.\n", exitCode: 124, timedOut: true });
    }, 4000);
  }

  finish(result) {
    clearTimeout(this.active.timer);
    const { resolve, stdout, stderr } = this.active;
    this.active = null;
    resolve({ ...result, stdout, stderr });
  }

  cancel() {
    if (!this.active) return false;
    const resolve = this.active.resolve;
    this.stopWorker();
    resolve({ stdout: "", stderr: "", exitCode: 130, cancelled: true, timedOut: false });
    return true;
  }

  stopWorker() {
    if (this.active) clearTimeout(this.active.timer);
    this.worker.terminate();
    this.active = null;
    this.start();
  }

  installWorkbenchUI() {
    const consoleOutput = document.querySelector("#console-output");
    const inputPanel = document.querySelector("#input-panel");
    const runButton = document.querySelector("#run-code");
    const editor = document.querySelector("#code-editor");
    if (!consoleOutput || !runButton || !editor) return;

    if (inputPanel) {
      inputPanel.hidden = true;
      setTimeout(() => { inputPanel.hidden = true; }, 0);
    }
    const shortcut = runButton.querySelector("kbd");
    if (shortcut) shortcut.textContent = "Ctrl ↵";

    const append = (text) => {
      if (consoleOutput.textContent === "Running…") consoleOutput.textContent = "";
      consoleOutput.append(document.createTextNode(text));
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };
    this.addEventListener("stdout", (event) => append(event.detail));
    this.addEventListener("stderr", (event) => append(event.detail));
    this.addEventListener("input-request", () => {
      const status = document.querySelector("#runner-status");
      if (status) status.textContent = "Waiting for input";
      const input = document.createElement("input");
      input.className = "console-input";
      input.setAttribute("aria-label", "Python program input");
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const answer = input.value;
        if (!this.submitInput(answer)) return;
        input.replaceWith(document.createTextNode(`${answer}\n`));
        if (status) status.textContent = "Running";
      });
      consoleOutput.append(input);
      input.focus();
    });

    ["#clear-console", "#reset-code", ".runner-tab"].forEach((selector) => {
      document.querySelectorAll(selector).forEach((control) => control.addEventListener("click", () => this.cancel(), { capture: true }));
    });
  }

  installPanelSplitter() {
    const shell = document.querySelector(".shell:not(.shell--single)");
    if (!shell) return;
    let splitter = shell.querySelector(".splitter");
    if (!splitter) {
      const workbench = shell.querySelector(".workbench");
      if (!workbench) return;
      splitter = document.createElement("div");
      splitter.className = "splitter";
      splitter.setAttribute("role", "separator");
      splitter.setAttribute("aria-orientation", "vertical");
      splitter.setAttribute("aria-label", "Resize reading and coding panels");
      splitter.setAttribute("aria-valuemin", "420");
      splitter.tabIndex = 0;
      splitter.title = "Drag to resize. Double-click to reset.";
      shell.insertBefore(splitter, workbench);
    }
    const storageKey = "returns-desk:workbench-split";
    const minReading = 420, minWorkbench = 420, handleWidth = 12;
    const narrow = window.matchMedia("(max-width: 1100px)");
    const setWidth = (requested) => {
      if (narrow.matches) return;
      const bounds = shell.getBoundingClientRect();
      const maximum = Math.max(minReading, bounds.width - minWorkbench - handleWidth);
      const width = Math.min(Math.max(requested, minReading), maximum);
      shell.style.setProperty("--reading-w", `${width}px`);
      splitter.setAttribute("aria-valuenow", String(Math.round(width)));
      splitter.setAttribute("aria-valuemax", String(Math.round(maximum)));
      localStorage.setItem(storageKey, String(Math.round(width)));
    };
    const reset = () => { shell.style.removeProperty("--reading-w"); localStorage.removeItem(storageKey); splitter.removeAttribute("aria-valuenow"); };
    const saved = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved > 0) requestAnimationFrame(() => setWidth(saved));
    splitter.addEventListener("pointerdown", (event) => { if (narrow.matches) return; splitter.setPointerCapture(event.pointerId); splitter.classList.add("dragging"); document.body.classList.add("splitter-dragging"); setWidth(event.clientX - shell.getBoundingClientRect().left); });
    splitter.addEventListener("pointermove", (event) => { if (splitter.hasPointerCapture(event.pointerId)) setWidth(event.clientX - shell.getBoundingClientRect().left); });
    const release = (event) => { if (splitter.hasPointerCapture(event.pointerId)) splitter.releasePointerCapture(event.pointerId); splitter.classList.remove("dragging"); document.body.classList.remove("splitter-dragging"); };
    splitter.addEventListener("pointerup", release); splitter.addEventListener("pointercancel", release); splitter.addEventListener("dblclick", reset);
    splitter.addEventListener("keydown", (event) => { const current = shell.querySelector(".drill-reading").getBoundingClientRect().width; if (event.key === "ArrowLeft") { event.preventDefault(); setWidth(current - 24); } if (event.key === "ArrowRight") { event.preventDefault(); setWidth(current + 24); } if (event.key === "Home") { event.preventDefault(); setWidth(minReading); } if (event.key === "End") { event.preventDefault(); setWidth(shell.getBoundingClientRect().width); } });
    window.addEventListener("resize", () => { const current = parseFloat(getComputedStyle(shell).getPropertyValue("--reading-w")); if (current && !narrow.matches) setWidth(current); });
  }

  installConsoleSplitter() {
    const workbench = document.querySelector(".workbench");
    const editorPanel = workbench?.querySelector(".editor-panel");
    const consolePanel = workbench?.querySelector(".console-panel");
    if (!workbench || !editorPanel || !consolePanel) return;

    let splitter = workbench.querySelector(".console-splitter");
    if (!splitter) {
      splitter = document.createElement("div");
      splitter.className = "console-splitter";
      splitter.setAttribute("role", "separator");
      splitter.setAttribute("aria-orientation", "horizontal");
      splitter.setAttribute("aria-label", "Resize code editor and console");
      splitter.tabIndex = 0;
      splitter.title = "Drag to resize. Double-click to reset.";
      workbench.insertBefore(splitter, consolePanel);
    }

    const storageKey = "returns-desk:workbench-editor-height";
    const minEditor = 260;
    const minConsole = 120;
    const handleHeight = 12;
    const setHeight = (requested) => {
      const editorBounds = editorPanel.getBoundingClientRect();
      const consoleBounds = consolePanel.getBoundingClientRect();
      const maximum = Math.max(minEditor, consoleBounds.bottom - editorBounds.top - minConsole - handleHeight);
      const height = Math.min(Math.max(requested, minEditor), maximum);
      workbench.style.setProperty("--editor-h", `${height}px`);
      splitter.setAttribute("aria-valuemin", String(minEditor));
      splitter.setAttribute("aria-valuemax", String(Math.round(maximum)));
      splitter.setAttribute("aria-valuenow", String(Math.round(height)));
      localStorage.setItem(storageKey, String(Math.round(height)));
    };
    const reset = () => {
      workbench.style.removeProperty("--editor-h");
      localStorage.removeItem(storageKey);
      splitter.removeAttribute("aria-valuenow");
    };
    const saved = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved > 0) requestAnimationFrame(() => setHeight(saved));
    const positionFromPointer = (event) => event.clientY - editorPanel.getBoundingClientRect().top;
    splitter.addEventListener("pointerdown", (event) => {
      splitter.setPointerCapture(event.pointerId);
      splitter.classList.add("dragging");
      document.body.classList.add("console-splitter-dragging");
      setHeight(positionFromPointer(event));
    });
    splitter.addEventListener("pointermove", (event) => {
      if (splitter.hasPointerCapture(event.pointerId)) setHeight(positionFromPointer(event));
    });
    const release = (event) => {
      if (splitter.hasPointerCapture(event.pointerId)) splitter.releasePointerCapture(event.pointerId);
      splitter.classList.remove("dragging");
      document.body.classList.remove("console-splitter-dragging");
    };
    splitter.addEventListener("pointerup", release);
    splitter.addEventListener("pointercancel", release);
    splitter.addEventListener("dblclick", reset);
    splitter.addEventListener("keydown", (event) => {
      const current = editorPanel.getBoundingClientRect().height;
      if (event.key === "ArrowUp") { event.preventDefault(); setHeight(current - 24); }
      if (event.key === "ArrowDown") { event.preventDefault(); setHeight(current + 24); }
      if (event.key === "Home") { event.preventDefault(); setHeight(minEditor); }
      if (event.key === "End") { event.preventDefault(); setHeight(workbench.getBoundingClientRect().height); }
    });
    window.addEventListener("resize", () => {
      const current = parseFloat(getComputedStyle(workbench).getPropertyValue("--editor-h"));
      if (current) setHeight(current);
    });
  }
}

window.browserPython = new BrowserPythonRunner();
