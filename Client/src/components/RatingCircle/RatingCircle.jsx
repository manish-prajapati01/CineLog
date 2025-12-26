/**
 * RatingCircle Component
 * TMDB-style circular progress rating
 */

import './RatingCircle.css';

const RatingCircle = ({ rating, size = 'medium', showPercent = true }) => {
  // Convert 0-10 rating to percentage
  const percent = Math.round(rating * 10);

  // Determine color based on rating
  const getColor = (score) => {
    if (score >= 70) return 'excellent';
    if (score >= 50) return 'good';
    if (score >= 30) return 'average';
    return 'poor';
  };

  const colorClass = getColor(percent);

  // SVG circle properties
  const sizeMap = {
    small: { size: 40, stroke: 3 },
    medium: { size: 60, stroke: 4 },
    large: { size: 80, stroke: 5 },
  };

  const { size: circleSize, stroke } = sizeMap[size] || sizeMap.medium;
  const radius = (circleSize - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={`rating-circle-wrapper ${size} ${colorClass}`}
      style={{ width: circleSize, height: circleSize }}
    >
      <svg className='rating-svg' viewBox={`0 0 ${circleSize} ${circleSize}`}>
        {/* Background circle */}
        <circle
          className='rating-bg'
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          strokeWidth={stroke}
        />
        {/* Progress circle */}
        <circle
          className='rating-progress'
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap='round'
        />
      </svg>
      <div className='rating-value'>
        {showPercent ? (
          <>
            <span className='rating-number'>{percent}</span>
            <sup className='rating-percent'>%</sup>
          </>
        ) : (
          <span className='rating-number'>{rating.toFixed(1)}</span>
        )}
      </div>
    </div>
  );
};

export default RatingCircle;
