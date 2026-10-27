import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../services/api';
export default function Calendar() {
  const user = useSelector((s) => s.users.user);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)),
    [events, setEvents] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [warning, setWarning] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setEvents([]);
    setError('');
    setWarning('');
    setLoading(false);
    if (!user?.id || !/^\d{4}-\d{2}$/.test(month)) return;
    setLoading(true);
    (async () => {
      try {
        let offset = 0;
        let failed = 0;
        const all = [];
        do {
          const r = await api.get(
            `/personal/calendar?start=${month}&offset=${offset}`,
            { signal: c.signal },
          );
          if (c.signal.aborted) return;
          all.push(...r.data);
          failed += r.failed;
          offset = r.nextOffset;
          setEvents(
            [...new Map(all.map((e) => [e.id, e])).values()].sort((a, b) =>
              a.date.localeCompare(b.date),
            ),
          );
        } while (offset !== null);
        if (failed)
          setWarning(
            `${failed} saved titles could not be checked. Retry to complete your calendar.`,
          );
      } catch (e) {
        if (!c.signal.aborted) setError(e.message);
      } finally {
        if (!c.signal.aborted) setLoading(false);
      }
    })();
    return () => c.abort();
  }, [user?.id, month, retry]);
  function exportCalendar() {
    const escape = (s) =>
      s
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CineLog//Release Calendar//EN',
      ...events.flatMap((e) => [
        'BEGIN:VEVENT',
        `UID:${e.id}@cinelog`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`,
        `SUMMARY:${escape(e.title + ' — ' + e.label)}`,
        'END:VEVENT',
      ]),
      'END:VCALENDAR',
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join('\r\n')], { type: 'text/calendar' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinelog-${month}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className='cl-page cl-top-space'>
      <p className='cl-eyebrow'>DATES WORTH KEEPING</p>
      <h1>Your release calendar</h1>
      <p className='cl-muted'>
        Releases and episodes from your library and tracked series. Catalogue
        dates may change; they don’t guarantee local streaming availability.
      </p>
      {!user ? (
        <Link
          className='cl-button'
          to={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
        >
          Sign in to see your calendar
        </Link>
      ) : (
        <>
          <div className='cl-feature-toolbar'>
            <label>
              Month
              <input
                type='month'
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <button
              className='cl-button secondary'
              disabled={!events.length || loading}
              onClick={exportCalendar}
            >
              Export month (.ics)
            </button>
            <Link to='/watchlist'>Manage saved titles ↗</Link>
          </div>
          {loading && <p role='status'>Checking saved titles…</p>}
          {(error || warning) && (
            <p role='alert'>
              {error || warning}{' '}
              <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
            </p>
          )}
          {!loading && !error && !events.length && (
            <div className='cl-empty'>
              <h2>No dates listed this month.</h2>
              <p>
                Save upcoming films or series to your library to see their
                release dates here.
              </p>
              <Link to='/upcoming'>Explore upcoming releases ↗</Link>
            </div>
          )}
          <div className='cl-calendar-list'>
            {events.map((e) => (
              <Link key={e.id} to={`/${e.mediaType}/${e.tmdbId}`}>
                <time dateTime={e.date}>
                  {new Date(e.date + 'T12:00:00').toLocaleDateString(
                    undefined,
                    { month: 'short', day: 'numeric' },
                  )}
                </time>
                <div>
                  <h3>{e.title}</h3>
                  <p>{e.label}</p>
                </div>
                <span aria-hidden='true'>↗</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
