(() => {
  "use strict";
  const entries = window.BOOK_CHAPTERS;
  if (!Array.isArray(entries)) return;
  const config = window.BOOK_CONFIG || {};
  const chapterPage = document.body.dataset.chapter === "true";
  const prefix = document.body.dataset.root ?? (chapterPage ? "../" : "");
  const current = document.body.dataset.slug ?? (chapterPage ? decodeURIComponent(location.pathname.split("/").pop()).replace(/\.html$/, "") : "");
  const bookTitle = config.title || "AI 时代的基本功";
  const storageKey = config.id || "fundamentals";
  const repository = config.repository || "turlamai/fundamentals";
  const index = entries.findIndex(e => e.slug === current);
  function link(entry, label) {
    const a = document.createElement("a");
    a.href = prefix + entry.url;
    a.textContent = label || entry.title;
    if (entry.slug === current) a.setAttribute("aria-current", "page");
    return a;
  }
  const toc = document.querySelector("#book-toc");
  const search = document.querySelector("#book-search");
  const count = document.querySelector("#book-count");
  function render() {
    const q = (search?.value || "").trim().toLocaleLowerCase();
    const matches = entries.filter(e => !q || (e.title + "\n" + e.text).toLocaleLowerCase().includes(q));
    const list = document.createElement("ol");
    for (const entry of matches) {
      const item = document.createElement("li");
      item.append(link(entry));
      if (q) {
        const at = entry.text.toLocaleLowerCase().indexOf(q);
        if (at >= 0) {
          const snippet = document.createElement("small");
          snippet.textContent = entry.text.slice(Math.max(0, at - 30), at + q.length + 50);
          item.append(snippet);
        }
      }
      list.append(item);
    }
    toc?.replaceChildren(list);
    if (count) count.textContent = matches.length + " 个章节";
  }
  search?.addEventListener("input", render);
  render();
  const nav = document.querySelector("#chapter-nav");
  if (nav && index >= 0) {
    if (index > 0) nav.append(link(entries[index - 1], "← " + entries[index - 1].title));
    const home = document.createElement("a");
    home.href = prefix + "index.html";
    home.textContent = "返回目录";
    nav.append(home);
    if (index + 1 < entries.length) nav.append(link(entries[index + 1], entries[index + 1].title + " →"));
    document.title = entries[index].title + " · " + bookTitle;
  }
  document.addEventListener("keydown", event => {
    if (event.isComposing || event.altKey || event.target?.closest?.("input,textarea,select,button,[contenteditable]")) return;
    if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
      event.preventDefault(); if (search) { const panel = search.closest("details"); if (panel) panel.open = true; search.focus(); }
    }
  });
  const get = key => { try { return localStorage.getItem(storageKey + ":" + key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(storageKey + ":" + key, value); } catch {} };
  const settings = document.createElement("section");
  settings.className = "reader-settings";
  settings.setAttribute("aria-label", "阅读设置");
  function setting(label, key, options, fallback) {
    const wrapper = document.createElement("label");
    wrapper.textContent = label + " ";
    const select = document.createElement("select");
    for (const [value, title] of options) {
      const option = document.createElement("option");
      option.value = value; option.textContent = title; select.append(option);
    }
    const stored = get(key);
    select.value = options.some(([value]) => value === stored) ? stored : fallback;
    function apply() { document.documentElement.dataset[key] = select.value; save(key, select.value); }
    select.addEventListener("change", apply); apply();
    wrapper.append(select); settings.append(wrapper);
  }
  setting("主题", "theme", [["auto","跟随系统"],["light","浅色"],["dark","深色"]], "auto");
  setting("字号", "size", [["normal","标准"],["large","大"],["xlarge","特大"]], "normal");
  document.body.prepend(settings);
  if (index >= 0) {
    const progress = document.createElement("progress");
    progress.className = "reading-progress";
    progress.max = 100;
    progress.setAttribute("aria-label", "阅读进度");
    document.body.prepend(progress);
    save("last", current);
    const positionKey = "position:" + current;
    const old = Number(get(positionKey));
    if (!location.hash && old > 0) requestAnimationFrame(() => window.scrollTo(0, old));
    function updateProgress() {
      const range = document.documentElement.scrollHeight - innerHeight;
      progress.value = range > 0 ? Math.min(100, Math.max(0, scrollY / range * 100)) : 100;
      save(positionKey, String(scrollY));
    }
    window.addEventListener("scroll", updateProgress, {passive:true});
    window.addEventListener("resize", updateProgress);
    requestAnimationFrame(updateProgress);
  } else {
    const last = entries.find(e => e.slug === get("last"));
    if (last) settings.append(link(last, "继续阅读：" + last.title));
  }
  for (const code of document.querySelectorAll("pre > code")) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "复制代码";
    button.className = "copy-code";
    button.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(code.textContent); button.textContent = "已复制"; }
      catch { button.textContent = "复制失败，请手动选择"; }
    });
    code.parentElement.before(button);
  }

  if (index >= 0) {
    const feedback = document.createElement("section");
    feedback.className = "book-feedback";
    const heading = document.createElement("h2");
    heading.textContent = "读者反馈";
    feedback.append(heading);
    function report(selection = "") {
      const params = new URLSearchParams({
        title: "勘误：" + entries[index].title,
        body: "章节：" + entries[index].title + "\n路径：" + entries[index].url + "\n" +
          (selection ? "\n原文摘录：\n" + selection.slice(0, 1500) + "\n" : "") +
          "\n问题描述：\n\n建议修改：\n"
      });
      return "https://github.com/" + repository + "/issues/new?" + params.toString();
    }
    const issue = document.createElement("a");
    issue.href = report();
    issue.textContent = "反馈本章问题";
    const edit = document.createElement("a");
    edit.href = "https://github.com/" + repository + "/edit/" + (config.branch || "main") + "/" + (entries[index].source || "chapters/" + encodeURIComponent(current) + ".md");
    edit.textContent = "编辑本章";
    const selected = document.createElement("a");
    selected.hidden = true;
    selected.textContent = "反馈选中的文字";
    feedback.append(issue, edit, selected);
    nav?.before(feedback);
    document.addEventListener("selectionchange", () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || "";
      const main = document.querySelector("main");
      const inside = main?.contains(selection?.anchorNode) && main?.contains(selection?.focusNode);
      selected.hidden = !inside || !text;
      if (!selected.hidden) selected.href = report(text);
    });
  }
  document.addEventListener("keydown", event => {
    if (index < 0 || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
        event.target?.closest?.("a,input,textarea,select,button,[contenteditable]") || window.getSelection()?.toString()) return;
    const next = event.key === "ArrowLeft" ? index - 1 : event.key === "ArrowRight" ? index + 1 : -1;
    if (next >= 0 && next < entries.length && ["ArrowLeft","ArrowRight"].includes(event.key)) {
      event.preventDefault();
      location.href = prefix + entries[next].url;
    }
  });

})();
