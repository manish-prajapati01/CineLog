import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
export default function CommunityRatings({ id, type, refresh }) {
  const [page, setPage] = useState(1),
    [data, setData] = useState(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    setPage(1);
  }, [id, type]);
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError('');
    api
      .get(`/ratings/community/${id}/${type}?page=${page}`, {
        signal: c.signal,
      })
      .then((r) => {
        if (!c.signal.aborted) setData(r);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [id, type, page, refresh, retry]);
  return (
    <section className='cl-section'>
      <h2>Community ratings</h2>
      <p className='cl-muted'>
        Ratings and published reviews are public on title pages, even when a
        member’s profile is private.
      </p>
      {error ? (
        <p role='alert'>
          {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      ) : !data ? (
        <p role='status'>Loading ratings…</p>
      ) : (
        <>
          {!data.data.length ? (
            <p>No ratings yet.</p>
          ) : (
            <div className='cl-community-ratings'>
              {data.data.map((r) => (
                <article className='cl-panel' key={r.id}>
                  <strong>{r.score} / 10</strong>
                  {r.user ? (
                    <Link to={`/people/${r.user.id}`}>{r.user.name}</Link>
                  ) : (
                    <span>CineLog member</span>
                  )}
                  <time dateTime={r.date}>
                    {new Date(r.date).toLocaleDateString()}
                  </time>
                </article>
              ))}
            </div>
          )}
          {data.pagination.pages > 1 && (
            <div className='cl-feature-toolbar'>
              <button
                disabled={page === 1}
                onClick={() => setPage((n) => n - 1)}
              >
                Previous ratings
              </button>
              <span>
                Page {page} of {data.pagination.pages}
              </span>
              <button
                disabled={page >= data.pagination.pages}
                onClick={() => setPage((n) => n + 1)}
              >
                Next ratings
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
