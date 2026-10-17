import { setMeta } from '../../helpers/pageMeta';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import MovieCard from '../../components/MovieCard/MovieCard';
export default function Person() {
  const { id } = useParams();
  const [person, setPerson] = useState(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setPerson(null);
    setError('');
    api
      .get(`/person/${id}`)
      .then((r) => {
        if (live) setPerson(r.data);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [id, retry]);
  useEffect(() => {
    if (person)
      setMeta(
        person.name,
        `Explore ${person.name}'s biography, films and series on CineLog.`,
      );
  }, [person]);
  if (!person)
    return (
      <div className='cl-page cl-empty'>
        <p role={error ? 'alert' : 'status'}>
          {error || 'Loading filmography...'}
        </p>
        {error && (
          <button className='cl-button' onClick={() => setRetry((n) => n + 1)}>
            Try again
          </button>
        )}
      </div>
    );
  const films = [
    ...(person.movie_credits?.cast || []).map((f) => ({
      ...f,
      media_type: 'movie',
    })),
    ...(person.tv_credits?.cast || []).map((f) => ({ ...f, media_type: 'tv' })),
  ];
  const unique = [
    ...new Map(films.map((f) => [`${f.media_type}-${f.id}`, f])).values(),
  ].sort((a, b) => b.popularity - a.popularity);
  return (
    <div className='cl-page cl-top-space'>
      <div className='cl-title-layout'>
        <div className='cl-detail-poster'>
          {person.profile_path && (
            <img
              src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
              alt={person.name}
            />
          )}
        </div>
        <div>
          <p className='cl-eyebrow'>
            THE TALENT / {person.known_for_department}
          </p>
          <h1>{person.name}</h1>
          <p className='cl-muted'>{person.place_of_birth}</p>
          <p className='cl-overview'>
            {person.biography || 'A biography is not available yet.'}
          </p>
          {person.birthday && (
            <p className='cl-muted'>
              Born {new Date(person.birthday).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <section className='cl-section'>
        <div className='cl-section-heading'>
          <h2>A life in stories</h2>
          <span className='cl-muted'>{unique.length} credits</span>
        </div>
        <div className='cl-grid'>
          {unique.slice(0, 60).map((f) => (
            <MovieCard key={`${f.media_type}-${f.id}`} item={f} />
          ))}
        </div>
      </section>
    </div>
  );
}
