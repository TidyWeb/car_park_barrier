const BASE = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/";

function loadScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${BASE}${path}`;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${path}`));
    document.head.append(script);
  });
}

function loadStylesheet(path) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${BASE}${path}`;
  document.head.append(link);
}

let codeMirrorReady;
function loadCodeMirror() {
  if (!codeMirrorReady) {
    loadStylesheet("codemirror.min.css");
    codeMirrorReady = loadScript("codemirror.min.js")
      .then(() => Promise.all([
        loadScript("mode/python/python.min.js"),
        loadScript("addon/edit/matchbrackets.min.js"),
        loadScript("addon/edit/matchtags.min.js"),
      ]));
  }
  return codeMirrorReady;
}

export async function createPythonEditor(textarea) {
  await loadCodeMirror();
  const editor = window.CodeMirror.fromTextArea(textarea, {
    mode: "python",
    theme: "tidyworkbench",
    lineNumbers: true,
    lineWrapping: true,
    indentUnit: 4,
    indentWithTabs: false,
    matchBrackets: true,
    extraKeys: {
      "Ctrl-Enter": () => window.dispatchEvent(new Event("python-editor-run")),
      "Enter": (cm) => cm.replaceSelection("\n", "end"),
      "Tab": (cm) => cm.execCommand("indentMore"),
      "Shift-Tab": (cm) => cm.execCommand("indentLess"),
    },
  });
  editor.on("change", () => textarea.dispatchEvent(new Event("input", { bubbles: true })));
  return {
    getValue: () => editor.getValue(),
    setValue: (value) => editor.setValue(value),
    focus: () => editor.focus(),
  };
}
