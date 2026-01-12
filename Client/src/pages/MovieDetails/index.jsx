/**
 * MovieDetails - IMDb Layout Redesign
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MovieDetailsSkeleton,
  CastList,
  ReviewSection,
  VideoModal,
  RatingModal,
  BackButton,
} from '../../components';
import { moviesAPI } from '../../services';
import api from '../../services/api'; // Import api
import './MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.users);

  // Core Data State
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);

  // User Interaction State
  const [userRating, setUserRating] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [playTrailer, setPlayTrailer] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);

  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const [movieRes, creditsRes, similarRes, videosRes] = await Promise.all(
          [
            moviesAPI.getDetails(id),
            moviesAPI.getCredits(id),
            moviesAPI.getSimilar(id),
            moviesAPI.getVideos(id),
          ],
        );
        setMovie(movieRes.data);
        setCredits(creditsRes.data);
        setSimilar(similarRes.data?.results || []);
        setVideos(videosRes.data?.results || []);
      } catch (error) {
        console.error('Error fetching movie:', error);
        // setError(error); // Use error state
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchMovie();
      window.scrollTo(0, 0);
    }
  }, [id]);

  // Fetch reviews separate effect
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/reviews/${id}/movie`);
        setReviews(res?.data || res || []);
      } catch (error) {
        console.warn('Review fetch error', error);
      }
    };
    fetchReviews();
  }, [id]);

  // Check watchlist & User Rating
  useEffect(() => {
    const checkUserData = async () => {
      if (!user || !id) return;
      try {
        const [watchlistRes, ratingRes] = await Promise.all([
          api.get(`/watchlist/check/${id}/movie`),
          api.get(`/ratings/user/${id}/movie`),
        ]);

        setInWatchlist(
          watchlistRes.data?.inWatchlist || watchlistRes.inWatchlist || false,
        );

        const score = ratingRes?.data?.score;
        if (score) setUserRating(score);
      } catch (error) {
        console.warn('User data fetch error', error);
      }
    };
    checkUserData();
  }, [id, user]);

  const handleReviewSubmitted = (newReview) => {
    setReviews([newReview, ...reviews]);
  };

  const toggleWatchlist = async () => {
    if (!user) {
      navigate('/login');
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
      console.error('Watchlist toggle error', error);
    }
  };

  if (loading) return <MovieDetailsSkeleton />;
  if (!movie) return <div className='error-state'>Movie not found</div>;

  // Get Trailer (prefer YouTube)
  const trailer =
    videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos[0];

  // Filter Crew for Director and Writers
  const director = credits?.crew?.find((c) => c.job === 'Director');
  const writers = credits?.crew
    ?.filter(
      (c) =>
        c.department === 'Writing' ||
        c.job === 'Screenplay' ||
        c.job === 'Writer',
    )
    .slice(0, 2);

  // significant cast members only
  const cast = credits?.cast?.slice(0, 15) || [];

  // OMDb Fallback data
  const imdbRating = movie.imdbRating || movie.vote_average;
  const imdbVotes = movie.imdbVotes || movie.vote_count;

  return (
    <div className='movie-details-imdb'>
      {/* 1. HEADER SECTION (Title, Year, Rating) */}
      <div className='imdb-header-container'>
        <div className='imdb-header-content'>
          <BackButton />
          <div className='header-top'>
            <h1 className='header-title'>{movie.title}</h1>
          </div>

          <div className='header-meta-row'>
            <span className='header-year'>
              {new Date(movie.release_date).getFullYear()}
            </span>
            {movie.certification && (
              <span className='header-cert'>{movie.certification}</span>
            )}
            <span className='header-runtime'>
              {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
            </span>
          </div>
        </div>

        <div className='imdb-header-rating'>
          <div className='rating-block'>
            <div className='rating-label'>IMDb RATING</div>
            <div className='rating-value'>
              <span className='star-icon'>⭐</span>
              <span className='score-big'>
                {typeof imdbRating === 'number'
                  ? imdbRating.toFixed(1)
                  : imdbRating}
              </span>
              <span className='score-max'>/10</span>
            </div>
            <div className='rating-count'>
              {imdbVotes ? Number(imdbVotes).toLocaleString() : ''}
            </div>
          </div>
          <div
            className='rating-block user-rate'
            onClick={() => {
              if (!user) {
                navigate('/login');
              } else {
                setShowRatingModal(true);
              }
            }}
          >
            <div className='rating-label'>YOUR RATING</div>
            <div className='rating-value action'>
              {userRating > 0 ? (
                <>
                  <span className='star-icon blue'>★</span>
                  <span className='score-big'>{userRating}</span>
                </>
              ) : (
                <>
                  <span className='star-icon hollow'>☆</span>
                  <span className='score-action'>Rate</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION (Media: Poster + Trailer) */}
      <section className='imdb-hero-section'>
        <div className='hero-poster-wrapper'>
          <img
            src={
              movie.poster_path?.startsWith('http')
                ? movie.poster_path
                : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            }
            alt={movie.title}
            className='hero-poster-img'
          />
          <button
            className={`hero-watchlist-ribbon ${inWatchlist ? 'active' : ''}`}
            onClick={toggleWatchlist}
            title='Add to Watchlist'
          >
            {inWatchlist ? '✓' : '+'}
          </button>
        </div>

        <div
          className='hero-media-wrapper'
          style={{
            backgroundImage: `url(${
              movie.backdrop_path?.startsWith('http')
                ? movie.backdrop_path
                : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className='hero-media-overlay'>
            <div className='media-content-center'>
              {trailer && (
                <button
                  className='play-trailer-btn-large'
                  onClick={() => setPlayTrailer(true)}
                >
                  <span className='play-icon'>▶</span>
                  <div className='play-text'>
                    <span className='play-label'>Play Trailer</span>
                    <span className='play-time'>2:30</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {playTrailer && trailer && (
        <VideoModal
          videoKey={trailer.key}
          title={`${movie.title} - Trailer`}
          onClose={() => setPlayTrailer(false)}
        />
      )}

      {/* 3. MAIN CONTENT GRID (2/3 Left, 1/3 Right) */}
      <div className='imdb-content-grid'>
        {/* LEFT COLUMN */}
        <div className='main-column'>
          {/* Plot & Credits */}
          <section className='plot-section'>
            <div className='genres-badges'>
              {movie.genres?.map((g) => (
                <span key={g.id} className='genre-chip'>
                  {g.name}
                </span>
              ))}
            </div>
            <p className='plot-text'>{movie.overview}</p>

            <div className='credits-list-simple'>
              {director && (
                <div className='credit-row'>
                  <span className='credit-label'>Director</span>
                  <Link to={`/person/${director.id}`} className='credit-link'>
                    {director.name}
                  </Link>
                </div>
              )}
              {writers && writers.length > 0 && (
                <div className='credit-row'>
                  <span className='credit-label'>Writers</span>
                  {writers.map((w, i) => (
                    <span key={w.id}>
                      <Link to={`/person/${w.id}`} className='credit-link'>
                        {w.name}
                      </Link>
                      {i < writers.length - 1 && ' • '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <span className='divider'></span>

          {/* Cast */}
          <CastList cast={cast} />

          {/* Reviews */}
          <ReviewSection
            tmdbId={id}
            mediaType='movie'
            reviews={reviews}
            user={user}
            onReviewSubmitted={handleReviewSubmitted}
            movieTitle={movie.title}
            posterPath={movie.poster_path}
          />
        </div>

        {/* RIGHT COLUMN (Sidebar) */}
        <div className='sidebar-column'>
          {/* More Like This */}
          {similar && similar.length > 0 && (
            <div className='sidebar-widget'>
              <div className='section-header-simple text-sm'>
                <h3>More Like This</h3>
              </div>
              <div className='sidebar-movies-list'>
                {similar.slice(0, 6).map((m, index) => (
                  <div
                    key={`sidebar-movie-${m.id}-${index}`}
                    className='sidebar-movie-item'
                  >
                    <div className='sidebar-poster'>
                      <img
                        src={
                          m.poster_path?.startsWith('http')
                            ? m.poster_path
                            : `https://image.tmdb.org/t/p/w92${m.poster_path}`
                        }
                        alt={m.title}
                      />
                    </div>
                    <div className='sidebar-info'>
                      <div className='mini-rating'>
                        ⭐ {m.vote_average?.toFixed(1)}
                      </div>
                      <Link to={`/movie/${m.id}`} className='sidebar-title'>
                        {m.title}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Specs / Details */}
          <div className='sidebar-widget'>
            <div className='section-header-simple text-sm'>
              <h3>Details</h3>
            </div>
            <div className='details-list'>
              <div className='detail-item'>
                <span className='label'>Release Date</span>
                <span className='value'>
                  {new Date(movie.release_date).toLocaleDateString()}
                </span>
              </div>
              {movie.production_countries?.length > 0 && (
                <div className='detail-item'>
                  <span className='label'>Country of Origin</span>
                  <span className='value'>
                    {movie.production_countries.map((c) => c.name).join(', ')}
                  </span>
                </div>
              )}
              {movie.spoken_languages?.length > 0 && (
                <div className='detail-item'>
                  <span className='label'>Language</span>
                  <span className='value'>
                    {movie.spoken_languages.map((l) => l.name).join(', ')}
                  </span>
                </div>
              )}
              {movie.budget > 0 && (
                <div className='detail-item'>
                  <span className='label'>Budget</span>
                  <span className='value'>
                    ${Number(movie.budget).toLocaleString()}
                  </span>
                </div>
              )}
              {movie.revenue > 0 && (
                <div className='detail-item'>
                  <span className='label'>Revenue</span>
                  <span className='value'>
                    ${Number(movie.revenue).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        tmdbId={id}
        mediaType='movie'
        currentRating={userRating}
        title={movie.title}
        onRatingSuccess={(score) => setUserRating(score)}
      />
    </div>
  );
};

export default MovieDetails;
