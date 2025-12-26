/**
 * Home Page
 * Features: Trending in India, Popular Indian & Hollywood Movies, Popular Indian & Hollywood TV Shows
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { moviesAPI, tvAPI } from '../../services';
import { MovieCard, MovieGridSkeleton } from '../../components';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  // Trending in India
  const [trendingIndia, setTrendingIndia] = useState([]);

  // Movies
  const [popularIndianMovies, setPopularIndianMovies] = useState([]);
  const [popularHollywoodMovies, setPopularHollywoodMovies] = useState([]);

  // TV Shows
  const [popularIndianTV, setPopularIndianTV] = useState([]);
  const [popularHollywoodTV, setPopularHollywoodTV] = useState([]);

  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        trendingIndiaRes,
        indianMoviesRes,
        hollywoodMoviesRes,
        indianTVRes,
        hollywoodTVRes,
      ] = await Promise.all([
        moviesAPI.getTrendingIndia('week'),
        moviesAPI.getPopularIndian(1),
        moviesAPI.getPopularHollywood(1),
        tvAPI.getPopularIndian(1),
        tvAPI.getPopularHollywood(1),
      ]);

      // Handle various response formats
      const trendingList =
        trendingIndiaRes?.results || trendingIndiaRes?.data?.results || [];
      setTrendingIndia(trendingList);

      setPopularIndianMovies(
        indianMoviesRes?.results || indianMoviesRes?.data?.results || [],
      );
      setPopularHollywoodMovies(
        hollywoodMoviesRes?.results || hollywoodMoviesRes?.data?.results || [],
      );
      setPopularIndianTV(
        indianTVRes?.results || indianTVRes?.data?.results || [],
      );
      setPopularHollywoodTV(
        hollywoodTVRes?.results || hollywoodTVRes?.data?.results || [],
      );

      // Set hero movie (first trending with backdrop)
      const heroCandidate = trendingList.find(
        (m) => m.backdrop_path || m.backdropPath,
      );
      setHeroMovie(heroCandidate || trendingList[0]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className='home-page'>
      {/* Hero Section */}
      <section
        className='hero-section'
        style={{
          backgroundImage: heroMovie?.backdropPath
            ? `url(${heroMovie.backdropPath.replace('w780', 'w1280')})`
            : 'none',
        }}
      >
        <div className='hero-overlay' />
        <div className='hero-content'>
          <h1 className='hero-title'>
            Welcome to <span className='text-gradient'>Movie World</span>
          </h1>
          <p className='hero-subtitle'>
            Millions of movies, TV shows and people to discover. Explore now.
          </p>

          {/* Search Bar */}
          <form className='hero-search' onSubmit={handleSearch}>
            <input
              type='text'
              placeholder='Search for a movie, TV show, person...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type='submit' className='btn btn-primary'>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Trending in India Section */}
      <section className='content-section'>
        <div className='container'>
          <div className='section-header'>
            <h2 className='section-title'>🔥 Trending in India</h2>
          </div>

          {loading ? (
            <MovieGridSkeleton count={8} />
          ) : (
            <div className='movies-scroll'>
              {trendingIndia.map((item, index) => (
                <div
                  key={item.id}
                  className={`scroll-item stagger-${Math.min(index + 1, 8)}`}
                >
                  <MovieCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Indian Movies Section */}
      <section className='content-section'>
        <div className='container'>
          <div className='section-header'>
            <h2 className='section-title'>🎬 Popular Indian Movies</h2>
          </div>

          {loading ? (
            <MovieGridSkeleton count={8} />
          ) : (
            <div className='grid-movies'>
              {popularIndianMovies.slice(0, 8).map((movie) => (
                <MovieCard key={movie.id} item={movie} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Hollywood Movies Section */}
      <section className='content-section'>
        <div className='container'>
          <div className='section-header'>
            <h2 className='section-title'>🎥 Popular Hollywood Movies</h2>
          </div>

          {loading ? (
            <MovieGridSkeleton count={8} />
          ) : (
            <div className='grid-movies'>
              {popularHollywoodMovies.slice(0, 8).map((movie) => (
                <MovieCard key={movie.id} item={movie} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Indian TV Shows Section */}
      <section className='content-section'>
        <div className='container'>
          <div className='section-header'>
            <h2 className='section-title'>📺 Popular Indian TV Shows</h2>
          </div>

          {loading ? (
            <MovieGridSkeleton count={8} />
          ) : (
            <div className='grid-movies'>
              {popularIndianTV.slice(0, 8).map((show) => (
                <MovieCard key={show.id} item={show} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Hollywood TV Shows Section */}
      <section className='content-section'>
        <div className='container'>
          <div className='section-header'>
            <h2 className='section-title'>🌍 Popular Hollywood TV Shows</h2>
          </div>

          {loading ? (
            <MovieGridSkeleton count={8} />
          ) : (
            <div className='grid-movies'>
              {popularHollywoodTV.slice(0, 8).map((show) => (
                <MovieCard key={show.id} item={show} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
