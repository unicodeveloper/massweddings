import { NextRequest, NextResponse } from "next/server";
import {
  fetchGeopoliticalMarkets,
  fetchMarketsByTag,
  searchMarketsByQuery,
} from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") || "geopolitical";
  const query = params.get("query");
  const tag = params.get("tag");
  const limit = Number.parseInt(params.get("limit") || "20", 10);

  try {
    let markets;

    if (type === "search" && query) {
      markets = await searchMarketsByQuery(query, limit);

      // Nigeria-specific markets come and go; fall back to the Africa tag so the
      // panel shows the nearest relevant thing rather than an empty shelf.
      if (markets.length === 0 && tag) {
        markets = await fetchMarketsByTag(tag, limit);
      }
    } else if (type === "tag" && tag) {
      markets = await fetchMarketsByTag(tag, limit);
    } else {
      markets = await fetchGeopoliticalMarkets(limit);
    }

    return NextResponse.json({ success: true, markets, count: markets.length });
  } catch (error) {
    console.error("Polymarket API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch markets",
        markets: [],
      },
      { status: 500 }
    );
  }
}
