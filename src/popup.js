(function initPopup() {
  var cleaner = window.WePicTextCleaner;
  var sourceText = document.getElementById("sourceText");
  var fileInput = document.getElementById("fileInput");
  var status = document.getElementById("status");

  function setStatus(message, type) {
    status.textContent = message;
    status.dataset.type = type || "info";
  }

  function getPasteShortcut() {
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "⌘V" : "Ctrl+V";
  }

  function cleanCurrentText() {
    var cleaned = cleaner.cleanMarkdown(sourceText.value);
    sourceText.value = cleaned;
    setStatus(cleaned ? "已整理。" : "没有可整理的文字。", cleaned ? "ok" : "warn");
    return cleaned;
  }

  function readFile(file) {
    var reader = new FileReader();
    reader.onload = function onLoad() {
      sourceText.value = cleaner.cleanMarkdown(String(reader.result || ""));
      setStatus("已读取：" + file.name, "ok");
    };
    reader.onerror = function onError() {
      setStatus("文件读取失败。", "warn");
    };
    reader.readAsText(file);
  }

  fileInput.addEventListener("change", function onChange(event) {
    var file = event.target.files && event.target.files[0];
    if (file) readFile(file);
  });

  document.querySelector(".drop-zone").addEventListener("dragover", function onDragOver(event) {
    event.preventDefault();
  });

  document.querySelector(".drop-zone").addEventListener("drop", function onDrop(event) {
    event.preventDefault();
    var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) readFile(file);
  });

  document.getElementById("cleanButton").addEventListener("click", cleanCurrentText);

  document.getElementById("copyButton").addEventListener("click", async function onCopy() {
    var cleaned = cleanCurrentText();
    if (!cleaned) return;

    try {
      await navigator.clipboard.writeText(cleaner.addParagraphSpacing(cleaned, 1));
      setStatus("已复制。", "ok");
    } catch (error) {
      setStatus("复制失败，请手动复制。", "warn");
    }
  });

  document.getElementById("writeButton").addEventListener("click", async function onWrite() {
    var cleaned = cleanCurrentText();
    if (!cleaned) return;

    try {
      await navigator.clipboard.writeText(cleaner.addParagraphSpacing(cleaned, 1));
      setStatus("已复制。请到公众号文字区按 " + getPasteShortcut() + " 粘贴。", "ok");
    } catch (error) {
      setStatus("复制失败，请手动复制。", "warn");
    }
  });
})();
