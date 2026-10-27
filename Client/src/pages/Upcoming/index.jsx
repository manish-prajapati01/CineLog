import CatalogueNotice from '../../components/CatalogueNotice';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import MovieCard from '../../components/MovieCard/MovieCard';
import Select from '../../components/Select';
export default function Upcoming() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') === 'tv' ? 'tv' : 'movie';
  const language = params.get('language') || '';
  const order = params.get('order') === 'date' ? 'date' : 'popular';
  const page = Math.max(1, Math.min(500, Math.floor(Number(params.get('page'))) || 1));
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError('');
    api
      .get(
        `/discover/${type}?upcoming=true&order=${order}&language=${encodeURIComponent(language)}&page=${page}`,
        { signal: c.signal },
      )
      .then((r) => {
        if (!c.signal.aborted) setData(r);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [type, language, order, page, retry]);
  function change(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }
  return (
    <div className='cl-page cl-top-space'>
      <CatalogueNotice data={data?._catalogue} />
      <p className='cl-eyebrow'>ON THE HORIZON</p>
      <h1>Coming soon</h1>
      <p className='cl-muted'>
        Upcoming films and series premieres. Release dates can change and vary
        by region.
      </p>
      <div className='cl-feature-toolbar'>
        <div className='cl-tabs'>
          <button
            aria-pressed={type === 'movie'}
            onClick={() => change('type', 'movie')}
          >
            Movies
          </button>
          <button
            aria-pressed={type === 'tv'}
            onClick={() => change('type', 'tv')}
          >
            Series
          </button>
        </div>
        <Select
          aria-label='Original language'
          value={language}
          onChange={(e) => change('language', e.target.value)}
        >
          <option value=''>All languages</option>
          {[
            ['indian', 'Indian languages'],
            ['hi', 'Hindi'],
            ['en', 'English'],
            ['ta', 'Tamil'],
            ['te', 'Telugu'],
            ['ml', 'Malayalam'],
            ['kn', 'Kannada'],
            ['mr', 'Marathi'],
            ['bn', 'Bengali'],
            ['ko', 'Korean'],
            ['ja', 'Japanese'],
          ].map(([v, n]) => (
            <option key={v} value={v}>
              {n}
            </option>
          ))}
        </Select>
        <Select
          aria-label='Order upcoming releases'
          value={order}
          onChange={(e) => change('order', e.target.value)}
        >
          <option value='popular'>Most anticipated</option>
          <option value='date'>Soonest releases</option>
        </Select>
      </div>
      {error ? (
        <p role='alert'>
          {error}{' '}
          <button onClick={() => setRetry((n) => n + 1)}>Try again</button>
        </p>
      ) : !data ? (
        <p role='status'>Loading upcoming releases…</p>
      ) : (
        <>
          <p className='cl-muted'>
            {data.total_results} upcoming titles · Open a title for synopsis,
            cast, trailers and details.
          </p>
          <div className='cl-grid'>
            {data.results.map((t) => (
              <div key={t.id}>
                <MovieCard item={t} mediaType={type} />
                <p className='cl-release-date'>
                  {t.release_date || t.first_air_date || 'Date to be announced'}
                </p>
              </div>
            ))}
          </div>
          {!data.results.length && (
            <p>No release dates are listed for this selection yet.</p>
          )}
          <div className='cl-pagination'>
            <button
              disabled={page === 1}
              onClick={() => change('page', page - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {Math.max(1, data.total_pages)}
            </span>
            <button
              disabled={page >= data.total_pages}
              onClick={() => change('page', page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
