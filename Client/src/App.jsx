/**
 * App - Main Application Component
 * CineLog Complete Redesign
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import React, { Suspense } from 'react';

// Styles
import './styles/design-system.css';
import './index.css';

// Components
import { Navbar, Footer } from './components';

// Lazy load pages for code splitting
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Movies = React.lazy(() => import('./pages/Movies'));
const TV = React.lazy(() => import('./pages/TV'));
const MovieDetails = React.lazy(() => import('./pages/MovieDetails'));
const TVDetails = React.lazy(() => import('./pages/TVDetails'));
const Search = React.lazy(() => import('./pages/Search'));
const Watchlist = React.lazy(() => import('./pages/Watchlist'));
const Person = React.lazy(() => import('./pages/Person'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Admin = React.lazy(() => import('./pages/Admin'));

// Loading fallback
const PageLoader = () => (
  <div className='page-loader'>
    <div className='loader-spinner' />
  </div>
);

// Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '50px',
            color: '#fff',
            background: '#0d253f',
            minHeight: '100vh',
          }}
        >
          <h1>Something went wrong</h1>
          <p style={{ color: '#f55' }}>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px 20px' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Layout wrapper with Navbar and Footer
const Layout = ({ children }) => (
  <div className='app-layout'>
    <Navbar />
    <main className='main-content'>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </main>
    <Footer />
  </div>
);

// Auth layout (no navbar)
const AuthLayout = ({ children }) => (
  <div className='auth-layout'>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </div>
);

function App() {
  const { loading } = useSelector((state) => state.loaders);

  return (
    <ErrorBoundary>
      {/* Global Loader Wrapper - Shows spinner when redux global loading is true */}
      {loading && (
        <div className='global-loader'>
          <div className='loader-spinner' />
        </div>
      )}

      {/* Main Application Router */}
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Navbar */}
          {/* We wrap these pages with <Layout> so they have the Navbar and Footer */}
          <Route
            path='/'
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path='/movies'
            element={
              <Layout>
                <Movies />
              </Layout>
            }
          />
          <Route
            path='/tv'
            element={
              <Layout>
                <TV />
              </Layout>
            }
          />
          <Route
            path='/movie/:id'
            element={
              <Layout>
                <MovieDetails />
              </Layout>
            }
          />
          <Route
            path='/tv/:id'
            element={
              <Layout>
                <TVDetails />
              </Layout>
            }
          />
          <Route
            path='/search'
            element={
              <Layout>
                <Search />
              </Layout>
            }
          />
          <Route
            path='/person/:id'
            element={
              <Layout>
                <Person />
              </Layout>
            }
          />
          <Route
            path='/watchlist'
            element={
              <Layout>
                <Watchlist />
              </Layout>
            }
          />
          <Route
            path='/profile'
            element={
              <Layout>
                <Profile />
              </Layout>
            }
          />
          <Route
            path='/admin/*'
            element={
              <Layout>
                <Admin />
              </Layout>
            }
          />

          {/* Auth Routes (no navbar) */}
          {/* These pages stand alone without the standard site navigation */}
          <Route
            path='/login'
            element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            }
          />
          <Route
            path='/register'
            element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            }
          />

          {/* 404 fallback - Matches any path not defined above */}
          <Route
            path='*'
            element={
              <Layout>
                <div style={{ padding: '100px 20px', textAlign: 'center' }}>
                  <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    404
                  </h1>
                  <p>Page not found</p>
                  <a href='/' style={{ color: '#01b4e4' }}>
                    Go Home
                  </a>
                </div>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
