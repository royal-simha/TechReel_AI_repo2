import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const INTEREST_TO_SEARCH: Record<string, string> = {
  'Software Engineering': 'software engineering shorts',
  'Programming': 'programming shorts tutorial',
  'Career': 'software career tips shorts',
  'Hardware': 'tech hardware shorts',
  'AI': 'artificial intelligence shorts',
  'Cybersecurity': 'cybersecurity shorts',
  'Cloud': 'cloud computing shorts',
  'Gaming': 'gaming shorts tech',
  'Web Development': 'web development shorts',
  'DSA': 'data structures algorithms shorts',
  'Databases': 'database shorts tutorial',
  'Java': 'java programming shorts',
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const queryParam = url.searchParams.get("query");
    const interest = url.searchParams.get("interest") || "";

    const searchQuery = queryParam || INTEREST_TO_SEARCH[interest] || "technology shorts";

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "YouTube API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoEmbeddable", "true");
    searchUrl.searchParams.set("maxResults", "12");
    searchUrl.searchParams.set("q", searchQuery);
    searchUrl.searchParams.set("key", apiKey);

    const searchResp = await fetch(searchUrl.toString(), {
      headers: { "Accept": "application/json" },
    });

    if (!searchResp.ok) {
      const errBody = await searchResp.text();
      return new Response(
        JSON.stringify({ error: `YouTube API error: ${searchResp.status}`, details: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchResp.json();
    const videoIds = searchData.items
      ?.filter((item: any) => item.id?.videoId)
      .map((item: any) => item.id.videoId) || [];

    if (videoIds.length === 0) {
      return new Response(
        JSON.stringify({ shorts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch video details for duration filtering
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.searchParams.set("part", "snippet,contentDetails,statistics");
    detailsUrl.searchParams.set("id", videoIds.join(","));
    detailsUrl.searchParams.set("key", apiKey);

    const detailsResp = await fetch(detailsUrl.toString(), {
      headers: { "Accept": "application/json" },
    });

    if (!detailsResp.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch video details" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const detailsData = await detailsResp.json();

    // Filter for short videos (under 60 seconds) and format
    const shorts = (detailsData.items || [])
      .filter((item: any) => {
        const duration = item.contentDetails?.duration || "";
        // Parse ISO 8601 duration — keep only videos under 60s
        const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return false;
        const minutes = parseInt(match[1] || "0", 10);
        const seconds = parseInt(match[2] || "0", 10);
        return minutes === 0 && seconds > 0 && seconds <= 60;
      })
      .map((item: any) => ({
        videoId: item.id,
        title: item.snippet?.title || "",
        description: item.snippet?.description || "",
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
        channelTitle: item.snippet?.channelTitle || "",
        publishedAt: item.snippet?.publishedAt || "",
        viewCount: item.statistics?.viewCount || "0",
        likeCount: item.statistics?.likeCount || "0",
        embedUrl: `https://www.youtube.com/embed/${item.id}`,
      }));

    return new Response(
      JSON.stringify({ shorts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
