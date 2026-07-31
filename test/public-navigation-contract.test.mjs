import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root=new URL("../",import.meta.url);
const publicPages=["404.html","about.html","assessment.html","capacity-brief-example.html","contact.html","diagnostic.html","framework.html","index.html","insights.html","organization-view.html","platform-journey.html","privacy.html","saved-results.html","signs.html"];
const canonicalLinks=[["framework.html","Capacity Lens"],["diagnostic.html","Diagnostic"],["assessment.html","Assessment"],["platform-journey.html","Platform Journey"],["signs.html","Signs"],["insights.html","Insights"],["about.html","About"],["contact.html","Connect"]];

test("every public page uses the canonical top-level navigation",async()=>{for(const page of publicPages){const html=await readFile(new URL(page,root),"utf8");const header=html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0]||"";assert.match(header,/class="nav-toggle"/,`${page} needs the mobile navigation control`);assert.match(header,/class="site-nav"/,`${page} needs the canonical navigation`);assert.match(html,/src="script\.js"/,`${page} needs shared navigation behavior`);for(const[href,label]of canonicalLinks)assert.match(header,new RegExp(`<a href="${href}"(?: aria-current="page")?>${label}<\\/a>`),`${page} is missing ${label}`)}});

test("every public page uses the shared Senger wordmark treatment",async()=>{for(const page of publicPages){const html=await readFile(new URL(page,root),"utf8");const header=html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0]||"";assert.match(header,/<a class="brand" href="index\.html" aria-label="Senger Advisory home"><span>Senger<\/span> <span>Advisory<\/span><\/a>/,`${page} needs the shared Senger wordmark`)}});

test("private and proprietary diagnostic surfaces are not added to public navigation",async()=>{for(const page of publicPages){const html=await readFile(new URL(page,root),"utf8");const header=html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0]||"";assert.doesNotMatch(header,/workspace\/|diagnostic-(?:process|interview|synthesis|decision|workspace)/)}});

test("homepage hero tells a finite automatic category story without implied cursor navigation",async()=>{const[html,script,styles,engine]=await Promise.all(["index.html","script.js","styles.css","flow-engine.js"].map(file=>readFile(new URL(file,root),"utf8")));assert.doesNotMatch(html,/data-lens-prompt/);assert.match(styles,/\.hero-visual[\s\S]*?cursor: default/);for(const delay of [3500,7000,10500,14000])assert.match(script,new RegExp(`\\[${delay}, \\"`));assert.doesNotMatch(script,/pointermove|pointerdown/);assert.match(engine,/setNarrativeStage\(stage\)/);assert.doesNotMatch(engine,/this\.drawLens\(\)/)});
