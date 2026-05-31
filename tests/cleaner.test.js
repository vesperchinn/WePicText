const assert = require("assert");
const { addParagraphSpacing, cleanMarkdown } = require("../src/cleaner");

const sample = `---
title: 测试
---

# 养生总半途而废？问题不在你

![cover](cover.png)

很多人一开始就想做到满分，结果三天就累了。

**第一次别要满分**，先让身体知道：这件事不难。

- 准备不等于行动
- 断一天不等于全白费

[查看来源](https://example.com)

---
`;

assert.strictEqual(
  cleanMarkdown(sample),
  [
    "养生总半途而废？问题不在你",
    "很多人一开始就想做到满分，结果三天就累了。",
    "第一次别要满分，先让身体知道：这件事不难。",
    "准备不等于行动",
    "断一天不等于全白费",
    "查看来源"
  ].join("\n\n")
);

assert.strictEqual(
  cleanMarkdown("第一行\n第二行\n\n第三行"),
  "第一行第二行\n\n第三行"
);

assert.strictEqual(cleanMarkdown("## 标题\n\n正文"), "标题\n\n正文");

assert.strictEqual(
  cleanMarkdown("第一段\r\n\r\n第二段\r\n第三行"),
  "第一段\n\n第二段第三行"
);

assert.strictEqual(
  addParagraphSpacing("第一段\n\n第二段\n\n第三段", 2),
  "第一段\n\u200b\n\u200b\n第二段\n\u200b\n\u200b\n第三段"
);

assert.strictEqual(
  addParagraphSpacing("第一段\n\n第二段\n\n第三段", 1),
  "第一段\n\u200b\n第二段\n\u200b\n第三段"
);

console.log("cleaner tests passed");
