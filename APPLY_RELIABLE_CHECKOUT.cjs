const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const page = path.join(root, "app/dat-mon-nhanh/page.tsx");
const patch = path.join(root, "reliable_checkout_page.patch");

if (!fs.existsSync(page)) {
  throw new Error("Không tìm thấy app/dat-mon-nhanh/page.tsx. Hãy chạy script tại root project web.");
}

if (!fs.existsSync(patch)) {
  throw new Error("Không tìm thấy reliable_checkout_page.patch. Hãy copy toàn bộ ZIP vào root project trước.");
}

const source = fs.readFileSync(page, "utf8");

if (
  source.includes('import StickyCheckoutBar from "@/components/order/StickyCheckoutBar";') &&
  source.includes('fetch("/api/orders/create"') &&
  source.includes("submitLockRef.current")
) {
  console.log("SKIP: Reliable Checkout đã được tích hợp trong page.tsx");
  process.exit(0);
}

function runGitApply(args) {
  return spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const check = runGitApply(["apply", "--check", "--whitespace=nowarn", patch]);

if (check.status !== 0) {
  console.error(check.stderr || check.stdout);
  throw new Error(
    "Patch không khớp page.tsx hiện tại. Dừng lại để tránh sửa sai. Gửi file page.tsx hiện tại để kiểm tra."
  );
}

const apply = runGitApply(["apply", "--whitespace=nowarn", patch]);

if (apply.status !== 0) {
  console.error(apply.stderr || apply.stdout);
  throw new Error("Không áp dụng được Reliable Checkout patch.");
}

let after = fs.readFileSync(page, "utf8");

// Compatibility hardening for PHASE 4.2 Branch Toppings.
// TypeScript does not preserve optional-id narrowing inside its nested async loader.
if (
  after.includes("/api/branch-toppings?branchId=") &&
  after.includes("const branchId = selectedBranch?.id;")
) {
  after = after.replace(
    "const branchId = selectedBranch?.id;",
    'const branchId = String(selectedBranch?.id || "").trim();'
  );
  fs.writeFileSync(page, after, "utf8");
  console.log("FIXED: Branch Toppings TypeScript narrowing");
}

const checks = [
  'import StickyCheckoutBar from "@/components/order/StickyCheckoutBar";',
  'fetch("/api/orders/create"',
  "submitLockRef.current",
  "checkoutIssues",
  "<StickyCheckoutBar",
];

const missing = checks.filter((token) => !after.includes(token));
if (missing.length > 0) {
  throw new Error(`Patch chạy xong nhưng thiếu marker: ${missing.join(", ")}`);
}

console.log("UPDATED: app/dat-mon-nhanh/page.tsx");
console.log("DONE - PHASE 6.2 Reliable Checkout & Sticky Order CTA applied.");
console.log("Tiếp theo: chạy SQL migration rồi npx tsc --noEmit");
