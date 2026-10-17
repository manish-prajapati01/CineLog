import Select from '../../components/Select';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../../components/MovieCard/MovieCard';
import api from '../../services/api';
export default function Discover({ type = 'movie' }) {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({
    results: [],
    total_pages: 0,
    total_results: 0,
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const [genres, setGenres] = useState([]);
  const [genreError, setGenreError] = useState(false);
  const page = Math.min(
    500,
    Math.max(1, Math.floor(Number(params.get('page'))) || 1),
  );
  const requestParams = new URLSearchParams(params);
  requestParams.set('page', String(page));
  const query = requestParams.toString();
  useEffect(() => {
    let live = true;
    setGenreError(false);
    api
      .get(`/${type === 'movie' ? 'movies' : 'tv'}/genres`)
      .then((r) => {
        if (live) setGenres(r.data || r.genres || []);
      })
      .catch(() => {
        if (live) setGenreError(true);
      });
    return () => {
      live = false;
    };
  }, [type, retry]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .get(`/discover/${type}?${query}`, { signal: controller.signal })
      .then((r) => {
        if (!controller.signal.aborted) setData(r);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [type, query, retry]);
  function change(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete('page');
    setParams(next);
  }
  return (
    <div className='cl-page cl-top-space'>
      <p className='cl-eyebrow'>THE CATALOGUE</p>
      <div className='cl-page-heading'>
        <div>
          <h1>{type === 'movie' ? 'Movies' : 'Series'}</h1>
          <p>Browse by genre, year, language and audience rating.</p>
        </div>
      </div>
      {genreError && (
        <p className='cl-notice' role='alert'>
          Genres could not be loaded.{' '}
          <button onClick={() => setRetry((x) => x + 1)}>Retry genres</button>
        </p>
      )}
      <div className='cl-filters'>
        <label>
          Genre
          <Select
            aria-label='Genre'
            value={params.get('genre') || ''}
            onChange={(e) => change('genre', e.target.value)}
          >
            <option value=''>All genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Original language
          <Select
            aria-label='Original language'
            value={params.get('language') || ''}
            onChange={(e) => change('language', e.target.value)}
          >
            <option value=''>Any language</option>
            {[
              ['en', 'English'],
              ['hi', 'Hindi'],
              ['ta', 'Tamil'],
              ['te', 'Telugu'],
              ['ml', 'Malayalam'],
              ['kn', 'Kannada'],
              ['ko', 'Korean'],
              ['ja', 'Japanese'],
              ['fr', 'French'],
              ['es', 'Spanish'],
            ].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          {type === 'tv' ? 'Aired in' : 'Release year'}
          <Select
            aria-label={type === 'tv' ? 'Aired in' : 'Release year'}
            value={params.get('year') || ''}
            onChange={(e) => change('year', e.target.value)}
          >
            <option value=''>Any year</option>
            {Array.from(
              { length: new Date().getFullYear() - 1899 },
              (_, i) => new Date().getFullYear() - i,
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Minimum rating
          <Select
            aria-label='Minimum rating'
            value={params.get('rating') || ''}
            onChange={(e) => change('rating', e.target.value)}
          >
            <option value=''>Any rating</option>
            {[6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>
                {n}+ / 10
              </option>
            ))}
          </Select>
        </label>
        <label>
          Sort by
          <Select
            aria-label='Sort by'
            value={params.get('sort') || 'popularity.desc'}
            onChange={(e) => change('sort', e.target.value)}
          >
            <option value='popularity.desc'>Popular now</option>
            <option value='vote_average.desc'>Highest rated</option>
            <option
              value={
                type === 'movie'
                  ? 'primary_release_date.desc'
                  : 'first_air_date.desc'
              }
            >
              Newest releases
            </option>
          </Select>
        </label>
        <button className='cl-quiet' onClick={() => setParams({})}>
          Reset
        </button>
      </div>
      <div className='cl-results-label'>
        <span>
          {error
            ? 'Results unavailable'
            : loading
              ? 'Loading titles...'
              : `${data.total_results?.toLocaleString() || 0} ${data.total_results === 1 ? 'title' : 'titles'} to explore`}
        </span>
        <span>
          {type === 'tv'
            ? 'Includes returning seasons · Original language'
            : 'Original releases · Original language'}
        </span>
      </div>
      {error ? (
        <div className='cl-empty' role='alert'>
          <h2>We couldn’t load these titles.</h2>
          <p>{error}</p>
          <button className='cl-button' onClick={() => setRetry((x) => x + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <div className='cl-grid'>
          {loading
            ? Array.from({ length: 12 }, (_, i) => (
                <div key={i} className='cl-skeleton' />
              ))
            : data.results.map((f) => (
                <MovieCard key={f.id} item={f} mediaType={type} />
              ))}
        </div>
      )}
      {!loading && !error && !data.results.length && (
        <div className='cl-empty'>
          <h2>No titles match these filters.</h2>
          <p>Try another language, year or rating to discover more.</p>
          <button className='cl-button' onClick={() => setParams({})}>
            Clear filters
          </button>
        </div>
      )}
      {!error && data.total_pages > 1 && (
        <div className='cl-pagination'>
          <button
            disabled={page <= 1 || loading}
            onClick={() => {
              const p = new URLSearchParams(params);
              p.set('page', page - 1);
              setParams(p);
              window.scrollTo(0, 0);
            }}
          >
            ← Previous
          </button>
          <span>
            Page {page} of {Math.min(data.total_pages, 500)}
          </span>
          <button
            disabled={page >= Math.min(data.total_pages, 500) || loading}
            onClick={() => {
              const p = new URLSearchParams(params);
              p.set('page', page + 1);
              setParams(p);
              window.scrollTo(0, 0);
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
