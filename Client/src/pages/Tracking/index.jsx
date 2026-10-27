import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { languageName } from '../../helpers/languages';
export default function Tracking() {
  const user = useSelector((s) => s.users.user);
  const [data, setData] = useState([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setData([]);
    setError('');
    if (!user?.id) return;
    setLoading(true);
    (async () => {
      try {
        let offset = 0;
        do {
          const r = await api.get(`/personal/progress?offset=${offset}`, {
            signal: c.signal,
          });
          if (c.signal.aborted) return;
          setData((d) => [...d, ...r.data]);
          if (r.failed)
            setError('Some series could not be loaded. Please retry.');
          offset = r.nextOffset;
        } while (offset !== null);
      } catch (e) {
        if (!c.signal.aborted) setError(e.message);
      } finally {
        if (!c.signal.aborted) setLoading(false);
      }
    })();
    return () => c.abort();
  }, [user?.id, retry]);
  return (
    <div className='cl-page cl-top-space'>
      <p className='cl-eyebrow'>ONE EPISODE AT A TIME</p>
      <h1>Series progress</h1>
      <p className='cl-muted'>
        Your manual viewing record. Open a series to mark episodes or a whole
        season.
      </p>
      {!user ? (
        <Link
          to={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
          className='cl-button'
        >
          Sign in to track series
        </Link>
      ) : (
        <>
          {loading && <p role='status'>Loading progress…</p>}
          {error && (
            <p role='alert'>
              {error}{' '}
              <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
            </p>
          )}
          {!loading && !error && !data.length && (
            <div className='cl-empty'>
              <h2>Start with a series you’re watching.</h2>
              <p>
                Open its seasons and mark an episode watched. Your progress
                appears here.
              </p>
              <Link to='/tv'>Browse series ↗</Link>
            </div>
          )}
          <div className='cl-region-grid'>
            {data.map((t) => (
              <Link className='cl-panel' key={t.id} to={`/tv/${t.id}`}>
                <h2>{t.title}</h2>
                <p>
                  {languageName(t.original_language)} · {t.watched} episodes
                  watched{t.total ? ` / ${t.total} listed` : ''}
                </p>
                <progress
                  aria-label={`${t.title} episode progress`}
                  value={Math.min(t.watched, t.total || t.watched)}
                  max={t.total || t.watched || 1}
                />
                <p>Update progress ↗</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
