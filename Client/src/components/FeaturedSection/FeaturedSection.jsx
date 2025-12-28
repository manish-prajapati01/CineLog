/**
 * FeaturedSection Component
 * Reusable horizontal scrolling section with IMDb-style header
 */
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from '../MovieCard/MovieCard';
import './FeaturedSection.css';

const FeaturedSection = ({
  title,
  subtitle,
  items = [],
  linkTo,
  loading = false,
  type = 'movie', // movie, tv, person
}) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -800 : 800;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!loading && (!items || items.length === 0)) return null;

  return (
    <section className='featured-section'>
      <div className='section-header-wrapper'>
        <Link to={linkTo} className='section-header-link'>
          <div className='section-title-bar'></div>
          <div className='section-header-content'>
            <h2 className='section-title'>{title}</h2>
            {subtitle && <p className='section-subtitle'>{subtitle}</p>}
          </div>
          <span className='section-chevron'>›</span>
        </Link>
      </div>

      <div className='carousel-container'>
        <button
          className='carousel-control left'
          onClick={() => scroll('left')}
        >
          ‹
        </button>

        <div className='carousel-track' ref={scrollRef}>
          {loading
            ? // Simple Loading Skeleton
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className='carousel-item skeleton'></div>
                ))
            : items.map((item, index) => (
                <div key={item.id} className='carousel-item'>
                  <MovieCard item={item} mediaType={type} index={index} />
                </div>
              ))}
        </div>

        <button
          className='carousel-control right'
          onClick={() => scroll('right')}
        >
          ›
        </button>
      </div>
    </section>
  );
};

export default FeaturedSection;
