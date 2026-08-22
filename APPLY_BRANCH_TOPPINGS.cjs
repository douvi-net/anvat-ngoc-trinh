const fs = require("fs");
const path = require("path");

const rel = "app/dat-mon-nhanh/page.tsx";
const target = path.join(process.cwd(), rel);
let source = fs.readFileSync(target, "utf8");

if (source.includes("/api/branch-toppings?branchId=")) {
  console.log("SKIP: Branch toppings đã được tích hợp trong page.tsx");
  process.exit(0);
}

const marker = "  async function fetchInitialData() {";
if (!source.includes(marker)) {
  throw new Error("Không tìm thấy fetchInitialData(). Dừng patch để tránh sửa sai file.");
}

const block = `  useEffect(() => {
    const branchId = selectedBranch?.id;

    if (!branchId) {
      return;
    }

    let active = true;

    async function loadBranchToppings() {
      // Không giữ topping của branch cũ trong lúc chuyển chi nhánh.
      setToppings([]);

      try {
        const response = await fetch(
          \`/api/branch-toppings?branchId=\${encodeURIComponent(branchId)}\`,
          { cache: "no-store" }
        );

        const payload = await response.json();

        if (!active || selectedBranch?.id !== branchId) {
          return;
        }

        if (!response.ok || !payload.ok) {
          throw new Error(
            payload.message || "Không tải được topping chi nhánh."
          );
        }

        setToppings((payload.items || []) as Topping[]);
      } catch (error) {
        console.error("LOAD BRANCH TOPPINGS ERROR:", error);

        if (active && selectedBranch?.id === branchId) {
          // Fail closed: không hiện topping branch khác nếu API lỗi.
          setToppings([]);
        }
      }
    }

    void loadBranchToppings();

    return () => {
      active = false;
    };
  }, [selectedBranch?.id]);

`;

source = source.replace(marker, block + marker);
fs.writeFileSync(target, source, "utf8");
console.log("UPDATED: app/dat-mon-nhanh/page.tsx");
console.log("DONE - Branch toppings website patch applied.");
