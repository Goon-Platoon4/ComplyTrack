import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
const root = path.resolve("src");
async function files(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await files(full)));
    else if (entry.name.endsWith(".js")) found.push(full);
  }
  return found;
}
let failed = false;
for (const file of await files(root)) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`${file}\n${result.stderr}`);
  }
}
if (failed) process.exit(1);
console.log("All backend JavaScript files pass syntax checks.");
