import { languageName } from '../../helpers/languages';
import Select from '../../components/Select';
import useDialog from '../../hooks/useDialog';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { setLibrary } from '../../redux/librarySlice';
import api from '../../services/api';
export default function Library() {
  const user = useSelector((s) => s.users.user),
    items = useSelector((s) => s.library.items);
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('all'),
    [query, setQuery] = useState(''),
    [collection, setCollection] = useState(''),
    [sort, setSort] = useState('recent');
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [editing, setEditing] = useState(null);
  const dialogRef = useDialog(Boolean(editing), () => setEditing(null));
  useEffect(() => {
    let live = true;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get('/watchlist')
      .then((r) => {
        if (live) dispatch(setLibrary(r.data));
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [user, dispatch]);
  const collections = [
    ...new Set(items.map((i) => i.collectionName).filter(Boolean)),
  ];
  const shown = useMemo(
    () =>
      items
        .filter(
          (i) =>
            (status === 'all' || (i.status || 'planned') === status) &&
            (!collection || i.collectionName === collection) &&
            i.title.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === 'title'
            ? a.title.localeCompare(b.title)
            : new Date(b.addedAt) - new Date(a.addedAt),
        ),
    [items, status, collection, query, sort],
  );
  async function update(item, changes) {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const r = await api.patch(
        `/watchlist/${item.tmdbId}/${item.mediaType}`,
        changes,
      );
      dispatch(setLibrary(r.data));
      setMessage('Your library has been updated.');
      setEditing(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(item) {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const r = await api.delete(`/watchlist/${item.tmdbId}/${item.mediaType}`);
      dispatch(setLibrary(r.data));
      setMessage('Your library has been updated.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function exportLibrary() {
    const blob = new Blob(
      [
        JSON.stringify(
          { exportedAt: new Date().toISOString(), items },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cinelog-library.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (!user)
    return (
      <div className='cl-page cl-empty'>
        <p className='cl-eyebrow'>YOUR LIBRARY</p>
        <h1>
          A home for every
          <br />
          film you love.
        </h1>
        <p>
          Save your next watch, keep a viewing journal, and make collections
          your own.
        </p>
        <Link className='cl-button' to='/login'>
          Sign in to start ↗
        </Link>
      </div>
    );
  return (
    <div className='cl-page cl-top-space'>
      <nav className='cl-feature-links' aria-label='Library tools'>
        <Link to='/tracking'>Series progress ↗</Link>
        <Link to='/calendar'>Release calendar ↗</Link>
        <Link to='/collections'>Shareable collections ↗</Link>
      </nav>
      <p className='cl-eyebrow'>YOUR COLLECTION</p>
      <div className='cl-page-heading'>
        <div>
          <h1>
            My library<span className='cl-accent'>.</span>
          </h1>
          <p>Your watchlist, viewing history and personal notes.</p>
        </div>
        <button
          className='cl-button secondary'
          onClick={exportLibrary}
          disabled={!items.length}
        >
          Export library ↓
        </button>
      </div>
      <div className='cl-library-stats'>
        {[
          ['planned', 'Want to watch'],
          ['watching', 'Watching'],
          ['watched', 'Watched'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setStatus(key)}>
            <strong>
              {items.filter((i) => (i.status || 'planned') === key).length}
            </strong>
            <span>{label} ↗</span>
          </button>
        ))}
      </div>
      <div className='cl-library-toolbar'>
        <div className='cl-tabs'>
          {[
            ['all', 'All titles'],
            ['planned', 'Watchlist'],
            ['watching', 'Watching'],
            ['watched', 'Diary'],
          ].map(([key, label]) => (
            <button
              className={status === key ? 'active' : ''}
              key={key}
              aria-pressed={key === status}
              onClick={() => setStatus(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          aria-label='Search your library'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          aria-label='Filter collection'
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option value=''>All collections</option>
          {collections.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select
          aria-label='Sort library'
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value='recent'>Recently added</option>
          <option value='title'>Title A–Z</option>
        </Select>
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
      {loading ? (
        <div className='cl-empty'>Loading your library...</div>
      ) : shown.length === 0 ? (
        <div className='cl-empty'>
          <h2>
            {items.length
              ? 'No matching titles.'
              : 'The beginning of a great collection.'}
          </h2>
          <p>Save a film from Discover to make it part of your story.</p>
          <Link to='/movies' className='cl-button'>
            Find a film ↗
          </Link>
        </div>
      ) : (
        <div className='cl-library-grid'>
          {shown.map((item) => (
            <article
              className='cl-library-card'
              key={`${item.mediaType}-${item.tmdbId}`}
            >
              <Link to={`/${item.mediaType}/${item.tmdbId}`}>
                {item.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${item.posterPath}`}
                    alt={item.title}
                  />
                ) : (
                  <div className='cl-no-poster'>{item.title}</div>
                )}
              </Link>
              <div>
                <p className='cl-eyebrow'>
                  {item.mediaType === 'tv' ? 'SERIES' : 'FILM'}
                  {item.collectionName && ` / ${item.collectionName}`}
                </p>
                <Link to={`/${item.mediaType}/${item.tmdbId}`}>
                  <h3>{item.title}</h3>
                </Link>
                <p className='cl-card-language'>
                  {languageName(item.originalLanguage)}
                </p>
                {item.watchedAt && (
                  <p className='cl-muted'>
                    Watched {new Date(item.watchedAt).toLocaleDateString()}
                  </p>
                )}
                {item.notes && <p className='cl-library-note'>{item.notes}</p>}
                <Select
                  aria-label={`Watch status for ${item.title}`}
                  disabled={busy}
                  value={item.status || 'planned'}
                  onChange={(e) => update(item, { status: e.target.value })}
                >
                  <option value='planned'>Want to watch</option>
                  <option value='watching'>Watching</option>
                  <option value='watched'>Watched</option>
                </Select>
                <div className='cl-actions'>
                  <button
                    className='cl-text-link'
                    onClick={() => setEditing({ ...item })}
                  >
                    Edit journal
                  </button>
                  <button
                    className='cl-quiet'
                    disabled={busy}
                    onClick={() => remove(item)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <div className='cl-modal-backdrop' onClick={() => setEditing(null)}>
          <section
            className='cl-modal'
            ref={dialogRef}
            role='dialog'
            aria-modal='true'
            aria-labelledby='journal-title'
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(null);
            }}
          >
            <div className='cl-section-heading'>
              <h2 id='journal-title'>Your film journal</h2>
              <button
                aria-label='Close journal'
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </div>
            <p>{editing.title}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update(editing, {
                  collectionName: editing.collectionName || '',
                  notes: editing.notes || '',
                  ...(editing.watchedAt
                    ? { watchedAt: editing.watchedAt }
                    : {}),
                });
              }}
            >
              <label>
                Collection
                <input
                  autoFocus
                  maxLength={40}
                  list='collection-names'
                  value={editing.collectionName || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, collectionName: e.target.value })
                  }
                />
              </label>
              <datalist id='collection-names'>
                {collections.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <label>
                Watched on
                <input
                  type='date'
                  max={new Date().toISOString().slice(0, 10)}
                  value={editing.watchedAt?.slice(0, 10) || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, watchedAt: e.target.value })
                  }
                />
              </label>
              <label>
                Private notes
                <textarea
                  maxLength={1000}
                  rows={4}
                  value={editing.notes || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                />
              </label>
              {error && <p role='alert'>{error}</p>}
              <button className='cl-button' disabled={busy}>
                {busy ? 'Saving...' : 'Save journal'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
