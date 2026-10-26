import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

test("every published guide, asset, local link and search anchor resolves", async ({ page, request }) => {
  const output = path.join(process.cwd(), "public/docs");
  const files = (await fs.readdir(output)).filter((name) => name.endsWith(".html"));
  expect(files).toHaveLength(10);
  const fragments = new Map<string, Set<string>>();
  for (const file of files) {
    const response = await page.goto(`/${file}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    fragments.set(file, new Set(await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id))));
    const links = await page.locator("a[href], img[src], script[src], link[href]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href") ?? node.getAttribute("src") ?? ""));
    for (const link of links) {
      const target = new URL(link, `http://localhost:4173/${file}`);
      if (target.origin !== "http://localhost:4173") continue;
      expect((await request.get(target.pathname)).status(), `${file} → ${link}`).toBe(200);
      if (target.hash) {
        const html = await (await request.get(target.pathname)).text();
        expect(html, `${file} → ${link}`).toContain(`id="${decodeURIComponent(target.hash.slice(1))}"`);
      }
    }
  }
  const search = await (await request.get("/search-index.json")).json() as { url: string }[];
  for (const entry of search) {
    const target = new URL(entry.url, "http://localhost:4173/");
    expect(fragments.has(target.pathname.slice(1))).toBe(true);
    if (target.hash) expect(fragments.get(target.pathname.slice(1))?.has(target.hash.slice(1)), entry.url).toBe(true);
  }
});

test("search, keyboard navigation, copy commands and saved theme work", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/index.html");
  await page.getByRole("button", { name: "Copy code" }).click();
  await expect(page.getByRole("status")).toContainText("copied");
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n")).toContain("npm run setup\nnpm run dev");
  await page.keyboard.press("Control+k");
  await page.getByRole("searchbox").fill("SMTP");
  await expect(page.locator(".search-result").first()).toBeVisible();
  await page.getByRole("searchbox").fill("zzzz-no-such-feature");
  await expect(page.locator(".search-empty")).toContainText("No matching pages");
  await page.getByRole("searchbox").fill("backup");
  await expect(page.locator(".search-result").first()).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".search-result").first()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#search-dialog")).not.toBeVisible();
  const initial = await page.locator("html").getAttribute("data-theme");
  await page.getByRole("button", { name: /Switch to .* theme/ }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", initial === "dark" ? "light" : "dark");
});

test("phone navigation, wide reference tables and no-JavaScript reading", async ({ page, browser }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("navigation", { name: "Mobile documentation" }).getByRole("link", { name: "API reference" }).click();
  await expect(page.locator("h1")).toHaveText("The API reference");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#nav-dialog")).not.toBeVisible();
  const offline = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const reader = await offline.newPage();
  await reader.goto("http://localhost:4173/setup.html");
  await expect(reader.getByRole("heading", { name: "Clone and run", exact: false })).toBeVisible();
  await expect(reader.getByRole("navigation", { name: "Documentation", exact: true }).getByRole("link", { name: "Quick start" })).toBeVisible();
  await offline.close();
});
