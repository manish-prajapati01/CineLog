/**
 * MovieDetails - Single movie page with all features
 * - Movie info, poster, backdrop
 * - Rating (user can rate 1-10)
 * - Reviews (users can write reviews)
 * - Cast & crew
 * - Similar movies
 * - Trailer modal
 * - Watchlist
 * - Parental certification
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MovieCard,
  RatingCircle,
  MovieDetailsSkeleton,
} from '../../components';
import movieService from '../../services/movieService';
import api from '../../services/api';
import './MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.users);

  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [ratingStats, setRatingStats] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const [movieRes, creditsRes, similarRes, videosRes] = await Promise.all(
          [
            movieService.getMovieDetails(id),
            movieService.getMovieCredits(id),
            movieService.getSimilarMovies(id),
            movieService.getMovieVideos(id),
          ],
        );
        setMovie(movieRes.data);
        setCredits(creditsRes.data);
        setSimilar(similarRes.data?.results || []);
        setVideos(videosRes.data?.results || []);
      } catch (error) {
        console.error('Error fetching movie:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/${id}/movie`);
        // api.js already unwraps response.data
        const reviewList = res?.data || res || [];
        setReviews(reviewList);
        // Check if current user has already reviewed
        if (user && Array.isArray(reviewList)) {
          const userReview = reviewList.find(
            (r) => r.userId?._id === user.id || r.userId === user.id,
          );
          setHasReviewed(!!userReview);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    if (id) fetchReviews();
  }, [id, user]);

  // Fetch rating stats
  useEffect(() => {
    const fetchRatingStats = async () => {
      try {
        const res = await api.get(`/ratings/${id}/movie`);
        setRatingStats(res.data);
      } catch (error) {
        console.error('Error fetching rating stats:', error);
      }
    };
    if (id) fetchRatingStats();
  }, [id]);

  // State for saved rating to compare against
  const [savedRating, setSavedRating] = useState(0);

  // Update fetchUserRating
  useEffect(() => {
    const fetchUserRating = async () => {
      if (!user || !id) return;
      try {
        // api.js returns response.data directly
        // Backend returns: { success: true, data: { score: 8 } }
        // So 'res' is { success: true, data: { score: 8 } }
        const res = await api.get(`/ratings/user/${id}/movie`);
        console.log('Fetched user rating:', res); // Log actual object

        // Safe extraction
        const score = res?.data?.score;

        if (score) {
          setUserRating(score);
          setSavedRating(score);
        } else {
          setUserRating(0);
          setSavedRating(0);
        }
      } catch (error) {
        console.error('Error fetching user rating:', error);
      }
    };
    fetchUserRating();
  }, [id, user]);

  // Check if in watchlist - Optimized
  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/watchlist/check/${id}/movie`);
        setInWatchlist(res.data?.inWatchlist || res.inWatchlist || false);
      } catch (error) {
        console.error('Error checking watchlist:', error);
      }
    };
    if (user && id) checkWatchlist();
  }, [id, user]);

  const trailer = videos.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube',
  );
  const director = credits?.crew?.find((c) => c.job === 'Director');
  const cast = credits?.cast?.slice(0, 10) || [];

  // Handle add/remove from watchlist
  const handleAddToWatchlist = async () => {
    if (!user) {
      alert('Please login to add to watchlist');
      return;
    }
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${id}/movie`);
        setInWatchlist(false);
      } else {
        await api.post('/watchlist', {
          tmdbId: parseInt(id),
          mediaType: 'movie',
          title: movie.title,
          posterPath: movie.poster_path,
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Watchlist error:', error);
      // Handle "Already in watchlist" case gracefully
      if (error.response?.status === 400) {
        setInWatchlist(true);
      }
    }
  };
  const handleRatingSelect = (rating) => {
    if (!user) {
      alert('Please login to rate');
      return;
    }
    setUserRating(rating); // Just update UI state
  };

  // Handle rating submission
  const handleSubmitRating = async () => {
    if (!userRating) return;

    try {
      console.log('Submitting rating:', { id, userRating }); // DEBUG
      const res = await api.post('/ratings', {
        tmdbId: parseInt(id),
        mediaType: 'movie',
        score: userRating,
        title: movie.title,
        posterPath: movie.poster_path,
      });

      console.log('Rating submission response:', res.data); // DEBUG

      // API returns rating object directly, not wrapped in success
      if (res.data?._id || res.data?.score) {
        // Update saved state to hide button and show checkmark
        setSavedRating(userRating);

        // Refresh overall stats
        const statsRes = await api.get(`/ratings/${id}/movie`);
        setRatingStats(statsRes.data);
      }
    } catch (error) {
      console.error('Rating error:', error);
      alert('Failed to save rating. Please try again.');
    }
  };

  // Handle submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to write a review');
      return;
    }
    if (!reviewText.trim()) return;

    setReviewLoading(true);
    try {
      const res = await api.post('/reviews', {
        tmdbId: parseInt(id),
        mediaType: 'movie',
        title: reviewText.substring(0, 50),
        content: reviewText,
        movieTitle: movie.title,
        posterPath: movie.poster_path,
      });
      // api.js already unwraps response.data
      setReviews([res?.data || res, ...reviews]);
      setReviewText('');
      setHasReviewed(true);
    } catch (error) {
      console.error('Review error:', error);
      alert(error.message || 'Error submitting review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <MovieDetailsSkeleton />;
  if (!movie) return <div className='error-state'>Movie not found</div>;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-poster.jpg';

  // Get certification (parental guide)
  const certification = movie.release_dates?.results
    ?.find((r) => r.iso_3166_1 === 'US')
    ?.release_dates?.find((d) => d.certification)?.certification;

  return (
    <div className='movie-details'>
      {/* Back Button */}
      <button className='back-button' onClick={() => navigate(-1)}>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M19 12H5M12 19l-7-7 7-7' />
        </svg>
      </button>

      {/* Backdrop */}
      <div
        className='details-backdrop'
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className='backdrop-overlay' />
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailer && (
        <div className='trailer-modal' onClick={() => setShowTrailer(false)}>
          <div className='trailer-content' onClick={(e) => e.stopPropagation()}>
            <button
              className='close-trailer'
              onClick={() => setShowTrailer(false)}
            >
              ×
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title='Trailer'
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className='details-content'>
        <div className='details-poster'>
          <img src={posterUrl} alt={movie.title} />
        </div>

        <div className='details-info'>
          <h1 className='details-title'>
            {movie.title}
            <span className='details-year'>
              ({new Date(movie.release_date).getFullYear()})
            </span>
          </h1>

          <div className='details-meta'>
            <span className='meta-rating'>
              <RatingCircle rating={movie.vote_average} size={60} />
            </span>
            {certification && (
              <span className='meta-certification'>{certification}</span>
            )}
            {movie.runtime && (
              <span className='meta-runtime'>
                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
              </span>
            )}
            <span className='meta-genres'>
              {movie.genres?.map((g) => g.name).join(', ')}
            </span>
          </div>

          {movie.tagline && (
            <p className='details-tagline'>&quot;{movie.tagline}&quot;</p>
          )}

          <div className='details-actions'>
            {trailer && (
              <button
                className='btn-trailer'
                onClick={() => setShowTrailer(true)}
              >
                ▶ Play Trailer
              </button>
            )}
            <button
              className={`btn-watchlist ${inWatchlist ? 'in-watchlist' : ''}`}
              onClick={handleAddToWatchlist}
            >
              {inWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
            </button>
          </div>

          <div className='details-overview'>
            <h3>Overview</h3>
            <p>{movie.overview}</p>
          </div>

          {director && (
            <div className='details-director'>
              <strong>Director:</strong> {director.name}
            </div>
          )}

          {/* User Rating Section */}
          <div className='user-rating-section'>
            <h3>What did you think of {movie.title}?</h3>
            <div className='rating-stars'>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  className={`star ${userRating >= star ? 'active' : ''}`}
                  onClick={() => handleRatingSelect(star)}
                  disabled={!user}
                  type='button'
                >
                  ★
                </button>
              ))}
            </div>

            <div className='rating-actions'>
              {!user ? (
                <span className='login-prompt'>
                  <Link to='/login'>Login</Link> to rate
                </span>
              ) : userRating > 0 && userRating !== savedRating ? (
                <button
                  className='btn-submit-rating'
                  onClick={handleSubmitRating}
                >
                  Submit {userRating}/10
                </button>
              ) : savedRating > 0 && userRating === savedRating ? (
                <span className='rating-status'>
                  ✓ Your rating: {savedRating}/10
                </span>
              ) : (
                <span
                  className='rating-status'
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Tap a star to rate
                </span>
              )}
            </div>
          </div>

          {/* Rating Breakdown */}
          {ratingStats && ratingStats.totalRatings > 0 && (
            <div className='rating-breakdown'>
              <h4>User Ratings ({ratingStats.totalRatings} ratings)</h4>
              <div className='rating-bar'>
                <div className='rating-average'>
                  <span className='avg-number'>
                    {ratingStats.average?.toFixed(1)}
                  </span>
                  <span className='avg-label'>/10</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cast Section */}
      {cast.length > 0 && (
        <section className='cast-section'>
          <h2>Top Billed Cast</h2>
          <div className='cast-grid'>
            {cast.map((person) => (
              <Link
                to={`/person/${person.id}`}
                key={person.id}
                className='cast-card'
              >
                <img
                  src={
                    person.profile_path
                      ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                      : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%23666" font-size="40"%3E👤%3C/text%3E%3C/svg%3E'
                  }
                  alt={person.name}
                />
                <div className='cast-info'>
                  <strong>{person.name}</strong>
                  <span>{person.character}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className='reviews-section'>
        <h2>Reviews</h2>

        {/* Review Form */}
        {user ? (
          hasReviewed ? (
            <p className='already-reviewed'>
              ✓ You have already reviewed this movie
            </p>
          ) : (
            <form className='review-form' onSubmit={handleSubmitReview}>
              <textarea
                placeholder='Write your review (at least 10 characters)...'
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                minLength={10}
              />
              <button
                type='submit'
                disabled={reviewLoading || reviewText.trim().length < 10}
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )
        ) : (
          <p className='login-to-review'>
            <Link to='/login'>Login</Link> to write a review
          </p>
        )}

        {/* Reviews List */}
        <div className='reviews-list'>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review._id} className='review-card'>
                <div className='review-header'>
                  <span className='review-author'>
                    {review.userId?.name || 'Anonymous'}
                  </span>
                  <span className='review-date'>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className='review-content'>{review.content}</p>
              </div>
            ))
          ) : (
            <p className='no-reviews'>
              No reviews yet. Be the first to review!
            </p>
          )}
        </div>
      </section>

      {/* Similar Movies */}
      {similar.length > 0 && (
        <section className='similar-section'>
          <h2>Similar Movies</h2>
          <div className='movies-grid'>
            {similar.slice(0, 6).map((m, i) => (
              <MovieCard key={m.id} movie={m} index={i} mediaType='movie' />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MovieDetails;
