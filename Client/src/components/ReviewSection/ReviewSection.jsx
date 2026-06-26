import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../../services/api';
import './ReviewSection.css';

const ReviewSection = ({
  tmdbId,
  mediaType,
  reviews = [],
  user,
  onReviewSubmitted,
  movieTitle,
  posterPath,
}) => {
  const navigate = useNavigate();
  const [isWriting, setIsWriting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    content: '',
    title: '', // optional headline
    isSpoiler: false,
  });

  // Spoiler toggle state for INDIVIDUAL reviews (by ID)
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  const toggleSpoiler = (reviewId) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!formData.content.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        tmdbId: parseInt(tmdbId),
        mediaType,
        content: formData.content,
        title: formData.title || 'Review',
        containsSpoilers: formData.isSpoiler,
        movieTitle,
        posterPath,
      };

      const res = await api.post('/reviews', payload);
      // res.data should be the new review
      if (onReviewSubmitted) {
        onReviewSubmitted(res.data);
      }

      // Reset form
      setFormData({ content: '', title: '', isSpoiler: false });
      setIsWriting(false);
    } catch (err) {
      console.error('Review submit error:', err);
      setError(err.message || 'Failed to post review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='reviews-container'>
      {/* HEADER */}
      <div className='reviews-header-block'>
        <div className='header-left'>
          <span className='reviews-label'>User Reviews</span>
          <span className='reviews-count'>
            {reviews?.length > 0 ? reviews.length : 0}
          </span>
        </div>
        {!isWriting && (
          <button
            className='btn-write-review'
            onClick={() => {
              if (!user) navigate('/login');
              else setIsWriting(true);
            }}
          >
            + Write Review
          </button>
        )}
      </div>

      {/* WRITE REVIEW FORM */}
      {isWriting && (
        <div className='review-form-panel'>
          <h4>Write a Review for {movieTitle}</h4>

          {error && (
            <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type='text'
              name='title'
              className='review-input-title'
              placeholder='A short headline... (optional)'
              value={formData.title}
              onChange={handleInputChange}
              disabled={submitting}
            />

            <textarea
              name='content'
              className='review-input-content'
              rows={5}
              placeholder='Write your thoughts here...'
              value={formData.content}
              onChange={handleInputChange}
              disabled={submitting}
              required
            />

            <div className='form-actions-row'>
              <label className='spoiler-checkbox'>
                <input
                  type='checkbox'
                  name='isSpoiler'
                  checked={formData.isSpoiler}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
                Contains Spoilers
              </label>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type='button'
                  className='text-btn'
                  onClick={() => setIsWriting(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn-submit'
                  disabled={submitting || !formData.content.trim()}
                >
                  {submitting ? 'Posting...' : 'Submit'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* REVIEWS LIST */}
      <div className='reviews-feed'>
        {!reviews || reviews.length === 0 ? (
          <div className='no-reviews-msg'>
            No reviews yet. Be the first to add one!
          </div>
        ) : (
          reviews.map((rev) => {
            const isSpoilerBlocked =
              rev.isSpoiler && !revealedSpoilers[rev._id];

            return (
              <div key={rev._id} className='review-card-item'>
                <div className='review-meta-header'>
                  {rev.title && (
                    <h5 className='review-title-text'>{rev.title}</h5>
                  )}
                  {/* Potentially show user rating if available in review object */}
                  {rev.authorDetails?.rating && (
                    <span className='featured-star'>
                      ★ {rev.authorDetails.rating}
                    </span>
                  )}
                </div>

                <div className='review-author-line'>
                  <span className='by-text'>by</span>
                  <Link
                    to={`/profile/${rev.user?._id || rev.user}`}
                    className='author-name'
                  >
                    {rev.authorName || 'User'}
                  </Link>
                  <span className='dot'>•</span>
                  <span className='review-date'>
                    {moment(rev.createdAt).format('DD MMMM YYYY')}
                  </span>
                </div>

                <div
                  className={`review-body ${isSpoilerBlocked ? 'spoiler-blur' : ''}`}
                >
                  {isSpoilerBlocked && (
                    <div
                      className='spoiler-warning'
                      onClick={() => toggleSpoiler(rev._id)}
                    >
                      <span>Warning: Spoilers! (Click to View)</span>
                    </div>
                  )}
                  <p>{rev.content}</p>
                </div>

                <div className='review-footer-actions'>
                  <button className='text-btn'>Helpful</button>
                  {/* Could add Share, Report etc */}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
