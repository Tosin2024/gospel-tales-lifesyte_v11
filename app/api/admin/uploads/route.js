import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import yauzl from "yauzl";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_ENTRIES = 2000;
const MAX_UNCOMPRESSED = 100 * 1024 * 1024;
const MAX_ENTRY_BYTES = 20 * 1024 * 1024;

function inspectZip(buffer) {
  return new Promise((resolve, reject) => {
    if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) {
      reject(new Error("The file does not appear to be a valid ZIP archive."));
      return;
    }
    yauzl.fromBuffer(buffer, { lazyEntries: true, decodeStrings: true, validateEntrySizes: true }, (err, zip) => {
      if (err || !zip) return reject(new Error("The ZIP archive could not be opened."));
      let count = 0;
      let total = 0;
      const names = new Set();
      let settled = false;
      const fail = (message) => {
        if (settled) return;
        settled = true;
        try { zip.close(); } catch {}
        reject(new Error(message));
      };
      zip.on("error", () => fail("The ZIP archive failed structural validation."));
      zip.on("entry", entry => {
        if (settled) return;
        count += 1;
        const name = String(entry.fileName || "");
        const normalized = name.replace(/\\/g, "/");
        const unixMode = (entry.externalFileAttributes >>> 16) & 0xF000;
        if (count > MAX_ENTRIES) return fail("The ZIP contains too many entries (maximum 2,000).");
        if (!name || normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized) ||
            normalized.split("/").some(part => part === ".." || part === ".")) {
          return fail("The ZIP contains an unsafe path.");
        }
        if (names.has(normalized)) return fail("The ZIP contains duplicate paths.");
        names.add(normalized);
        if (unixMode === 0xA000) return fail("Symbolic links are not accepted in ZIP uploads.");
        const size = Number(entry.uncompressedSize || 0);
        if (size > MAX_ENTRY_BYTES) return fail("A ZIP entry exceeds the 20 MB uncompressed limit.");
        total += size;
        if (total > MAX_UNCOMPRESSED) return fail("The ZIP expands beyond the 100 MB safety limit.");
        zip.readEntry();
      });
      zip.on("end", () => {
        if (settled) return;
        settled = true;
        resolve({ entry_count: count, uncompressed_bytes: total });
      });
      zip.readEntry();
    });
  });
}

async function getAdminClient() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll(cookiesToSet) {
      try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
    } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Sign in is required.", status: 401 };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return { error: "Administrator access is required.", status: 403 };
  return { supabase, user };
}

export async function POST(request) {
  try {
    const auth = await getAdminClient();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const form = await request.formData();
    const file = form.get("archive");
    const kind = form.get("kind");
    if (!file || typeof file.arrayBuffer !== "function") return NextResponse.json({ error: "Choose a ZIP file." }, { status: 400 });
    if (!["content", "project"].includes(kind)) return NextResponse.json({ error: "Invalid upload purpose." }, { status: 400 });
    if (!file.name || !file.name.toLowerCase().endsWith(".zip")) return NextResponse.json({ error: "Only .zip files are accepted." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "ZIP must be between 1 byte and 4 MB." }, { status: 413 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const inspection = await inspectZip(buffer);
    const id = randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "upload.zip";
    const objectPath = `${auth.user.id}/${id}/${safeName}`;
    const { error: storageError } = await auth.supabase.storage.from("admin-upload-quarantine").upload(objectPath, buffer, {
      contentType: "application/zip",
      upsert: false,
      cacheControl: "0"
    });
    if (storageError) {
      return NextResponse.json({ error: "Private storage upload failed. Check the bucket and its administrator-only policies in the SQL setup." }, { status: 500 });
    }

    const row = {
      id,
      uploaded_by: auth.user.id,
      upload_kind: kind,
      original_name: safeName,
      object_path: objectPath,
      size_bytes: buffer.length,
      sha256: (await import("node:crypto")).createHash("sha256").update(buffer).digest("hex"),
      entry_count: inspection.entry_count,
      uncompressed_bytes: inspection.uncompressed_bytes,
      status: "quarantined"
    };
    const { data, error: insertError } = await auth.supabase.from("admin_uploads").insert(row).select("id,upload_kind,original_name,size_bytes,entry_count,status,created_at").single();
    if (insertError) {
      await auth.supabase.storage.from("admin-upload-quarantine").remove([objectPath]);
      return NextResponse.json({ error: "Upload record could not be saved. Apply the admin upload SQL migration and try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, upload: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Upload could not be validated." }, { status: 400 });
  }
}

export async function GET() {
  const auth = await getAdminClient();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase.from("admin_uploads")
    .select("id,upload_kind,original_name,size_bytes,entry_count,uncompressed_bytes,status,created_at,sha256")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Could not load upload history. Apply the SQL migration first." }, { status: 500 });
  return NextResponse.json({ uploads: data || [] });
}
