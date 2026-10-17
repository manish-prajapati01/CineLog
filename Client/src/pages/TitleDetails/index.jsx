import Select from '../../components/Select';
import { setMeta } from '../../helpers/pageMeta';
import Backdrop from '../../components/Backdrop';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { setLibrary } from '../../redux/librarySlice';
import MovieCard from '../../components/MovieCard/MovieCard';
import ReviewSection from '../../components/ReviewSection/ReviewSection';
import VideoModal from '../../components/VideoModal/VideoModal';
export default function TitleDetails({ type = 'movie' }) {
  const { id } = useParams();
  const navigate = useNavigate(),
    dispatch = useDispatch();
  const user = useSelector((s) => s.users.user),
    library = useSelector((s) => s.library.items);
  const [seasonLoading, setSeasonLoading] = useState(false),
    [seasonError, setSeasonError] = useState(''),
    [seasonRetry, setSeasonRetry] = useState(0);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const [reviews, setReviews] = useState([]),
    [reviewPage, setReviewPage] = useState(1),
    [reviewPages, setReviewPages] = useState(1),
    [reviewError, setReviewError] = useState('');
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [providers, setProviders] = useState({}),
    [providerError, setProviderError] = useState(''),
    [country, setCountry] = useState('IN');
  const [score, setScore] = useState(0),
    [trailer, setTrailer] = useState(null),
    [season, setSeason] = useState(''),
    [episodes, setEpisodes] = useState([]);
  useEffect(() => {
    if (title)
      setMeta(
        title.title || title.name,
        (
          title.overview ||
          'Explore cast, trailers and streaming availability on CineLog.'
        ).slice(0, 160),
      );
  }, [title]);
  const saved = library.some(
    (i) => i.tmdbId === Number(id) && i.mediaType === type,
  );
  useEffect(() => {
    let live = true;
    setLoading(true);
    setTitle(null);
    setMessage('');
    setTrailer(null);
    setError('');
    setScore(0);
    setReviewPage(1);
    setSeason('');
    setEpisodes([]);
    setProviders({});
    setProviderError('');
    api
      .get(`/${type === 'movie' ? 'movies' : 'tv'}/${id}`)
      .then((r) => {
        if (live) setTitle(r.data);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    api
      .get(`/discover/${type}/${id}/providers`)
      .then((r) => {
        if (live) setProviders(r.data);
      })
      .catch(() => {
        if (live)
          setProviderError(
            'Streaming availability is temporarily unavailable.',
          );
      });
    window.scrollTo(0, 0);
    return () => {
      live = false;
    };
  }, [id, type, retry]);
  useEffect(() => {
    let live = true;
    setReviewError('');
    api
      .get(`/reviews/${id}/${type}?page=${reviewPage}`)
      .then((r) => {
        if (live) {
          setReviews(r.data);
          setReviewPages(r.pagination.pages);
        }
      })
      .catch((e) => {
        if (live) setReviewError(e.message);
      });
    return () => {
      live = false;
    };
  }, [id, type, reviewPage, retry, reviewRefresh]);
  useEffect(() => {
    let live = true;
    setScore(0);
    if (user)
      api
        .get(`/ratings/user/${id}/${type}`)
        .then((r) => {
          if (live) setScore(r.data?.score || 0);
        })
        .catch(() => {});
    return () => {
      live = false;
    };
  }, [id, type, user]);
  useEffect(() => {
    let live = true;
    setEpisodes([]);
    setSeasonError('');
    setSeasonLoading(Boolean(season));
    if (season)
      api
        .get(`/tv/${id}/season/${season}`)
        .then((r) => {
          if (live) setEpisodes(r.data?.episodes || []);
        })
        .catch(() => {
          if (live)
            setSeasonError('Episodes could not be loaded. Please try again.');
        })
        .finally(() => {
          if (live) setSeasonLoading(false);
        });
    return () => {
      live = false;
    };
  }, [id, season, seasonRetry]);
  async function save() {
    if (!user) return navigate('/login');
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const r = saved
        ? await api.delete(`/watchlist/${id}/${type}`)
        : await api.post('/watchlist', {
            tmdbId: Number(id),
            mediaType: type,
            title: title.title || title.name,
            posterPath: title.poster_path,
          });
      dispatch(setLibrary(r.data));
      setMessage(
        saved ? 'Removed from your library.' : 'Saved to your library.',
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function rate(value) {
    if (!user) return navigate('/login');
    setBusy(true);
    setMessage('');
    setError('');
    try {
      if (Number(value) === 0) await api.delete(`/ratings/${id}/${type}`);
      else
        await api.post('/ratings', {
          tmdbId: Number(id),
          mediaType: type,
          title: title.title || title.name,
          posterPath: title.poster_path,
          score: Number(value),
        });
      setScore(Number(value));
      setMessage(
        Number(value)
          ? 'Your rating has been saved.'
          : 'Your rating has been removed.',
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className='cl-page cl-top-space'>
        <div className='cl-detail-skeleton cl-skeleton' />
        <p>Loading title...</p>
      </div>
    );
  if (!title)
    return (
      <div className='cl-page cl-empty' role='alert'>
        <h1>Couldn’t find this story.</h1>
        <p>{error}</p>
        <button className='cl-button' onClick={() => setRetry((x) => x + 1)}>
          Try again
        </button>
      </div>
    );
  const name = title.title || title.name,
    credits = title.credits?.cast || [],
    videos = title.videos?.results || [],
    video = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const available = providers[country],
    subscriptions = available?.flatrate || [],
    rental = available?.rent || [],
    purchase = available?.buy || [];
  return (
    <div>
      <section className='cl-detail-backdrop'>
        <Backdrop path={title.backdrop_path} detail />
      </section>
      <div className='cl-page cl-detail-content'>
        <Link
          className='cl-text-link'
          to={type === 'movie' ? '/movies' : '/tv'}
        >
          ← Back to discovery
        </Link>
        <div className='cl-title-layout'>
          <div className='cl-detail-poster'>
            {title.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w342${title.poster_path}`}
                alt={`${name} poster`}
              />
            )}
          </div>
          <div>
            <p className='cl-eyebrow'>
              {type === 'movie' ? 'THE FILM' : 'THE SERIES'} /{' '}
              {(title.release_date || title.first_air_date || '').slice(0, 4)}
            </p>
            <h1>{name}</h1>
            {title.tagline && <p className='cl-tagline'>{title.tagline}</p>}
            <div className='cl-title-meta'>
              <span className='cl-score'>
                ★ {Number(title.vote_average).toFixed(1)} <small>TMDB</small>
              </span>
              {title.runtime > 0 && <span>{title.runtime} min</span>}
              {title.number_of_seasons && (
                <span>{title.number_of_seasons} seasons</span>
              )}
              <span>{title.certification_code || title.status}</span>
            </div>
            <div className='cl-tags'>
              {title.genres?.map((g) => (
                <Link
                  key={g.id}
                  to={`/${type === 'movie' ? 'movies' : 'tv'}?genre=${g.id}`}
                >
                  {g.name}
                </Link>
              ))}
            </div>
            <p className='cl-overview'>
              {title.overview || 'A synopsis is not available yet.'}
            </p>
            <div className='cl-actions'>
              <button disabled={busy} className='cl-button' onClick={save}>
                {saved ? '✓ In your library' : '+ Add to library'}
              </button>
              {video && (
                <button
                  className='cl-button secondary'
                  onClick={() => setTrailer(video.key)}
                >
                  ▷ Watch trailer
                </button>
              )}
              <label className='cl-rate-label'>
                Your rating
                <Select
                  disabled={busy}
                  value={score}
                  onChange={(e) => rate(e.target.value)}
                  aria-label='Your rating'
                >
                  <option value='0'>Not rated</option>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} / 10
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            {message && (
              <p className='cl-success' role='status'>
                {message}
              </p>
            )}
            {error && (
              <p className='cl-notice' role='alert'>
                {error}
              </p>
            )}
          </div>
        </div>
        <section className='cl-provider-panel'>
          <div>
            <p className='cl-eyebrow'>STREAMING AVAILABILITY</p>
            <h2>Where to watch</h2>
            <small>
              Availability by JustWatch via TMDB. Offers may change.
            </small>
          </div>
          <label>
            Region
            <Select
              aria-label='Region'
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {[
                ['IN', 'India'],
                ['US', 'United States'],
                ['GB', 'United Kingdom'],
                ['CA', 'Canada'],
                ['AU', 'Australia'],
              ].map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <div className='cl-provider-options'>
            {providerError ? (
              <p role='status'>{providerError}</p>
            ) : !available ||
              ![...subscriptions, ...rental, ...purchase].length ? (
              <p>No streaming offers listed for this region.</p>
            ) : (
              [
                ['Stream', subscriptions],
                ['Rent', rental],
                ['Buy', purchase],
              ].map(
                ([label, services]) =>
                  services.length > 0 && (
                    <div key={label}>
                      <strong>{label}</strong>
                      <div className='cl-providers'>
                        {services.map((p) => (
                          <div
                            className='cl-provider-service'
                            key={p.provider_id}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                              alt=''
                              loading='lazy'
                            />
                            <span>{p.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
              )
            )}
          </div>
        </section>
        {credits.length > 0 && (
          <section className='cl-section'>
            <div className='cl-section-heading'>
              <div>
                <p className='cl-eyebrow'>THE PEOPLE BEHIND THE STORY</p>
                <h2>Cast & characters</h2>
              </div>
            </div>
            <div className='cl-cast-row'>
              {credits.slice(0, 12).map((p) => (
                <Link to={`/person/${p.id}`} key={p.id}>
                  {p.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${p.profile_path}`}
                      alt=''
                      loading='lazy'
                    />
                  ) : (
                    <div className='cl-cast-placeholder'>{p.name[0]}</div>
                  )}
                  <strong>{p.name}</strong>
                  <small>{p.character}</small>
                </Link>
              ))}
            </div>
          </section>
        )}
        {type === 'tv' && (
          <section className='cl-section'>
            <div className='cl-section-heading'>
              <h2>Seasons & episodes</h2>
              <Select
                aria-label='Choose season'
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              >
                <option value=''>Choose a season</option>
                {title.seasons
                  ?.filter((s) => s.season_number > 0)
                  .map((s) => (
                    <option key={s.id} value={s.season_number}>
                      {s.name}
                    </option>
                  ))}
              </Select>
            </div>
            {seasonLoading && <p role='status'>Loading episodes...</p>}
            {seasonError && (
              <p className='cl-notice' role='alert'>
                {seasonError}{' '}
                <button onClick={() => setSeasonRetry((n) => n + 1)}>
                  Retry episodes
                </button>
              </p>
            )}
            {season && !seasonLoading && !seasonError && !episodes.length && (
              <p>No episodes are listed for this season yet.</p>
            )}
            <div className='cl-episodes'>
              {episodes.map((e) => (
                <article key={e.id}>
                  <span>{String(e.episode_number).padStart(2, '0')}</span>
                  <div>
                    <h3>{e.name}</h3>
                    <p>{e.overview || 'Episode synopsis unavailable.'}</p>
                  </div>
                  <small>{e.runtime ? `${e.runtime} min` : e.air_date}</small>
                </article>
              ))}
            </div>
          </section>
        )}
        <ReviewSection
          tmdbId={Number(id)}
          mediaType={type}
          reviews={reviews}
          user={user}
          movieTitle={name}
          posterPath={title.poster_path}
          onReviewSubmitted={() => setReviewRefresh((x) => x + 1)}
        />
        {reviewError && (
          <p className='cl-notice' role='alert'>
            {reviewError}
          </p>
        )}
        {reviewPages > 1 && (
          <div className='cl-pagination'>
            <button
              disabled={reviewPage === 1}
              onClick={() => setReviewPage((p) => p - 1)}
            >
              Previous reviews
            </button>
            <span>
              {reviewPage} / {reviewPages}
            </span>
            <button
              disabled={reviewPage >= reviewPages}
              onClick={() => setReviewPage((p) => p + 1)}
            >
              Next reviews
            </button>
          </div>
        )}
        {title.recommendations?.results?.length > 0 && (
          <section className='cl-section'>
            <div className='cl-section-heading'>
              <div>
                <p className='cl-eyebrow'>STAY IN THIS WORLD A LITTLE LONGER</p>
                <h2>You might also like</h2>
              </div>
            </div>
            <div className='cl-film-row'>
              {title.recommendations.results.slice(0, 8).map((f) => (
                <MovieCard key={f.id} item={f} mediaType={type} />
              ))}
            </div>
          </section>
        )}
      </div>
      {trailer && (
        <VideoModal
          videoKey={trailer}
          title={`${name} - Trailer`}
          onClose={() => setTrailer(null)}
        />
      )}
    </div>
  );
}
