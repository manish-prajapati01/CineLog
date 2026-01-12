/**
 * Home Page (IMDb Clone Redesign)
 */

import { useState, useEffect } from 'react';
import { moviesAPI, tvAPI, personAPI } from '../../services';
import { HeroCarousel, FeaturedSection } from '../../components';
import './Home.css';

const Home = () => {
  // Data States
  const [trending, setTrending] = useState([]);
  const [indianMovies, setIndianMovies] = useState([]);
  const [hollywoodMovies, setHollywoodMovies] = useState([]);
  const [indianTV, setIndianTV] = useState([]);
  const [hollywoodTV, setHollywoodTV] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [popularPeople, setPopularPeople] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all homepage data in parallel for faster load times
      const [
        trendingRes,
        indianMoviesRes,
        hollywoodMoviesRes,
        indianTVRes,
        hollywoodTVRes,
        topRatedRes,
        peopleRes,
      ] = await Promise.all([
        moviesAPI.getTrendingIndia('week'),
        moviesAPI.getPopularIndian(1),
        moviesAPI.getPopularHollywood(1),
        tvAPI.getPopularIndian(1),
        tvAPI.getPopularHollywood(1),
        moviesAPI.getTopRated(1),
        personAPI.getPopular(1),
      ]);

      setTrending(trendingRes?.results || trendingRes || []);
      setIndianMovies(indianMoviesRes?.results || []);
      setHollywoodMovies(hollywoodMoviesRes?.results || []);
      setIndianTV(indianTVRes?.results || []);
      setHollywoodTV(hollywoodTVRes?.results || []);
      setTopRated(topRatedRes?.results || []);
      setPopularPeople(peopleRes?.results || []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='home-page-container'>
      {/* 1. Hero Carousel (Trending) */}
      <HeroCarousel items={trending} />

      {/* 2. Featured Sections */}
      <div className='main-content'>
        <FeaturedSection
          title='Top Picks for You'
          subtitle='TV shows and movies just for you'
          items={topRated.slice(0, 10)}
          linkTo='/movies/top-rated'
          loading={loading}
        />

        <FeaturedSection
          title='Fan Favorites'
          subtitle="This week's top people"
          items={popularPeople}
          linkTo='/search?q=&type=person'
          loading={loading}
          type='person'
        />

        <FeaturedSection
          title='Indian Movies'
          subtitle='Best of Bollywood and Regional Cinema'
          items={indianMovies}
          linkTo='/movies?region=indian'
          loading={loading}
          type='movie'
        />

        <FeaturedSection
          title='Popular TV Shows'
          subtitle='Explore trending series'
          items={hollywoodTV}
          linkTo='/tv'
          loading={loading}
          type='tv'
        />

        <FeaturedSection
          title='Indian Web Series'
          subtitle='Originals from India'
          items={indianTV}
          linkTo='/tv?region=indian'
          loading={loading}
          type='tv'
        />

        <FeaturedSection
          title='Hollywood Hits'
          items={hollywoodMovies}
          linkTo='/movies'
          loading={loading}
          type='movie'
        />
      </div>
    </div>
  );
};

export default Home;
