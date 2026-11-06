// Converts the stored simple text format (**bold**, [text](url), "- " bullets, one line per row)
// to and from editor HTML. The stored format stays the same, so course pages render unchanged.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeHref = (u: string) => /^(\/|https?:\/\/|mailto:)/i.test(u.trim());

function inlineToHtml(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => (safeHref(u) ? `<a href="${u}">${t}</a>` : m));
}

export function textToHtml(text: string): string {
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.join("")}</ul>`); list = []; } };
  for (const line of (text || "").split("\n")) {
    if (/^\s*[-•]\s+/.test(line)) { list.push(`<li>${inlineToHtml(line.replace(/^\s*[-•]\s+/, ""))}</li>`); continue; }
    flush();
    out.push(line.trim() ? `<div>${inlineToHtml(line)}</div>` : "<div><br></div>");
  }
  flush();
  return out.join("");
}

function inlineToText(node: Node): string {
  let s = "";
  node.childNodes.forEach((c) => {
    if (c.nodeType === 3) { s += (c.textContent ?? "").replace(/\u00a0/g, " "); return; }
    if (!(c instanceof HTMLElement)) return;
    const tag = c.tagName;
    if (tag === "BR") { s += "\n"; return; }
    const inner = inlineToText(c);
    const bold = tag === "B" || tag === "STRONG" || Number(c.style.fontWeight) >= 600 || c.style.fontWeight === "bold";
    if (tag === "A") { const h = c.getAttribute("href") ?? ""; s += safeHref(h) && inner.trim() ? `[${inner}](${h})` : inner; }
    else if (bold && inner.trim()) s += `**${inner}**`;
    else if (["DIV", "P", "UL", "OL", "LI"].includes(tag)) s += "\n" + blocksToLines(c).join("\n") + "\n";
    else s += inner;
  });
  return s;
}

function blocksToLines(root: Node): string[] {
  const lines: string[] = [];
  let buf = "";
  const pushBuf = () => { if (buf) { lines.push(...buf.split("\n")); buf = ""; } };
  root.childNodes.forEach((c) => {
    if (c instanceof HTMLElement && (c.tagName === "UL" || c.tagName === "OL")) {
      pushBuf();
      c.querySelectorAll(":scope > li").forEach((li) => lines.push("- " + inlineToText(li).replace(/\n+/g, " ").trim()));
    } else if (c instanceof HTMLElement && (c.tagName === "DIV" || c.tagName === "P")) {
      pushBuf();
      if (c.querySelector("ul,ol")) lines.push(...blocksToLines(c));
      else lines.push(...inlineToText(c).replace(/\n$/, "").split("\n"));
    } else if (c instanceof HTMLElement && c.tagName === "BR") {
      buf += "\n";
    } else {
      const wrap = document.createElement("span");
      wrap.appendChild(c.cloneNode(true));
      buf += inlineToText(wrap);
    }
  });
  pushBuf();
  return lines;
}

export function htmlToText(root: HTMLElement): string {
  return blocksToLines(root).map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
