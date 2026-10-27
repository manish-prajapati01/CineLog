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
          <Link to='/upcoming'>Coming soon</Link>
          <Link to='/indian-cinema'>Indian cinema</Link>
        </nav>
        <nav aria-label='Your CineLog'>
          <h2>Your CineLog</h2>
          <Link to='/watchlist'>My library</Link>
          <Link to='/profile'>My profile</Link>
          <Link to='/collections'>Collections</Link>
          <Link to='/calendar'>Release calendar</Link>
          <Link to='/tracking'>Series progress</Link>
          <Link to='/privacy'>Privacy policy</Link>
          <Link to='/terms'>Terms of use</Link>
        </nav>
      </div>
      <div className='cl-footer-bottom'>
        <p>© {new Date().getFullYear()} CineLog</p>
        <p>
          Film and series data by <a href='https://www.themoviedb.org/' target='_blank' rel='noopener noreferrer'>TMDB</a>
          .<br />
          This product is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}
