/**
 * TV - Browse TV shows page with region filtering
 * Supports category tabs for region-specific views (All, Airing, Popular, Upcoming)
 * Note: Indian region uses web series filter (no daily soaps)
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MovieCard, MovieGridSkeleton } from '../../components';
import tvService, { tvAPI } from '../../services/tvService';
import '../Movies/Movies.css';

const TV = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const region = searchParams.get('region'); // 'indian', 'hollywood', or null
  const filterParam = searchParams.get('filter') || 'popular'; // Default to popular

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(filterParam);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Get page title based on region
  // Get page title based on region
  const getPageTitle = () => {
    if (region === 'indian') {
      return (
        <span className='flex items-center gap-2'>
          <img
            src='https://flagcdn.com/20x15/in.png'
            srcSet='https://flagcdn.com/40x30/in.png 2x'
            width='20'
            height='15'
            alt='India'
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
          />{' '}
          Indian TV Shows
        </span>
      );
    }
    if (region === 'hollywood') return '🌍 Hollywood TV Shows';
    return 'TV Shows';
  };

  // Category tabs for region-filtered views
  const regionCategories = [
    { key: 'all', label: 'All' },
    { key: 'airing', label: 'Airing' },
    { key: 'popular', label: 'Popular' },
    { key: 'upcoming', label: 'Upcoming' },
  ];

  // Category tabs for general view
  const generalCategories = [
    { key: 'popular', label: 'Popular' },
    { key: 'airing_today', label: 'Airing Today' },
    { key: 'on_the_air', label: 'On TV' },
    { key: 'top_rated', label: 'Top Rated' },
  ];

  // Fetch genres on mount (only for non-region views)
  useEffect(() => {
    if (region) return;
    const fetchGenres = async () => {
      try {
        const res = await tvService.getGenres();
        const genreData = res.data?.genres || res.data?.data || res.data || [];
        setGenres(Array.isArray(genreData) ? genreData : []);
      } catch (error) {
        console.error('Error fetching TV genres:', error);
      }
    };
    fetchGenres();
  }, [region]);

  // Reset category when region changes
  useEffect(() => {
    setCategory(filterParam);
    setPage(1);
  }, [region, filterParam]);

  // Fetch shows when category/page/genre/region changes
  useEffect(() => {
    const fetchShows = async () => {
      setLoading(true);
      setShows([]); // Clear existing shows to prevent stale data
      try {
        let response;

        // Region-based filtering with category support
        if (region === 'indian') {
          switch (category) {
            case 'all':
              response = await tvAPI.getAllIndian(page);
              break;
            case 'airing':
              response = await tvAPI.getAiringIndian(page);
              break;
            case 'upcoming':
              response = await tvAPI.getUpcomingIndian(page);
              break;
            default:
              response = await tvAPI.getPopularIndian(page);
          }
        } else if (region === 'hollywood') {
          switch (category) {
            case 'all':
              response = await tvAPI.getAllHollywood(page);
              break;
            case 'airing':
              response = await tvAPI.getAiringHollywood(page);
              break;
            case 'upcoming':
              response = await tvAPI.getUpcomingHollywood(page);
              break;
            default:
              response = await tvAPI.getPopularHollywood(page);
          }
        } else if (selectedGenre) {
          response = await tvService.getByGenre(selectedGenre, page);
        } else {
          switch (category) {
            case 'airing_today':
              response = await tvService.getAiringToday(page);
              break;
            case 'on_the_air':
              response = await tvService.getOnTheAir(page);
              break;
            case 'top_rated':
              response = await tvService.getTopRated(page);
              break;
            default:
              response = await tvService.getPopular(page);
          }
        }

        const data = response.data || response;
        setShows(data.results || []);
        setTotalPages(Math.min(data.total_pages || 0, 500));
      } catch (error) {
        console.error('Error fetching TV shows:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShows();
    window.scrollTo(0, 0);
  }, [category, page, selectedGenre, region]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSelectedGenre(null);
    setPage(1);
    if (region) {
      setSearchParams({ region, filter: cat });
    }
  };

  const handleGenreChange = (genreId) => {
    setSelectedGenre(genreId === selectedGenre ? null : genreId);
    setPage(1);
  };

  return (
    <div className='tv-page'>
      {/* Back Button */}
      <button className='back-button' onClick={() => navigate(-1)}>
        ←
      </button>

      <div className='page-header'>
        <h1>{getPageTitle()}</h1>
      </div>

      {/* Category Tabs */}
      <div className='category-tabs'>
        {(region ? regionCategories : generalCategories).map((cat) => (
          <button
            key={cat.key}
            className={`category-btn ${category === cat.key && !selectedGenre ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Genre Filters - Only for non-region views */}
      {!region && (
        <div className='genre-filters'>
          {genres.map((genre) => (
            <button
              key={genre.id}
              className={`genre-btn ${selectedGenre === genre.id ? 'active' : ''}`}
              onClick={() => handleGenreChange(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}

      {/* TV Shows Grid */}
      <div className='content-section'>
        {loading ? (
          <MovieGridSkeleton count={20} />
        ) : shows.length > 0 ? (
          <>
            <div className='movies-grid'>
              {shows.map((show, index) => (
                <MovieCard
                  key={show.id}
                  movie={show}
                  index={index}
                  mediaType='tv'
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='pagination'>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className='no-results'>No TV shows found</div>
        )}
      </div>
    </div>
  );
};

export default TV;
