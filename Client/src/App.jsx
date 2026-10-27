/**
 * App - Main Application Component
 * CineLog application
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import React, { Suspense } from 'react';

// Styles

import './index.css';
import './styles/brand.css';

// Components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Spinner from './components/Spinner';
import PageMeta from './components/PageMeta';
import NotFound from './pages/NotFound';

// Lazy load pages for code splitting
const Policies = React.lazy(() => import('./pages/Policies'));
const AccountHelp = React.lazy(() => import('./pages/AccountHelp'));
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

const Upcoming = React.lazy(() => import('./pages/Upcoming'));
const IndianCinema = React.lazy(() => import('./pages/IndianCinema'));
const Collections = React.lazy(() => import('./pages/Collections'));
const Tracking = React.lazy(() => import('./pages/Tracking'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const PublicPage = React.lazy(() => import('./pages/PublicPage'));

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
        <div className='cl-page cl-empty' role='alert'>
          <h1>A pause in the story.</h1>
          <p>Something went wrong while loading this page. Please try again.</p>
          <button
            className='cl-button'
            onClick={() => window.location.reload()}
          >
            Reload page
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
    <main id='main-content' className='main-content' tabIndex={-1}>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </main>
    <Footer />
  </div>
);

// Auth layout (no navbar)
const AuthLayout = ({ children }) => (
  <main id='main-content' className='auth-layout' tabIndex={-1}>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </main>
);

function App() {
  const { loading } = useSelector((state) => state.loaders);

  return (
    <ErrorBoundary>
      {/* Global Loader Wrapper - Shows spinner when redux global loading is true */}
      {loading && <Spinner />}

      {/* Main Application Router */}
      <BrowserRouter>
        <PageMeta />
        <a href='#main-content' className='cl-skip-link'>
          Skip to content
        </a>
        <Routes>
          <Route path='/privacy' element={<Layout><Policies /></Layout>} />
          <Route path='/terms' element={<Layout><Policies terms /></Layout>} />
          <Route path='/forgot-password' element={<Layout><AccountHelp mode='forgot' /></Layout>} />
          <Route path='/reset-password' element={<Layout><AccountHelp mode='reset' /></Layout>} />
          <Route path='/verify-email' element={<Layout><AccountHelp mode='verify' /></Layout>} />
          <Route
            path='/tracking'
            element={
              <Layout>
                <Tracking />
              </Layout>
            }
          />
          <Route
            path='/upcoming'
            element={
              <Layout>
                <Upcoming />
              </Layout>
            }
          />
          <Route
            path='/indian-cinema'
            element={
              <Layout>
                <IndianCinema />
              </Layout>
            }
          />
          <Route
            path='/collections'
            element={
              <Layout>
                <Collections />
              </Layout>
            }
          />
          <Route
            path='/calendar'
            element={
              <Layout>
                <Calendar />
              </Layout>
            }
          />
          <Route
            path='/people/:id'
            element={
              <Layout>
                <PublicPage />
              </Layout>
            }
          />
          <Route
            path='/collections/:owner/:id'
            element={
              <Layout>
                <PublicPage collection />
              </Layout>
            }
          />
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
          <Route path='/admin/*' element={<Admin />} />

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
                <NotFound />
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
