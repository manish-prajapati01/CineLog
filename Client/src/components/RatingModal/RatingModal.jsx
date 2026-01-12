/**
 * RatingModal Component
 * Interactive 1-10 star rating modal.
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import './RatingModal.css';
import api from '../../services/api';

const RatingModal = ({
  isOpen,
  onClose,
  tmdbId,
  mediaType,
  currentRating,
  onRatingSuccess,
  title,
}) => {
  const [rating] = useState(currentRating || 0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRate = async (score) => {
    setLoading(true);
    try {
      await api.post(`/ratings`, {
        tmdbId,
        mediaType,
        score,
        title, // Sending title for backend
      });
      onRatingSuccess(score);
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Rating error:', error);
      setLoading(false);
    }
  };

  return (
    <div className='rating-modal-overlay' onClick={onClose}>
      <div
        className='rating-modal-content'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='rating-header'>
          <span className='rating-star-icon'>★</span>
          <h3>Rate this</h3>
        </div>
        <h4 className='rating-title'>{title}</h4>

        <div className='star-rating-display'>
          {[...Array(10)].map((_, index) => {
            const starValue = index + 1;
            return (
              <button
                key={index}
                className={`star-btn ${starValue <= (hover || rating) ? 'active' : ''}`}
                onClick={() => handleRate(starValue)}
                onMouseEnter={() => setHover(starValue)}
                onMouseLeave={() => setHover(rating)}
                disabled={loading}
              >
                ★
              </button>
            );
          })}
        </div>

        <div className='rating-score-label'>{hover || rating || 0}/10</div>

        <button className='rating-close-btn' onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

RatingModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  tmdbId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mediaType: PropTypes.string,
  currentRating: PropTypes.number,
  onRatingSuccess: PropTypes.func,
  title: PropTypes.string,
};

export default RatingModal;
