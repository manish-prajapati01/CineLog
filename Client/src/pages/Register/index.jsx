/**
 * Register Page - Modern styled registration
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/usersSlice';
import api from '../../services/api';
import '../Login/Login.css';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // api.js interceptor already returns response.data
      if (response.success) {
        localStorage.setItem('token', response.token);
        dispatch(setUser(response.user));
        navigate('/');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      // err.message is set by api.js interceptor
      setError(err.message || 'Registration failed. Please try again.');
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
              Join our community of movie enthusiasts and start your journey
              today.
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
            <h2>Create Account</h2>
            <p className='login-subtitle'>Join CineLog today</p>

            {error && <div className='error-message'>{error}</div>}

            <form onSubmit={handleSubmit} className='login-form'>
              <div className='form-group'>
                <label htmlFor='name'>Full Name</label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='Enter your name'
                  required
                />
              </div>

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
                  placeholder='Create a password'
                  required
                  minLength={6}
                />
              </div>

              <div className='form-group'>
                <label htmlFor='confirmPassword'>Confirm Password</label>
                <input
                  type='password'
                  id='confirmPassword'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder='Confirm your password'
                  required
                />
              </div>

              <button type='submit' className='btn-submit' disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className='register-link'>
              Already have an account? <Link to='/login'>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
