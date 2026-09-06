"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchBranchToppings, type BranchTopping } from "./branchToppings";

type Snapshot = {
  branchId: string | null;
  items: BranchTopping[];
  ready: boolean;
  error: string;
};
const EMPTY_TOPPINGS: BranchTopping[] = [];
const REFRESH_MS = 15_000;
const TIMEOUT_MS = 12_000;

/** Refresh only while visible; never expose another branch's previous snapshot. */
export function useBranchToppings(branchId: string | null) {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    branchId: null, items: [], ready: false, error: "",
  });
  const [snapshotBranch, setSnapshotBranch] = useState(branchId);
  // Reset on the branch transition, including Q1 -> Q6 -> Q1 while a load is pending.
  // A conditional state adjustment prevents one render of an earlier snapshot.
  if (snapshotBranch !== branchId) {
    setSnapshotBranch(branchId);
    setSnapshot({ branchId, items: [], ready: false, error: "" });
  }
  const activeBranchRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const sequenceRef = useRef(0);
  const pendingRef = useRef<{
    controller: AbortController;
    promise: Promise<BranchTopping[] | null>;
  } | null>(null);

  const refresh = useCallback((force = false): Promise<BranchTopping[] | null> => {
    if (!branchId || !mountedRef.current || activeBranchRef.current !== branchId) {
      return Promise.resolve(null);
    }
    if (pendingRef.current && !force) return pendingRef.current.promise;
    pendingRef.current?.controller.abort();
    const controller = new AbortController();
    const sequence = ++sequenceRef.current;
    let timedOut = false;
    let timer: number | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(new Error("Tải topping quá lâu. Vui lòng kiểm tra kết nối và thử lại."));
      }, TIMEOUT_MS);
    });
    const isCurrent = () => mountedRef.current &&
      activeBranchRef.current === branchId && sequenceRef.current === sequence;

    const promise = (async (): Promise<BranchTopping[] | null> => {
      try {
        const items = await Promise.race([
          fetchBranchToppings(branchId, controller.signal),
          timeout,
        ]);
        if (!isCurrent() || controller.signal.aborted) return null;
        setSnapshot({ branchId, items, ready: true, error: "" });
        return items;
      } catch (error) {
        if (!isCurrent() || (controller.signal.aborted && !timedOut)) return null;
        const message = timedOut
          ? "Tải topping quá lâu. Vui lòng kiểm tra kết nối và thử lại."
          : error instanceof Error ? error.message : "Không tải được topping chi nhánh.";
        // A failed load is NOT an empty menu: do not modify the customer's cart.
        setSnapshot({ branchId, items: [], ready: false, error: message });
        return null;
      } finally {
        window.clearTimeout(timer);
        if (sequenceRef.current === sequence) pendingRef.current = null;
      }
    })();
    pendingRef.current = { controller, promise };
    return promise;
  }, [branchId]);

  useEffect(() => {
    mountedRef.current = true;
    activeBranchRef.current = branchId;
    void refresh();
    const refreshWhenVisible = () => {
      if (!document.hidden) void refresh();
    };
    const timer = window.setInterval(refreshWhenVisible, REFRESH_MS);
    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("online", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      mountedRef.current = false;
      activeBranchRef.current = null;
      sequenceRef.current += 1;
      pendingRef.current?.controller.abort();
      pendingRef.current = null;
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshWhenVisible);
      window.removeEventListener("online", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [branchId, refresh]);

  const sameBranch = !!branchId && snapshot.branchId === branchId;
  const ready = sameBranch && snapshot.ready;
  return {
    toppings: ready ? snapshot.items : EMPTY_TOPPINGS,
    ready,
    error: sameBranch ? snapshot.error : "",
    refresh,
  };
}
