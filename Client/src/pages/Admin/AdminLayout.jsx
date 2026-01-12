import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  theme,
  Breadcrumb,
  ConfigProvider,
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
import { setUser } from '../../redux/usersSlice';

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);

  // useToken hook to get design tokens if needed inside component
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(setUser(null));
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
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
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
        <div
          className='demo-logo-vertical'
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            margin: '16px',
            borderRadius: '8px',
          }}
        >
          <h1
            style={{
              color: '#f5c518',
              margin: 0,
              fontSize: collapsed ? '1rem' : '1.5rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              transition: 'all 0.3s',
            }}
          >
            {collapsed ? 'CL' : 'CineLog'}
          </h1>
        </div>
        <Menu
          theme='dark'
          mode='inline'
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{ fontSize: '1rem', fontWeight: 500 }}
        />
      </Sider>
      <Layout
        style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}
      >
        <Header
          style={{
            padding: '0 24px',
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
              type='text'
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>
              To the moon 🚀
            </span>
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
                    backgroundColor: '#f5c518',
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
          style={{
            margin: '24px 16px',
            padding: 24,
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
