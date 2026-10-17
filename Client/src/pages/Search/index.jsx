import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../../components/MovieCard/MovieCard';
import api from '../../services/api';
export default function Search() {
  const [params, setParams] = useSearchParams(),
    q = params.get('q') || '',
    type = ['movie', 'tv', 'person'].includes(params.get('type'))
      ? params.get('type')
      : 'multi',
    page = Math.min(
      500,
      Math.max(1, Math.floor(Number(params.get('page'))) || 1),
    );
  const [data, setData] = useState({
      results: [],
      total_pages: 0,
      total_results: 0,
    }),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [draft, setDraft] = useState(q),
    [retry, setRetry] = useState(0);
  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    if (!q.trim()) {
      setLoading(false);
      setData({ results: [], total_pages: 0, total_results: 0 });
      return;
    }
    setLoading(true);
    api
      .get(
        `/search/${['movie', 'tv', 'person'].includes(type) ? type : 'multi'}`,
        { params: { q, page }, signal: controller.signal },
      )
      .then((r) => {
        if (!controller.signal.aborted) setData(r.data || r);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [q, type, page, retry]);
  return (
    <div className='cl-page cl-top-space'>
      <p className='cl-eyebrow'>THE CATALOGUE</p>
      <h1>Search CineLog</h1>
      <form
        className='cl-search-page-form'
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ q: draft.trim(), type });
        }}
      >
        <label className='cl-sr-only' htmlFor='catalogue-search'>
          Search films, series and people
        </label>
        <input
          id='catalogue-search'
          autoFocus
          aria-label='Search query'
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className='cl-button'>Search ↗</button>
      </form>
      <div className='cl-tabs'>
        {[
          ['multi', 'Everything'],
          ['movie', 'Films'],
          ['tv', 'Series'],
          ['person', 'People'],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={key === type}
            className={key === type ? 'active' : ''}
            onClick={() => setParams({ q, type: key })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className='cl-results-label'>
        <span>{q ? `Results for “${q}”` : 'Something in mind?'}</span>
        <span>{data.total_results || 0} results</span>
      </div>
      {error ? (
        <div className='cl-empty' role='alert'>
          <p>{error}</p>
          <button onClick={() => setRetry((x) => x + 1)}>Try again</button>
        </div>
      ) : (
        <div className='cl-grid'>
          {loading
            ? Array.from({ length: 12 }, (_, i) => (
                <div key={i} className='cl-skeleton' />
              ))
            : data.results.map((item) => (
                <MovieCard
                  key={`${item.media_type || type}-${item.id}`}
                  item={item}
                  mediaType={
                    item.media_type ||
                    (type === 'multi' ? (item.title ? 'movie' : 'tv') : type)
                  }
                />
              ))}
        </div>
      )}
      {!loading && !error && !data.results.length && (
        <div className='cl-empty'>
          <h2>
            {q ? 'No matches this time.' : 'Find a film, series or filmmaker.'}
          </h2>
          <p>
            {q
              ? 'Try a different title or spelling.'
              : 'Search for movies, series and the people who make them.'}
          </p>
        </div>
      )}
      {!error && data.total_pages > 1 && (
        <div className='cl-pagination'>
          <button
            disabled={page === 1 || loading}
            onClick={() => setParams({ q, type, page: page - 1 })}
          >
            ← Previous
          </button>
          <span>
            {page} / {Math.min(data.total_pages, 500)}
          </span>
          <button
            disabled={page >= Math.min(data.total_pages, 500) || loading}
            onClick={() => setParams({ q, type, page: page + 1 })}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
