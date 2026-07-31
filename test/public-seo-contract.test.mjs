import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicPages = [
  ["index.html", "https://sengeradvisory.com/"],
  ["framework.html", "https://sengeradvisory.com/framework.html"],
  ["diagnostic.html", "https://sengeradvisory.com/diagnostic.html"],
  ["assessment.html", "https://sengeradvisory.com/assessment.html"],
  ["platform-journey.html", "https://sengeradvisory.com/platform-journey.html"],
  ["signs.html", "https://sengeradvisory.com/signs.html"],
  ["insights.html", "https://sengeradvisory.com/insights.html"],
  ["about.html", "https://sengeradvisory.com/about.html"],
  ["contact.html", "https://sengeradvisory.com/contact.html"]
];

test("public pages expose unique search and social metadata", async () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const [file, canonical] of publicPages) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];

    assert.ok(title, `${file} must have a title`);
    assert.ok(description, `${file} must have a description`);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(html, /<meta property="og:title"/);
    assert.match(html, /<meta property="og:description"/);
    assert.match(html, /<meta property="og:image"/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
    assert.doesNotMatch(html, /<meta name="robots" content="[^\"]*noindex/i);
    assert.ok(!titles.has(title), `${file} title must be unique`);
    assert.ok(!descriptions.has(description), `${file} description must be unique`);
    titles.add(title);
    descriptions.add(description);
  }
});

test("homepage identifies the Senger Advisory entity and diagnostic service", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /"@type": "Organization"/);
  assert.match(html, /"@type": "Person"/);
  assert.match(html, /"@type": "WebSite"/);
  assert.match(html, /"@type": "Service"/);
  assert.match(html, /"name": "Organizational Capacity Diagnostic"/);
});

test("crawler controls separate public content from private and prototype surfaces", async () => {
  const [robots, sitemap, redirects, organizationView] = await Promise.all([
    readFile(new URL("../robots.txt", import.meta.url), "utf8"),
    readFile(new URL("../sitemap.xml", import.meta.url), "utf8"),
    readFile(new URL("../netlify.toml", import.meta.url), "utf8"),
    readFile(new URL("../organization-view.html", import.meta.url), "utf8")
  ]);

  assert.match(robots, /Disallow: \/workspace\//);
  assert.doesNotMatch(sitemap, /organization-view\.html/);
  assert.match(organizationView, /noindex,nofollow/);
  assert.match(redirects, /from = "\/the-network"[\s\S]*?status = 301/);
  assert.match(redirects, /X-Robots-Tag = "noindex, nofollow, noarchive"/);
});
