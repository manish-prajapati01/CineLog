/**
 * Profile Page - User's profile with ratings, reviews, and watchlist
 */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { MovieCard, MovieGridSkeleton } from '../../components';
import api from '../../services/api';
import watchlistService from '../../services/watchlistService';
import './Profile.css';

const Profile = () => {
  const { user } = useSelector((state) => state.users);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ratings');
  const [ratings, setRatings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRatings: 0,
    totalReviews: 0,
    totalWatchlist: 0,
    averageRating: 0,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [watchlistRes, reviewsRes, ratingsRes] = await Promise.all([
          api.get('/watchlist'),
          api.get('/reviews/user/my-reviews'),
          api.get('/ratings/user/me'),
        ]);

        const wl = watchlistRes.data?.data || watchlistRes.data || [];
        const rv = reviewsRes.data?.data || reviewsRes.data || [];
        const rt = ratingsRes.data?.data || ratingsRes.data || [];

        setWatchlist(wl);
        setReviews(rv);
        setRatings(rt);

        // Calculate stats
        const avgRating =
          rt.length > 0
            ? (rt.reduce((sum, r) => sum + r.score, 0) / rt.length).toFixed(1)
            : 0;

        setStats({
          totalRatings: rt.length,
          totalReviews: rv.length,
          totalWatchlist: wl.length,
          averageRating: avgRating,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleRemoveFromWatchlist = async (tmdbId, mediaType) => {
    try {
      await watchlistService.remove(tmdbId, mediaType);
      setWatchlist(
        watchlist.filter(
          (item) => !(item.tmdbId === tmdbId && item.mediaType === mediaType),
        ),
      );
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(reviews.filter((r) => r._id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  if (!user) {
    return (
      <div className='profile-page'>
        <div className='login-prompt-container'>
          <h2>Please login to view your profile</h2>
          <Link to='/login' className='btn-login'>
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='profile-page'>
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

      {/* Profile Header */}
      <div className='profile-header'>
        <div className='profile-avatar'>
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <div className='avatar-placeholder'>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className='profile-info'>
          <h1>{user.name}</h1>
          <p className='profile-email'>{user.email}</p>
          <p className='profile-joined'>
            Member since{' '}
            {new Date(user.createdAt || Date.now()).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='profile-stats'>
        <div className='stat-card'>
          <span className='stat-number'>{stats.totalWatchlist}</span>
          <span className='stat-label'>In Watchlist</span>
        </div>
        <div className='stat-card'>
          <span className='stat-number'>{stats.totalRatings}</span>
          <span className='stat-label'>Ratings</span>
        </div>
        <div className='stat-card'>
          <span className='stat-number'>{stats.totalReviews}</span>
          <span className='stat-label'>Reviews</span>
        </div>
        {stats.averageRating > 0 && (
          <div className='stat-card highlight'>
            <span className='stat-number'>{stats.averageRating}</span>
            <span className='stat-label'>Avg Rating</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className='profile-tabs'>
        <button
          className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
        >
          Watchlist ({watchlist.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          My Ratings ({ratings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          My Reviews ({reviews.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className='profile-content'>
        {loading ? (
          <MovieGridSkeleton count={6} />
        ) : (
          <>
            {/* Watchlist Tab */}
            {activeTab === 'watchlist' && (
              <div className='watchlist-content'>
                {watchlist.length > 0 ? (
                  <div className='profile-grid'>
                    {watchlist.map((item, index) => (
                      <div key={item._id} className='profile-card'>
                        <MovieCard
                          movie={{
                            id: item.tmdbId,
                            title: item.title,
                            name: item.title,
                            poster_path: item.posterPath,
                          }}
                          index={index}
                          mediaType={item.mediaType}
                        />
                        <button
                          className='remove-btn'
                          onClick={() =>
                            handleRemoveFromWatchlist(
                              item.tmdbId,
                              item.mediaType,
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='empty-state'>
                    <p>Your watchlist is empty</p>
                    <Link to='/movies' className='browse-link'>
                      Browse Movies
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Ratings Tab */}
            {activeTab === 'ratings' && (
              <div className='ratings-content'>
                {ratings.length > 0 ? (
                  <div className='ratings-grid'>
                    {ratings.map((rating) => (
                      <div key={rating._id} className='rating-card'>
                        <div className='rating-poster'>
                          <img
                            src={
                              rating.posterPath
                                ? `https://image.tmdb.org/t/p/w185${rating.posterPath}`
                                : 'https://placehold.co/185x278?text=No+Poster'
                            }
                            alt={rating.title}
                          />
                          <div className='rating-badge'>
                            <span className='rating-score'>{rating.score}</span>
                            <span className='rating-max'>/10</span>
                          </div>
                        </div>
                        <div className='rating-info'>
                          <Link
                            to={`/${rating.mediaType}/${rating.tmdbId}`}
                            className='rating-title'
                          >
                            {rating.title}
                          </Link>
                          <span className='rating-type'>
                            {rating.mediaType === 'movie'
                              ? '🎬 Movie'
                              : '📺 TV'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='empty-state'>
                    <p>You have not rated any movies or TV shows yet</p>
                    <Link to='/movies' className='browse-link'>
                      Browse Movies to Rate
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className='reviews-content'>
                {reviews.length > 0 ? (
                  <div className='reviews-list'>
                    {reviews.map((review) => (
                      <div key={review._id} className='review-card'>
                        <div className='review-movie-info'>
                          <span className='review-movie-title'>
                            {review.movieTitle || 'Unknown Title'}
                          </span>
                          <span className='review-date'>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className='review-text'>{review.content}</p>
                        <button
                          className='delete-btn'
                          onClick={() => handleDeleteReview(review._id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='empty-state'>
                    <p>You haven&apos;t written any reviews yet</p>
                    <Link to='/movies' className='browse-link'>
                      Browse Movies to Review
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
