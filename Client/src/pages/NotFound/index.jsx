import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <section className='cl-page cl-not-found'>
      <p className='cl-eyebrow'>404 / SCENE NOT FOUND</p>
      <span className='cl-404-mark' aria-hidden='true'>
        404
      </span>
      <h1>This scene is missing.</h1>
      <p>
        The page may have moved, or the link may be incomplete. Your next great
        story is still out there.
      </p>
      <div className='cl-actions'>
        <Link className='cl-button' to='/'>
          Back to discovery
        </Link>
        <Link className='cl-button secondary' to='/search'>
          Search CineLog
        </Link>
      </div>
    </section>
  );
}
