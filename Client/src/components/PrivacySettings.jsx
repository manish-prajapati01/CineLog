import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
export default function PrivacySettings({ userId }) {
  const [settings, setSettings] = useState(null),
    [published, setPublished] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setSettings(null);
    setError('');
    api
      .get('/personal')
      .then((r) => {
        if (live) {
          setSettings(r.data);
          setPublished(r.data.profilePublic);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [userId, retry]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await api.patch('/personal/privacy', {
        profilePublic: settings.profilePublic,
        showRatings: settings.showRatings,
        showReviews: settings.showReviews,
        bio: settings.bio,
      });
      setSettings(r.data);
      setPublished(r.data.profilePublic);
      setMessage('Privacy settings saved.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className='cl-panel cl-privacy'>
      <summary>Privacy & public profile</summary>
      <p className='cl-eyebrow'>YOU CHOOSE WHAT TO SHARE</p>
      <h2>Public profile</h2>
      <p>
        Your email, episode progress and library notes stay private. Ratings and
        published reviews remain visible to everyone on title pages, even with a
        private profile. These switches only control summaries on your public
        profile.
      </p>
      {error && (
        <p role='alert'>
          {error}{' '}
          <button onClick={() => setRetry((n) => n + 1)}>
            Reload settings
          </button>
        </p>
      )}
      {message && (
        <p role='status' className='cl-success'>
          {message}
        </p>
      )}
      {!settings && !error && <p>Loading privacy settings…</p>}
      {settings && (
        <form onSubmit={save}>
          <label className='cl-checkbox'>
            <input
              type='checkbox'
              checked={settings.profilePublic}
              onChange={(e) =>
                setSettings({ ...settings, profilePublic: e.target.checked })
              }
            />
            Make my profile public
          </label>
          <label>
            Bio
            <textarea
              maxLength={300}
              value={settings.bio}
              onChange={(e) =>
                setSettings({ ...settings, bio: e.target.value })
              }
            />
          </label>
          {[
            ['showRatings', 'Show my recent ratings'],
            ['showReviews', 'Show my published reviews'],
          ].map(([key, label]) => (
            <label key={key} className='cl-checkbox'>
              <input
                type='checkbox'
                disabled={!settings.profilePublic}
                checked={settings[key]}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: e.target.checked })
                }
              />
              {label}
            </label>
          ))}
          <p>
            Only collections you explicitly publish appear on a public profile.
            Collection links can be shared even when your profile is private.
          </p>
          <button className='cl-button' disabled={busy}>
            {busy ? 'Saving…' : 'Save privacy settings'}
          </button>
          {published ? (
            <Link to={`/people/${userId}`}>View public profile ↗</Link>
          ) : (
            <p className='cl-muted'>Your profile is private.</p>
          )}
        </form>
      )}
    </details>
  );
}
