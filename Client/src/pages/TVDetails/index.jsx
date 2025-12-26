/**
 * TVDetails - Single TV show page
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MovieCard,
  RatingCircle,
  MovieDetailsSkeleton,
} from '../../components';
import tvService from '../../services/tvService';
import api from '../../services/api';
import '../MovieDetails/MovieDetails.css';

const TVDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.users);

  const [show, setShow] = useState(null);
  const [credits, setCredits] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [savedRating, setSavedRating] = useState(0); // Added missing state
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const fetchShow = async () => {
      setLoading(true);
      try {
        const [showRes, creditsRes, similarRes, videosRes] = await Promise.all([
          tvService.getTVDetails(id),
          tvService.getTVCredits(id),
          tvService.getSimilarTV(id),
          tvService.getTVVideos(id),
        ]);
        setShow(showRes.data);
        setCredits(creditsRes.data);
        setSimilar(similarRes.data?.results || []);
        setVideos(videosRes.data?.results || []);
      } catch (error) {
        console.error('Error fetching TV show:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShow();
    window.scrollTo(0, 0);
  }, [id]);

  // Check if in watchlist
  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/watchlist/check/${id}/tv`);
        setInWatchlist(res.data?.inWatchlist || res.inWatchlist || false);
      } catch (error) {
        console.error('Error checking watchlist:', error);
      }
    };
    if (user && id) checkWatchlist();
  }, [id, user]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/${id}/tv`);
        const reviewList = res?.data || res || [];
        setReviews(reviewList);
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

  const trailer = videos.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube',
  );
  const creators = show?.created_by || [];
  const cast = credits?.cast?.slice(0, 10) || [];

  const handleAddToWatchlist = async () => {
    if (!user) return alert('Please login to add to watchlist');

    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${id}/tv`);
        setInWatchlist(false);
      } else {
        await api.post('/watchlist', {
          tmdbId: parseInt(id),
          mediaType: 'tv',
          title: show.name,
          posterPath: show.poster_path,
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Watchlist error:', error);
      if (error.response?.status === 400) {
        setInWatchlist(true);
      }
    }
  };

  // Fetch user's rating
  useEffect(() => {
    const fetchUserRating = async () => {
      if (!user || !id) return;
      try {
        const res = await api.get(`/ratings/user/${id}/tv`);
        console.log('Fetched TV rating:', res);

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

  const handleRatingSelect = (rating) => {
    if (!user) return alert('Please login to rate');
    setUserRating(rating);
  };

  const handleSubmitRating = async () => {
    if (!userRating) return;

    try {
      await api.post('/ratings', {
        tmdbId: parseInt(id),
        mediaType: 'tv',
        score: userRating,
        title: show.name,
        posterPath: show.poster_path,
      });
      setSavedRating(userRating);
    } catch (error) {
      console.error('Rating error:', error);
      alert('Failed to save rating');
    }
  };

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
        mediaType: 'tv',
        title: reviewText.substring(0, 50),
        content: reviewText,
        movieTitle: show.name,
        posterPath: show.poster_path,
      });
      const newReview = res?.data?.data || res?.data || res;
      setReviews([newReview, ...reviews]);
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
  if (!show) return <div className='error-state'>TV Show not found</div>;

  const backdropUrl = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : null;
  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : '/placeholder-poster.jpg';

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
          <img src={posterUrl} alt={show.name} />
        </div>

        <div className='details-info'>
          <h1 className='details-title'>
            {show.name}
            <span className='details-year'>
              ({show.first_air_date?.substring(0, 4)})
            </span>
          </h1>

          <div className='details-meta'>
            <span className='meta-rating'>
              <RatingCircle rating={show.vote_average} size={60} />
            </span>
            <span className='meta-seasons'>
              {show.number_of_seasons} Season
              {show.number_of_seasons > 1 ? 's' : ''}
            </span>
            <span className='meta-episodes'>
              {show.number_of_episodes} Episodes
            </span>
            <span className='meta-genres'>
              {show.genres?.map((g) => g.name).join(', ')}
            </span>
          </div>

          {show.tagline && (
            <p className='details-tagline'>&quot;{show.tagline}&quot;</p>
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
            <p>{show.overview}</p>
          </div>

          {creators.length > 0 && (
            <div className='details-creators'>
              <strong>Created by:</strong>{' '}
              {creators.map((c) => c.name).join(', ')}
            </div>
          )}

          {/* User Rating Section */}
          <div className='user-rating-section'>
            <h3>What did you think of {show.name}?</h3>
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
        </div>
      </div>

      {/* Cast Section */}
      {cast.length > 0 && (
        <section className='cast-section'>
          <h2>Series Cast</h2>
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
                      : '/placeholder-person.jpg'
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
              ✓ You have already reviewed this show
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

      {/* Similar Shows */}
      {similar.length > 0 && (
        <section className='similar-section'>
          <h2>Similar Shows</h2>
          <div className='movies-grid'>
            {similar.slice(0, 6).map((s, i) => (
              <MovieCard key={s.id} movie={s} index={i} mediaType='tv' />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default TVDetails;
