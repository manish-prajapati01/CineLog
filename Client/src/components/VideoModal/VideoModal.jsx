/**
 * VideoModal Component
 * Renders a YouTube video in a modal overlay using React Portals.
 */
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import './VideoModal.css';

const VideoModal = ({ videoKey, onClose, title }) => {
  if (!videoKey) return null;

  return createPortal(
    <div className='video-modal-overlay' onClick={onClose}>
      <div className='video-modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='video-modal-header'>
          <h3>{title}</h3>
          <button className='close-btn' onClick={onClose}>
            ×
          </button>
        </div>
        <div className='video-player-wrapper'>
          <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
            title={title}
            frameBorder='0'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>,
    document.body,
  );
};

VideoModal.propTypes = {
  videoKey: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
};

export default VideoModal;
