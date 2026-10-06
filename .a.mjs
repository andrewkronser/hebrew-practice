import pw from "/opt/npm-tools/node_modules/playwright/index.js";
const { chromium } = pw;
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
import { ALL_WORDS, LESSONS, wordsForLesson } from "./src/features/article/lessons.js";
const root="dist", types={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"};
const server=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split("?")[0]);let f=path.join(root,p==="/"?"index.html":p);
  if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,"index.html");
  rs.writeHead(200,{"content-type":types[path.extname(f)]??"application/octet-stream"});fs.createReadStream(f).pipe(rs);});
await new Promise(r=>server.listen(0,r));
const out="/tmp/claude-0/-home-claude/51b5ca90-ea28-5ece-b6c2-7c2ee7b3e740/scratchpad/out";
const browser=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome"});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
const errs=[]; page.on("pageerror",e=>errs.push(e.message));
await page.goto(`http://localhost:${server.address().port}/#/definite-article`,{waitUntil:"networkidle"});
await page.waitForTimeout(600);
console.log("h1:", await page.locator("h1").textContent().catch(()=>null));
console.log("toc rows:", await page.locator(".toc-row").count(), "(want 6)");
console.log("locked:", await page.locator(".toc-locked").count(), "(want 5)");
console.log("keyboard keys:", await page.locator(".kbd-key").count());
console.log("word:", (await page.locator(".glyph-word").textContent())?.trim());
// Answer correctly
const entry = () => ALL_WORDS.find(w => w.he === document.querySelector(".glyph-word").textContent.trim());
const he = (await page.locator(".glyph-word").textContent()).trim();
const want = ALL_WORDS.find(w=>w.he===he).def;
await page.locator('input[aria-label="Definite form"]').fill(want);
await page.keyboard.press("Enter"); await page.waitForTimeout(250);
const body = await page.locator("body").textContent();
console.log("verdict:", body.includes("Correct")?"Correct":body.includes("Not quite")?"Not quite":"?");
console.log("streak:", (body.match(/(\d+) of (\d+) in a row/)||[])[0]);
// Toggle the table
const tableShown = async () => page.evaluate(() => {
  const t = document.querySelector("table"); if (!t) return false;
  return t.getBoundingClientRect().height > 0;
});
console.log("table visible before toggle:", await tableShown());
await page.locator('input[type=checkbox]').first().click(); await page.waitForTimeout(500);
console.log("table visible after toggle: ", await tableShown());
console.log("rows in DOM either way:     ", await page.locator("table tbody tr").count());
console.log("slice showTable:", (await page.evaluate(()=>JSON.parse(localStorage.getItem("hebrew-practice:definite-article")||"{}"))).showTable);
console.log("checkbox checked:", await page.locator('input[type=checkbox]').first().isChecked());
console.log(await page.evaluate(()=>{
  const t=document.querySelector("table");
  let el=t, chain=[];
  while(el && chain.length<6){ const cs=getComputedStyle(el);
    chain.push(`${el.tagName.toLowerCase()}.${(el.className||"").toString().split(" ")[0]} h=${Math.round(el.getBoundingClientRect().height)} display=${cs.display} vis=${cs.visibility} overflow=${cs.overflow}`);
    el=el.parentElement; }
  return chain.join("\n");
}));
await page.screenshot({path:`${out}/article.png`});
console.log("errors:", errs.length?errs:"none");
await browser.close(); server.close();
