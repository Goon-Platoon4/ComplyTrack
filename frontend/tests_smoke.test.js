import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("primary workspace pages use the backend API instead of seeded demo records", async () => {
  for (const file of [
    "src/pages/Dashboard.jsx",
    "src/pages/Contractors.jsx",
    "src/pages/ContractorDetails.jsx",
    "src/pages/Reports.jsx",
    "src/pages/Settings.jsx",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /services\/api/, `${file} should use the API client`);
    assert.doesNotMatch(
      source,
      /demoData|attentionItems|from ['"]\.\.\/data\//,
      `${file} should not import demo records`,
    );
  }
});

test("frontend has authenticated route guards and no hard-coded demo user", async () => {
  const source = await readFile(
    new URL("src/context/AuthContext.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /complytrack_access_token/);
  assert.match(source, /api\.get\(\s*["']\/auth\/me["']\s*\)/);
  assert.doesNotMatch(source, /Thandi Nkosi|signInDemo/);
});
