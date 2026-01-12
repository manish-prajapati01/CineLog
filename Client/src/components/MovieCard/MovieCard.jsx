/**
 * MovieCard Component
 * Displays movie/TV show poster with hover effects
 * Handles both camelCase and snake_case data from TMDB
 */

import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../../services/api';
import './MovieCard.css';

/**
 * MovieCard Component
 * Reusable card component for Movies, TV Shows, and People.
 * Handles automatic fallback for missing posters and intelligent Watchlist state.
 */
const MovieCard = ({
  movie,
  item,
  showRating = true,
  size = 'medium',
  mediaType: propMediaType,
  index = 0,
}) => {
  const navigate = useNavigate();
  // Support both 'movie' and 'item' props
  const data = movie || item;
  const { user } = useSelector((state) => state.users);

  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  const id = data?.id;
  const title = data?.title || data?.name || 'Untitled';
  const voteAverage = data?.voteAverage || data?.vote_average || 0;

  const mediaType =
    propMediaType ||
    data?.mediaType ||
    data?.media_type ||
    (data?.name ? 'tv' : 'movie');

  // Ensure person types are caught if passed without mediaType prop
  const finalMediaType =
    data?.gender !== undefined || data?.profile_path ? 'person' : mediaType;

  // Now we can safely use finalMediaType/mediaType
  const posterPath =
    finalMediaType === 'person'
      ? data?.profile_path || data?.profilePath
      : data?.posterPath || data?.poster_path;

  // Check Watchlist Status (Optimistic or Lazy)
  useEffect(() => {
    // Only check if user is logged in
    if (user && data && finalMediaType !== 'person') {
      const checkWatchlist = async () => {
        try {
          const res = await api.get(`/watchlist/check/${id}/${finalMediaType}`);
          setInWatchlist(res.data?.inWatchlist || res.inWatchlist || false);
        } catch (err) {
          // silent fail
        }
      };
      checkWatchlist();
    }
  }, [id, finalMediaType, user, data]);

  if (!data) return null;

  const linkPath =
    finalMediaType === 'person' ? `/person/${id}` : `/${finalMediaType}/${id}`;

  const imageUrl = posterPath
    ? posterPath.startsWith('http')
      ? posterPath
      : `https://image.tmdb.org/t/p/w342${posterPath}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&size=342`; // Better fallback

  const handleWatchlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${id}/${finalMediaType}`);
        setInWatchlist(false);
      } else {
        await api.post('/watchlist', {
          tmdbId: parseInt(id),
          mediaType: finalMediaType,
          title,
          posterPath,
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Watchlist error', error);
    } finally {
      setLoading(false);
    }
  };

  if (mediaType === 'person') {
    // simplified card for persons if needed
  }

  return (
    <div className={`movie-card ${size}`} style={{ '--index': index }}>
      <Link
        to={linkPath}
        className='card-link-wrapper'
        style={{ display: 'contents' }}
      >
        {/* Poster Section */}
        <div className='card-poster'>
          {/* Ribbon Button for Watchlist (Not for People) */}
          {finalMediaType !== 'person' && (
            <button
              className={`card-watchlist-btn ${inWatchlist ? 'added' : ''}`}
              onClick={handleWatchlistClick}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {loading ? '...' : inWatchlist ? '✓' : '+'}
            </button>
          )}

          <img src={imageUrl} alt={title} loading='lazy' />
        </div>

        {/* Content Section */}
        <div className='card-info'>
          {/* Rating */}
          {showRating && finalMediaType !== 'person' && (
            <div className='card-rating-row'>
              <span className='rating-star'>⭐</span>
              <span className='rating-value'>
                {voteAverage ? Number(voteAverage).toFixed(1) : 'NR'}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className='card-title'>{title}</h3>

          {/* Actions */}
          {finalMediaType !== 'person' && (
            <div className='card-actions'>
              <button
                className={`watchlist-btn-text ${inWatchlist ? 'added-text' : ''}`}
                onClick={handleWatchlistClick}
              >
                {inWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
              </button>
              <button
                className='trailer-btn'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/${finalMediaType}/${id}`);
                }}
              >
                <span>Details ›</span>
              </button>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

MovieCard.propTypes = {
  movie: PropTypes.object,
  item: PropTypes.object,
  showRating: PropTypes.bool,
  size: PropTypes.string,
  mediaType: PropTypes.string,
  index: PropTypes.number,
};

export default MovieCard;
