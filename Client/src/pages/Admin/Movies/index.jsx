import { Button, Table, message, Input, Space, Tooltip, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setLoading } from '../../../redux/loadersSlice';
import { DeleteMovie, GetAllMovies } from '../../../apis/movies';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, StarFilled } from '@ant-design/icons';
import moment from 'moment';

/**
 * Admin Movies Page
 * Manage movies (add, edit, delete) with smart table.
 */
function Movies() {
  const [movies, setMovies] = useState([]);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getAllMovies = async () => {
    try {
      dispatch(setLoading(true));
      const response = await GetAllMovies();
      setMovies(response.movies);
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      message.error(error.message);
    }
  };

  const deleteMovie = async (id) => {
    try {
      dispatch(setLoading(true));
      const response = await DeleteMovie(id);
      message.success(response.message);
      getAllMovies();
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    getAllMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMovies = movies.filter(movie => 
      movie.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Poster',
      dataIndex: 'posters',
      render: (posters, record) => {
        const imageUrl = posters?.[0] || '';
        return (
            <div style={{ width: 40, height: 60, borderRadius: 4, overflow: 'hidden', border: '1px solid #333' }}>
                {imageUrl ? (
                     <img src={imageUrl} alt={record.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: '#333' }} />
                )}
            </div>
        );
      },
      width: 80,
    },
    { 
        title: 'Title', 
        dataIndex: 'name', 
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text) => <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>{text}</span>
    },
    {
      title: 'Release Date',
      dataIndex: 'releaseDate',
      render: (text) => <span style={{ color: '#aaa' }}>{moment(text).format('DD MMM YYYY')}</span>,
      sorter: (a, b) => new Date(a.releaseDate) - new Date(b.releaseDate),
    },
    { 
        title: 'Genre', 
        dataIndex: 'genre',
        render: (genre) => {
           if(Array.isArray(genre)){
               return genre.map(g => <Tag key={g} color="gold" style={{ color: '#000', fontWeight: 500, marginRight: 5 }}>{g}</Tag>)
           }
           return <Tag color="gold" style={{ color: '#000', fontWeight: 500 }}>{genre}</Tag>
        }
    },
    {
        title: 'Rating',
        dataIndex: 'rating', // Assuming rating assumes we fetch it or it's on the movie object. If not, mocked.
        render: (text) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <StarFilled style={{ color: '#f5c518' }} />
                <span style={{ fontWeight: 'bold' }}>{text || 'N/A'}</span>
            </div>
        )
    },
    { 
      title: 'Language', 
      dataIndex: 'language',
      responsive: ['md']
    },
    {
      title: 'Action',
      dataIndex: 'action',
      render: (text, record) => {
        return (
            <Space size="middle">
                <Tooltip title="Edit">
                    <Button 
                        type="text" 
                        icon={<EditOutlined style={{ color: '#5799ef' }} />} 
                        onClick={() => navigate(`/admin/movies/edit/${record._id}`)}
                    />
                </Tooltip>
                <Tooltip title="Delete">
                    <Button 
                        type="text" 
                        danger
                        icon={<DeleteOutlined />} 
                        onClick={() => {
                            if(window.confirm('Are you sure you want to delete this movie?')) {
                                deleteMovie(record._id);
                            }
                        }}
                    />
                </Tooltip>
            </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Movies</h1>
          <Space>
             <Input 
                placeholder="Search movies..." 
                prefix={<SearchOutlined style={{ color: '#888' }} />} 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250, background: '#1f1f1f', border: 'none', color: '#fff' }}
             />
             <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/movies/add')}>
                Add Movie
             </Button>
          </Space>
      </div>

      <Table
        dataSource={filteredMovies}
        columns={columns}
        rowKey='_id'
        pagination={{ pageSize: 8, position: ['bottomCenter'] }}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}

export default Movies;
