import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button className='imdb-back-btn' onClick={() => navigate(-1)}>
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
        className='back-icon'
      >
        <polyline points='15 18 9 12 15 6'></polyline>
      </svg>
      <span className='back-text'>Back</span>
    </button>
  );
};

export default BackButton;
