"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminUploadsPage() {
  const [kind, setKind] = useState("content");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");

  async function loadHistory() {
    try {
      const response = await fetch("/api/admin/uploads", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load upload history.");
      setHistory(data.uploads || []);
      setHistoryError("");
    } catch (error) { setHistoryError(error.message || "Could not load upload history."); }
  }

  useEffect(() => { loadHistory(); }, []);

  async function upload(event) {
    event.preventDefault();
    setMessage("");
    setResult(null);
    if (!file) return setMessage("Choose a ZIP file first.");
    if (!file.name.toLowerCase().endsWith(".zip")) return setMessage("Only .zip files are accepted.");
    if (file.size > 4 * 1024 * 1024) return setMessage("This first version accepts ZIP files up to 4 MB. Larger uploads need a direct-to-storage upload flow.");
    const form = new FormData();
    form.append("archive", file);
    form.append("kind", kind);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setResult(data.upload);
      setMessage("ZIP uploaded to private quarantine. It has NOT been imported or deployed.");
      setFile(null);
      event.target.reset();
      await loadHistory();
    } catch (error) {
      setMessage(error.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="wrap">
    <p><Link href="/admin">← Admin dashboard</Link></p>
    <h1>Secure ZIP Upload Centre</h1>
    <p className="muted">Upload Bible learning content or a project source archive into private quarantine for review.</p>
    <div className="panel">
      <b>Safety notice</b>
      <p>Uploads are stored privately for review. This page does not execute code, import content, overwrite files, or deploy the website.</p>
    </div>
    <form className="panel" onSubmit={upload}>
      <label htmlFor="kind"><b>ZIP purpose</b></label>
      <select id="kind" value={kind} onChange={e => setKind(e.target.value)} className="input" style={{display:"block",width:"100%",padding:12,margin:"8px 0 18px"}}>
        <option value="content">Bible content — stories, lessons, questions and media</option>
        <option value="project">Project source code — recovery/review only</option>
      </select>
      <label htmlFor="archive"><b>Select ZIP file (maximum 4 MB for this first version)</b></label>
      <input id="archive" type="file" accept=".zip,application/zip" required onChange={e => setFile(e.target.files?.[0] || null)} style={{display:"block",margin:"12px 0 18px"}} />
      <button type="submit" disabled={busy}>{busy ? "Validating and uploading…" : "Validate and upload to quarantine"}</button>
      {message && <p role="status" style={{marginTop:14}}>{message}</p>}
      {result && <div className="panel" style={{marginTop:14}}>
        <b>Upload receipt</b>
        <p>Reference: <code>{result.id}</code></p>
        <p>File: {result.original_name}</p>
        <p>Type: {result.upload_kind}</p>
        <p>Status: {result.status}</p>
        <p>Size: {Math.ceil(result.size_bytes / 1024)} KB</p>
        <p>Files inspected: {result.entry_count}</p>
        <p>Uploaded at: {new Date(result.created_at).toLocaleString()}</p>
      </div>}
    </form>
    <section className="panel">
      <h2>Upload rules</h2>
      <ul>
        <li>ZIP archives only; maximum request size is 4 MB in this first version.</li>
        <li>Archive paths are checked for traversal, symlinks and unsafe entries.</li>
        <li>Project source ZIPs are never executed or deployed by this tool.</li>
        <li>Content ZIPs are not published or imported automatically.</li>
        <li>Only administrator accounts can upload or read the upload records.</li>
      </ul>
    </section>
    <section className="panel">
      <h2>Recent uploads</h2>
      {historyError && <p role="status">{historyError}</p>}
      {!historyError && history.length === 0 && <p className="muted">No ZIP uploads recorded yet.</p>}
      {history.length > 0 && <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th align="left">File</th><th align="left">Type</th><th align="left">Status</th><th align="left">Size</th><th align="left">Uploaded</th></tr></thead><tbody>{history.map(item => <tr key={item.id}><td style={{padding:"8px 6px"}}>{item.original_name}</td><td style={{padding:"8px 6px"}}>{item.upload_kind}</td><td style={{padding:"8px 6px"}}>{item.status}</td><td style={{padding:"8px 6px"}}>{Math.ceil(item.size_bytes / 1024)} KB</td><td style={{padding:"8px 6px"}}>{new Date(item.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}
      <button type="button" onClick={loadHistory} style={{marginTop:12}}>Refresh history</button>
    </section>
  </main>;
}
