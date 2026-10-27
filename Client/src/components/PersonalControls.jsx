import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Select from './Select';
export function CollectionPicker({ id, type }) {
  const user = useSelector((s) => s.users.user);
  const [open, setOpen] = useState(false),
    [data, setData] = useState(null),
    [selected, setSelected] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    setData(null);
    setOpen(false);
    setMessage('');
  }, [id, type, user?.id]);
  const [newName, setNewName] = useState('');
  async function createAndAdd(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await api.post('/personal/collections', { name: newName });
      setData(r.data);
      const c = r.data.collections[r.data.collections.length - 1];
      setSelected(c._id);
      await api.put(`/personal/collections/${c._id}/items/${type}/${id}`);
      setNewName('');
      setMessage('Collection created and title added.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function load() {
    setOpen(!open);
    if (!user || open) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.get('/personal');
      setData(r.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function add() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await api.put(`/personal/collections/${selected}/items/${type}/${id}`);
      setMessage('Added to your collection.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className='cl-collection-picker'>
      <button className='cl-text-link' aria-expanded={open} onClick={load}>
        Add to a collection +
      </button>
      {open && (
        <div className='cl-inline-panel'>
          {!user ? (
            <Link
              to={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
            >
              Sign in to create and save collections
            </Link>
          ) : (
            <>
              {busy && <p role='status'>Loading…</p>}
              {data && (
                <>
                  <Select
                    aria-label='Choose collection'
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value=''>Choose collection</option>
                    {data.collections.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <button
                    className='cl-button'
                    disabled={!selected || busy}
                    onClick={add}
                  >
                    Add title
                  </button>
                  <Link to='/collections'>Manage collections ↗</Link>
                  <form className='cl-feature-toolbar' onSubmit={createAndAdd}>
                    <label>
                      Or create a private collection
                      <input
                        maxLength={80}
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </label>
                    <button className='cl-button secondary' disabled={busy}>
                      Create & add
                    </button>
                  </form>
                </>
              )}
              {error && <p role='alert'>{error}</p>}
              {message && <p role='status'>{message}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
export function EpisodeTracker({ id, season, episodes }) {
  const user = useSelector((s) => s.users.user);
  const [keys, setKeys] = useState([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setKeys([]);
    setError('');
    setLoading(true);
    if (!user?.id) {
      setLoading(false);
      return;
    }
    api
      .get('/personal')
      .then((r) => {
        if (live) setKeys(r.data.episodes || []);
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
  }, [id, user?.id, retry]);
  const aired = episodes.filter(
    (e) => e.air_date && e.air_date <= new Date().toISOString().slice(0, 10),
  );
  const key = (e) => `${id}:${season}:${e.episode_number}`;
  async function toggle(e) {
    setBusy(key(e));
    setError('');
    try {
      const r = await api.put(
        `/personal/episodes/${id}/${season}/${e.episode_number}`,
        { watched: !keys.includes(key(e)) },
      );
      setKeys(r.data.episodes);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }
  async function toggleSeason() {
    setBusy('season');
    setError('');
    try {
      const r = await api.put(`/personal/seasons/${id}/${season}`, {
        watched: !aired.every((e) => keys.includes(key(e))),
      });
      setKeys(r.data.episodes);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }
  const done = aired.filter((e) => keys.includes(key(e))).length;
  return (
    <div className='cl-tracker'>
      {user && aired.length > 0 && (
        <button
          className='cl-episode-check'
          disabled={loading || !!busy || !!error}
          onClick={toggleSeason}
        >
          {busy === 'season'
            ? 'Saving…'
            : aired.every((e) => keys.includes(key(e)))
              ? 'Unmark this season'
              : 'Mark released episodes watched'}
        </button>
      )}
      {user ? (
        <p role='status'>
          {loading
            ? 'Loading progress…'
            : `${done} of ${aired.length} released episodes watched`}
        </p>
      ) : (
        <p>
          <Link
            to={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
          >
            Sign in
          </Link>{' '}
          to keep your episode progress. Watch on your streaming service, then
          mark it here.
        </p>
      )}
      {error && (
        <p role='alert'>
          {error}{' '}
          <button onClick={() => setRetry((n) => n + 1)}>
            Reload progress
          </button>
        </p>
      )}
      <div className='cl-episodes'>
        {episodes.map((e) => (
          <article key={e.id}>
            <span>{String(e.episode_number).padStart(2, '0')}</span>
            <div>
              <h3>{e.name}</h3>
              <p>{e.overview || 'Episode synopsis unavailable.'}</p>
              <small>
                {e.air_date || 'Air date to be announced'}
                {e.runtime ? ` · ${e.runtime} min` : ''}
              </small>
            </div>
            {user && (
              <button
                className='cl-episode-check'
                disabled={loading || !!busy || !aired.includes(e) || !!error}
                aria-pressed={keys.includes(key(e))}
                onClick={() => toggle(e)}
              >
                {busy === key(e)
                  ? 'Saving…'
                  : keys.includes(key(e))
                    ? '✓ Watched'
                    : aired.includes(e)
                      ? 'Mark watched'
                      : 'Not released'}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
