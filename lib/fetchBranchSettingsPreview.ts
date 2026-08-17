export type BranchSettingsPreview = {
  id: number | string;
  branch_id: string;
  is_open: boolean;
  order_status: string;
  open_time: string;
  close_time: string;
  preparation_minutes: number;
};

type ResponseBody = {
  ok?: boolean;
  message?: string;
  settings?: BranchSettingsPreview;
};

export async function fetchBranchSettingsPreview(
  input: { branchId?: string | null; branchCode?: string | null },
  signal?: AbortSignal
): Promise<
  | { ok: true; settings: BranchSettingsPreview }
  | { ok: false; message: string }
> {
  const params = new URLSearchParams();

  if (input.branchId) params.set("branchId", input.branchId);
  if (input.branchCode) params.set("branchCode", input.branchCode);

  try {
    const response = await fetch(`/api/branch-settings?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    const body = (await response.json()) as ResponseBody;

    if (!response.ok || !body.ok || !body.settings) {
      return {
        ok: false,
        message: body.message || "Không tải được cài đặt chi nhánh.",
      };
    }

    return { ok: true, settings: body.settings };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, message: "aborted" };
    }

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Không tải được cài đặt chi nhánh.",
    };
  }
}
