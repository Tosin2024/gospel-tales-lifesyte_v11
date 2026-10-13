
'use client';
import Link from 'next/link';

export default function ContentCard({type,title,summary,reference,slug,id,featured}) {
  const href = type === 'story' ? `/stories/${slug || id}`
    : type === 'lesson' ? `/lessons/${slug || id}`
    : type === 'devotional' ? `/devotional/${id || slug}`
    : `/memory-verses/${id || slug}`;
  return (
    <Link href={href} className="content-card">
      <div className="content-card-top">
        <span className="pill">{type.replace('_',' ')}</span>
        {featured && <span className="featured">Featured</span>}
      </div>
      <h3>{title}</h3>
      {reference && <p className="reference">{reference}</p>}
      {summary && <p>{summary}</p>}
      <span className="read-more">Open →</span>
    </Link>
  );
}
