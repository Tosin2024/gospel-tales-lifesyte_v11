'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '../../../../lib/supabase';

const emptyStory = { title: '', slug: '', bible_reference: '', summary: '', content: '', key_lesson: '', age_group: 'general', difficulty: 'beginner', cover_image_url: '', published: false, featured: false };
const fields = [
  ['title', 'Story title', 'text'], ['slug', 'URL slug', 'text'], ['bible_reference', 'Bible reference', 'text'],
  ['summary', 'Short summary', 'textarea'], ['content', 'Story content', 'textarea'], ['key_lesson', 'Key lesson', 'textarea'],
  ['age_group', 'Age group', 'text'], ['difficulty', 'Difficulty', 'select'], ['cover_image_url', 'Cover image URL (optional)', 'text']
];
function slugify(value) { return value.toLowerCase().trim().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function AdminStories() {
  const [supabase] = useState(() => supabaseBrowser());
  const [items, setItems] = useState([]); const [form, setForm] = useState(emptyStory); const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) { setAuthorized(false); setError('Sign in with your administrator account to manage Bible Tales.'); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', authData.user.id).maybeSingle();
    if (profileError || profile?.role !== 'admin') { setAuthorized(false); setError('Admin access required. Set this account role to admin in Supabase profiles.'); setLoading(false); return; }
    setAuthorized(true);
    const { data, error: queryError } = await supabase.from('bible_stories').select('*').order('updated_at', { ascending: false });
    if (queryError) setError(queryError.message); else setItems(data || []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => items.filter(x => `${x.title} ${x.bible_reference || ''} ${x.slug}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  function startNew() { setEditing(null); setForm({ ...emptyStory }); setMessage(''); setError(''); }
  function editStory(item) { setEditing(item.id); setForm({ ...emptyStory, ...item }); setMessage(''); setError(''); }
  function update(field, value) {
    setForm(old => ({ ...old, [field]: value, ...(field === 'title' && !editing && !old.slug ? { slug: slugify(value) } : {}) }));
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) { setError('Your session has expired. Sign in again.'); setSaving(false); return; }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).maybeSingle();
    if (profile?.role !== 'admin') { setError('Admin access required.'); setSaving(false); return; }
    const payload = {
      title: form.title.trim(), slug: slugify(form.slug || form.title), bible_reference: form.bible_reference.trim() || null,
      summary: form.summary.trim() || null, content: form.content.trim(), key_lesson: form.key_lesson.trim() || null,
      age_group: form.age_group.trim() || 'general', difficulty: form.difficulty || 'beginner', cover_image_url: form.cover_image_url.trim() || null,
      published: Boolean(form.published), featured: Boolean(form.featured), updated_at: new Date().toISOString()
    };
    if (!payload.title || !payload.content || !payload.slug) { setError('Story title, URL slug and story content are required.'); setSaving(false); return; }
    const result = editing
      ? await supabase.from('bible_stories').update(payload).eq('id', editing).select().single()
      : await supabase.from('bible_stories').insert({ ...payload, created_by: authData.user.id }).select().single();
    if (result.error) setError(result.error.message);
    else { setMessage(editing ? 'Story updated successfully.' : 'Story saved successfully.'); setForm({ ...emptyStory }); setEditing(null); await load(); }
    setSaving(false);
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    setError(''); setMessage('');
    const { error: deleteError } = await supabase.from('bible_stories').delete().eq('id', item.id);
    if (deleteError) setError(deleteError.message); else { setMessage('Story deleted.'); if (editing === item.id) startNew(); await load(); }
  }
  async function togglePublished(item) {
    setError(''); setMessage('');
    const { error: updateError } = await supabase.from('bible_stories').update({ published: !item.published, updated_at: new Date().toISOString() }).eq('id', item.id);
    if (updateError) setError(updateError.message); else { setMessage(item.published ? 'Story moved to draft.' : 'Story published.'); await load(); }
  }

  return <main className="wrap">
    <Link href="/admin">← Admin dashboard</Link>
    <h1>📖 Bible Tales Content Manager</h1>
    <p className="muted">Create, edit, publish, feature or remove Bible stories. Changes use your Supabase session and the database admin policies.</p>
    {error && <div className="notice" role="alert"><strong>Action needs attention</strong><p>{error}</p></div>}
    {message && <div className="notice" role="status">{message}</div>}
    {!authorized && !loading && <div className="panel"><p>Sign in with the account assigned the <code>admin</code> role, then refresh this page.</p><Link href="/auth">Go to sign in</Link></div>}
    {authorized && <>
      <section className="panel" style={{ marginBottom: 24 }}>
        <h2>{editing ? 'Edit story' : 'Add a Bible story'}</h2>
        <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
          {fields.map(([key, label, type]) => <label key={key} style={{ display: 'grid', gap: 6 }}>
            <span>{label}{['title', 'slug', 'content'].includes(key) ? ' *' : ''}</span>
            {type === 'textarea' ? <textarea required={key === 'content'} rows={key === 'content' ? 8 : 3} value={form[key] || ''} onChange={e => update(key, e.target.value)} />
              : type === 'select' ? <select value={form[key] || 'beginner'} onChange={e => update(key, e.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
              : <input required={['title', 'slug'].includes(key)} value={form[key] || ''} onChange={e => update(key, e.target.value)} />}
          </label>)}
          <label><input type="checkbox" checked={Boolean(form.published)} onChange={e => update('published', e.target.checked)} /> Publish for learners</label>
          <label><input type="checkbox" checked={Boolean(form.featured)} onChange={e => update('featured', e.target.checked)} /> Feature on Bible Tales page</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create story'}</button>{editing && <button type="button" onClick={startNew}>Cancel edit</button>}</div>
        </form>
      </section>
      <section className="panel">
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}><h2>Existing stories ({items.length})</h2><input aria-label="Search stories" placeholder="Search title or reference" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {loading ? <p>Loading stories…</p> : !filtered.length ? <p>No stories found. Add the first story using the form above.</p> : filtered.map(item => <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #e5e7eb' }}>
          <div><strong>{item.title}</strong><div className="muted">{item.bible_reference || 'No Bible reference'} · {item.published ? 'Published' : 'Draft'}{item.featured ? ' · Featured' : ''}</div><small>/{item.slug}</small></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button type="button" onClick={() => editStory(item)}>Edit</button><button type="button" onClick={() => togglePublished(item)}>{item.published ? 'Unpublish' : 'Publish'}</button><button type="button" onClick={() => remove(item)}>Delete</button></div>
        </div>)}
      </section>
    </>}
  </main>;
}
