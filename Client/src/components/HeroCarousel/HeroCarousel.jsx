/**
 * HeroCarousel Component
 * IMDb-style Home Page Hero
 * Desktop: Main Slider (66%) + Up Next List (33%)
 * Mobile: Main Slider (100%)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroCarousel.css';

const HeroCarousel = ({ items = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-play interval: Change slide every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 6));
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length, isAnimating]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 6)); // Limit to first 6 items for carousel
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(
      (prev) =>
        (prev - 1 + Math.min(items.length, 6)) % Math.min(items.length, 6),
    );
    setTimeout(() => setIsAnimating(false), 500);
  };

  if (!items || items.length === 0) return null;

  // Carousel Logic:
  // We only show the top 6 trending items in the main slider
  const carouselItems = items.slice(0, 6);
  const currentItem = carouselItems[currentIndex];

  // "Up Next" logic: Show the next 3 items in the list
  const nextItems = [];
  for (let i = 1; i <= 3; i++) {
    nextItems.push(carouselItems[(currentIndex + i) % carouselItems.length]);
  }

  return (
    <div className='hero-container'>
      {/* Main Slider */}
      <div className='hero-slider'>
        <div className='hero-slide active' key={currentItem.id}>
          <div className='hero-backdrop'>
            <img
              src={`https://image.tmdb.org/t/p/original${currentItem.backdrop_path || currentItem.backdropPath}`}
              alt={currentItem.title || currentItem.name}
            />
            <div className='hero-vignette'></div>
          </div>

          <div className='hero-content'>
            <div className='hero-poster'>
              <img
                src={`https://image.tmdb.org/t/p/w342${currentItem.poster_path || currentItem.posterPath}`}
                alt='Poster'
              />
            </div>
            <div className='hero-info'>
              <h1 className='hero-title'>
                {currentItem.title || currentItem.name}
              </h1>
              <div className='hero-meta'>
                <span className='hero-rating'>
                  ⭐{' '}
                  <span className='score'>
                    {currentItem.vote_average?.toFixed(1)}
                  </span>
                </span>
                <span className='hero-type'>
                  {currentItem.media_type === 'tv' ? 'TV Series' : 'Movie'}
                </span>
              </div>
              <p className='hero-overview line-clamp-2'>
                {currentItem.overview}
              </p>
              <div className='hero-actions'>
                <Link
                  to={
                    currentItem.media_type === 'tv'
                      ? `/tv/${currentItem.id}`
                      : `/movie/${currentItem.id}`
                  }
                  className='hero-btn-primary'
                >
                  View Details
                </Link>
                <button className='hero-btn-secondary'>+ Watchlist</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <button className='slider-btn prev' onClick={handlePrev}>
          ‹
        </button>
        <button className='slider-btn next' onClick={handleNext}>
          ›
        </button>
      </div>

      {/* Up Next Section (Desktop Only) */}
      <div className='hero-up-next'>
        <h3 className='up-next-title'>Up Next</h3>
        <div className='up-next-list'>
          {nextItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className='up-next-item'
              onClick={() =>
                setCurrentIndex((currentIndex + 1 + idx) % carouselItems.length)
              }
            >
              <div className='up-next-poster'>
                <img
                  src={`https://image.tmdb.org/t/p/w185${item.poster_path || item.posterPath}`}
                  alt=''
                />
              </div>
              <div className='up-next-info'>
                <span className='sc-play-icon'>▶</span>
                <div className='text-content'>
                  <span className='duration'>Trailer</span>
                  <h4 className='title'>{item.title || item.name}</h4>
                  <span className='subtitle'>Watch the trailer</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className='up-next-footer'>
          <span>Browse trailers ➤</span>
        </div>
      </div>
    </div>
  );
};

import PropTypes from 'prop-types';

HeroCarousel.propTypes = {
  items: PropTypes.array,
};

export default HeroCarousel;
