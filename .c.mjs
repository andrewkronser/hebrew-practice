import pw from "/opt/npm-tools/node_modules/playwright/index.js";
const { chromium } = pw;
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root="dist", types={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"};
const server=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split("?")[0]);let f=path.join(root,p==="/"?"index.html":p);
  if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,"index.html");
  rs.writeHead(200,{"content-type":types[path.extname(f)]??"application/octet-stream"});fs.createReadStream(f).pipe(rs);});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const browser=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome"});

for (const reduced of [true, false]) {
  const ctx = await browser.newContext({ viewport:{width:1440,height:900}, reducedMotion: reduced ? "reduce" : "no-preference" });
  await ctx.addInitScript(() => {
    localStorage.setItem("hebrew-practice:plural-rules", JSON.stringify({progress:{ruleId:"pro",streak:0,done:["mp","fp"]}}));
    localStorage.setItem("hebrew-practice:gender-number-mode", JSON.stringify({mode:"form"}));
  });
  const page = await ctx.newPage();
  await page.goto(`${base}/#/gender-and-number`,{waitUntil:"networkidle"});
  await page.locator('label',{hasText:"Write the form"}).first().click();
  await page.waitForSelector(".kbd-key");
  // Reach a reduction rule, where the preamble disclosure exists.
  const disclosure = page.locator('button',{hasText:/How reduction works/});
  const has = await disclosure.count();
  /* Measure the reading column: if the disclosure opens, the page gets taller. */
  const colH = () => page.evaluate(() => Math.round(document.querySelector(".kbd-scroll").getBoundingClientRect().top));
  const before = await colH();
  await disclosure.first().click();
  await page.waitForTimeout(700);
  const after = await colH();
  console.log(`reducedMotion=${reduced ? "reduce" : "no-preference"}: present=${!!has}  keyboard top ${before} -> ${after}  opened=${after > before + 20}`);
  await ctx.close();
}
await browser.close(); server.close();
