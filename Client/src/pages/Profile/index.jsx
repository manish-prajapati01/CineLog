import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { setUser } from '../../redux/usersSlice';
import api from '../../services/api';
export default function Profile() {
  const user = useSelector((s) => s.users.user),
    items = useSelector((s) => s.library.items),
    dispatch = useDispatch();
  const [ratings, setRatings] = useState([]),
    [reviews, setReviews] = useState([]),
    [name, setName] = useState(user?.name || ''),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.allSettled([
      api.get('/ratings/user/me'),
      api.get('/reviews/user/my-reviews'),
    ]).then(([r, v]) => {
      if (!live) return;
      if (r.status === 'fulfilled') setRatings(r.value.data);
      if (v.status === 'fulfilled') setReviews(v.value.data);
      if (r.status === 'rejected' || v.status === 'rejected')
        setError(
          'Some activity could not be loaded. Please refresh to try again.',
        );
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [user]);
  useEffect(() => setName(user?.name || ''), [user?.name]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await api.put('/auth/profile', { name: name.trim() });
      dispatch(setUser({ ...user, ...r.data }));
      setMessage('Your profile has been updated.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!user)
    return (
      <div className='cl-page cl-empty'>
        <h1>Your profile</h1>
        <p>Sign in to see your film journey.</p>
        <Link to='/login' className='cl-button'>
          Sign in ↗
        </Link>
      </div>
    );
  const watched = items.filter((i) => i.status === 'watched'),
    average = ratings.length
      ? (ratings.reduce((n, r) => n + r.score, 0) / ratings.length).toFixed(1)
      : '—';
  return (
    <div className='cl-page cl-top-space cl-profile-page'>
      <div className='cl-profile-header'>
        <span className='cl-avatar' aria-hidden='true'>
          {user.name
            ?.trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()}
        </span>
        <div>
          <p className='cl-eyebrow'>YOUR CINELOG</p>
          <h1>{user.name}</h1>
          <p className='cl-muted'>
            {user.createdAt
              ? `Member since ${new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
              : 'Your personal corner of cinema'}
          </p>
        </div>
        <Link
          className='cl-button secondary cl-profile-library-link'
          to='/watchlist'
        >
          Open my library <span aria-hidden='true'>↗</span>
        </Link>
      </div>
      <div className='cl-library-stats'>
        <div className='cl-stat'>
          <strong>{watched.length}</strong>
          <span>Titles watched</span>
        </div>
        <div className='cl-stat'>
          <strong>{loading ? '—' : ratings.length}</strong>
          <span>Ratings · latest 100</span>
        </div>
        <div className='cl-stat'>
          <strong>{loading ? '—' : average}</strong>
          <span>Average score / 10</span>
        </div>
        <div className='cl-stat'>
          <strong>{items.filter((i) => i.status === 'planned').length}</strong>
          <span>On your watchlist</span>
        </div>
      </div>
      {error && (
        <p className='cl-notice' role='alert'>
          {error}
        </p>
      )}
      {message && (
        <p className='cl-notice' role='status'>
          {message}
        </p>
      )}
      <div className='cl-profile-grid'>
        <section className='cl-panel'>
          <h2>Recently rated</h2>
          {loading ? (
            <p>Loading your activity...</p>
          ) : !ratings.length ? (
            <p className='cl-muted'>You have not rated a title yet.</p>
          ) : (
            ratings.slice(0, 8).map((r) => (
              <Link
                className='cl-activity'
                key={r._id}
                to={`/${r.mediaType}/${r.tmdbId}`}
              >
                {r.posterPath && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${r.posterPath}`}
                    alt=''
                  />
                )}
                <div>
                  <h3>{r.title || 'View title'}</h3>
                  <p>
                    {new Date(r.updatedAt || r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className='cl-score' style={{ marginLeft: 'auto' }}>
                  ★ {r.score}
                </span>
              </Link>
            ))
          )}
        </section>
        <section className='cl-panel cl-profile-settings'>
          <p className='cl-eyebrow'>ACCOUNT</p>
          <h2>Profile details</h2>
          <form onSubmit={save}>
            <label>
              Display name
              <input
                required
                minLength={2}
                maxLength={50}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                value={user.email || ''}
                readOnly
                aria-describedby='profile-email-help'
              />
            </label>
            <p id='profile-email-help' className='cl-muted'>
              Your email is private and cannot be changed here.
            </p>
            <button
              className='cl-button'
              disabled={
                busy || name.trim() === user.name || name.trim().length < 2
              }
            >
              {busy ? 'Saving...' : 'Save profile'}
            </button>
          </form>
          <Link
            className='cl-text-link'
            style={{ marginTop: 25 }}
            to='/watchlist'
          >
            Open your library & journal ↗
          </Link>
        </section>
        <section className='cl-panel'>
          <h2>Your recent reviews</h2>
          {loading ? (
            <p className='cl-muted'>Loading your reviews…</p>
          ) : !reviews.length ? (
            <p className='cl-muted'>Your published reviews will appear here.</p>
          ) : (
            reviews.slice(0, 6).map((r) => (
              <Link
                className='cl-activity'
                key={r._id}
                to={`/${r.mediaType}/${r.tmdbId}`}
              >
                <div>
                  <h3>{r.movieTitle || r.title}</h3>
                  <p>
                    {r.content.slice(0, 140)}
                    {r.content.length > 140 ? '...' : ''}
                  </p>
                </div>
              </Link>
            ))
          )}
        </section>
        <section className='cl-panel'>
          <h2>From your diary</h2>
          {!watched.length ? (
            <p className='cl-muted'>
              Mark a title as watched in your library to start your diary.
            </p>
          ) : (
            watched
              .slice()
              .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
              .slice(0, 6)
              .map((i) => (
                <Link
                  className='cl-activity'
                  key={`${i.mediaType}-${i.tmdbId}`}
                  to={`/${i.mediaType}/${i.tmdbId}`}
                >
                  <div>
                    <h3>{i.title}</h3>
                    <p>
                      {i.watchedAt
                        ? new Date(i.watchedAt).toLocaleDateString()
                        : 'Watched'}
                      {i.collectionName && ` · ${i.collectionName}`}
                    </p>
                  </div>
                </Link>
              ))
          )}
        </section>
      </div>
    </div>
  );
}
