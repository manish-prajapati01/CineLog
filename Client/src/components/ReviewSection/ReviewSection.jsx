import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
export default function ReviewSection({
  tmdbId,
  mediaType,
  reviews = [],
  user,
  onReviewSubmitted,
  movieTitle,
  posterPath,
}) {
  const [message, setMessage] = useState('');
  const [writing, setWriting] = useState(false),
    [content, setContent] = useState(''),
    [title, setTitle] = useState(''),
    [spoiler, setSpoiler] = useState(false),
    [revealed, setRevealed] = useState({}),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await api.post('/reviews', {
        tmdbId,
        mediaType,
        title: title.trim() || 'My thoughts',
        content,
        containsSpoilers: spoiler,
        movieTitle,
        posterPath,
      });
      setWriting(false);
      setContent('');
      setTitle('');
      setSpoiler(false);
      onReviewSubmitted();
      setMessage('Your review activity has been updated.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function action(review, method) {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      if (method === 'delete') await api.delete(`/reviews/${review._id}`);
      else await api.put(`/reviews/${review._id}/like`);
      onReviewSubmitted();
      setMessage('Your review activity has been updated.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className='cl-section'>
      <div className='cl-section-heading'>
        <div>
          <p className='cl-eyebrow'>AFTER THE CREDITS</p>
          <h2>The conversation</h2>
        </div>
        {user ? (
          <button
            className='cl-button secondary'
            onClick={() => setWriting(!writing)}
          >
            {writing ? 'Cancel' : 'Write a review ↗'}
          </button>
        ) : (
          <Link className='cl-text-link' to='/login'>
            Sign in to review ↗
          </Link>
        )}
      </div>
      {message && (
        <p className='cl-success' role='status'>
          {message}
        </p>
      )}
      {error && (
        <p role='alert' className='cl-notice'>
          {error}
        </p>
      )}
      {writing && (
        <form className='cl-review-form' onSubmit={submit}>
          <label>
            Headline
            <input
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Your review
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
          <div className='cl-section-heading'>
            <label className='cl-checkbox'>
              <input
                type='checkbox'
                checked={spoiler}
                onChange={(e) => setSpoiler(e.target.checked)}
              />
              Contains spoilers
            </label>
            <button className='cl-button' disabled={busy}>
              {busy ? 'Publishing...' : 'Publish review'}
            </button>
          </div>
        </form>
      )}
      {!reviews.length ? (
        <div className='cl-empty compact'>
          <p>No reviews yet. Start the conversation.</p>
        </div>
      ) : (
        <div className='cl-review-grid'>
          {reviews.map((r) => (
            <article className='cl-review' key={r._id}>
              <div className='cl-review-byline'>
                <span className='cl-avatar'>{r.userId?.name?.[0] || 'C'}</span>
                <div>
                  <strong>{r.userId?.name || 'CineLog member'}</strong>
                  <small>{new Date(r.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
              <h3>{r.title}</h3>
              {r.containsSpoilers && !revealed[r._id] ? (
                <button
                  className='cl-spoiler'
                  onClick={() => setRevealed({ ...revealed, [r._id]: true })}
                >
                  Contains spoilers · Reveal review
                </button>
              ) : (
                <p className='cl-review-body'>{r.content}</p>
              )}
              <div className='cl-section-heading'>
                <button
                  className='cl-text-link'
                  disabled={!user || busy}
                  onClick={() => action(r, 'like')}
                >
                  ♡ Helpful · {r.likes?.length || 0}
                </button>
                {(user?.id === r.userId?._id || user?.role === 'admin') && (
                  <button
                    className='cl-quiet'
                    disabled={busy}
                    onClick={() => action(r, 'delete')}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
