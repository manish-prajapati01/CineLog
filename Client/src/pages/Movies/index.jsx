/**
 * Movies - Browse movies page with region filtering
 * Supports category tabs for region-specific views (All, Airing, Popular, Upcoming)
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MovieCard, MovieGridSkeleton, Dropdown } from '../../components';
import { moviesAPI } from '../../services';
import './Movies.css';

const Movies = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const region = searchParams.get('region'); // 'indian', 'hollywood', or null
  const filterParam = searchParams.get('filter') || 'popular'; // Default to popular
  const genreParam = searchParams.get('genre');
  const langParam = searchParams.get('language') || '';

  const [movies, setMovies] = useState([]);
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
      return <span className='flex items-center gap-2'>Indian Movies</span>;
    }
    if (region === 'hollywood') return '🌍 Hollywood Movies';
    return 'Movies';
  };

  // Category tabs for region-filtered views
  const regionCategories = [
    { key: 'popular', label: 'Popular' },
    { key: 'now_playing', label: 'Now Playing' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'top_rated', label: 'Top Rated' },
  ];

  // Category tabs for general view
  const generalCategories = [
    { key: 'popular', label: 'Popular' },
    { key: 'now_playing', label: 'Now Playing' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'top_rated', label: 'Top Rated' },
  ];

  // Fetch genres on mount
  useEffect(() => {
    // Simplified Genre List per user request
    const simplifiedGenres = [
      { id: 28, name: 'Action' },
      { id: 18, name: 'Drama' },
      { id: 35, name: 'Comedy' },
      { id: 27, name: 'Horror' },
      { id: 10749, name: 'Romance' },
    ];
    setGenres(simplifiedGenres);
  }, []);

  // ... (Reset category effect) ...

  // ... (Sync selectedGenre effect) ...

  // Fetch movies when category/page/genre/region changes
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setMovies([]); // Clear existing movies to prevent stale data
      try {
        let response;
        const filters = { language: language };

        // Region-based filtering with category support
        if (region === 'indian') {
          switch (category) {
            case 'now_playing':
              response = await moviesAPI.getAiringIndian(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'upcoming':
              response = await moviesAPI.getUpcomingIndian(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'top_rated':
              response = await moviesAPI.getTopRatedIndian(
                page,
                selectedGenre,
                filters,
              );
              break;
            default:
              response = await moviesAPI.getPopularIndian(
                page,
                selectedGenre,
                filters,
              );
          }
        } else if (region === 'hollywood') {
          switch (category) {
            case 'now_playing':
              response = await moviesAPI.getAiringHollywood(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'upcoming':
              response = await moviesAPI.getUpcomingHollywood(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'top_rated':
              response = await moviesAPI.getTopRatedHollywood(
                page,
                selectedGenre,
                filters,
              );
              break;
            default:
              response = await moviesAPI.getPopularHollywood(
                page,
                selectedGenre,
                filters,
              );
          }
        } else if (selectedGenre && category === 'popular') {
          // If genre selected and in default "popular" view, use getByGenre
          response = await moviesAPI.getByGenre(selectedGenre, page);
        } else {
          // Global views
          switch (category) {
            case 'now_playing':
              response = await moviesAPI.getNowPlaying(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'upcoming':
              response = await moviesAPI.getUpcoming(
                page,
                selectedGenre,
                filters,
              );
              break;
            case 'top_rated':
              response = await moviesAPI.getTopRated(
                page,
                selectedGenre,
                filters,
              );
              break;
            default:
              response = await moviesAPI.getPopular(
                page,
                selectedGenre,
                filters,
              );
          }
        }

        const data = response.data || response;
        setMovies(data.results || []);
        setTotalPages(Math.min(data.total_pages || 0, 500));
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
    window.scrollTo(0, 0);
  }, [category, page, selectedGenre, region, language]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    // Don't reset genre if it's there? The user might want "Indian -> Action -> Top Rated"
    // But currently UI might imply tabs switch everything. Let's keep genre.
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
    <div className='movies-page'>
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

        {/* Genre Filter */}
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

      {/* Movies Grid */}
      <div className='content-section'>
        {loading ? (
          <MovieGridSkeleton count={20} />
        ) : movies.length > 0 ? (
          <>
            <div className='movies-grid'>
              {movies.map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  index={index}
                  mediaType='movie'
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
          <div className='no-results'>No movies found</div>
        )}
      </div>
    </div>
  );
};

export default Movies;
