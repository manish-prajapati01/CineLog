import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../services/api';
export default function Collections() {
  const user = useSelector((s) => s.users.user);
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [name, setName] = useState(''),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setData(null);
    setError('');
    if (user?.id)
      api
        .get('/personal')
        .then((r) => {
          if (live) setData(r.data);
        })
        .catch((e) => {
          if (live) setError(e.message);
        });
    return () => {
      live = false;
    };
  }, [user?.id, retry]);
  async function action(method, path, body) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await api[method](path, body);
      setData(r.data);
      setMessage('Collection updated.');
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function create(e) {
    e.preventDefault();
    if (await action('post', '/personal/collections', { name })) setName('');
  }
  async function share(c) {
    try {
      await navigator.clipboard.writeText(
        `${location.origin}/collections/${user.id}/${c._id}`,
      );
      setMessage('Public collection link copied.');
    } catch {
      setMessage('Open the public collection and copy its address to share.');
    }
  }
  return (
    <div className='cl-page cl-top-space'>
      <p className='cl-eyebrow'>YOUR OWN SELECTION</p>
      <h1>Collections</h1>
      <p className='cl-muted'>
        Build a list around a mood, a filmmaker or a favourite evening. Every
        new collection starts private.
      </p>
      {!user ? (
        <Link
          className='cl-button'
          to={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
        >
          Sign in to make a collection
        </Link>
      ) : (
        <>
          <form className='cl-feature-toolbar' onSubmit={create}>
            <label>
              Collection name
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className='cl-button' disabled={busy || !data}>
              Create collection
            </button>
          </form>
          {error && (
            <p role='alert'>
              {error}{' '}
              <button onClick={() => setRetry((n) => n + 1)}>Reload</button>
            </p>
          )}
          {message && (
            <p className='cl-success' role='status'>
              {message}
            </p>
          )}
          {!data && !error && <p role='status'>Loading collections…</p>}
          {data?.collections.length === 0 && (
            <div className='cl-empty'>
              <h2>Your first collection starts here.</h2>
              <p>
                Create a collection, then use “Add to a collection” on any film
                or series.
              </p>
              <Link to='/movies'>Browse movies ↗</Link>
            </div>
          )}
          <div className='cl-collection-grid'>
            {data?.collections.map((c) => (
              <section className='cl-panel' key={c._id}>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    await action('patch', `/personal/collections/${c._id}`, {
                      name: form.get('name'),
                      description: form.get('description'),
                    });
                  }}
                >
                  <label>
                    Name
                    <input
                      name='name'
                      required
                      maxLength={80}
                      defaultValue={c.name}
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      name='description'
                      maxLength={500}
                      defaultValue={c.description}
                    />
                  </label>
                  <button disabled={busy} className='cl-quiet'>
                    Save details
                  </button>
                </form>
                <label className='cl-checkbox'>
                  <input
                    type='checkbox'
                    checked={c.visibility === 'public'}
                    disabled={busy}
                    onChange={(e) =>
                      action('patch', `/personal/collections/${c._id}`, {
                        visibility: e.target.checked ? 'public' : 'private',
                      })
                    }
                  />
                  Public collection — anyone with the link can view these titles
                </label>
                {c.visibility === 'public' && (
                  <div className='cl-actions'>
                    <button onClick={() => share(c)}>Copy link</button>
                    <Link to={`/collections/${user.id}/${c._id}`}>
                      View public collection ↗
                    </Link>
                  </div>
                )}
                <p className='cl-muted'>
                  {c.items.length} / 100 titles · Add titles from their detail
                  pages.
                </p>
                {c.items.map((i) => (
                  <div
                    className='cl-activity'
                    key={`${i.mediaType}-${i.tmdbId}`}
                  >
                    <Link to={`/${i.mediaType}/${i.tmdbId}`}>{i.title}</Link>
                    <button
                      disabled={busy}
                      aria-label={`Remove ${i.title} from ${c.name}`}
                      onClick={() =>
                        action(
                          'delete',
                          `/personal/collections/${c._id}/items/${i.mediaType}/${i.tmdbId}`,
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className='cl-quiet'
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete “${c.name}”? Its public link will stop working.`,
                      )
                    )
                      action('delete', `/personal/collections/${c._id}`);
                  }}
                >
                  Delete collection
                </button>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
