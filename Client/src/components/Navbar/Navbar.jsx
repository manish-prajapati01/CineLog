/**
 * Navbar Component
 * Dark theme navigation with search
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search results on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const data = await searchAPI.multiSearch(searchQuery);
          setSearchResults(data.results?.slice(0, 8) || []);
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

  const handleResultClick = (item) => {
    setShowResults(false);
    setSearchQuery('');
    if (item.mediaType === 'movie') {
      navigate(`/movie/${item.id}`);
    } else if (item.mediaType === 'tv') {
      navigate(`/tv/${item.id}`);
    } else if (item.mediaType === 'person') {
      navigate(`/person/${item.id}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className='navbar-container'>
        {/* Logo */}
        <Link to='/' className='navbar-logo'>
          <span className='logo-icon'>🎬</span>
          <span className='logo-text'>
            Cine<span className='text-gradient'>Log</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to='/' className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>

          {/* Movies Dropdown */}
          <div className='nav-dropdown'>
            <span
              className={`nav-dropdown-trigger ${location.pathname.startsWith('/movies') ? 'active' : ''}`}
            >
              Movies ▾
            </span>
            <div className='nav-dropdown-menu'>
              <Link to='/movies?region=indian'>
                <img
                  src='https://flagcdn.com/20x15/in.png'
                  srcSet='https://flagcdn.com/40x30/in.png 2x'
                  width='20'
                  height='15'
                  alt='India'
                  style={{ marginRight: '8px', verticalAlign: 'middle' }}
                />
                Indian Movies
              </Link>
              <Link to='/movies?region=hollywood'>🌍 Hollywood Movies</Link>
            </div>
          </div>

          {/* TV Shows Dropdown */}
          <div className='nav-dropdown'>
            <span
              className={`nav-dropdown-trigger ${location.pathname.startsWith('/tv') ? 'active' : ''}`}
            >
              TV Shows ▾
            </span>
            <div className='nav-dropdown-menu'>
              <Link to='/tv?region=indian'>
                <img
                  src='https://flagcdn.com/20x15/in.png'
                  srcSet='https://flagcdn.com/40x30/in.png 2x'
                  width='20'
                  height='15'
                  alt='India'
                  style={{ marginRight: '8px', verticalAlign: 'middle' }}
                />
                Indian TV Shows
              </Link>
              <Link to='/tv?region=hollywood'>🌍 Hollywood TV Shows</Link>
            </div>
          </div>
          {user && (
            <Link
              to='/watchlist'
              className={location.pathname === '/watchlist' ? 'active' : ''}
            >
              Watchlist
            </Link>
          )}
        </div>

        {/* Search */}
        <div className='navbar-search' ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <div className='search-input-wrapper'>
              <svg
                className='search-icon'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <circle cx='11' cy='11' r='8' />
                <path d='m21 21-4.35-4.35' />
              </svg>
              <input
                type='text'
                placeholder='Search movies, TV shows, people...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
              {searchQuery && (
                <button
                  type='button'
                  className='clear-btn'
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className='search-results'>
              {searchResults.map((item) => (
                <div
                  key={`${item.mediaType}-${item.id}`}
                  className='search-result-item'
                  onClick={() => handleResultClick(item)}
                >
                  <img
                    src={
                      item.posterPath || item.profilePath || '/placeholder.jpg'
                    }
                    alt=''
                    className='result-poster'
                  />
                  <div className='result-info'>
                    <span className='result-title'>
                      {item.title || item.name}
                    </span>
                    <span className='result-meta'>
                      <span className={`media-badge ${item.mediaType}`}>
                        {item.mediaType === 'movie'
                          ? '🎬 Movie'
                          : item.mediaType === 'tv'
                            ? '📺 TV'
                            : '👤 Person'}
                      </span>
                      {item.releaseDate || item.firstAirDate ? (
                        <span className='result-year'>
                          {new Date(
                            item.releaseDate || item.firstAirDate,
                          ).getFullYear()}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
              ))}
              <div
                className='search-results-footer'
                onClick={handleSearchSubmit}
              >
                See all results for &quot;{searchQuery}&quot;
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className='navbar-user'>
          {user ? (
            <div className='user-menu'>
              <div className='user-avatar'>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className='user-dropdown'>
                <div className='dropdown-header'>
                  <span className='dropdown-name'>{user.name}</span>
                  <span className='dropdown-email'>{user.email}</span>
                </div>
                <div className='dropdown-divider' />
                <Link to='/profile'>Profile</Link>
                {user.role === 'admin' && <Link to='/admin'>Admin Panel</Link>}
                <div className='dropdown-divider' />
                <button onClick={handleLogout} className='logout-btn'>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className='auth-buttons'>
              <Link to='/login' className='btn btn-ghost'>
                Login
              </Link>
              <Link to='/register' className='btn btn-primary'>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className='mobile-menu-toggle'
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={mobileMenuOpen ? 'open' : ''} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
