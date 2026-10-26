import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fdbnwxqwupjepyatesyw.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_H8jleixzDsGwglnxl6_L1A_yu7M1yZO";

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getCompanies({ page = 1, limit = 50, category, search, minArr } = {}) {
  try {
    let query = supabase
      .from("companies")
      .select("*", { count: "exact" })
      .order("revenue", { ascending: false });

    if (category && category !== "All Sectors") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,founder.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (minArr) {
      query = query.gte("revenue", minArr);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data, count, page, totalPages: Math.ceil((count || 0) / limit) };
  } catch (err) {
    console.error("Supabase fetch error:", err);
    return { data: [], count: 0, page: 1, totalPages: 1 };
  }
}

export async function getCompanyBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Supabase getCompanyBySlug error:", err);
    return null;
  }
}
