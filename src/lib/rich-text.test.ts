// @vitest-environment jsdom
import { expect, test } from "vitest";
import { htmlToText, textToHtml } from "./rich-text";
test("round-trips bold, links, bullets and paragraphs", () => {
  const t = "Intro **bold** and [apply](/apply)\n\n- one\n- two\nEnd";
  const el = document.createElement("div");
  el.innerHTML = textToHtml(t);
  expect(htmlToText(el)).toBe(t);
});
