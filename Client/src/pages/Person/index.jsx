/**
 * Person - Actor/crew details page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
      <div className='person-loading-state'>
        <div className='spinner'></div>
      </div>
    );
  }

  if (!person) return <div className='error-state'>Person not found</div>;

  const profileUrl = person.profile_path
    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
    : 'https://via.placeholder.com/300x450?text=No+Image';

  // Filter 'Known For' to show best works (with posters)
  // Sort by popularity (vote_count) and remove duplicates
  const knownFor = [...(credits.cast || []), ...(credits.crew || [])]
    .filter((item) => item.poster_path)
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    // Dedup by ID
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
    .slice(0, 10);

  const age = person.birthday
    ? new Date().getFullYear() - new Date(person.birthday).getFullYear()
    : null;

  // Filmography: Sort by year descending
  const sortedCast = (credits.cast || []).sort((a, b) => {
    const dateA = new Date(a.release_date || a.first_air_date || '0000-01-01');
    const dateB = new Date(b.release_date || b.first_air_date || '0000-01-01');
    return dateB - dateA;
  });

  return (
    <div className='person-page-container'>
      <button className='back-button fixed' onClick={() => navigate(-1)}>
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

      <div className='person-header'>
        <h1 className='person-name-title'>{person.name}</h1>
        {person.known_for_department && (
          <span className='person-role'>{person.known_for_department}</span>
        )}
      </div>

      <div className='person-content-grid'>
        {/* LEFT SIDEBAR (Photo + Stats) */}
        <div className='person-sidebar'>
          <div className='person-photo-wrapper'>
            <img src={profileUrl} alt={person.name} />
          </div>

          <div className='person-personal-info'>
            <h3>Personal Info</h3>

            {person.gender > 0 && (
              <div className='info-item'>
                <span className='label'>Gender</span>
                <span className='value'>
                  {person.gender === 1
                    ? 'Female'
                    : person.gender === 2
                      ? 'Male'
                      : 'Non-binary'}
                </span>
              </div>
            )}

            {person.birthday && (
              <div className='info-item'>
                <span className='label'>Birthday</span>
                <span className='value'>
                  {new Date(person.birthday).toLocaleDateString()}
                  {!person.deathday && age && ` (${age} years old)`}
                </span>
              </div>
            )}

            {person.deathday && (
              <div className='info-item'>
                <span className='label'>Day of Death</span>
                <span className='value'>
                  {new Date(person.deathday).toLocaleDateString()}
                </span>
              </div>
            )}

            {person.place_of_birth && (
              <div className='info-item'>
                <span className='label'>Place of Birth</span>
                <span className='value'>{person.place_of_birth}</span>
              </div>
            )}

            {person.also_known_as?.length > 0 && (
              <div className='info-item'>
                <span className='label'>Also Known As</span>
                <div className='aka-list'>
                  {person.also_known_as.slice(0, 3).map((alias, i) => (
                    <div key={i} className='aka-badge'>
                      {alias}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className='person-main-column'>
          {/* Biography */}
          <section className='person-bio-section'>
            <h3 className='section-title-yellow'>Biography</h3>
            <div className={`bio-text ${showFullBio ? 'expanded' : ''}`}>
              {person.biography ? (
                person.biography.split('\n').map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p>No biography available.</p>
              )}
            </div>
            {person.biography && person.biography.length > 500 && (
              <button
                className='read-more-btn'
                onClick={() => setShowFullBio(!showFullBio)}
              >
                {showFullBio ? 'Read Less' : 'Read More...'}
              </button>
            )}
          </section>

          {/* Combined Known For & Filmography Section */}
          {(knownFor.length > 0 || credits.cast.length > 0) && (
            <section className='person-section'>
              <h3 className='section-title-yellow'>Known For & Filmography</h3>
              <div className='known-for-scroll'>
                {sortedCast.length > 0 ? (
                  sortedCast.map((credit) => (
                    <Link
                      to={`/${credit.media_type || 'movie'}/${credit.id}`}
                      key={`${credit.media_type}-${credit.id}`}
                      className='known-for-card'
                      style={{ textDecoration: 'none' }}
                    >
                      <img
                        src={
                          credit.poster_path
                            ? `https://image.tmdb.org/t/p/w154${credit.poster_path}`
                            : '/placeholder-poster.png'
                        }
                        alt={credit.title || credit.name}
                      />
                      <div className='credit-info'>
                        <span className='credit-title'>
                          {credit.title || credit.name}
                        </span>
                        <span className='credit-character'>
                          {credit.character ? `as ${credit.character}` : ''}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p>No filmography available.</p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Person;
