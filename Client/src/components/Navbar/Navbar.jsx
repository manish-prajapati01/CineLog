/**
 * Navbar Component (IMDb Clone)
 * Features: Yellow Logo, Mega Menu, Centered Search, User Actions
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../redux/usersSlice';
import { searchAPI } from '../../services';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);

  // Search Filters
  const searchFilters = [
    { key: 'multi', label: 'All' },
    { key: 'movie', label: 'Movies' },
    { key: 'tv', label: 'TV Shows' },
    { key: 'person', label: 'Celebs' },
  ];
  const [searchCategory, setSearchCategory] = useState('multi');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target)
      ) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mega menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Debounced search: Waits 300ms after user stops typing to fetch results
  // This prevents making API calls for every single keystroke.
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const data = await searchAPI.multiSearch(searchQuery);
          setSearchResults(data.results?.slice(0, 6) || []);
          setShowResults(true);
        } catch (error) {
          console.error('Search error:', error);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(setUser(null));
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `/search?q=${encodeURIComponent(searchQuery)}&type=${searchCategory}`,
      );
      setShowResults(false);
    }
  };

  return (
    <>
      <nav className='navbar'>
        <div className='navbar-container'>
          {/* 1. Logo */}
          <Link to='/' className='navbar-logo'>
            CineLog
          </Link>

          {/* 2. Menu Button (Triggers Mega Menu) */}
          <button
            className={`menu-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className='menu-icon'>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>Menu</span>
          </button>

          {/* 3. Search Bar */}
          <div className='navbar-search' ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className='search-input-wrapper'>
                <div
                  className='search-category'
                  ref={searchDropdownRef}
                  onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
                >
                  {searchFilters.find((f) => f.key === searchCategory)?.label ||
                    'All'}
                  {searchDropdownOpen && (
                    <div className='search-category-dropdown'>
                      {searchFilters.map((filter) => (
                        <div
                          key={filter.key}
                          className={`search-category-item ${searchCategory === filter.key ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchCategory(filter.key);
                            setSearchDropdownOpen(false);
                          }}
                        >
                          {filter.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type='text'
                  placeholder='Search IMDb'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() =>
                    searchResults.length > 0 && setShowResults(true)
                  }
                />
                <button type='submit' className='search-btn'>
                  <svg viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' />
                  </svg>
                </button>
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className='search-results'>
                {searchResults.map((item) => (
                  <div
                    key={`${item.mediaType}-${item.id}`}
                    className='search-result-item'
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery('');
                      navigate(
                        item.mediaType === 'person'
                          ? `/person/${item.id}`
                          : `/${item.mediaType}/${item.id}`,
                      );
                    }}
                  >
                    <img
                      src={
                        item.posterPath ||
                        item.profilePath ||
                        '/placeholder.jpg'
                      }
                      alt=''
                      className='result-poster'
                    />
                    <div className='result-info'>
                      <span className='result-title'>
                        {item.title || item.name}
                      </span>
                      <span className='result-meta'>
                        {item.mediaType === 'movie'
                          ? 'Movie'
                          : item.mediaType === 'tv'
                            ? 'TV Series'
                            : 'Person'}
                        {item.releaseDate
                          ? ` • ${item.releaseDate.split('-')[0]}`
                          : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Right Actions */}
          <div className='navbar-actions'>
            <div className='separator'></div>

            <Link to='/watchlist' className='nav-link-btn'>
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='currentColor'
                style={{ marginRight: '-4px' }}
              >
                <path d='M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z' />
              </svg>
              <span>Watchlist</span>
            </Link>

            {user ? (
              <div className='user-menu'>
                <button className='user-menu-trigger'>
                  <div className='user-avatar-small'>
                    {user.avatar ? (
                      <img src={user.avatar} alt='User' />
                    ) : (
                      user.name?.[0]
                    )}
                  </div>
                  <span>{user.name?.split(' ')[0]}</span>
                  <span style={{ fontSize: '0.7em' }}>▼</span>
                </button>
                <div className='user-dropdown-content'>
                  {user.role === 'admin' && (
                    <Link to='/admin' className='dropdown-item'>
                      Admin Dashboard
                    </Link>
                  )}
                  <Link to='/profile' className='dropdown-item'>
                    Your Profile
                  </Link>
                  <Link to='/watchlist' className='dropdown-item'>
                    Your Watchlist
                  </Link>
                  <button onClick={handleLogout} className='dropdown-item'>
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to='/login' className='nav-link-btn'>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mega Menu Overlay */}
      <div
        className={`mega-menu-overlay ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        <div className='mega-menu-content' onClick={(e) => e.stopPropagation()}>
          <div className='mega-menu-grid'>
            <div className='menu-column'>
              <h3>🎬 Movies</h3>
              <ul>
                <li>
                  <Link to='/movies?filter=popular&region=hollywood'>
                    Popular Movies
                  </Link>
                </li>
                <li>
                  <Link to='/movies?filter=now_playing&region=hollywood'>
                    Now Playing
                  </Link>
                </li>
                <li>
                  <Link to='/movies?filter=upcoming&region=hollywood'>
                    Upcoming Releases
                  </Link>
                </li>
                <li>
                  <Link to='/movies?filter=top_rated&region=hollywood'>
                    Top Rated
                  </Link>
                </li>
                <li>
                  <Link to='/movies?region=indian'>Indian Movies</Link>
                </li>
              </ul>
            </div>

            <div className='menu-column'>
              <h3>📺 TV Shows</h3>
              <ul>
                <li>
                  <Link to='/tv?filter=popular&region=hollywood'>
                    Popular TV Shows
                  </Link>
                </li>
                <li>
                  <Link to='/tv?filter=airing_today&region=hollywood'>
                    Airing Today
                  </Link>
                </li>
                <li>
                  <Link to='/tv?filter=upcoming&region=hollywood'>
                    Upcoming TV Shows
                  </Link>
                </li>
                <li>
                  <Link to='/tv?filter=top_rated&region=hollywood'>
                    Top Rated TV Shows
                  </Link>
                </li>
                <li>
                  <Link to='/tv?region=indian'>Indian TV Shows</Link>
                </li>
              </ul>
            </div>

            <div className='menu-column'>
              <h3>🎭 Genres</h3>
              <ul>
                <li>
                  <Link to='/movies?genre=28&region=hollywood'>Action</Link>
                </li>
                <li>
                  <Link to='/movies?genre=35&region=hollywood'>Comedy</Link>
                </li>
                <li>
                  <Link to='/movies?genre=18&region=hollywood'>Drama</Link>
                </li>
                <li>
                  <Link to='/movies?genre=27&region=hollywood'>Horror</Link>
                </li>
                <li>
                  <Link to='/movies?genre=10749&region=hollywood'>Romance</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
