import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_COOKIE_NAME,
  isAdminSessionTokenValid,
} from "@/lib/adminSession";

export const dynamic = "force-dynamic";

type BranchRow = {
  id: string;
  code: string;
  name: string;
  short_name: string;
  address: string;
  is_active: boolean;
  sort_order: number;
};

type MerchantProfileRow = {
  user_id: string;
  display_name: string;
  global_role: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type MembershipRow = {
  id: string;
  user_id: string;
  branch_id: string;
  branch_role: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

function getAdminClient() {
  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function ensureAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return isAdminSessionTokenValid(token);
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function generateTemporaryPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = upper + lower + digits + symbols;
  const random = new Uint32Array(16);
  crypto.getRandomValues(random);

  const required = [
    upper[random[0] % upper.length],
    lower[random[1] % lower.length],
    digits[random[2] % digits.length],
    symbols[random[3] % symbols.length],
  ];

  for (let index = 4; index < random.length; index += 1) {
    required.push(all[random[index] % all.length]);
  }

  for (let index = required.length - 1; index > 0; index -= 1) {
    const swapIndex = random[index % random.length] % (index + 1);
    [required[index], required[swapIndex]] = [
      required[swapIndex],
      required[index],
    ];
  }

  return required.join("");
}

async function loadBranches(supabaseAdmin: ReturnType<typeof getAdminClient>) {
  const { data, error } = await supabaseAdmin
    .from("branches")
    .select("id,code,name,short_name,address,is_active,sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data || []) as BranchRow[];
}

async function loadAuthUsers(supabaseAdmin: ReturnType<typeof getAdminClient>) {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;
    users.push(...data.users);

    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

export async function GET() {
  if (!(await ensureAdminSession())) {
    return NextResponse.json(
      { ok: false, message: "Phiên quản trị đã hết hạn." },
      { status: 401 }
    );
  }

  try {
    const supabaseAdmin = getAdminClient();

    const [branches, profilesResult, membershipsResult, authUsers] =
      await Promise.all([
        loadBranches(supabaseAdmin),
        supabaseAdmin
          .from("merchant_profiles")
          .select(
            "user_id,display_name,global_role,is_active,created_at,updated_at"
          )
          .in("global_role", ["super_admin", "branch_owner"])
          .order("created_at", { ascending: true }),
        supabaseAdmin
          .from("merchant_branch_members")
          .select(
            "id,user_id,branch_id,branch_role,is_active,created_at,updated_at"
          )
          .eq("is_active", true),
        loadAuthUsers(supabaseAdmin),
      ]);

    if (profilesResult.error) throw profilesResult.error;
    if (membershipsResult.error) throw membershipsResult.error;

    const profiles = (profilesResult.data || []) as MerchantProfileRow[];
    const memberships = (membershipsResult.data || []) as MembershipRow[];
    const branchById = new Map(branches.map((branch) => [branch.id, branch]));
    const authById = new Map(authUsers.map((user) => [user.id, user]));
    const activeMembershipsByUser = new Map<string, MembershipRow[]>();

    for (const membership of memberships) {
      const current = activeMembershipsByUser.get(membership.user_id) || [];
      current.push(membership);
      activeMembershipsByUser.set(membership.user_id, current);
    }

    const accounts = profiles.map((profile) => {
      const authUser = authById.get(profile.user_id);
      const activeMemberships =
        activeMembershipsByUser.get(profile.user_id) || [];
      const membership = activeMemberships[0] || null;
      const branch = membership ? branchById.get(membership.branch_id) || null : null;

      return {
        userId: profile.user_id,
        email: authUser?.email || null,
        displayName: profile.display_name,
        role: profile.global_role,
        isActive: profile.is_active,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        lastSignInAt: authUser?.last_sign_in_at || null,
        branch: branch
          ? {
              id: branch.id,
              code: branch.code,
              shortName: branch.short_name,
              name: branch.name,
              address: branch.address,
              isActive: branch.is_active,
            }
          : null,
        activeMembershipCount: activeMemberships.length,
        configurationWarning:
          profile.global_role === "branch_owner" && activeMemberships.length !== 1
            ? `branch_owner đang có ${activeMemberships.length} membership active`
            : null,
      };
    });

    return NextResponse.json({
      ok: true,
      accounts,
      branches: branches.map((branch) => ({
        id: branch.id,
        code: branch.code,
        shortName: branch.short_name,
        name: branch.name,
        address: branch.address,
        isActive: branch.is_active,
      })),
    });
  } catch (error) {
    console.error("merchant accounts GET error:", error);
    return NextResponse.json(
      { ok: false, message: "Không tải được tài khoản Merchant." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await ensureAdminSession())) {
    return NextResponse.json(
      { ok: false, message: "Phiên quản trị đã hết hạn." },
      { status: 401 }
    );
  }

  let createdUserId: string | null = null;

  try {
    const body = await request.json();
    const displayName = String(body.displayName || "").trim();
    const email = normalizeEmail(body.email);
    const branchId = String(body.branchId || "").trim();

    if (displayName.length < 2) {
      return NextResponse.json(
        { ok: false, message: "Tên Merchant phải có ít nhất 2 ký tự." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, message: "Email không hợp lệ." },
        { status: 400 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { ok: false, message: "Vui lòng chọn chi nhánh." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();
    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("id,is_active,short_name")
      .eq("id", branchId)
      .maybeSingle();

    if (branchError) throw branchError;
    if (!branch || !branch.is_active) {
      return NextResponse.json(
        { ok: false, message: "Chi nhánh không tồn tại hoặc đang bị khóa." },
        { status: 400 }
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
        },
      });

    if (authError) {
      const duplicate = /already|registered|exists/i.test(authError.message);
      return NextResponse.json(
        {
          ok: false,
          message: duplicate
            ? "Email này đã tồn tại trong Supabase Auth."
            : `Không tạo được tài khoản Auth: ${authError.message}`,
        },
        { status: duplicate ? 409 : 400 }
      );
    }

    createdUserId = authData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("merchant_profiles")
      .insert({
        user_id: createdUserId,
        display_name: displayName,
        global_role: "branch_owner",
        is_active: true,
      });

    if (profileError) throw profileError;

    const { error: membershipError } = await supabaseAdmin
      .from("merchant_branch_members")
      .insert({
        user_id: createdUserId,
        branch_id: branchId,
        branch_role: "branch_owner",
        is_active: true,
      });

    if (membershipError) throw membershipError;

    return NextResponse.json(
      {
        ok: true,
        message: "Đã tạo tài khoản Merchant.",
        credentials: {
          email,
          temporaryPassword,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("merchant accounts POST error:", error);

    if (createdUserId) {
      try {
        const supabaseAdmin = getAdminClient();
        await supabaseAdmin
          .from("merchant_branch_members")
          .delete()
          .eq("user_id", createdUserId);
        await supabaseAdmin
          .from("merchant_profiles")
          .delete()
          .eq("user_id", createdUserId);
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      } catch (rollbackError) {
        console.error("merchant account rollback error:", rollbackError);
      }
    }

    return NextResponse.json(
      {
        ok: false,
        message:
          "Không tạo được tài khoản Merchant. Hệ thống đã thử hoàn tác dữ liệu vừa tạo.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await ensureAdminSession())) {
    return NextResponse.json(
      { ok: false, message: "Phiên quản trị đã hết hạn." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const userId = String(body.userId || "").trim();
    const action = String(body.action || "update").trim();

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "Thiếu userId." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("merchant_profiles")
      .select("user_id,display_name,global_role,is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json(
        { ok: false, message: "Không tìm thấy Merchant profile." },
        { status: 404 }
      );
    }

    if (action === "reset_password") {
      if (profile.global_role !== "branch_owner") {
        return NextResponse.json(
          { ok: false, message: "Không đặt lại mật khẩu super_admin tại đây." },
          { status: 400 }
        );
      }

      const temporaryPassword = generateTemporaryPassword();
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: temporaryPassword }
      );

      if (error) throw error;

      return NextResponse.json({
        ok: true,
        message: "Đã tạo mật khẩu tạm mới.",
        credentials: {
          email: data.user.email || null,
          temporaryPassword,
        },
      });
    }

    if (profile.global_role !== "branch_owner") {
      return NextResponse.json(
        {
          ok: false,
          message: "super_admin chỉ hiển thị để kiểm tra, không chỉnh ở màn này.",
        },
        { status: 400 }
      );
    }

    const displayName = String(body.displayName ?? profile.display_name).trim();
    const branchId = String(body.branchId || "").trim();
    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : profile.is_active;

    if (displayName.length < 2) {
      return NextResponse.json(
        { ok: false, message: "Tên Merchant phải có ít nhất 2 ký tự." },
        { status: 400 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { ok: false, message: "branch_owner bắt buộc phải có một chi nhánh." },
        { status: 400 }
      );
    }

    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("id,is_active")
      .eq("id", branchId)
      .maybeSingle();

    if (branchError) throw branchError;
    if (!branch || !branch.is_active) {
      return NextResponse.json(
        { ok: false, message: "Chi nhánh không tồn tại hoặc đang bị khóa." },
        { status: 400 }
      );
    }

    const { data: currentMemberships, error: currentMembershipsError } =
      await supabaseAdmin
        .from("merchant_branch_members")
        .select("branch_id")
        .eq("user_id", userId)
        .eq("is_active", true);

    if (currentMembershipsError) throw currentMembershipsError;

    const currentBranchId = currentMemberships?.[0]?.branch_id || null;
    const branchChanged = currentBranchId !== branchId;

    const { error: updateProfileError } = await supabaseAdmin
      .from("merchant_profiles")
      .update({
        display_name: displayName,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("global_role", "branch_owner");

    if (updateProfileError) throw updateProfileError;

    const { error: authStatusError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: isActive ? "none" : "876000h" }
    );

    if (authStatusError) {
      await supabaseAdmin
        .from("merchant_profiles")
        .update({
          is_active: profile.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      throw authStatusError;
    }

    const { error: deactivateMembershipsError } = await supabaseAdmin
      .from("merchant_branch_members")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (deactivateMembershipsError) throw deactivateMembershipsError;

    const { data: existingMembership, error: existingMembershipError } =
      await supabaseAdmin
        .from("merchant_branch_members")
        .select("id")
        .eq("user_id", userId)
        .eq("branch_id", branchId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (existingMembershipError) throw existingMembershipError;

    if (existingMembership) {
      const { error } = await supabaseAdmin
        .from("merchant_branch_members")
        .update({
          branch_role: "branch_owner",
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMembership.id);

      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("merchant_branch_members")
        .insert({
          user_id: userId,
          branch_id: branchId,
          branch_role: "branch_owner",
          is_active: true,
        });

      if (error) throw error;
    }

    if (!isActive || branchChanged) {
      const { error: deactivateDevicesError } = await supabaseAdmin
        .from("merchant_devices")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (deactivateDevicesError) throw deactivateDevicesError;
    }

    return NextResponse.json({
      ok: true,
      message: !isActive
        ? "Đã khóa tài khoản Merchant và dừng thiết bị nhận FCM."
        : branchChanged
          ? "Đã đổi chi nhánh. Thiết bị cũ đã dừng FCM cho tới khi app xác nhận lại phiên mới."
          : "Đã cập nhật tài khoản Merchant.",
    });
  } catch (error) {
    console.error("merchant accounts PATCH error:", error);
    return NextResponse.json(
      { ok: false, message: "Không cập nhật được tài khoản Merchant." },
      { status: 500 }
    );
  }
}
