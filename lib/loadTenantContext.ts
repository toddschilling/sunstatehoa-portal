"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase";
import { extractTenantSlug } from "@/lib/extractTenantSlug";
import { TenantRow, TenantContextResult } from "@/lib/types";

export async function loadTenantContext(): Promise<TenantContextResult> {
  const host = headers().get("host") || "";
  const slug = extractTenantSlug(host);

  if (!slug) {
    return {
      tenant: null,
      user: null,
      role: null,
      error: "Invalid tenant slug",
    };
  }

  const supabase = createClient();

  // Get the authenticated user, if any
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Always try to load the tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single<TenantRow>();

  if (!tenant || tenantError) {
    return {
      tenant: null,
      user,
      role: null,
      error: "Unable to load tenant",
    };
  }

  let role: "admin" | "member" | null = null;

  // If user is signed in, look up their role in the tenant
  if (user) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .maybeSingle();

    role = membership?.role ?? null;
  }

  return {
    tenant,
    user,
    role,
    error: null,
  };
}
