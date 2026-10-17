import Logo from '../../components/Logo';
import { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  theme,
  Breadcrumb,
  Grid,
} from 'antd';
import {
  DashboardOutlined,
  VideoCameraOutlined,
  UserOutlined,
  TeamOutlined,
  DesktopOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  HomeOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/usersSlice';

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children }) => {
  const screens = Grid.useBreakpoint();
  const mobile = !screens.md;
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => setCollapsed(mobile), [mobile]);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!mobile || collapsed) return;
    const close = (e) => {
      if (e.key === 'Escape') setCollapsed(true);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [mobile, collapsed]);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);

  // useToken hook to get design tokens if needed inside component
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'home',
      label: 'Go to Site',
      icon: <HomeOutlined />,
      onClick: () => navigate('/'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/admin/movies',
      icon: <VideoCameraOutlined />,
      label: 'Movies',
    },
    {
      key: '/admin/series',
      icon: <DesktopOutlined />,
      label: 'TV Shows',
    },
    {
      key: '/admin/artists',
      icon: <TeamOutlined />,
      label: 'Artists',
    },
    {
      key: '/admin/users',
      icon: <UserSwitchOutlined />,
      label: 'Users',
    },
  ];

  // Determine breadcrumb items based on path
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const title =
      pathSnippets[index].charAt(0).toUpperCase() +
      pathSnippets[index].slice(1);
    return {
      title: <Link to={url}>{title}</Link>,
    };
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {mobile && !collapsed && (
        <button
          className='cl-admin-scrim'
          aria-label='Close admin menu'
          onClick={() => setCollapsed(true)}
        />
      )}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        collapsedWidth={mobile ? 0 : 80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1001,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        <div className='cl-admin-brand'>
          <Logo compact={collapsed && !mobile} />
        </div>
        {mobile && (
          <Button onClick={() => setCollapsed(true)} style={{ margin: 16 }}>
            Close menu
          </Button>
        )}
        <Menu
          theme='dark'
          mode='inline'
          selectedKeys={[location.pathname]}
          onClick={({ key }) => {
            navigate(key);
            if (mobile) setCollapsed(true);
          }}
          items={menuItems}
          style={{ fontSize: '1rem', fontWeight: 500 }}
        />
      </Sider>
      <Layout
        style={{
          minWidth: 0,
          marginLeft: mobile ? 0 : collapsed ? 80 : 250,
          transition: 'all 0.2s',
        }}
      >
        <Header
          className='cl-admin-header'
          style={{
            padding: mobile ? '0 12px' : '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Button
              aria-label={collapsed ? 'Open admin menu' : 'Close admin menu'}
              aria-expanded={!collapsed}
              type='text'
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            {!mobile && <Breadcrumb items={breadcrumbItems} />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement='bottomRight'
              arrow
            >
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Avatar
                  style={{
                    backgroundColor: '#dfb582',
                    verticalAlign: 'middle',
                  }}
                  size='large'
                  icon={<UserOutlined />}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </Avatar>
                <span style={{ fontWeight: 600 }}>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          id='main-content'
          tabIndex={-1}
          style={{
            margin: mobile ? '16px 8px' : '24px 16px',
            padding: mobile ? 12 : 24,
            minWidth: 0,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'initial',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
