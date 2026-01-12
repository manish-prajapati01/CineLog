import { Button, Table, message, Input, Space, Tooltip, Avatar, Tag } from 'antd';
import { useEffect, useState } from 'react';
import ArtistModalForm from './ArtistModalForm';
import { useDispatch } from 'react-redux';
import { setLoading } from '../../../redux/loadersSlice';
import { DeleteArtist, GetAllArtists } from '../../../apis/artists';
import { getDateFormat } from '../../../helpers';
import { EditOutlined, DeleteOutlined, UserAddOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { TeamOutlined } from '@ant-design/icons';

function Artists() {
  const [artists, setArtists] = useState([]);
  const [searchText, setSearchText] = useState('');
  const dispatch = useDispatch();
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);

  const fetchAllArtists = async () => {
    try {
      dispatch(setLoading(true));
      const response = await GetAllArtists();
      setArtists(response.data);
      dispatch(setLoading(false));
    } catch (error) {
      message.error(error.message);
      dispatch(setLoading(false));
    }
  };

  const deleteArtist = async (id) => {
    try {
      dispatch(setLoading(true));
      const response = await DeleteArtist(id);
      message.success(response.message);
      fetchAllArtists();
      dispatch(setLoading(false));
    } catch (error) {
      message.error(error.message);
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchAllArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredArtists = artists.filter(artist => 
      artist.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Profile',
      dataIndex: 'profilePic',
      render: (text, record) => {
        const imageUrl = record?.images?.[0] || '';
        if (imageUrl) {
            return <Avatar src={imageUrl} size={48} />;
        }
        return <Avatar icon={<UserOutlined />} size={48} />;
      },
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span style={{ fontWeight: 600, fontSize: '1rem', color: '#fff' }}>{text}</span>
    },
    {
      title: 'Profession',
      dataIndex: 'profession',
      render: (text) => <Tag color="geekblue">{text}</Tag>
    },
    {
      title: 'Debuted In',
      dataIndex: 'debutYear',
      render: (text) => <span style={{ color: '#aaa' }}>{text}</span>
    },
    {
      title: 'Debut Movie',
      dataIndex: 'debutMovie',
      render: (text) => <span style={{ fontStyle: 'italic', color: '#ccc' }}>{text}</span>
    },
    {
        title: 'DOB',
        dataIndex: 'dob',
        render: (text) => <span style={{ color: '#888' }}>{getDateFormat(text)}</span>,
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
                    onClick={() => {
                        setSelectedArtist(record);
                        setShowArtistModal(true);
                    }}
                 />
             </Tooltip>
             <Tooltip title="Delete">
                 <Button 
                    type="text" 
                    danger
                    icon={<DeleteOutlined />} 
                    onClick={() => {
                        if(window.confirm('Are you sure you want to delete this artist?')) {
                            deleteArtist(record._id);
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
         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TeamOutlined style={{ fontSize: '24px', color: '#f5c518' }} />
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Artists</h1>
         </div>
      
          <Space>
             <Input 
                placeholder="Search artists..." 
                prefix={<SearchOutlined style={{ color: '#888' }} />} 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250, background: '#1f1f1f', border: 'none', color: '#fff' }}
             />
             <Button 
                type="primary" 
                icon={<UserAddOutlined />}
                onClick={() => {
                    setSelectedArtist(null);
                    setShowArtistModal(true);
                }}
            >
                Add Artist
            </Button>
          </Space>
      </div>

      <Table 
        dataSource={filteredArtists} 
        columns={columns} 
        rowKey="_id"
        pagination={{ pageSize: 8 }}
      />
      
      {showArtistModal && (
        <ArtistModalForm
          showArtistModal={showArtistModal}
          setShowArtistModal={setShowArtistModal}
          selectedArtist={selectedArtist}
          setSelectedArtist={setSelectedArtist}
          reloadData={fetchAllArtists}
        />
      )}
    </div>
  );
}

export default Artists;
