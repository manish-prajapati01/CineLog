import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { message, Rate, Button } from 'antd';
import moment from 'moment';
import { GetMovieById } from '../../apis/movies';
import { setLoading } from '../../redux/loadersSlice';

const MovieInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [movie, setMovie] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(0);

  const getMovieData = async () => {
    try {
      dispatch(setLoading(true));
      const response = await GetMovieById(id);
      setMovie(response.movie);
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    getMovieData();
  }, [id]);

  if (!movie) {
    return null;
  }

  return (
    <div className='flex flex-col gap-5'>
      {/* Back Button */}
      <Button type='link' onClick={() => navigate(-1)} className='self-start'>
        ← Back
      </Button>

      {/* Movie Header */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-10'>
        {/* Poster Section */}
        <div className='flex flex-col gap-3'>
          <img
            src={movie?.posters?.[selectedPoster] || ''}
            alt={movie?.name}
            className='w-full h-96 object-cover rounded'
          />
          {/* Poster Thumbnails */}
          {movie?.posters?.length > 1 && (
            <div className='flex gap-2 justify-center'>
              {movie.posters.map((poster, index) => (
                <img
                  key={index}
                  src={poster}
                  alt={`Poster ${index + 1}`}
                  className={`w-16 h-20 object-cover rounded cursor-pointer ${
                    selectedPoster === index
                      ? 'border-2 border-orange-500'
                      : 'opacity-60'
                  }`}
                  onClick={() => setSelectedPoster(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Movie Details */}
        <div className='col-span-2 flex flex-col gap-4'>
          <h1 className='text-3xl font-semibold text-gray-700'>
            {movie?.name}
          </h1>

          <div className='flex items-center gap-4'>
            <span className='text-gray-500'>
              {moment(movie?.releaseDate).format('MMMM DD, YYYY')}
            </span>
            <span className='bg-orange-500 text-white px-3 py-1 rounded text-sm'>
              {movie?.genre}
            </span>
            <span className='bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm capitalize'>
              {movie?.language}
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-gray-600'>Rating:</span>
            <Rate
              disabled
              defaultValue={movie?.rating || 0}
              allowHalf
              style={{ color: 'darkred' }}
            />
          </div>

          <hr />

          <div>
            <h2 className='text-xl font-semibold text-gray-600 mb-2'>Plot</h2>
            <p className='text-gray-500'>{movie?.plot}</p>
          </div>

          <hr />

          {/* Cast & Crew */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <span className='text-gray-600 font-semibold'>Director:</span>
              <span className='text-gray-500 ml-2'>
                {movie?.director?.name || 'N/A'}
              </span>
            </div>
            <div>
              <span className='text-gray-600 font-semibold'>Hero:</span>
              <span className='text-gray-500 ml-2'>
                {movie?.hero?.name || 'N/A'}
              </span>
            </div>
            <div>
              <span className='text-gray-600 font-semibold'>Heroine:</span>
              <span className='text-gray-500 ml-2'>
                {movie?.heroine?.name || 'N/A'}
              </span>
            </div>
          </div>

          <hr />

          {/* Trailer */}
          {movie?.trailer && (
            <div>
              <h2 className='text-xl font-semibold text-gray-600 mb-2'>
                Trailer
              </h2>
              <a
                href={movie.trailer}
                target='_blank'
                rel='noopener noreferrer'
                className='text-orange-500 underline'
              >
                Watch Trailer
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieInfo;
