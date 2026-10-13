
'use client';
import Link from 'next/link';
export default function Stage10Admin(){
 const links=[
  ['/admin/content/stories','Bible Stories'],
  ['/admin/content/lessons','Bible Lessons'],
  ['/admin/content/devotionals','Devotionals'],
  ['/admin/content/memory-verses','Memory Verses'],
  ['/admin/stage7/competitions','Competitions'],
  ['/admin/stage7/registrations','Registrations'],
  ['/admin/stage7/payments','Payments'],
  ['/admin/stage9/finalize','Finalize Competitions'],
  ['/admin/stage9/awards','Prize Approval'],
  ['/admin/stage9/analytics','Analytics'],
  ['/admin/stage9/integrity','Integrity Review'],
  ['/admin/stage10/certificates','Certificate Center'],
  ['/admin/stage10/payments','Payment Configuration'],
  ['/admin/stage10/settings','Site Settings'],
  ['/admin/stage10/audit','Audit Log']
 ];
 return <main className="container"><Link href="/admin">← Admin</Link><h1>⚙️ Full Operations Center</h1><p className="notice">Stage 10 consolidates operational controls. Sensitive payment credentials remain server-side.</p><div className="card-grid">{links.map(([href,label])=><Link className="content-card" href={href} key={href}><h3>{label}</h3><span className="read-more">Open →</span></Link>)}</div></main>
}
