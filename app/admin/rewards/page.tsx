"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Reward = {
  id: string;
  name: string;
  points_required: number;
  reward_value: number | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string | null;
};

type RewardForm = {
  name: string;
  points_required: number;
  reward_value: number;
  description: string;
  sort_order: number;
};

const emptyForm: RewardForm = {
  name: "",
  points_required: 50,
  reward_value: 0,
  description: "",
  sort_order: 99,
};

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [form, setForm] = useState<RewardForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  async function fetchRewards() {
    setLoading(true);

    const { data, error } = await supabase
      .from("rewards")
      .select(
        "id,name,points_required,reward_value,description,is_active,sort_order,created_at"
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("FETCH REWARDS ERROR:", error);
      alert("Không tải được danh sách quà đổi xu.");
    } else {
      setRewards((data || []) as Reward[]);
    }

    setLoading(false);
  }

  function startCreate() {
    setEditingReward(null);
    setForm(emptyForm);
  }

  function startEdit(reward: Reward) {
    setEditingReward(reward);
    setForm({
      name: reward.name || "",
      points_required: Number(reward.points_required || 0),
      reward_value: Number(reward.reward_value || 0),
      description: reward.description || "",
      sort_order: Number(reward.sort_order || 99),
    });
  }

  async function saveReward() {
    if (!form.name.trim()) {
      alert("Nhập tên quà đổi xu.");
      return;
    }

    if (Number(form.points_required) <= 0) {
      alert("Số xu cần đổi phải lớn hơn 0.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      points_required: Number(form.points_required),
      reward_value: Number(form.reward_value || 0),
      description: form.description.trim() || null,
      sort_order: Number(form.sort_order || 99),
    };

    if (editingReward) {
      const { error } = await supabase
        .from("rewards")
        .update(payload)
        .eq("id", editingReward.id);

      if (error) {
        console.error("UPDATE REWARD ERROR:", error);
        alert("Sửa quà thất bại.");
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("rewards").insert({
        ...payload,
        is_active: true,
      });

      if (error) {
        console.error("INSERT REWARD ERROR:", error);
        alert("Thêm quà thất bại.");
        setSaving(false);
        return;
      }
    }

    setEditingReward(null);
    setForm(emptyForm);
    await fetchRewards();
    setSaving(false);
  }

  async function toggleReward(reward: Reward) {
    const { error } = await supabase
      .from("rewards")
      .update({ is_active: !reward.is_active })
      .eq("id", reward.id);

    if (error) {
      console.error("TOGGLE REWARD ERROR:", error);
      alert("Không đổi được trạng thái quà.");
      return;
    }

    fetchRewards();
  }

  async function deleteReward(reward: Reward) {
    const ok = confirm(`Xóa quà "${reward.name}"?`);
    if (!ok) return;

    const { error } = await supabase
      .from("rewards")
      .delete()
      .eq("id", reward.id);

    if (error) {
      console.error("DELETE REWARD ERROR:", error);
      alert("Xóa quà thất bại. Nếu quà đã có lịch sử đổi, nên Tắt thay vì Xóa.");
      return;
    }

    fetchRewards();
  }

  const activeCount = rewards.filter((item) => item.is_active).length;
  const minPoints =
    rewards.length > 0
      ? Math.min(...rewards.map((item) => Number(item.points_required || 0)))
      : 0;

  return (
    <AdminLayout>
      <div>
        <p className="font-black text-[#00B14F]">Admin/POS</p>
        <h1 className="mt-1 text-4xl font-black text-[#06113C]">
          Quà đổi xu
        </h1>
        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Quản lý quà khách có thể đổi trực tiếp trong giỏ hàng khi đặt món.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] bg-white p-4 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Tổng quà</p>
          <p className="mt-1 text-3xl font-black text-[#06113C]">
            {rewards.length}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Đang bật</p>
          <p className="mt-1 text-3xl font-black text-[#00B14F]">
            {activeCount}
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-4 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Quà thấp nhất</p>
          <p className="mt-1 text-3xl font-black text-[#06113C]">
            {minPoints > 0 ? `${minPoints} xu` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="h-fit rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
          <p className="font-black text-[#00B14F]">
            {editingReward ? "Sửa quà" : "Thêm quà"}
          </p>

          <div className="mt-5 space-y-4">
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Tên quà: Bất kỳ topping"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              type="number"
              value={form.points_required}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  points_required: Number(e.target.value),
                }))
              }
              placeholder="Số xu cần đổi"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              type="number"
              value={form.reward_value}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  reward_value: Number(e.target.value),
                }))
              }
              placeholder="Giá trị quà, ví dụ 5000"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Mô tả ngắn: Quán chọn topping phù hợp và làm chung với đơn."
              rows={3}
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sort_order: Number(e.target.value),
                }))
              }
              placeholder="Thứ tự hiển thị"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <button
              onClick={saveReward}
              disabled={saving}
              className="w-full rounded-2xl bg-[#00B14F] px-5 py-4 font-black text-white disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : editingReward ? "Lưu sửa" : "Thêm quà"}
            </button>

            {editingReward && (
              <button
                onClick={startCreate}
                className="w-full rounded-2xl bg-neutral-100 px-5 py-4 font-black text-[#06113C]"
              >
                Huỷ sửa
              </button>
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-[#F5FFF8] p-4 text-xs font-bold leading-5 text-neutral-600">
            <p className="font-black text-[#06113C]">Gợi ý setup:</p>
            <p className="mt-1">50 xu → Bất kỳ topping</p>
            <p>100 xu → Nui rim sấy</p>
            <p>150 xu → Hồng trà nguyên vị</p>
            <p>200 xu → Bánh que chấm kem</p>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#06113C]">
                Danh sách quà
              </h2>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Quà đang bật sẽ hiển thị trong giỏ hàng khi khách đủ xu.
              </p>
            </div>

            <button
              onClick={fetchRewards}
              className="rounded-xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]"
            >
              Tải lại
            </button>
          </div>

          {loading ? (
            <p className="mt-6 font-black">Đang tải...</p>
          ) : rewards.length === 0 ? (
            <div className="mt-6 rounded-[28px] bg-[#F5FFF8] p-5 text-center">
              <p className="text-lg font-black text-[#06113C]">
                Chưa có quà đổi xu
              </p>
              <p className="mt-2 text-sm font-bold text-neutral-500">
                Thêm quà đầu tiên để khách đổi trực tiếp khi đặt món.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="grid gap-4 rounded-[28px] border border-black/5 p-4 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-[#06113C]">
                        {reward.name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          reward.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {reward.is_active ? "Đang bật" : "Đang tắt"}
                      </span>

                      <span className="rounded-full bg-[#FFF7E8] px-3 py-1 text-xs font-black text-[#B45309]">
                        {Number(reward.points_required).toLocaleString("vi-VN")} xu
                      </span>
                    </div>

                    {reward.description && (
                      <p className="mt-2 font-bold text-neutral-600">
                        {reward.description}
                      </p>
                    )}

                    <p className="mt-2 text-sm font-bold text-neutral-500">
                      Giá trị quà:{" "}
                      {Number(reward.reward_value || 0).toLocaleString("vi-VN")}đ
                      {" "}· Thứ tự: {Number(reward.sort_order || 99)}
                    </p>
                  </div>

                  <div className="flex gap-2 md:flex-col">
                    <button
                      onClick={() => startEdit(reward)}
                      className="rounded-xl bg-[#06113C] px-4 py-3 text-xs font-black text-white"
                    >
                      Sửa
                    </button>

                    <button
                      onClick={() => toggleReward(reward)}
                      className="rounded-xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]"
                    >
                      {reward.is_active ? "Tắt" : "Bật"}
                    </button>

                    <button
                      onClick={() => deleteReward(reward)}
                      className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
