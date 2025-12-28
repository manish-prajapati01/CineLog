/**
 * ReviewSection Component
 * Displays user reviews and submission form
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
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
  const [reviewText, setReviewText] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  // Check if user has already reviewed
  const hasReviewed =
    user &&
    reviews.some((r) => r.userId?._id === user.id || r.userId === user.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !reviewText.trim() || !reviewTitle.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/reviews', {
        tmdbId: parseInt(tmdbId),
        mediaType,
        title: reviewTitle,
        content: reviewText,
        containsSpoilers, // New field support
        movieTitle,
        posterPath,
      });

      onReviewSubmitted(res.data || res);
      setReviewText('');
      setReviewTitle('');
      setShowForm(false);
    } catch (error) {
      console.error('Review submit error:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='reviews-container'>
      <div className='reviews-header-block'>
        <div className='header-left'>
          <span className='reviews-label'>User Reviews</span>
          <span className='reviews-count'>{reviews.length}</span>
        </div>
        {!hasReviewed && user && (
          <button
            className='btn-write-review'
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Review'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form className='review-form-panel' onSubmit={handleSubmit}>
          <h4>Write a Review</h4>
          <input
            type='text'
            className='review-input-title'
            placeholder='Review Title (e.g. A Masterpiece!)'
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            maxLength={100}
            required
          />
          <textarea
            className='review-input-content'
            placeholder='Write your thoughts here...'
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={5}
            minLength={10}
            required
          />
          <div className='form-actions-row'>
            <label className='spoiler-checkbox'>
              <input
                type='checkbox'
                checked={containsSpoilers}
                onChange={(e) => setContainsSpoilers(e.target.checked)}
              />
              Contains Spoilers
            </label>
            <button type='submit' className='btn-submit' disabled={loading}>
              {loading ? 'Posting...' : 'Post Review'}
            </button>
          </div>
        </form>
      )}

      {!user && (
        <div className='login-prompt-banner'>
          <Link to='/login'>Sign in</Link> to rate and review.
        </div>
      )}

      {/* Reviews List */}
      <div className='reviews-feed'>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review._id} className='review-card-item'>
              <div className='review-meta-header'>
                <h5 className='review-title-text'>{review.title}</h5>
              </div>

              <div className='review-author-line'>
                <span className='author-name'>
                  {review.userId?.name || 'Anonymous'}
                </span>
                <span className='review-date'>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div
                className={`review-body ${review.containsSpoilers ? 'spoiler-blur' : ''}`}
              >
                {review.containsSpoilers && (
                  <div
                    className='spoiler-warning'
                    onClick={(e) =>
                      e.currentTarget.parentElement.classList.remove(
                        'spoiler-blur',
                      )
                    }
                  >
                    <span>Warning: Spoilers! Click to reveal</span>
                  </div>
                )}
                <p>{review.content}</p>
              </div>

              <div className='review-footer-actions'>
                <button className='text-btn'>
                  Helpful ({review.helpfulVotes?.length || 0})
                </button>
                <button className='text-btn'>Share</button>
              </div>
            </div>
          ))
        ) : (
          <p className='no-reviews-msg'>No reviews yet. Be the first!</p>
        )}
      </div>
    </section>
  );
};

ReviewSection.propTypes = {
  tmdbId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mediaType: PropTypes.string,
  reviews: PropTypes.array,
  user: PropTypes.object,
  onReviewSubmitted: PropTypes.func,
  movieTitle: PropTypes.string,
  posterPath: PropTypes.string,
};

export default ReviewSection;
