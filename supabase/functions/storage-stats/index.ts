import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    // Check sub-admin
    const { data: subAdmin } = await adminClient
      .from("admin_sub_users")
      .select("is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!roleData && !subAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get DB size using pg_database_size
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: "DB URL not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Deno's postgres
    const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.5/mod.js");
    const sql = postgres(dbUrl, { max: 1 });

    // Total DB size
    const [dbSize] = await sql`SELECT pg_database_size(current_database()) as total_bytes`;

    // Table sizes
    const tableSizes = await sql`
      SELECT 
        schemaname || '.' || tablename as table_name,
        pg_total_relation_size(schemaname || '.' || tablename) as total_bytes,
        pg_relation_size(schemaname || '.' || tablename) as data_bytes,
        pg_indexes_size(schemaname || '.' || tablename) as index_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
      LIMIT 30
    `;

    // Row counts (estimates from pg_stat)
    const rowCounts = await sql`
      SELECT relname as table_name, n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `;

    // Storage buckets info
    const { data: buckets } = await adminClient.storage.listBuckets();

    let bucketStats: any[] = [];
    let totalStorageBytes = 0;
    if (buckets) {
      for (const bucket of buckets) {
        try {
          const { data: files } = await adminClient.storage.from(bucket.name).list("", { limit: 1000 });
          const fileCount = files?.length || 0;
          let bucketSize = 0;
          if (files) {
            for (const file of files) {
              if (file.metadata && file.metadata.size) {
                bucketSize += Number(file.metadata.size);
              }
            }
          }
          totalStorageBytes += bucketSize;
          bucketStats.push({
            name: bucket.name,
            public: bucket.public,
            file_count: fileCount,
            size_bytes: bucketSize,
          });
        } catch {
          bucketStats.push({ name: bucket.name, public: bucket.public, file_count: 0, size_bytes: 0 });
        }
      }
    }

    await sql.end();

    const result = {
      database: {
        total_bytes: Number(dbSize.total_bytes),
        total_mb: (Number(dbSize.total_bytes) / (1024 * 1024)).toFixed(2),
        tables: tableSizes.map((t: any) => ({
          name: t.table_name.replace("public.", ""),
          total_bytes: Number(t.total_bytes),
          data_bytes: Number(t.data_bytes),
          index_bytes: Number(t.index_bytes),
          total_mb: (Number(t.total_bytes) / (1024 * 1024)).toFixed(3),
        })),
        row_counts: rowCounts.map((r: any) => ({
          table: r.table_name,
          rows: Number(r.row_count),
        })),
      },
      storage_buckets: bucketStats,
      total_storage_bytes: totalStorageBytes,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Storage stats error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
