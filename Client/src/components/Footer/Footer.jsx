import Logo from '../Logo';
import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer className='cl-footer cl-footer-editorial'>
      <div className='cl-footer-main'>
        <div className='cl-footer-brand'>
          <Logo />
          <p>Keep the films. Remember the feeling.</p>
          <span>Your watchlist, ratings and stories from the screen.</span>
        </div>
        <nav aria-label='Explore CineLog'>
          <h2>Explore</h2>
          <Link to='/'>Discover</Link>
          <Link to='/movies'>Movies</Link>
          <Link to='/tv'>Series</Link>
          <Link to='/search'>Search titles</Link>
        </nav>
        <nav aria-label='Your CineLog'>
          <h2>Your CineLog</h2>
          <Link to='/watchlist'>My library</Link>
          <Link to='/profile'>My profile</Link>
        </nav>
      </div>
      <div className='cl-footer-bottom'>
        <p>© {new Date().getFullYear()} CineLog</p>
        <p>
          Film and series data by <span>TMDB</span>
          .<br />
          This product is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}
