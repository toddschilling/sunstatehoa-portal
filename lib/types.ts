// lib/types.ts

import { User } from "@supabase/supabase-js";

export interface DocumentRow {
  id: string;
  title: string;
  doc_type: string;
  storage_path: string;
  uploaded_by?: string;
  uploaded_at?: string;
  is_public: boolean;
  url?: string;
}

export interface TenantRow {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  contact_email: string | null;
  description: string | null;
  custom_domain: string | null;
  active: boolean;
}

export interface TenantContextResult {
  tenant: TenantRow | null;
  user: User | null;
  role: "admin" | "member" | null;
  error: string | null;
}

export interface MembershipRow {
  id: string;
  user_id: string;
  tenant_id: string;
  role: "admin" | "member";
  unit: string | null;
  created_at: string; // or `Date` if you're converting it
  tenants: Pick<TenantRow, "id" | "slug" | "name">;
}
