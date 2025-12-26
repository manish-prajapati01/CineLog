/**
 * Watchlist - User's watchlist page
 */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MovieCard, MovieGridSkeleton } from '../../components';
import watchlistService from '../../services/watchlistService';
import './Watchlist.css';

const Watchlist = () => {
  const { user } = useSelector((state) => state.users);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const res = await watchlistService.getWatchlist();
        setItems(res.data || []);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, [user, navigate]);

  const handleRemove = async (tmdbId, mediaType) => {
    try {
      await watchlistService.remove(tmdbId, mediaType);
      setItems(items.filter((item) => item.tmdbId !== tmdbId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const filteredItems =
    filter === 'all'
      ? items
      : items.filter((item) => item.mediaType === filter);

  const movieCount = items.filter((i) => i.mediaType === 'movie').length;
  const tvCount = items.filter((i) => i.mediaType === 'tv').length;

  return (
    <div className='watchlist-page'>
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

      <div className='page-header'>
        <div className='header-main'>
          <h1>🎬 My Watchlist</h1>
          <p className='watchlist-count'>{items.length} items saved</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className='filter-tabs'>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({items.length})
        </button>
        <button
          className={`filter-btn ${filter === 'movie' ? 'active' : ''}`}
          onClick={() => setFilter('movie')}
        >
          Movies ({movieCount})
        </button>
        <button
          className={`filter-btn ${filter === 'tv' ? 'active' : ''}`}
          onClick={() => setFilter('tv')}
        >
          TV Shows ({tvCount})
        </button>
      </div>

      {/* Watchlist Items */}
      <div className='watchlist-content'>
        {loading ? (
          <MovieGridSkeleton count={12} />
        ) : filteredItems.length > 0 ? (
          <div className='watchlist-grid'>
            {filteredItems.map((item, index) => (
              <div key={item._id} className='watchlist-item'>
                <MovieCard
                  movie={{
                    id: item.tmdbId,
                    title: item.title,
                    name: item.title,
                    poster_path: item.posterPath,
                    vote_average: item.rating,
                  }}
                  index={index}
                  mediaType={item.mediaType}
                />
                <button
                  className='remove-btn'
                  onClick={() => handleRemove(item.tmdbId, item.mediaType)}
                  title='Remove from watchlist'
                />
              </div>
            ))}
          </div>
        ) : (
          <div className='empty-watchlist'>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📺</div>
            <h2>Your watchlist is empty</h2>
            <p>
              Add movies and TV shows to keep track of what you want to watch.
            </p>
            <button onClick={() => navigate('/movies')} className='browse-btn'>
              Browse Movies
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
