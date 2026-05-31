(function exposeCleaner(root) {
  function normalizeNewlines(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ");
  }

  function stripFrontMatter(text) {
    return text.replace(/^---\n[\s\S]*?\n---\n?/, "");
  }

  function stripMarkdownSyntax(line) {
    return line
      .replace(/^#{1,6}\s+/, "")
      .replace(/^>\s?/, "")
      .replace(/^[-*+]\s+/, "")
      .replace(/^\d+[.)]\s+/, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  function isListLine(line) {
    return /^\s*(?:[-*+]|\d+[.)])\s+/.test(line);
  }

  function shouldJoinWithSpace(left, right) {
    return /[A-Za-z0-9]$/.test(left) && /^[A-Za-z0-9]/.test(right);
  }

  function joinInline(lines) {
    return lines.reduce((result, line) => {
      if (!result) return line;
      return result + (shouldJoinWithSpace(result, line) ? " " : "") + line;
    }, "");
  }

  function splitBlocks(text) {
    return text
      .replace(/^#{1,6}\s+(.+)$/gm, "\n\n$1\n\n")
      .replace(/^\s*[-*_]{3,}\s*$/gm, "\n\n")
      .replace(/!\[[^\]]*]\([^)]*\)/g, "\n\n")
      .replace(/\[[^\]]+]\(([^)]+)\)/g, (match) => {
        var textOnly = match.match(/^\[([^\]]+)]/);
        return textOnly ? textOnly[1] : "";
      })
      .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, "")
      .split(/\n{2,}/);
  }

  function cleanMarkdown(input) {
    var text = stripFrontMatter(normalizeNewlines(input));
    var paragraphs = [];

    splitBlocks(text).forEach((block) => {
      var inlineLines = [];

      block.split("\n").forEach((rawLine) => {
        var cleanedLine = stripMarkdownSyntax(rawLine).replace(/\s+/g, " ").trim();
        if (!cleanedLine) return;

        if (isListLine(rawLine)) {
          if (inlineLines.length) {
            paragraphs.push(joinInline(inlineLines));
            inlineLines = [];
          }
          paragraphs.push(cleanedLine);
          return;
        }

        inlineLines.push(cleanedLine);
      });

      if (inlineLines.length) {
        paragraphs.push(joinInline(inlineLines));
      }
    });

    return paragraphs
      .map((block) => block.trim())
      .filter(Boolean)
      .join("\n\n");
  }

  function addParagraphSpacing(input, blankLineCount) {
    var spacerLine = "\u200b";
    var separator = "\n" + Array(blankLineCount || 1).fill(spacerLine).join("\n") + "\n";

    return normalizeNewlines(input)
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .join(separator);
  }

  var api = { cleanMarkdown: cleanMarkdown, addParagraphSpacing: addParagraphSpacing };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.WePicTextCleaner = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
