const fs = require("fs");
const { execFileSync } = require("child_process");

const files = [
  "index.html",
  "core.html",
  "raid.html",
  "overview.html",
  "parties.html",
].filter((file) => fs.existsSync(file));

if (!files.length) {
  console.log("No HTML files found. Run this script at the project root after adding project files.");
  process.exit(0);
}

let hasError = false;

function fail(message) {
  hasError = true;
  console.error("FAIL:", message);
}

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");

  const htmlCloseIndex = html.lastIndexOf("</html>");
  if (htmlCloseIndex !== -1) {
    const afterHtml = html.slice(htmlCloseIndex + "</html>".length).trim();
    if (afterHtml.length > 0) {
      fail(`${file}: code exists after </html>`);
    }
  }

  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .join("\n");

  const tmp = `.tmp-${file}.js`;
  fs.writeFileSync(tmp, scripts, "utf8");

  try {
    execFileSync("node", ["--check", tmp], { stdio: "pipe" });
    console.log(`OK: ${file} JavaScript syntax`);
  } catch (err) {
    fail(`${file}: JavaScript syntax error\n${err.stderr?.toString() || err.message}`);
  }

  const usedVars = new Set([...html.matchAll(/var\(--([A-Za-z0-9_-]+)/g)].map((m) => m[1]));
  const definedVars = new Set([...html.matchAll(/--([A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1]));

  for (const v of usedVars) {
    if (!definedVars.has(v)) {
      fail(`${file}: CSS variable --${v} is used but not defined`);
    }
  }
}

for (const file of files) {
  const tmp = `.tmp-${file}.js`;
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
}

if (hasError) {
  process.exit(1);
}

console.log("All checks passed.");
