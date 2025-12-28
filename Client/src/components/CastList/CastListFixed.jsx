import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './CastList.css';

/**
 * CastList Component (Fixed)
 * Bypassing locked file issue.
 */
const CastList = ({ cast, title = 'Top Billed Cast' }) => {
  if (!cast || cast.length === 0) return null;

  return (
    <div className='cast-section'>
      <h3 className='cast-title'>{title}</h3>
      <div className='cast-scroller'>
        {cast.slice(0, 20).map((person) => {
          const profilePath = person.profile_path
            ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                person.name || 'Unknown',
              )}&background=random&size=185`;

          return (
            <div key={person.id} className='cast-card'>
              <Link to={`/person/${person.id}`} className='cast-link'>
                <div className='cast-image-wrapper'>
                  <img
                    src={profilePath}
                    alt={person.name}
                    className='cast-image'
                    loading='lazy'
                  />
                </div>
                <div className='cast-info'>
                  <span className='cast-name'>{person.name}</span>
                  <span className='cast-character'>
                    {person.character || 'Unknown'}
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

CastList.propTypes = {
  cast: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      character: PropTypes.string,
      profile_path: PropTypes.string,
    }),
  ),
  title: PropTypes.string,
};

export default CastList;
