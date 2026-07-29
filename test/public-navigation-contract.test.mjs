import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root=new URL("../",import.meta.url);
const publicPages=["404.html","about.html","assessment.html","capacity-brief-example.html","contact.html","diagnostic.html","framework.html","index.html","insights.html","organization-view.html","privacy.html","saved-results.html","signs.html"];
const canonicalLinks=[["framework.html","Model"],["diagnostic.html","Diagnostic"],["assessment.html","Assessment"],["capacity-brief-example.html","Sample Brief"],["signs.html","Signs"],["insights.html","Insights"],["about.html","About"],["contact.html","Connect"]];

test("every public page uses the canonical top-level navigation",async()=>{for(const page of publicPages){const html=await readFile(new URL(page,root),"utf8");const header=html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0]||"";assert.match(header,/class="nav-toggle"/,`${page} needs the mobile navigation control`);assert.match(header,/class="site-nav"/,`${page} needs the canonical navigation`);assert.match(html,/src="script\.js"/,`${page} needs shared navigation behavior`);for(const[href,label]of canonicalLinks)assert.match(header,new RegExp(`<a href="${href}"(?: aria-current="page")?>${label}<\\/a>`),`${page} is missing ${label}`)}});

test("every public page uses the shared Senger wordmark treatment",async()=>{for(const page of publicPages){const html=await readFile(new URL(page,root),"utf8");const header=html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0]||"";assert.match(header,/<a class="brand" href="index\.html" aria-label="Senger Advisory home"><span>Senger<\/span> <span>Advisory<\/span><\/a>/,`${page} needs the shared Senger wordmark`)}});

test("private and proprietary diagnostic surfaces are not added to public navigation",async()=>{for(const page of publicPages){const html=await readFile(new URL(page,root),"utf8");const header=html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0]||"";assert.doesNotMatch(header,/workspace\/|diagnostic-(?:process|interview|synthesis|decision|workspace)/)}});
