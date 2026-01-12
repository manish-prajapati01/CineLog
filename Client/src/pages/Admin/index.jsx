import { useSelector } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import Movies from './Movies';
import MovieForm from './Movies/MovieForm';
import Artists from './Artists';
import Users from './Users';
import Series from './Series'; // New Series Page
import SeriesForm from './Series/SeriesForm';
import './index.css';

function Admin() {
  const { user } = useSelector((state) => state.users);
  const navigate = useNavigate();

  // IMDb-inspired Dark Theme Token
  const customTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#f5c518', // IMDb Gold
      colorBgBase: '#121212',  // Deep Black/Grey
      colorTextBase: '#ffffff',
      colorLink: '#5799ef',
      borderRadius: 4,
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    },
    components: {
      Layout: {
        headerBg: '#1f1f1f',
        siderBg: '#121212',
        triggerBg: '#1f1f1f',
      },
      Menu: {
        darkItemBg: '#121212',
        darkItemColor: '#ffffff',
        darkItemHoverBg: '#1f1f1f',
        darkItemSelectedBg: 'rgba(245, 197, 24, 0.2)', // Gold with opacity
        darkItemSelectedColor: '#f5c518',
      },
      Card: {
        colorBgContainer: '#1f1f1f', 
        headerBg: '#1f1f1f',
      },
      Table: {
        headerBg: '#1a1a1a', 
        rowHoverBg: '#252525',
      }
    },
  };

  return (
    <ConfigProvider theme={customTheme}>
      <div className='admin-container'>
        {user?.role === 'admin' ? (
          <AdminLayout>
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
            </Routes>
          </AdminLayout>
        ) : (
          <div className='w-full h-screen flex flex-col justify-center items-center text-xl text-gray-500 bg-[#121212]'>
            <h1 className="text-3xl font-bold text-[#f5c518] mb-4">Access Denied</h1>
            <p className="mb-6">You are not authorized to view this page.</p>
            <button
              className='px-6 py-2 bg-[#f5c518] text-black font-bold rounded hover:bg-[#e2b616] transition-all'
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
