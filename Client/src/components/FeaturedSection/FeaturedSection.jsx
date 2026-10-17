import { Link } from 'react-router-dom';
import MovieCard from '../MovieCard/MovieCard';
export default function FeaturedSection({
  title,
  subtitle,
  items = [],
  linkTo = '/movies',
  loading,
  type = 'movie',
}) {
  if (!loading && !items.length) return null;
  return (
    <section className='cl-section'>
      <div className='cl-section-heading'>
        <div>
          <p className='cl-eyebrow'>{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <Link className='cl-text-link' to={linkTo}>
          Explore all <span>↗</span>
        </Link>
      </div>
      <div className='cl-film-row'>
        {loading
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className='cl-skeleton' />
            ))
          : items
              .slice(0, 12)
              .map((item) => (
                <MovieCard key={item.id} item={item} mediaType={type} />
              ))}
      </div>
    </section>
  );
}
