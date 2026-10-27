import { NextResponse } from "next/server";
import { getCompanies } from "../../../lib/supabase";
import fallbackData from "../../../data.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const minArr = searchParams.get("minArr") ? parseInt(searchParams.get("minArr"), 10) : null;

  try {
    const result = await getCompanies({ page, limit, category, search, minArr });
    if (result && result.data && result.data.length > 0) {
      return NextResponse.json(result);
    }
  } catch (err) {
    console.error("API error fetching from Supabase, falling back to local dataset:", err);
  }

  // Fallback to local high-speed static data if Supabase isn't reachable
  let filtered = [...fallbackData];
  if (category && category !== "All Sectors") {
    filtered = filtered.filter((c) => c.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.founder && c.founder.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q))
    );
  }
  if (minArr) {
    filtered = filtered.filter((c) => c.revenue >= minArr);
  }

  const from = (page - 1) * limit;
  const to = from + limit;
  const paginated = filtered.slice(from, to);

  return NextResponse.json({
    data: paginated,
    count: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
    source: "fallback",
  });
}
