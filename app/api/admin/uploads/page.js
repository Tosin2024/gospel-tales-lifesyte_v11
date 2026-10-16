
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminUploadsPage() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadHistory() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/uploads");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load upload history.");
      }

      setUploads(data.uploads || []);
    } catch (error) {
      setMessage(error.message || "Could not load upload history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <p><Link href="/admin">← Admin dashboard</Link></p>
      <h1>Secure ZIP Upload Centre</h1>
      <p>
        Upload Bible learning content or project source archives
        into private quarantine for administrator review.
      </p>

      <section style={{ padding: 20, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2>Upload status</h2>
        <p>
          The upload API is available for validated ZIP files.
          This page does not execute code or deploy a project.
        </p>
        <p>
          Use the secure upload form once the upload workflow is
          connected and tested.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Recent uploads</h2>
        <button onClick={loadHistory} disabled={loading}>
          {loading ? "Loading..." : "Refresh history"}
        </button>

        {message && <p role="alert">{message}</p>}

        {loading ? (
          <p>Loading upload history...</p>
        ) : uploads.length === 0 ? (
          <p>No upload records found.</p>
        ) : (
          <ul>
            {uploads.map((upload) => (
              <li key={upload.id}>
                {upload.original_name} — {upload.status}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
