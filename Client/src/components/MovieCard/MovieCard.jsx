/**
 * MovieCard Component
 * Displays movie/TV show poster with hover effects
 * Handles both camelCase and snake_case data from TMDB
 */

import { Link } from 'react-router-dom';
import RatingCircle from '../RatingCircle';
import './MovieCard.css';

const MovieCard = ({
  movie,
  item,
  showRating = true,
  size = 'medium',
  mediaType: propMediaType,
  index = 0,
}) => {
  // Support both 'movie' and 'item' props for backwards compatibility
  const data = movie || item;

  // Guard against undefined data
  if (!data) {
    return null;
  }

  // Handle both camelCase and snake_case formats
  const id = data.id;
  const title = data.title || data.name || 'Untitled';
  const posterPath = data.posterPath || data.poster_path;
  const voteAverage = data.voteAverage || data.vote_average || 0;
  const releaseDate = data.releaseDate || data.release_date;
  const firstAirDate = data.firstAirDate || data.first_air_date;
  const mediaType =
    propMediaType ||
    data.mediaType ||
    data.media_type ||
    (data.name ? 'tv' : 'movie');

  const year =
    releaseDate || firstAirDate
      ? new Date(releaseDate || firstAirDate).getFullYear()
      : null;

  const linkPath = mediaType === 'tv' ? `/tv/${id}` : `/movie/${id}`;

  // Build image URL
  const imageUrl = posterPath
    ? posterPath.startsWith('http')
      ? posterPath
      : `https://image.tmdb.org/t/p/w342${posterPath}`
    : null;

  return (
    <Link
      to={linkPath}
      className={`movie-card ${size}`}
      style={{ '--index': index }}
    >
      <div className='card-poster'>
        {imageUrl ? (
          <img src={imageUrl} alt={title} loading='lazy' />
        ) : (
          <div className='no-poster'>
            <span>🎬</span>
            <p>No Image</p>
          </div>
        )}

        {/* Overlay on hover */}
        <div className='card-overlay'>
          <div className='overlay-content'>
            <span className='view-details'>View Details</span>
          </div>
        </div>

        {/* Rating Circle */}
        {showRating && voteAverage > 0 && (
          <div className='card-rating'>
            <RatingCircle rating={voteAverage} size='small' />
          </div>
        )}

        {/* Media Type Badge */}
        <span className={`media-type-badge ${mediaType}`}>
          {mediaType === 'tv' ? 'TV' : 'Movie'}
        </span>
      </div>

      <div className='card-info'>
        <h3 className='card-title'>{title}</h3>
        {year && <span className='card-year'>{year}</span>}
      </div>
    </Link>
  );
};

export default MovieCard;
