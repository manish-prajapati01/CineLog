/**
 * TV - Browse TV shows page with region filtering
 * Supports category tabs for region-specific views (All, Airing, Popular, Upcoming)
 * Note: Indian region uses web series filter (no daily soaps)
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MovieCard, MovieGridSkeleton, Dropdown } from '../../components';
import tvService from '../../services/tvService';
import '../Movies/Movies.css';

const TV = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Params State
  const region = searchParams.get('region'); // 'indian', 'hollywood', or null
  const filterParam = searchParams.get('filter') || 'popular';
  const genreParam = searchParams.get('genre');
  const langParam = searchParams.get('language') || '';

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(filterParam);
  const [language, setLanguage] = useState(langParam);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(
    genreParam ? parseInt(genreParam) : null,
  );

  // Get page title based on region
  // Get page title based on region
  const getPageTitle = () => {
    if (region === 'indian') {
      return <span className='flex items-center gap-2'>Indian TV Shows</span>;
    }
    if (region === 'hollywood') return '🌍 Hollywood TV Shows';
    return 'TV Shows';
  };

  // Category tabs for region-filtered views
  const regionCategories = [
    { key: 'popular', label: 'Popular' },
    { key: 'airing_today', label: 'Airing Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'top_rated', label: 'Top Rated' },
  ];

  // Category tabs for general view
  const generalCategories = [
    { key: 'popular', label: 'Popular' },
    { key: 'airing_today', label: 'Airing Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'top_rated', label: 'Top Rated' },
  ];

  // Fetch genres on mount (only for non-region views)
  // Fetch genres on mount
  // Fetch genres on mount
  useEffect(() => {
    // Simplified Genre List per user request
    const simplifiedGenres = [
      { id: 10759, name: 'Action & Adventure' }, // TV Action
      { id: 18, name: 'Drama' },
      { id: 35, name: 'Comedy' },
      { id: 9648, name: 'Mystery' },
      { id: 10749, name: 'Romance' },
    ];
    setGenres(simplifiedGenres);
  }, []);

  // Reset category when region changes
  useEffect(() => {
    setCategory(filterParam);
    setPage(1);
  }, [region, filterParam]);

  // Sync selectedGenre with URL params
  useEffect(() => {
    if (genreParam) {
      setSelectedGenre(parseInt(genreParam));
    } else {
      setSelectedGenre(null);
    }
  }, [genreParam]);

  // Fetch shows when category/page/genre/region changes
  useEffect(() => {
    const fetchShows = async () => {
      setLoading(true);
      setShows([]); // Clear existing shows to prevent stale data
      try {
        let response;

        const filters = { language: language };

        // Region-based filtering with category support
        if (region === 'indian') {
          switch (category) {
            case 'airing_today':
              response = await tvService.getAiringIndian(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'upcoming':
              response = await tvService.getUpcomingIndian(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'top_rated':
              response = await tvService.getTopRatedIndian(
                page,
                selectedGenre,
                filters,
              );
              break;
            default:
              response = await tvService.getPopularIndian(
                page,
                selectedGenre,
                filters,
              );
          }
        } else if (region === 'hollywood') {
          switch (category) {
            case 'airing_today':
              response = await tvService.getAiringHollywood(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'upcoming':
              response = await tvService.getUpcomingHollywood(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'top_rated':
              response = await tvService.getTopRatedHollywood(
                page,
                selectedGenre,
                filters,
              );
              break;
            default:
              response = await tvService.getPopularHollywood(
                page,
                selectedGenre,
                filters,
              );
          }
        } else if (selectedGenre && category === 'popular') {
          // If using getByGenre directly, might not support complex sorts easily without backend update,
          // but generic discover supports it. For now, fallback to generic popular with filters if complexity rises.
          // Actually, let's trust simple filtering.
          response = await tvService.getByGenre(selectedGenre, page);
          // NOTE: getByGenre logic might ignore sort/lang params unless updated.
          // But user asked for filters on "hollywood/indian" specifically.
          // For generic pages, we'll use discover based methods below.
        } else {
          switch (category) {
            case 'airing_today':
              response = await tvService.getAiringToday(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'upcoming':
              // Using On The Air as "Upcoming" proxy for general view
              response = await tvService.getOnTheAir(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'top_rated':
              response = await tvService.getTopRated(
                page,
                selectedGenre,
                filters,
              );
              break;
            default:
              response = await tvService.getPopular(
                page,
                selectedGenre,
                filters,
              );
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
  }, [category, page, selectedGenre, region, language]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    // Keep genre if selected
    setPage(1);
    const newParams = { filter: cat };
    if (region) newParams.region = region;
    if (selectedGenre) newParams.genre = selectedGenre;
    setSearchParams(newParams);
  };

  const handleGenreChange = (genreId) => {
    const newGenre = genreId === selectedGenre ? null : genreId;
    setSelectedGenre(newGenre);
    setPage(1);
    const newParams = { filter: category };
    if (region) newParams.region = region;
    if (newGenre) newParams.genre = newGenre;
    setSearchParams(newParams);
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
            className={`category-btn ${category === cat.key ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Advanced Filter Bar */}
      <div className='filter-bar'>
        {/* Language Filter (Indian Only) */}
        {region === 'indian' && (
          <div className='filter-group'>
            <label className='filter-label'>Language:</label>
            <Dropdown
              options={[
                { value: '', label: 'All Languages' },
                { value: 'hi', label: 'Hindi' },
                { value: 'ta', label: 'Tamil' },
                { value: 'te', label: 'Telugu' },
                { value: 'ml', label: 'Malayalam' },
                { value: 'kn', label: 'Kannada' },
              ]}
              value={language}
              onChange={(val) => {
                setLanguage(val);
                setSearchParams({
                  ...Object.fromEntries(searchParams),
                  language: val,
                });
              }}
              placeholder='Select Language'
            />
          </div>
        )}

        {/* Genre Filter - Dropdown */}
        <div className='filter-group'>
          <label className='filter-label'>Genre:</label>
          <Dropdown
            options={[
              { value: '', label: 'All Genres' },
              ...genres.map((g) => ({ value: g.id, label: g.name })),
            ]}
            value={selectedGenre || ''}
            onChange={(val) => handleGenreChange(val ? parseInt(val) : null)}
            placeholder='Select Genre'
          />
        </div>
      </div>

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
