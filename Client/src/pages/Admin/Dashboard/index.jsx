import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, message, Table, Tag, Typography, Button } from 'antd';
import { 
    VideoCameraOutlined, 
    TeamOutlined, 
    UserOutlined, 
    DesktopOutlined, 
    ArrowRightOutlined,
    StarFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GetAllMovies } from '../../../apis/movies';
import { GetAllArtists } from '../../../apis/artists';
import { GetAllUsers } from '../../../apis/users';
import { useDispatch } from 'react-redux';
import { setLoading } from '../../../redux/loadersSlice';
import moment from 'moment';

const { Title } = Typography;

function Dashboard() {
  const [stats, setStats] = useState({
    movies: 0,
    artists: 0,
    users: 0,
    series: 0, // Placeholder
  });
  const [recentMovies, setRecentMovies] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      dispatch(setLoading(true));
      const [moviesRes, artistsRes, usersRes] = await Promise.all([
        GetAllMovies(),
        GetAllArtists(),
        GetAllUsers(),
      ]);

      const movies = moviesRes.movies || [];
      const artists = artistsRes.data || [];
      const users = usersRes.data || [];

      setStats({
        movies: movies.length,
        artists: artists.length,
        users: users.length,
        series: 0, // TODO: Fetch from Series API
      });

      // Get last 5 movies
      setRecentMovies(movies.slice(0, 5));
      // Get last 5 users
      setRecentUsers(users.slice(0, 5));

      dispatch(setLoading(false));
    } catch (error) {
      console.error(error);
      message.error(error.message);
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardStyle = {
      background: 'linear-gradient(145deg, #1f1f1f, #161616)',
      border: '1px solid #333',
      borderRadius: '8px',
      overflow: 'hidden'
  };

  const tableStyle = {
      background: '#1f1f1f',
      borderRadius: '8px',
      border: '1px solid #333',
  }

  const columnsMovies = [
    {
      title: 'Poster',
      dataIndex: 'poster',
      key: 'poster',
      render: (text) => <img src={text} alt="poster" style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: '4px' }} />,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span style={{ fontWeight: 600, color: '#fff' }}>{text}</span>,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (text) => <span style={{ color: '#f5c518', fontWeight: 'bold' }}><StarFilled /> {text || 'N/A'}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => <span style={{ color: '#aaa' }}>{moment(text).format('DD MMM YYYY')}</span>,
    },
  ];

  const columnsUsers = [
      {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          render: (text) => <span style={{ fontWeight: 600, color: '#fff' }}>{text}</span>,
      },
      {
          title: 'Role',
          dataIndex: 'role',
          key: 'role',
          render: (role) => (
              <Tag color={role === 'admin' ? 'gold' : 'blue'}>
                  {role?.toUpperCase()}
              </Tag>
          )
      },
      {
        title: 'Joined',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (text) => <span style={{ color: '#aaa' }}>{moment(text).format('DD MMM YYYY')}</span>,
      }
  ]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#f5c518' }}>Dashboard Overview</Title>
        <p style={{ color: '#aaa', margin: 0 }}>Welcome back to CineLog Control Center</p>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#888' }}>Total Movies</span>}
              value={stats.movies}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
              prefix={<VideoCameraOutlined style={{ color: '#f5c518', marginRight: '10px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#888' }}>Total TV Shows</span>}
              value={stats.series} // Mocked for now
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
              prefix={<DesktopOutlined style={{ color: '#f5c518', marginRight: '10px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#888' }}>Total Artists</span>}
              value={stats.artists}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
              prefix={<TeamOutlined style={{ color: '#f5c518', marginRight: '10px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#888' }}>Registered Users</span>}
              value={stats.users}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
              prefix={<UserOutlined style={{ color: '#f5c518', marginRight: '10px' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '30px' }}>
          <Col xs={24} lg={12}>
              <div style={{ ...tableStyle, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <Title level={4} style={{ margin: 0, color: '#fff' }}>Recently Added Movies</Title>
                      <Button type="link" onClick={() => navigate('/admin/movies')} style={{ color: '#f5c518' }}>
                          View All <ArrowRightOutlined />
                      </Button>
                  </div>
                  <Table 
                    columns={columnsMovies} 
                    dataSource={recentMovies} 
                    rowKey="_id" 
                    pagination={false} 
                    size="small"
                  />
              </div>
          </Col>
          <Col xs={24} lg={12}>
            <div style={{ ...tableStyle, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <Title level={4} style={{ margin: 0, color: '#fff' }}>New Users</Title>
                      <Button type="link" onClick={() => navigate('/admin/users')} style={{ color: '#f5c518' }}>
                          View All <ArrowRightOutlined />
                      </Button>
                  </div>
                  <Table 
                    columns={columnsUsers} 
                    dataSource={recentUsers} 
                    rowKey="_id" 
                    pagination={false} 
                    size="small"
                  />
              </div>
          </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
