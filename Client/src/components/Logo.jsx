import { Link } from 'react-router-dom';
export default function Logo({ compact = false }) {
  return (
    <Link to='/' className='cl-logo' aria-label='CineLog home'>
      <svg
        className='cl-brand-mark'
        viewBox='0 0 40 44'
        fill='none'
        aria-hidden='true'
      >
        <path d='M30 5H13L5 13v23h25' stroke='currentColor' strokeWidth='2.5' />
        <path
          d='M24 13H14v15h10M32 16v20h6'
          stroke='currentColor'
          strokeWidth='2.5'
        />
        <path d='M5 14h5M5 24h5M5 33h5' stroke='currentColor' strokeWidth='2' />
      </svg>
      {!compact && (
        <span className='cl-brand-word'>
          CINELOG<span className='cl-brand-caption'>A LIFE IN CINEMA</span>
        </span>
      )}
    </Link>
  );
}
