const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "app/dat-mon-nhanh/page.tsx"
);

if (!fs.existsSync(target)) {
  throw new Error(
    "Khong tim thay app/dat-mon-nhanh/page.tsx"
  );
}

let source = fs
  .readFileSync(target, "utf8")
  .replace(/\r\n/g, "\n");

if (source.includes("BRANCH_TOPPINGS_SYNC_FINAL")) {
  console.log(
    "SKIP: Branch toppings da duoc tich hop."
  );
  process.exit(0);
}

/*
 * ============================================================
 * 1. BO toppingResult KHOI fetchInitialData
 * ============================================================
 */

source = source.replace(
  /^\s*toppingResult,\n/m,
  ""
);

/*
 * ============================================================
 * 2. BO QUERY toppings GLOBAL
 * ============================================================
 */

const globalToppingQuery = [
  "",
  "      supabase",
  '        .from("toppings")',
  '        .select("id,name,price,category")',
  '        .eq("is_active", true)',
  '        .order("sort_order", { ascending: true }),',
].join("\n");

if (source.includes(globalToppingQuery)) {
  source = source.replace(
    globalToppingQuery,
    ""
  );
} else {
  console.warn(
    "WARN: Khong tim thay query topping global dung mau."
  );
}

/*
 * ============================================================
 * 3. BO setToppings tu toppingResult
 * ============================================================
 */

source = source.replace(
  /^\s*setToppings\(\(toppingResult\.data \|\| \[\]\) as Topping\[\]\);\n/m,
  ""
);

/*
 * ============================================================
 * 4. THEM TOPPING THEO CHI NHANH
 * ============================================================
 */

const marker =
  "  async function fetchInitialData() {";

if (!source.includes(marker)) {
  throw new Error(
    "Khong tim thay fetchInitialData(). Dung lai de tranh sua sai file."
  );
}

const block = [
  "  // BRANCH_TOPPINGS_SYNC_FINAL",
  "  // Topping tren website chi duoc lay theo chi nhanh dang chon.",
  "  useEffect(() => {",
  "    const branchId = selectedBranch?.id;",
  "",
  "    // Doi branch thi xoa ngay topping cua branch cu.",
  "    setToppings([]);",
  "    setSelectedToppingIds([]);",
  "",
  "    if (!branchId) {",
  "      return;",
  "    }",
  "",
  "    let active = true;",
  "    let currentController = null;",
  "",
  "    async function loadBranchToppings() {",
  "      if (currentController) {",
  "        currentController.abort();",
  "      }",
  "",
  "      const controller = new AbortController();",
  "      currentController = controller;",
  "",
  "      try {",
  "        const response = await fetch(",
  "          `/api/branch-toppings?branchId=${encodeURIComponent(branchId)}`,",
  "          {",
  '            method: "GET",',
  '            cache: "no-store",',
  "            signal: controller.signal,",
  "          }",
  "        );",
  "",
  "        const payload = await response",
  "          .json()",
  "          .catch(() => null);",
  "",
  "        if (!active || controller.signal.aborted) {",
  "          return;",
  "        }",
  "",
  "        if (!response.ok || !payload?.ok) {",
  "          throw new Error(",
  "            payload?.message ||",
  '              "Khong tai duoc topping chi nhanh."',
  "          );",
  "        }",
  "",
  "        const nextToppings =",
  "          (payload.items || []) as Topping[];",
  "",
  "        setToppings(nextToppings);",
  "",
  "        // Topping vua bi tat tren Merchant se bi loai khoi gio cu.",
  "        const allowedIds = new Set(",
  "          nextToppings.map((item) => item.id)",
  "        );",
  "",
  "        setSelectedToppingIds((previous) =>",
  "          previous.filter((id) =>",
  "            allowedIds.has(id)",
  "          )",
  "        );",
  "",
  "        setCart((previousCart) =>",
  "          previousCart.map((item) => ({",
  "            ...item,",
  "            selectedToppings:",
  "              item.selectedToppings.filter(",
  "                (topping) =>",
  "                  allowedIds.has(topping.id)",
  "              ),",
  "          }))",
  "        );",
  "      } catch (error) {",
  "        if (!active || controller.signal.aborted) {",
  "          return;",
  "        }",
  "",
  '        console.error("LOAD BRANCH TOPPINGS ERROR:", error);',
  "",
  "        // Fail closed: API loi thi khong hien topping cua branch khac.",
  "        setToppings([]);",
  "        setSelectedToppingIds([]);",
  "      }",
  "    }",
  "",
  "    void loadBranchToppings();",
  "",
  "    // Merchant thay doi topping khi khach dang mo web:",
  "    // website tu dong dong bo toi da sau 15 giay.",
  "    const timer = window.setInterval(() => {",
  "      void loadBranchToppings();",
  "    }, 15000);",
  "",
  "    // Quay lai Safari/Chrome/Zalo thi refresh ngay.",
  "    const handleFocus = () => {",
  "      void loadBranchToppings();",
  "    };",
  "",
  "    const handleVisibility = () => {",
  "      if (!document.hidden) {",
  "        void loadBranchToppings();",
  "      }",
  "    };",
  "",
  '    window.addEventListener("focus", handleFocus);',
  "    document.addEventListener(",
  '      "visibilitychange",',
  "      handleVisibility",
  "    );",
  "",
  "    return () => {",
  "      active = false;",
  "",
  "      if (currentController) {",
  "        currentController.abort();",
  "      }",
  "",
  "      window.clearInterval(timer);",
  "",
  '      window.removeEventListener("focus", handleFocus);',
  "      document.removeEventListener(",
  '        "visibilitychange",',
  "        handleVisibility",
  "      );",
  "    };",
  "  }, [selectedBranch?.id]);",
  "",
  "",
].join("\n");

source = source.replace(
  marker,
  block + marker
);

fs.writeFileSync(
  target,
  source,
  "utf8"
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "BRANCH TOPPINGS FIX APPLIED"
);
console.log(
  "========================================"
);
console.log(
  "OK: Removed global topping source"
);
console.log(
  "OK: Added branch topping API sync"
);
console.log(
  "OK: Added 15-second auto refresh"
);
console.log(
  "OK: Added focus/visibility refresh"
);
console.log(
  "OK: Removes disabled topping from cart"
);
console.log("");
console.log(
  "NEXT: npx tsc --noEmit"
);