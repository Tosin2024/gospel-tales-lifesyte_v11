'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '../../../lib/supabase';

export default function AdminLeaderboard() {
  const [supabase] = useState(() => supabaseBrowser());
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Sign in with an administrator account.'); setRows([]); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'admin') { setError('Admin access required.'); setRows([]); setLoading(false); return; }
    const { data: attempts, error: attemptsError } = await supabase.from('quiz_attempts').select('id,user_id,total_questions,correct_answers,score_percent,points_earned,completed_at').gt('total_questions', 0).order('score_percent', { ascending: false }).order('points_earned', { ascending: false }).order('completed_at', { ascending: true }).limit(200);
    if (attemptsError) { setError(attemptsError.message); setRows([]); setLoading(false); return; }
    const ids = [...new Set((attempts || []).map(a => a.user_id))]; let names = {};
    if (ids.length) {
      const { data: profiles, error: namesError } = await supabase.from('profiles').select('id,full_name').in('id', ids);
      if (namesError) { setError(namesError.message); setRows([]); setLoading(false); return; }
      names = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
    }
    setRows((attempts || []).map(a => ({ ...a, full_name: names[a.user_id] || 'Learner' }))); setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);
  const filtered = rows.filter(r => `${r.full_name} ${r.user_id}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="wrap"><Link href="/admin">← Admin dashboard</Link><h1>🏆 Quiz Leaderboard</h1><p className="muted">Review recorded quiz attempts. Scores are read-only here; this page does not create or alter learner results.</p>
    {error && <div className="notice"><strong>Unable to load leaderboard</strong><p>{error}</p><button onClick={load}>Try again</button></div>}
    <div className="panel"><div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}><h2>Quiz attempts ({rows.length})</h2><input placeholder="Search learner" aria-label="Search learner" value={search} onChange={e => setSearch(e.target.value)} /></div>
      {loading ? <p>Loading quiz results…</p> : !filtered.length ? <p>No quiz attempts found yet. Completed quizzes will appear here once saved in Supabase.</p> : filtered.map((r, i) => <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '38px minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '13px 0', borderBottom: '1px solid #e5e7eb' }}><b>{i + 1}</b><div><strong>{r.full_name}</strong><div className="muted">{r.correct_answers}/{r.total_questions} correct · {new Date(r.completed_at).toLocaleString()}</div></div><b>{Number(r.score_percent || 0)}%<div className="muted">{r.points_earned || 0} pts</div></b></div>)}
    </div></main>;
}
