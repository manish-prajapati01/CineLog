import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MovieCard from './MovieCard/MovieCard';
export default function UpcomingPreview() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);
    Promise.allSettled(
      ['movie', 'tv'].map((type) =>
        api
          .get(`/discover/${type}?upcoming=true`)
          .then((r) =>
            r.results.slice(0, 4).map((t) => ({ ...t, media_type: type })),
          ),
      ),
    ).then((results) => {
      if (!live) return;
      setItems(
        results.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])),
      );
      setError(results.some((r) => r.status === 'rejected'));
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [retry]);
  return (
    <section className='cl-page cl-section'>
      <div className='cl-section-heading'>
        <div>
          <p className='cl-eyebrow'>NEXT ON YOUR LIST</p>
          <h2>Coming soon</h2>
        </div>
        <Link className='cl-text-link' to='/upcoming'>
          All upcoming releases ↗
        </Link>
      </div>
      {loading ? (
        <p role='status'>Loading upcoming releases…</p>
      ) : (
        <div className='cl-film-row'>
          {items.map((t) => (
            <div key={`${t.media_type}-${t.id}`}>
              <MovieCard item={t} />
              <p className='cl-release-date'>
                {t.media_type === 'movie' ? 'Film' : 'Series premiere'} ·{' '}
                {t.release_date || t.first_air_date || 'Date to be announced'}
              </p>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p role='alert'>
          Some releases could not be loaded.{' '}
          <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      )}
    </section>
  );
}
