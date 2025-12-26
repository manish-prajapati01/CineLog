/**
 * Person - Actor/crew details page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MovieCard } from '../../components';
import searchService from '../../services/searchService';
import './Person.css';

const Person = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [loading, setLoading] = useState(true);
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    const fetchPerson = async () => {
      setLoading(true);
      try {
        const [personRes, creditsRes] = await Promise.all([
          searchService.getPersonDetails(id),
          searchService.getPersonCredits(id),
        ]);
        setPerson(personRes.data);
        setCredits(creditsRes.data);
      } catch (error) {
        console.error('Error fetching person:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerson();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className='person-loading'>
        <div className='skeleton skeleton-poster' />
        <div className='skeleton-content'>
          <div className='skeleton skeleton-title' />
          <div className='skeleton skeleton-text' />
          <div className='skeleton skeleton-text' />
        </div>
      </div>
    );
  }

  if (!person) return <div className='error-state'>Person not found</div>;

  const profileUrl = person.profile_path
    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
    : '/placeholder-person.jpg';

  const knownFor = [...(credits.cast || []), ...(credits.crew || [])]
    .filter((item) => item.poster_path)
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    .slice(0, 8);

  const age = person.birthday
    ? new Date().getFullYear() - new Date(person.birthday).getFullYear()
    : null;

  return (
    <div className='person-page'>
      <button className='back-button' onClick={() => navigate(-1)}>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M19 12H5M12 19l-7-7 7-7' />
        </svg>
      </button>

      <div className='person-content'>
        <div className='person-sidebar'>
          <img src={profileUrl} alt={person.name} className='person-photo' />

          <div className='person-facts'>
            <h3>Personal Info</h3>

            <div className='fact'>
              <strong>Known For</strong>
              <span>{person.known_for_department}</span>
            </div>

            {person.gender && (
              <div className='fact'>
                <strong>Gender</strong>
                <span>
                  {person.gender === 1
                    ? 'Female'
                    : person.gender === 2
                      ? 'Male'
                      : 'Other'}
                </span>
              </div>
            )}

            {person.birthday && (
              <div className='fact'>
                <strong>Birthday</strong>
                <span>
                  {new Date(person.birthday).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {age && !person.deathday && ` (${age} years old)`}
                </span>
              </div>
            )}

            {person.deathday && (
              <div className='fact'>
                <strong>Deathday</strong>
                <span>
                  {new Date(person.deathday).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {person.place_of_birth && (
              <div className='fact'>
                <strong>Place of Birth</strong>
                <span>{person.place_of_birth}</span>
              </div>
            )}
          </div>
        </div>

        <div className='person-main'>
          <h1 className='person-name'>{person.name}</h1>

          {person.biography && (
            <div className='person-bio'>
              <h3>Biography</h3>
              <p className={showFullBio ? 'expanded' : ''}>
                {showFullBio
                  ? person.biography
                  : person.biography.slice(0, 600)}
                {person.biography.length > 600 && !showFullBio && '...'}
              </p>
              {person.biography.length > 600 && (
                <button
                  className='read-more'
                  onClick={() => setShowFullBio(!showFullBio)}
                >
                  {showFullBio ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          )}

          {knownFor.length > 0 && (
            <div className='known-for-section'>
              <h3>Known For</h3>
              <div className='known-for-grid'>
                {knownFor.map((item, index) => (
                  <MovieCard
                    key={`${item.id}-${index}`}
                    movie={item}
                    index={index}
                    mediaType={item.media_type || (item.title ? 'movie' : 'tv')}
                    size='small'
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Person;
