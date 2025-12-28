/**
 * Footer Component
 * Simple site footer with copyright info.
 * Stays at the bottom of the layout.
 */
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className='site-footer'>
      <div className='footer-content'>
        <Link to='/' className='footer-logo'>
          CineLog
        </Link>
        <div className='footer-copyright'>
          <p>© 2025 CineLog</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
