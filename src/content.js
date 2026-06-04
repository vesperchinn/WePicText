(function initWePicText() {
  var cleaner = window.WePicTextCleaner;
  if (!cleaner || document.getElementById("wepictext-panel")) return;

  var state = {
    sourceName: "",
    cleanedText: ""
  };

  function getPasteShortcut() {
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "⌘V" : "Ctrl+V";
  }

  function isVisible(element) {
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    return rect.width > 40 && rect.height > 24 && style.visibility !== "hidden" && style.display !== "none";
  }

  function isEditable(element) {
    if (!element) return false;
    var tag = element.tagName ? element.tagName.toLowerCase() : "";
    return (
      tag === "textarea" ||
      (tag === "input" && /^(text|search|url|email|tel)?$/.test(element.type || "text")) ||
      element.isContentEditable ||
      element.getAttribute("role") === "textbox"
    );
  }

  function findTarget() {
    if (isEditable(document.activeElement) && isVisible(document.activeElement)) {
      return document.activeElement;
    }

    var selectors = [
      "textarea",
      "[contenteditable='true']",
      "[role='textbox']",
      "input[type='text']"
    ];

    return Array.from(document.querySelectorAll(selectors.join(",")))
      .filter(isVisible)
      .sort((a, b) => {
        var aRect = a.getBoundingClientRect();
        var bRect = b.getBoundingClientRect();
        return bRect.width * bRect.height - aRect.width * aRect.height;
      })[0];
  }

  function findEditableAncestor(element) {
    var current = element;

    while (current && current !== document.body && current !== document.documentElement) {
      if (isEditable(current)) return current;
      current = current.parentElement;
    }

    return element;
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  async function copyAndFocusTarget(text) {
    var target = findTarget();

    if (target) {
      findEditableAncestor(target).focus();
    }

    await copyText(cleaner.addParagraphSpacing(text, 1));
    return Boolean(target);
  }

  function setStatus(message, type) {
    var status = document.getElementById("wepictext-status");
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type || "info";
  }

  function updatePreview(text) {
    state.cleanedText = cleaner.cleanMarkdown(text);
    var preview = document.getElementById("wepictext-preview");
    if (preview) preview.value = state.cleanedText;
    setStatus(state.cleanedText ? "已整理，可写入当前文字框。" : "没有可写入的文字。", state.cleanedText ? "ok" : "warn");
  }

  function readFile(file) {
    var reader = new FileReader();
    state.sourceName = file.name;
    reader.onload = function onLoad() {
      updatePreview(String(reader.result || ""));
      setStatus("已读取：" + state.sourceName, "ok");
    };
    reader.onerror = function onError() {
      setStatus("文件读取失败。", "warn");
    };
    reader.readAsText(file);
  }

  function injectPanel() {
    var panel = document.createElement("section");
    panel.id = "wepictext-panel";
    panel.innerHTML = [
      '<div class="wepictext-head">',
      "  <strong>WePicText <span>0.1.8</span></strong>",
      '  <button type="button" id="wepictext-collapse" aria-label="收起">−</button>',
      "</div>",
      '<label class="wepictext-drop" for="wepictext-file">拖入 .md / .txt</label>',
      '<input id="wepictext-file" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" />',
      '<textarea id="wepictext-preview" placeholder="整理后的文字会出现在这里"></textarea>',
      '<div class="wepictext-actions">',
      '  <button type="button" id="wepictext-clean">整理剪贴板</button>',
      '  <button type="button" id="wepictext-write">复制并定位</button>',
      "</div>",
      '<p id="wepictext-status">拖入文件，复制后在文字区按 ' + getPasteShortcut() + '。</p>'
    ].join("");

    document.documentElement.appendChild(panel);

    var fileInput = document.getElementById("wepictext-file");
    var drop = panel.querySelector(".wepictext-drop");
    var preview = document.getElementById("wepictext-preview");

    fileInput.addEventListener("change", function onChange(event) {
      var file = event.target.files && event.target.files[0];
      if (file) readFile(file);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      drop.addEventListener(eventName, function onDrag(event) {
        event.preventDefault();
        drop.dataset.dragging = "true";
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      drop.addEventListener(eventName, function onDragEnd() {
        drop.dataset.dragging = "false";
      });
    });

    drop.addEventListener("drop", function onDrop(event) {
      event.preventDefault();
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) readFile(file);
    });

    preview.addEventListener("input", function onPreviewInput() {
      state.cleanedText = preview.value;
    });

    document.getElementById("wepictext-clean").addEventListener("click", async function onClean() {
      try {
        var text = await navigator.clipboard.readText();
        updatePreview(text);
      } catch (error) {
        setStatus("无法读取剪贴板，请拖入文件或手动粘贴。", "warn");
      }
    });

    document.getElementById("wepictext-write").addEventListener("click", async function onWrite() {
      var text = preview.value.trim();
      if (!text) {
        setStatus("没有可写入的文字。", "warn");
        return;
      }

      try {
        var hasTarget = await copyAndFocusTarget(text);
        setStatus(
          hasTarget
            ? "已复制。空行已加防吞占位，请按 " + getPasteShortcut() + " 粘贴。"
            : "已复制。请点文字区后按 " + getPasteShortcut() + " 粘贴。",
          "ok"
        );
      } catch (error) {
        setStatus("复制失败，请手动复制右侧文字。", "warn");
      }
    });

    document.getElementById("wepictext-collapse").addEventListener("click", function onCollapse() {
      panel.dataset.collapsed = panel.dataset.collapsed === "true" ? "false" : "true";
    });
  }

  injectPanel();
})();
