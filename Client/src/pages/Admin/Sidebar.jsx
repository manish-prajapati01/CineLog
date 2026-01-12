import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const menuItems = [
    { label: 'Back to Site', icon: '🏠', path: '/' },
    { label: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
    { label: 'Movies', icon: '🎬', path: '/admin/movies' },
    { label: 'Artists', icon: '🎭', path: '/admin/artists' },
    { label: 'Users', icon: '👥', path: '/admin/users' },
  ];

  return (
    <div className='admin-sidebar'>
      <div className='sidebar-header'>
        <h2>Admin Panel</h2>
      </div>
      <div className='sidebar-menu'>
        {menuItems.map((item) => (
          <div
            key={item.label}
            className={`sidebar-item ${location.pathname.includes(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className='sidebar-icon'>{item.icon}</span>
            <span className='sidebar-label'>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
