import { setMeta } from '../../helpers/pageMeta';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import MovieCard from '../../components/MovieCard/MovieCard';
export default function PublicPage({ collection = false }) {
  const { owner, id } = useParams();
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setData(null);
    setError('');
    api
      .get(
        collection
          ? `/personal/shared/${owner}/${id}`
          : `/personal/people/${id}`,
      )
      .then((r) => {
        if (live) setData(r.data);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [owner, id, collection, retry]);
  useEffect(() => {
    if (data)
      setMeta(
        data.name,
        collection
          ? data.description || 'A shared CineLog collection.'
          : data.bio || 'A CineLog public profile.',
      );
  }, [data, collection]);
  return (
    <div className='cl-page cl-top-space'>
      {error ? (
        <div className='cl-empty'>
          <h1>Not available</h1>
          <p>{error}</p>
          <button onClick={() => setRetry((n) => n + 1)}>Try again</button>
          <Link to='/'>Back to discovery</Link>
        </div>
      ) : !data ? (
        <p role='status'>Loading…</p>
      ) : (
        <>
          <p className='cl-eyebrow'>
            {collection ? 'SHARED COLLECTION' : 'PUBLIC PROFILE'}
          </p>
          <h1>{data.name}</h1>
          <p className='cl-muted'>{collection ? data.description : data.bio}</p>
          {collection ? (
            <div className='cl-grid'>
              {data.items.map((i) => (
                <MovieCard
                  key={`${i.mediaType}-${i.tmdbId}`}
                  item={{ ...i, id: i.tmdbId, poster_path: i.posterPath }}
                  mediaType={i.mediaType}
                />
              ))}
            </div>
          ) : (
            <>
              {data.collections.length > 0 && (
                <section className='cl-section'>
                  <h2>Collections</h2>
                  <div className='cl-region-grid'>
                    {data.collections.map((c) => (
                      <Link
                        className='cl-panel'
                        key={c.id}
                        to={`/collections/${id}/${c.id}`}
                      >
                        <h3>{c.name}</h3>
                        <p>{c.description}</p>
                        <span>{c.items.length} titles ↗</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {data.ratings.length > 0 && (
                <section className='cl-section'>
                  <h2>Recent ratings</h2>
                  {data.ratings.map((r) => (
                    <Link
                      className='cl-activity'
                      key={r._id}
                      to={`/${r.mediaType}/${r.tmdbId}`}
                    >
                      {r.title || 'View title'}{' '}
                      <span className='cl-score'>★ {r.score}/10</span>
                    </Link>
                  ))}
                </section>
              )}
              {data.reviews.length > 0 && (
                <section className='cl-section'>
                  <h2>Published reviews</h2>
                  {data.reviews.map((r) => (
                    <article className='cl-panel' key={r._id}>
                      <Link to={`/${r.mediaType}/${r.tmdbId}`}>
                        {r.movieTitle || 'View title'} ↗
                      </Link>
                      <h3>{r.title}</h3>
                      {r.containsSpoilers ? (
                        <details>
                          <summary>Contains spoilers · Reveal review</summary>
                          <p>{r.content}</p>
                        </details>
                      ) : (
                        <p>{r.content}</p>
                      )}
                    </article>
                  ))}
                </section>
              )}
              {!data.collections.length &&
                !data.ratings.length &&
                !data.reviews.length && (
                  <p className='cl-empty'>
                    This member hasn’t shared any activity here.
                  </p>
                )}
            </>
          )}
        </>
      )}
    </div>
  );
}
