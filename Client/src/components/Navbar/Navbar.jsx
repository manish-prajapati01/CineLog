import Logo from '../Logo';
import { useEffect, useState, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../../redux/usersSlice';
import { fetchLibrary, clearLibrary } from '../../redux/librarySlice';
import api from '../../services/api';
export default function Navbar() {
  const { user } = useSelector((s) => s.users);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null),
    header = useRef(null);
  const [mobile, setMobile] = useState(
    () => window.matchMedia('(max-width: 1000px)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1000px)');
    const update = () => {
      setMobile(query.matches);
      setOpen(false);
    };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const location = useLocation();
  const wasOpen = useRef(open);
  wasOpen.current = open;
  useEffect(() => {
    if (wasOpen.current) document.getElementById('main-content')?.focus({ preventScroll: true });
    setOpen(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    if (!open || !mobile) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function close(event) {
      if (event.key === 'Tab') {
        const controls = [
          ...header.current.querySelectorAll(
            'a[href],button:not([disabled]),input',
          ),
        ].filter((el) => el.getClientRects().length);
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    function outside(event) {
      if (!header.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open, mobile]);
  useEffect(() => {
    if (user?.id) dispatch(fetchLibrary());
    else dispatch(clearLibrary());
  }, [user?.id, dispatch]);
  useEffect(() => {
    if (localStorage.getItem('token'))
      api
        .get('/auth/me')
        .then((r) => dispatch(setUser(r.data)))
        .catch(() => {});
  }, [dispatch]);
  return (
    <>
      <div
        className={`cl-menu-scrim ${open && mobile ? 'is-open' : ''}`}
        aria-hidden='true'
        onClick={() => setOpen(false)}
      />
      <header ref={header} className={`cl-nav ${open ? 'menu-open' : ''}`}>
        <Logo />
        <button
          ref={menuButton}
          className='cl-menu-toggle'
          aria-expanded={open}
          aria-controls='primary-menu'
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span className='cl-menu-icon' aria-hidden='true'>
            <i />
            <i />
          </span>
          <span>{open ? 'Close' : 'Menu'}</span>
        </button>
        <div
          id='primary-menu'
          aria-hidden={mobile && !open ? true : undefined}
          className={`cl-nav-content ${open ? 'is-open' : ''}`}
        >
          <p className='cl-menu-heading'>EXPLORE CINELOG</p>
          <nav aria-label='Main navigation'>
            <NavLink to='/' end>
              Discover
              <span className='cl-nav-arrow' aria-hidden='true'>
                ↗
              </span>
            </NavLink>
            <NavLink to='/movies'>
              Movies
              <span className='cl-nav-arrow' aria-hidden='true'>
                ↗
              </span>
            </NavLink>
            <NavLink to='/tv'>
              Series
              <span className='cl-nav-arrow' aria-hidden='true'>
                ↗
              </span>
            </NavLink>
            <NavLink to='/watchlist'>
              My library
              <span className='cl-nav-arrow' aria-hidden='true'>
                ↗
              </span>
            </NavLink>
          </nav>
          <form
            className='cl-search'
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim())
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            <span aria-hidden='true'>⌕</span>
            <input
              aria-label='Search films, series and people'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type='submit' aria-label='Search'>
              Search
            </button>
          </form>
          {user ? (
            <div className='cl-account'>
              <Link
                to='/profile'
                className='cl-avatar'
                title='Your profile'
                aria-label='Your profile'
              >
                {user.name?.slice(0, 1)}
              </Link>
              {user.role === 'admin' && <Link to='/admin'>Admin</Link>}
              <button
                className='cl-quiet'
                onClick={() => {
                  dispatch(logout());
                  dispatch(clearLibrary());
                  navigate('/');
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link className='cl-button small' to='/login'>
              Sign in <span>↗</span>
            </Link>
          )}
        </div>
      </header>
    </>
  );
}
