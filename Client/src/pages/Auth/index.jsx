import Logo from '../../components/Logo';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/usersSlice';
import api from '../../services/api';
export default function Auth({ register = false }) {
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const dispatch = useDispatch(),
    navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.post(`/auth/${register ? 'register' : 'login'}`, {
        name,
        email: email.trim(),
        password,
      });
      localStorage.setItem('token', r.token);
      dispatch(setUser(r.user));
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className='cl-auth'>
      <aside className='cl-auth-story'>
        <Logo />
        <div>
          <p className='cl-eyebrow'>A LIFE IN CINEMA</p>
          <h1>
            For the films.
            <br />
            For the feeling.
            <br />
            <span className='cl-accent'>For you.</span>
          </h1>
          <p>
            A home for your taste in cinema. Discover, collect, and keep the
            stories that matter.
          </p>
        </div>
        <div className='cl-eyebrow'>CINELOG / YOUR VIEWING JOURNAL</div>
      </aside>
      <div className='cl-auth-form'>
        <p className='cl-eyebrow'>
          {register ? 'JOIN CINELOG' : 'MEMBER ACCESS'}
        </p>
        <h2>{register ? 'Profile details.' : 'Welcome back.'}</h2>
        <p>
          {register
            ? 'Create your CineLog account to start your collection.'
            : 'Sign in to access your library and journal.'}
        </p>
        {error && (
          <div role='alert' className='cl-notice'>
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          {register && (
            <label>
              Your name
              <input
                required
                autoComplete='name'
                minLength={2}
                maxLength={50}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label>
            Email address
            <input
              required
              autoComplete='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              required
              autoComplete={register ? 'new-password' : 'current-password'}
              type='password'
              minLength={register ? 8 : 1}
              maxLength={72}
              aria-describedby={register ? 'password-help' : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {register && (
            <small id='password-help'>
              Use 8 to 72 characters for your password.
            </small>
          )}
          <button className='cl-button' disabled={busy}>
            {busy
              ? 'One moment...'
              : register
                ? 'Create account ↗'
                : 'Sign in ↗'}
          </button>
        </form>
        <small>
          {register ? 'Already have an account?' : 'New here?'}{' '}
          <Link to={register ? '/login' : '/register'}>
            {register ? 'Sign in' : 'Create an account'}
          </Link>
        </small>
        <Link className='cl-text-link' style={{ marginTop: 25 }} to='/'>
          ← Keep exploring
        </Link>
      </div>
    </div>
  );
}
