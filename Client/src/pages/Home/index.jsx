import UpcomingPreview from '../../components/UpcomingPreview';
import Sponsor from '../../components/Sponsor';
import { languageName } from '../../helpers/languages';
import Backdrop from '../../components/Backdrop';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { moviesAPI, tvAPI } from '../../services';
import FeaturedSection from '../../components/FeaturedSection/FeaturedSection';
export default function Home() {
  const [sections, setSections] = useState([[], [], [], []]);
  const [loading, setLoading] = useState(true),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    Promise.allSettled([
      moviesAPI.getTrending('week'),
      moviesAPI.getPopularIndian(1),
      tvAPI.getPopular(1),
      moviesAPI.getTopRated(1),
    ]).then((results) => {
      if (!live) return;
      setSections(
        results.map((r) =>
          r.status === 'fulfilled'
            ? r.value.results ||
              r.value.data?.results ||
              (Array.isArray(r.value.data) ? r.value.data : [])
            : [],
        ),
      );
      setFailed(results.some((r) => r.status === 'rejected'));
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [attempt]);
  const hero = sections[0][active];
  return (
    <div className='cl-home'>
      <nav className='cl-discovery-links' aria-label='Explore more'>
        <Link to='/upcoming'>Coming soon ↗</Link>
        <Link to='/indian-cinema'>Explore Indian cinema ↗</Link>
        <Link to='/calendar'>Your calendar ↗</Link>
        <Link to='/collections'>Your collections ↗</Link>
      </nav>
      <section className='cl-hero'>
        <Backdrop path={hero?.backdrop_path} />
        <div className='cl-hero-copy'>
          <p className='cl-eyebrow'>
            <span className='cl-live-dot' /> THE WEEK’S SPOTLIGHT
          </p>
          <h1>{hero?.title || 'The evening starts here.'}</h1>
          <p className='cl-hero-description'>
            {hero?.overview ||
              'Explore the catalogue, keep a watchlist and record what you watch.'}
          </p>
          <div className='cl-hero-meta'>
            {hero && (
              <>
                <span className='cl-score'>
                  ★ {Number(hero.vote_average).toFixed(1)} TMDB
                </span>
                <span>{hero.release_date?.slice(0, 4)}</span>
                <span>{languageName(hero.original_language)}</span>
              </>
            )}
            <span>FILM / SERIES / JOURNAL</span>
          </div>
          <div className='cl-actions'>
            <Link
              className='cl-button'
              to={hero ? `/movie/${hero.id}` : '/movies'}
            >
              {hero ? 'Explore the film' : 'Discover films'} <span>↗</span>
            </Link>
            <Link className='cl-button secondary' to='/watchlist'>
              My watchlist
            </Link>
          </div>
        </div>
        <div className='cl-hero-bottom'>
          <span>THIS WEEK ON CINELOG</span>
          <div className='cl-hero-tabs'>
            {sections[0].slice(0, 4).map((film, i) => (
              <button
                key={film.id}
                className={active === i ? 'active' : ''}
                onClick={() => setActive(i)}
                aria-label={`Spotlight: ${film.title}`}
                aria-pressed={active === i}
              >
                0{i + 1}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className='cl-page'>
        <section className='cl-browse-index' aria-labelledby='browse-heading'>
          <div>
            <p className='cl-eyebrow'>FIND A FILM</p>
            <h2 id='browse-heading'>Browse by genre</h2>
          </div>
          <nav aria-label='Browse film genres'>
            {[
              ['18', 'Drama'],
              ['53', 'Thriller'],
              ['878', 'Science fiction'],
              ['35', 'Comedy'],
              ['99', 'Documentary'],
              ['28', 'Action'],
            ].map(([id, name]) => (
              <Link key={id} to={`/movies?genre=${id}`}>
                <span>{name}</span>
                <span aria-hidden='true'>↗</span>
              </Link>
            ))}
          </nav>
        </section>
        {failed && (
          <div className='cl-notice' role='status'>
            Some film shelves couldn’t load.{' '}
            <button onClick={() => setAttempt((x) => x + 1)}>Try again</button>
          </div>
        )}
        <FeaturedSection
          title='Trending films'
          subtitle='TRENDING THIS WEEK'
          items={sections[0]}
          loading={loading}
          linkTo='/movies'
        />
        <FeaturedSection
          title='Indian cinema'
          subtitle='INDIAN CINEMA'
          items={sections[1]}
          loading={loading}
          linkTo='/movies?language=hi'
        />
        <section className='cl-journal-banner'>
          <span className='cl-journal-symbol' aria-hidden='true'>
            01—
          </span>
          <div>
            <p className='cl-eyebrow'>YOUR VIEWING JOURNAL</p>
            <h2>
              Keep a record of
              <br />
              what stays with you.
            </h2>
            <p>
              Save films for later, record your viewing dates and keep your
              notes in one place.
            </p>
          </div>
          <Link to='/watchlist' className='cl-button'>
            Open your journal ↗
          </Link>
        </section>
        <FeaturedSection
          title='On the small screen'
          subtitle='SERIES'
          items={sections[2]}
          loading={loading}
          type='tv'
          linkTo='/tv'
        />
        <FeaturedSection
          title='Audience favourites'
          subtitle='HIGHLY RATED ON TMDB'
          items={sections[3]}
          loading={loading}
          linkTo='/movies?sort=vote_average.desc'
        />
      </div>
      <UpcomingPreview />
      <Sponsor />
    </div>
  );
}
