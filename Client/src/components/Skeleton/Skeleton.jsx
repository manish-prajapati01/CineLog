/**
 * Skeleton Loading Components
 * Display placeholders while content loads
 */

import './Skeleton.css';

// Generic Skeleton
export const Skeleton = ({ width, height, borderRadius, className = '' }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
  />
);

// Movie Card Skeleton
export const MovieCardSkeleton = () => (
  <div className='movie-card-skeleton'>
    <div className='skeleton skeleton-poster' />
    <div className='skeleton-info'>
      <div className='skeleton skeleton-title' />
      <div className='skeleton skeleton-year' />
    </div>
  </div>
);

// Movie Grid Skeleton
export const MovieGridSkeleton = ({ count = 8 }) => (
  <div className='grid-movies'>
    {Array(count)
      .fill(0)
      .map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
  </div>
);

// Cast Card Skeleton
export const CastCardSkeleton = () => (
  <div className='cast-card-skeleton'>
    <div className='skeleton skeleton-avatar' />
    <div className='skeleton skeleton-name' />
    <div className='skeleton skeleton-character' />
  </div>
);

// Movie Details Skeleton
export const MovieDetailsSkeleton = () => (
  <div className='movie-details-skeleton'>
    <div className='skeleton skeleton-backdrop' />
    <div className='details-content'>
      <div className='skeleton skeleton-poster-large' />
      <div className='details-info'>
        <div className='skeleton skeleton-title-large' />
        <div className='skeleton skeleton-tagline' />
        <div className='skeleton skeleton-meta' />
        <div className='skeleton skeleton-overview' />
        <div className='skeleton skeleton-overview' />
      </div>
    </div>
  </div>
);

// Review Skeleton
export const ReviewSkeleton = () => (
  <div className='review-skeleton'>
    <div className='review-header-skeleton'>
      <div className='skeleton skeleton-avatar-small' />
      <div className='skeleton skeleton-author' />
    </div>
    <div className='skeleton skeleton-content' />
    <div className='skeleton skeleton-content-short' />
  </div>
);

export default Skeleton;
