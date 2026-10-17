import NotFound from '../NotFound';
import { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import AdminLayout from './AdminLayout';
const Dashboard = lazy(() => import('./Dashboard'));
const Movies = lazy(() => import('./Movies'));
const MovieForm = lazy(() => import('./Movies/MovieForm'));
const Artists = lazy(() => import('./Artists'));
const Users = lazy(() => import('./Users'));
const Series = lazy(() => import('./Series')); // New Series Page
const SeriesForm = lazy(() => import('./Series/SeriesForm'));
import './index.css';

function Admin() {
  const { user } = useSelector((state) => state.users);
  const navigate = useNavigate();

  // Shared CineLog theme
  const customTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#dfb582',
      colorBgBase: '#111116', // Deep Black/Grey
      colorTextBase: '#ffffff',
      colorLink: '#dfb582',
      borderRadius: 4,
      fontFamily: "'Source Sans 3', sans-serif",
    },
    components: {
      Layout: {
        headerBg: '#1c1b22',
        siderBg: '#111116',
        triggerBg: '#1c1b22',
      },
      Menu: {
        darkItemBg: '#111116',
        darkItemColor: '#ffffff',
        darkItemHoverBg: '#1c1b22',
        darkItemSelectedBg: 'rgba(223, 181, 130, 0.12)',
        darkItemSelectedColor: '#dfb582',
      },
      Card: {
        colorBgContainer: '#1c1b22',
        headerBg: '#1c1b22',
      },
      Table: {
        headerBg: '#1a1a1a',
        rowHoverBg: '#252525',
      },
    },
  };

  return (
    <ConfigProvider theme={customTheme}>
      <div className='admin-container'>
        {user?.role === 'admin' ? (
          <AdminLayout>
            <Suspense
              fallback={<div className='page-loader'>Loading workspace...</div>}
            >
              <Routes>
                <Route path='/' element={<Dashboard />} />
                <Route path='/dashboard' element={<Dashboard />} />

                {/* Movies */}
                <Route path='/movies' element={<Movies />} />
                <Route path='/movies/add' element={<MovieForm />} />
                <Route path='/movies/edit/:id' element={<MovieForm />} />

                {/* Series - New Section */}
                <Route path='/series' element={<Series />} />
                <Route path='/series/add' element={<SeriesForm />} />
                <Route path='/series/edit/:id' element={<SeriesForm />} />

                {/* Other Modules */}
                <Route path='/artists' element={<Artists />} />
                <Route path='/users' element={<Users />} />
                <Route path='*' element={<NotFound />} />
              </Routes>
            </Suspense>
          </AdminLayout>
        ) : (
          <div className='w-full h-screen flex flex-col justify-center items-center text-xl text-gray-500 bg-[#111116]'>
            <h1 className='text-3xl font-bold text-[#dfb582] mb-4'>
              Access Denied
            </h1>
            <p className='mb-6'>You are not authorized to view this page.</p>
            <button
              className='px-6 py-2 bg-[#dfb582] text-black font-bold rounded hover:bg-[#edcba4] transition-all'
              onClick={() => navigate('/')}
            >
              Go Home
            </button>
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}

export default Admin;
