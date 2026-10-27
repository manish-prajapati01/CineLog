import { languageName } from '../../helpers/languages';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import api from '../../services/api';
import { setLibrary } from '../../redux/librarySlice';
export default function MovieCard({
  movie,
  item,
  mediaType: suppliedType,
  showRating = true,
}) {
  const data = movie || item;
  const user = useSelector((s) => s.users.user);
  const items = useSelector((s) => s.library.items);
  const dispatch = useDispatch(),
    navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [imageFailed, setImageFailed] = useState(false);
  if (!data) return null;
  const type = suppliedType || data.media_type || (data.name ? 'tv' : 'movie');
  const title = data.title || data.name;
  const poster = data.poster_path || data.posterPath || data.profile_path;
  const saved = items.some((i) => i.tmdbId === data.id && i.mediaType === type);
  const rating = Number(data.vote_average || data.voteAverage || 0);
  async function toggle() {
    if (!user)
      return navigate(
        `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = saved
        ? await api.delete(`/watchlist/${data.id}/${type}`)
        : await api.post('/watchlist', {
            tmdbId: data.id,
            mediaType: type,
            title,
            posterPath: poster,
            originalLanguage: data.original_language,
          });
      dispatch(setLibrary(result.data));
      setMessage(saved ? 'Removed from library' : 'Saved to library');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className='cl-card'>
      <div className='cl-poster'>
        <Link to={`/${type}/${data.id}`} tabIndex={-1} aria-hidden='true'>
          {poster && !imageFailed ? (
            <img
              src={
                poster.startsWith('http')
                  ? poster
                  : `https://image.tmdb.org/t/p/${type === 'person' ? 'w185' : 'w342'}${poster}`
              }
              alt=''
              loading='lazy'
              decoding='async'
              width='342'
              height='513'
              srcSet={
                type !== 'person' && !poster.startsWith('http')
                  ? `https://image.tmdb.org/t/p/w185${poster} 185w, https://image.tmdb.org/t/p/w342${poster} 342w`
                  : undefined
              }
              sizes='(max-width: 600px) 45vw, (max-width: 1100px) 25vw, 210px'
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className='cl-no-poster'>{title}</span>
          )}
        </Link>
        {type !== 'person' && (
          <button
            disabled={busy}
            className={`cl-save ${saved ? 'saved' : ''}`}
            onClick={toggle}
            aria-label={`${saved ? 'Remove' : 'Save'} ${title}`}
            aria-pressed={saved}
          >
            {busy ? '...' : saved ? '✓' : '+'}
          </button>
        )}
      </div>
      <div className='cl-card-meta'>
        <span>
          {(data.release_date || data.first_air_date || '').slice(0, 4) ||
            (type === 'person' ? 'Talent' : type === 'tv' ? 'Series' : 'Film')}
        </span>
        {showRating && type !== 'person' && rating > 0 && (
          <span className='cl-score'>★ {rating.toFixed(1)}</span>
        )}
      </div>
      <Link className='cl-card-title' to={`/${type}/${data.id}`}>
        {title}
      </Link>
      {type !== 'person' && (
        <p className='cl-card-language'>
          {languageName(data.original_language || data.originalLanguage)}
        </p>
      )}
      <span className='cl-sr-only' role='status'>
        {message}
      </span>
      {error && (
        <p role='alert' className='cl-error'>
          {error}
        </p>
      )}
    </article>
  );
}
