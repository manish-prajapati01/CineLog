import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { languageName } from '../helpers/languages';
import api from '../services/api';
const priority = ['hi', 'en', 'ta', 'te', 'ml', 'kn', 'mr', 'bn'];
const ordered = (codes) =>
  [...codes].sort(
    (a, b) =>
      (priority.includes(a) ? priority.indexOf(a) : 99) -
      (priority.includes(b) ? priority.indexOf(b) : 99),
  );
function Languages({ codes }) {
  const all = ordered(codes);
  return (
    <>
      {all.slice(0, 6).map(languageName).join(', ') || 'None listed'}
      {all.length > 6 && (
        <details>
          <summary>{all.length - 6} more languages</summary>
          {all.slice(6).map(languageName).join(', ')}
        </details>
      )}
    </>
  );
}
export default function LanguageDetails({ title, type, country }) {
  const admin = useSelector((s) => s.users.user?.role === 'admin');
  const [entries, setEntries] = useState([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setEntries([]);
    setLoading(true);
    setError('');
    setMessage('');
    api
      .get(`/audio/${type}/${title.id}`)
      .then((r) => {
        if (live) setEntries(r.data);
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
  }, [title.id, type, retry]);
  const local = entries.filter((e) => e.region === country);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const codes = (key) =>
      String(f.get(key))
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    try {
      const r = await api.put(`/audio/${type}/${title.id}`, {
        region: country,
        provider: f.get('provider'),
        source: f.get('source'),
        audio: codes('audio'),
        subtitles: codes('subtitles'),
      });
      setEntries(r.data);
      setMessage('Verified language information saved.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className='cl-language-details'>
      <summary>
        Original language: {languageName(title.original_language)}{' '}
        <span>Audio & subtitles</span>
      </summary>
      <div>
        <p>
          <strong>Original language:</strong>{' '}
          {languageName(title.original_language)}
        </p>
        {title.spoken_languages?.length > 0 && (
          <p>
            <strong>Languages spoken in the story:</strong>{' '}
            {title.spoken_languages
              .map((l) => languageName(l.iso_639_1))
              .join(', ')}
          </p>
        )}
        <p>
          Availability for <strong>{country}</strong>. Change the region under
          “Where to watch”.
        </p>
        {loading ? (
          <p role='status'>Checking language information…</p>
        ) : error ? (
          <p role='alert'>
            Language information could not be loaded.{' '}
            <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
          </p>
        ) : !local.length ? (
          <>
            <p>
              <strong>Dubbed audio, including Hindi:</strong> Not verified.
            </p>
            <p>
              <strong>Subtitles:</strong> Not verified. Check your streaming
              service’s audio and subtitle menu.
            </p>
          </>
        ) : (
          local.map((e) => (
            <section key={e._id}>
              <h3>{e.provider}{e.offerType ? ` · ${e.offerType}` : ''}</h3>
              <p>
                <strong>Dubbed audio:</strong>{' '}
                <Languages
                  codes={e.audio.filter((c) => c !== title.original_language)}
                />
              </p>
              <p>
                <strong>Subtitles:</strong> <Languages codes={e.subtitles} />
              </p>
              <small>
                Checked {new Date(e.checkedAt).toLocaleDateString()} · Source:{' '}
                <a href={e.source} target='_blank' rel='noopener noreferrer'>{new URL(e.source).hostname}</a>. Options may change by plan or
                region.
              </small>
            </section>
          ))
        )}
        <small>
          Story languages are not evidence of dubbed audio or subtitle
          availability.
        </small>
        {admin && (
          <details className='cl-inline-panel'>
            <summary>Update verified language information</summary>
            <form className='cl-language-form' onSubmit={save}>
              <p>
                Only enter audio and subtitles checked on the provider for{' '}
                {country}. Saving replaces that provider’s previous entry.
              </p>
              <label>
                Streaming service
                <input name='provider' required maxLength={80} />
              </label>
              <label>
                Provider source URL
                <input name='source' required type='url' />
              </label>
              <label>
                Audio language codes, comma-separated
                <input name='audio' aria-describedby='audio-codes' />
              </label>
              <label>
                Subtitle language codes, comma-separated
                <input name='subtitles' />
              </label>
              <p id='audio-codes'>
                Examples: hi, en, ta, te, ml. Leave empty only if no options are
                listed.
              </p>
              <button className='cl-button' disabled={busy}>
                {busy ? 'Saving…' : 'Save verified details'}
              </button>
              {message && <p role='status'>{message}</p>}
              {error && <p role='alert'>{error}</p>}
            </form>
          </details>
        )}
      </div>
    </details>
  );
}
