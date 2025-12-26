/**
 * Search - Search results page
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovieCard, MovieGridSkeleton } from '../../components';
import searchService from '../../services/searchService';
import './Search.css';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'multi';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (!query) return;

    const search = async () => {
      setLoading(true);
      try {
        let response;
        switch (type) {
          case 'movie':
            response = await searchService.searchMovies(query, page);
            break;
          case 'tv':
            response = await searchService.searchTV(query, page);
            break;
          case 'person':
            response = await searchService.searchPeople(query, page);
            break;
          default:
            response = await searchService.searchMulti(query, page);
        }
        // Handle both response.data and direct response formats
        const data = response.data || response;
        setResults(data.results || []);
        setTotalPages(data.total_pages || 0);
        setTotalResults(data.total_results || 0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [query, type, page]);

  const handleTypeChange = (newType) => {
    setSearchParams({ q: query, type: newType });
    setPage(1);
  };

  const filterButtons = [
    { key: 'multi', label: 'All' },
    { key: 'movie', label: 'Movies' },
    { key: 'tv', label: 'TV Shows' },
    { key: 'person', label: 'People' },
  ];

  return (
    <div className='search-page'>
      <div className='search-header'>
        <h1>Search Results</h1>
        {query && <p className='search-query'>for "{query}"</p>}
        {totalResults > 0 && (
          <span className='result-count'>{totalResults} results found</span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className='search-filters'>
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            className={`filter-btn ${type === btn.key ? 'active' : ''}`}
            onClick={() => handleTypeChange(btn.key)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className='search-results'>
        {loading ? (
          <MovieGridSkeleton count={12} />
        ) : results.length > 0 ? (
          <>
            <div className='results-grid'>
              {results.map((item, index) => {
                // Handle person results differently
                if (item.media_type === 'person' || type === 'person') {
                  return (
                    <div key={item.id} className='person-result'>
                      <img
                        src={
                          item.profile_path
                            ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                            : '/placeholder-person.jpg'
                        }
                        alt={item.name}
                      />
                      <div className='person-info'>
                        <strong>{item.name}</strong>
                        <span>{item.known_for_department}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <MovieCard
                    key={item.id}
                    movie={item}
                    index={index}
                    mediaType={item.media_type || type}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='pagination'>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className='pagination-btn'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M15 18l-6-6 6-6' />
                  </svg>
                  Previous
                </button>
                <span className='pagination-info'>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className='pagination-btn'
                >
                  Next
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M9 18l6-6-6-6' />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : query ? (
          <div className='no-results'>
            <h2>No results found</h2>
            <p>Try different keywords or check the spelling</p>
          </div>
        ) : (
          <div className='no-query'>
            <h2>Search for movies, TV shows, and people</h2>
            <p>Use the search bar above to find what you're looking for</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
