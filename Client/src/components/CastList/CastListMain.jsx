import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './CastList.css';

const CastList = ({ cast }) => {
  if (!cast || cast.length === 0) return null;

  return (
    <section className='cast-section'>
      <div className='section-header-simple'>
        <h3>Top Cast</h3>
      </div>
      <div className='cast-scroller'>
        {cast.map((person) => (
          <Link
            to={`/person/${person.id}`}
            key={person.id}
            className='cast-card'
          >
            <div className='cast-avatar'>
              <img
                src={
                  person.profile_path
                    ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                    : 'https://via.placeholder.com/138x175?text=No+Image'
                }
                alt={person.name}
                loading='lazy'
              />
            </div>
            <div className='cast-info'>
              <span className='cast-name'>{person.name}</span>
              <span className='cast-character'>{person.character}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

CastList.propTypes = {
  cast: PropTypes.arrayOf(PropTypes.object),
};

export default CastList;
