/**
 * Login Page - Modern styled login with new auth API
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/usersSlice';
import api from '../../services/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);

      // api.js interceptor already returns response.data
      if (response.success) {
        localStorage.setItem('token', response.token);
        dispatch(setUser(response.user));
        navigate('/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      // err.message is set by api.js interceptor
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <div className='login-container'>
        {/* Left Side - Branding */}
        <div className='login-branding'>
          <div className='branding-content'>
            <h1>🎬 CineLog</h1>
            <p>
              Your ultimate destination for movie reviews, ratings, and
              recommendations.
            </p>
            <ul className='features-list'>
              <li>✓ Rate movies and TV shows</li>
              <li>✓ Write and read reviews</li>
              <li>✓ Create your watchlist</li>
              <li>✓ Get personalized recommendations</li>
            </ul>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className='login-form-container'>
          <div className='login-form-wrapper'>
            <h2>Welcome back</h2>
            <p className='login-subtitle'>Sign in to continue to CineLog</p>

            {error && <div className='error-message'>{error}</div>}

            <form onSubmit={handleSubmit} className='login-form'>
              <div className='form-group'>
                <label htmlFor='email'>Email</label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='Enter your email'
                  required
                />
              </div>

              <div className='form-group'>
                <label htmlFor='password'>Password</label>
                <input
                  type='password'
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='Enter your password'
                  required
                />
              </div>

              <button type='submit' className='btn-submit' disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className='register-link'>
              Don&apos;t have an account? <Link to='/register'>Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
