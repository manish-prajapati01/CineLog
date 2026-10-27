import { Link } from 'react-router-dom';
const regions = [
  ['hi', 'Hindi', 'From intimate dramas to large-scale spectacles.'],
  ['ta', 'Tamil', 'Explore distinctive voices, thrillers and popular cinema.'],
  ['te', 'Telugu', 'Discover ambitious stories and crowd favourites.'],
  [
    'ml',
    'Malayalam',
    'Start with character-led dramas and absorbing mysteries.',
  ],
  ['kn', 'Kannada', 'Find contemporary discoveries and enduring favourites.'],
  ['mr', 'Marathi', 'Explore stories rooted in everyday life and place.'],
  ['bn', 'Bengali', 'Discover a rich tradition of storytelling.'],
  ['pa', 'Punjabi', 'Explore comedies, dramas and stories of home.'],
];
export default function IndianCinema() {
  return (
    <div className='cl-page cl-top-space'>
      <p className='cl-eyebrow'>MANY LANGUAGES. MANY STORIES.</p>
      <h1>Explore Indian cinema</h1>
      <p className='cl-muted'>
        Choose an original language, then find your own way through its films
        and series.
      </p>
      <div className='cl-region-grid'>
        {regions.map(([code, name, description]) => (
          <section className='cl-panel' key={code}>
            <h2>{name}</h2>
            <p>{description}</p>
            <div className='cl-actions'>
              <Link className='cl-text-link' to={`/movies?language=${code}`}>
                Explore movies ↗
              </Link>
              <Link className='cl-text-link' to={`/tv?language=${code}`}>
                Explore series ↗
              </Link>
            </div>
          </section>
        ))}
      </div>
      <section className='cl-section'>
        <h2>A place to start</h2>
        <div className='cl-feature-links'>
          <Link to='/movies?language=ml&genre=53'>Malayalam thrillers ↗</Link>
          <Link to='/movies?language=ta&genre=18'>Tamil dramas ↗</Link>
          <Link to='/movies?language=hi&genre=35'>Hindi comedies ↗</Link>
          <Link to='/upcoming?language=hi'>Upcoming Hindi films ↗</Link>
        </div>
      </section>
    </div>
  );
}
