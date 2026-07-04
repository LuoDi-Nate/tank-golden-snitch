const { chromium } = require("/home/finance/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core");
(async () => {
  const out = process.argv[2] || "/home/finance/tank_v2/leaderboard.png";
  const browser = await chromium.launch({ executablePath: "/home/finance/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome", args:["--no-sandbox","--disable-gpu","--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1500 }, deviceScaleFactor: 2 });
  await page.goto("https://agentank.ai/leaderboard", { waitUntil: "networkidle", timeout: 50000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: out, fullPage: false });
  // 报告我的位置
  const txt = await page.evaluate(()=>document.body.innerText);
  const lines = txt.split("\n").map(s=>s.trim()).filter(Boolean);
  let myrank="?"; for(let i=0;i<lines.length;i++){ if(lines[i].includes("金色飞贼")){ for(let j=i;j>=0;j--){ if(/^#\d+$/.test(lines[j])){ myrank=lines[j]; break; } } break; } }
  console.log("SHOT_OK "+out+" 金色飞贼在榜单 "+myrank);
  await browser.close();
})().catch(e=>{console.error("SHOT_ERR",e.message);process.exit(1)});
