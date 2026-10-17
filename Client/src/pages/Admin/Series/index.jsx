import { Button, Table, message, Input, Space, Tooltip, Tag } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setLoading } from '../../../redux/loadersSlice';
import { DeleteSeries, GetAllSeries } from '../../../apis/series';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import moment from 'moment';

function Series() {
  const [series, setSeries] = useState([]);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getAllSeries = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const response = await GetAllSeries();
      setSeries(response.data || []);
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      message.error(error.message);
    }
  }, [dispatch]);

  const deleteSeries = async (id) => {
    try {
      dispatch(setLoading(true));
      const response = await DeleteSeries(id);
      message.success(response.message);
      getAllSeries();
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    getAllSeries();
  }, [getAllSeries]);

  const filteredSeries = series.filter((s) =>
    s.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const columns = [
    {
      title: 'Poster',
      dataIndex: 'posters',
      render: (posters, record) => {
        const imageUrl = posters?.[0] || '';
        return (
          <div
            style={{
              width: 40,
              height: 60,
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid #333',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={record.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{ width: '100%', height: '100%', background: '#333' }}
              />
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
      render: (text) => (
        <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Total Seasons',
      dataIndex: 'totalSeasons',
      render: (text) => <Tag color='blue'>{text || 1} Seasons</Tag>,
    },
    {
      title: 'First Air Date',
      dataIndex: 'releaseDate',
      render: (text) => (
        <span style={{ color: '#aaa' }}>
          {moment(text).format('DD MMM YYYY')}
        </span>
      ),
      sorter: (a, b) => new Date(a.releaseDate) - new Date(b.releaseDate),
    },
    {
      title: 'Genre',
      dataIndex: 'genre',
      render: (genre) => (
        <Tag color='cyan' style={{ color: '#000', fontWeight: 500 }}>
          {genre}
        </Tag>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      render: (text, record) => {
        return (
          <Space size='middle'>
            <Tooltip title='Edit'>
              <Button
                type='text'
                icon={<EditOutlined style={{ color: '#dfb582' }} />}
                onClick={() => navigate(`/admin/series/edit/${record._id}`)}
              />
            </Tooltip>
            <Tooltip title='Delete'>
              <Button
                type='text'
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to delete this series?',
                    )
                  ) {
                    deleteSeries(record._id);
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DesktopOutlined style={{ fontSize: '24px', color: '#dfb582' }} />
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>TV Shows</h1>
        </div>
        <Space wrap>
          <Input aria-label="Search series"
            prefix={<SearchOutlined style={{ color: '#888' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 'min(250px, 65vw)',
              background: '#1c1b22',
              border: 'none',
              color: '#fff',
            }}
          />
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/series/add')}
          >
            Add TV Show
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredSeries}
        columns={columns}
        rowKey='_id'
        pagination={{ pageSize: 8 }}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}

export default Series;
