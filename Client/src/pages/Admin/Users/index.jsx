import { Table, message, Input, Space, Tag, Avatar } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setLoading } from '../../../redux/loadersSlice';
import { GetAllUsers } from '../../../apis/users';
import { getDateFormat } from '../../../helpers';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { TeamOutlined } from '@ant-design/icons';

function Users() {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const dispatch = useDispatch();

  const fetchUsers = async () => {
    try {
      dispatch(setLoading(true));
      const response = await GetAllUsers();
      setUsers(response.data);
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchText.toLowerCase()) || 
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => (
          <Space>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#f5c518', verticalAlign: 'middle' }} />
              <span style={{ fontWeight: 600, color: '#fff' }}>{text}</span>
          </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'User', value: 'user' },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => (
         <Tag color={role === 'admin' ? 'gold' : 'blue'}>
             {role.toUpperCase()}
         </Tag>
      ),
    },
    {
      title: 'Joined Date',
      dataIndex: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => <span style={{ color: '#aaa' }}>{getDateFormat(date)}</span>,
    },
    {
        title: 'Status',
        dataIndex: 'isActive', // Assuming this field exists or we defaults
        render: (isActive) => (
            <Tag color={isActive !== false ? 'green' : 'red'}>
                {isActive !== false ? 'Active' : 'Inactive'}
            </Tag>
        )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TeamOutlined style={{ fontSize: '24px', color: '#f5c518' }} />
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Users</h1>
         </div>
      
          <Space>
             <Input 
                placeholder="Search users..." 
                prefix={<SearchOutlined style={{ color: '#888' }} />} 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250, background: '#1f1f1f', border: 'none', color: '#fff' }}
             />
          </Space>
      </div>
      
      <Table
        dataSource={filteredUsers}
        columns={columns}
        rowKey='_id'
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

export default Users;
