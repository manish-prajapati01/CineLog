import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import tvService from '../../services/tvService';
import api from '../../services/api';
import {
  MovieDetailsSkeleton,
  CastList,
  ReviewSection,
  VideoModal,
  RatingModal,
  BackButton,
} from '../../components';
import '../MovieDetails/MovieDetails.css';
import './TVDetails.css';

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
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Season/Episode State
  const [activeSeason, setActiveSeason] = useState(1);
  const [activeSeasonData, setActiveSeasonData] = useState(null);

  // Video Modal State
  const [playTrailer, setPlayTrailer] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);

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
    if (id) {
      fetchShow();
      window.scrollTo(0, 0);
    }
  }, [id]);

  // Fetch reviews separate effect
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/reviews/${id}/tv`);
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
          api.get(`/watchlist/check/${id}/tv`),
          api.get(`/ratings/user/${id}/tv`),
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

  const handleAddToWatchlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
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
      console.error('Watchlist toggle error', error);
    }
  };

  // Fetch Season Details when activeSeason changes
  useEffect(() => {
    const fetchSeason = async () => {
      if (!id) return;
      try {
        const res = await tvService.getTVSeason(id, activeSeason);
        setActiveSeasonData(res.data);
      } catch (error) {
        console.error('Error fetching season:', error);
      }
    };
    fetchSeason();
  }, [id, activeSeason]);

  const handleSeasonClick = (seasonNum) => {
    setActiveSeason(seasonNum);
  };

  if (loading) return <MovieDetailsSkeleton />;
  if (!show) return <div className='error-state'>TV Show not found</div>;

  const trailer =
    videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos[0];
  const creators = show?.created_by || [];
  const cast = credits?.cast?.slice(0, 15) || [];

  // OMDb Fallback data (simulated/mapped)
  const imdbRating = show.vote_average;
  const imdbVotes = show.vote_count;

  const certification = show.content_ratings?.results?.find(
    (r) => r.iso_3166_1 === 'US',
  )?.rating;

  return (
    <div className='movie-details-imdb'>
      {/* 1. HEADER SECTION */}
      <div className='imdb-header-container'>
        <div className='imdb-header-content'>
          <BackButton />
          <div className='header-top'>
            <h1 className='header-title'>{show.name}</h1>
          </div>

          <div className='header-meta-row'>
            <span className='header-year'>
              {show.first_air_date
                ? show.first_air_date.substring(0, 4)
                : 'N/A'}
              {show.in_production
                ? '–'
                : show.last_air_date
                  ? `–${show.last_air_date.substring(0, 4)}`
                  : ''}
            </span>
            {certification && (
              <span className='header-cert'>{certification}</span>
            )}
            <span className='header-runtime'>
              {show.episode_run_time?.[0]
                ? `${show.episode_run_time[0]}m`
                : 'N/A'}
            </span>
            <span className='header-type'>TV Series</span>
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

      <section className='imdb-hero-section'>
        <div className='hero-poster-wrapper'>
          <img
            src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
            alt={show.name}
            className='hero-poster-img'
          />
          <button
            className={`hero-watchlist-ribbon ${inWatchlist ? 'active' : ''}`}
            onClick={handleAddToWatchlist}
            title='Add to Watchlist'
          >
            {inWatchlist ? '✓' : '+'}
          </button>
        </div>

        <div
          className='hero-media-wrapper'
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${show.backdrop_path})`,
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
          title={`${show.name} - Trailer`}
          onClose={() => setPlayTrailer(false)}
        />
      )}

      {/* 3. MAIN CONTENT GRID */}
      <div className='imdb-content-grid'>
        {/* LEFT COLUMN */}
        <div className='main-column'>
          {/* Plot & Creators */}
          <section className='plot-section'>
            <div className='genres-badges'>
              {show.genres?.map((g) => (
                <span key={g.id} className='genre-chip'>
                  {g.name}
                </span>
              ))}
            </div>
            <p className='plot-text'>{show.overview}</p>

            <div className='credits-list-simple'>
              {creators.length > 0 && (
                <div className='credit-row'>
                  <span className='credit-label'>Creators</span>
                  {creators.map((c, i) => (
                    <span key={c.id}>
                      <Link to={`/person/${c.id}`} className='credit-link'>
                        {c.name}
                      </Link>
                      {i < creators.length - 1 && ' • '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className='seasons-info-block'>
            <div className='section-header-simple'>
              <h3>Seasons</h3>
            </div>

            {/* Season Chips */}
            <div
              className='seasons-list-chip-container'
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              {Array.from({ length: show.number_of_seasons }, (_, i) => {
                const seasonNum = i + 1;
                const isActive = activeSeason === seasonNum;
                return (
                  <button
                    key={seasonNum}
                    className={`season-chip ${isActive ? 'active' : ''}`}
                    onClick={() => handleSeasonClick(seasonNum)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '20px',
                      padding: '6px 16px', // Reduced padding
                      backgroundColor: isActive ? '#f5c518' : 'transparent',
                      color: isActive ? '#000' : '#e0e0e0', // Slightly brighter inactive text
                      border: isActive ? '1px solid #f5c518' : '1px solid #666',
                      fontWeight: isActive ? '700' : '500',
                      fontSize: '0.85rem', // Slightly smaller text
                      transition: 'all 0.2s ease',
                      minWidth: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Season {seasonNum}
                  </button>
                );
              })}
            </div>

            {/* Episode Guide / List */}
            {activeSeasonData && (
              <div className='episodes-list-container'>
                <h4 className='season-heading'>
                  Season {activeSeason}{' '}
                  <span className='episode-count-sub'>
                    ({activeSeasonData.episodes?.length} episodes)
                  </span>
                </h4>

                <div className='episodes-grid'>
                  {activeSeasonData.episodes?.map((episode) => (
                    <div key={episode.id} className='episode-card'>
                      <div className='episode-still'>
                        <img
                          src={
                            episode.still_path
                              ? `https://image.tmdb.org/t/p/w227_and_h127_bestv2${episode.still_path}`
                              : 'https://placehold.co/227x127?text=No+Image'
                          }
                          alt={episode.name}
                        />
                        <div className='episode-number'>
                          S{episode.season_number} • E{episode.episode_number}
                        </div>
                      </div>
                      <div className='episode-info'>
                        <div className='episode-header'>
                          <h5>{episode.name}</h5>
                          <span className='episode-rating'>
                            ⭐ {episode.vote_average?.toFixed(1)}
                          </span>
                        </div>
                        <p className='episode-date'>
                          {episode.air_date
                            ? new Date(episode.air_date).toLocaleDateString()
                            : 'TBA'}
                        </p>
                        <p className='episode-overview'>
                          {episode.overview || 'No overview available.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <span className='divider'></span>

          {/* Cast */}
          <CastList cast={cast} />

          {/* Reviews */}
          <ReviewSection
            tmdbId={id}
            mediaType='tv'
            reviews={reviews}
            user={user}
            onReviewSubmitted={handleReviewSubmitted}
            movieTitle={show.name}
            posterPath={show.poster_path}
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
                    key={`sidebar-show-${m.id}-${index}`}
                    className='sidebar-movie-item'
                  >
                    <div className='sidebar-poster'>
                      <img
                        src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                        alt={m.name}
                      />
                    </div>
                    <div className='sidebar-info'>
                      <div className='mini-rating'>
                        ⭐ {m.vote_average?.toFixed(1)}
                      </div>
                      <Link to={`/tv/${m.id}`} className='sidebar-title'>
                        {m.name}
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
                <span className='label'>First Air Date</span>
                <span className='value'>
                  {new Date(show.first_air_date).toLocaleDateString()}
                </span>
              </div>
              {show.networks?.length > 0 && (
                <div className='detail-item'>
                  <span className='label'>Network</span>
                  <span className='value'>
                    {show.networks.map((n) => n.name).join(', ')}
                  </span>
                </div>
              )}
              <div className='detail-item'>
                <span className='label'>Status</span>
                <span className='value'>{show.status}</span>
              </div>
              {show.production_countries?.length > 0 && (
                <div className='detail-item'>
                  <span className='label'>Country</span>
                  <span className='value'>
                    {show.production_countries.map((c) => c.name).join(', ')}
                  </span>
                </div>
              )}
              {show.spoken_languages?.length > 0 && (
                <div className='detail-item'>
                  <span className='label'>Language</span>
                  <span className='value'>
                    {show.spoken_languages.map((l) => l.name).join(', ')}
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
        mediaType='tv'
        currentRating={userRating}
        title={show.name}
        onRatingSuccess={(score) => setUserRating(score)}
      />
    </div>
  );
};

export default TVDetails;
