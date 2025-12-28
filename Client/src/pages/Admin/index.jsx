import { Tabs } from 'antd';
import Movies from '../Admin/Movies';
import Artists from '../Admin/Artists';
import Users from '../Admin/Users';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;

/**
 * Admin Dashboard
 * Uses Ant Design Tabs to manage Movies, Artists, and Users.
 * Protected by Admin check.
 */
function Admin() {
  const [activeTab, setActiveTab] = useState('1'); // '1' = Movies, '2' = Artists, '3' = Users
  const { user } = useSelector((state) => state.users);
  const navigate = useNavigate();

  return (
    <div>
      {user?.isAdmin ? (
        <Tabs
          className='border border-b-gray-500'
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            navigate(`/admin?tab=${key}`);
          }}
        >
          <TabPane tab='Movies' key='1'>
            <Movies />
          </TabPane>
          <TabPane tab='Artists' key='2'>
            <Artists />
          </TabPane>
          <TabPane tab='Users' key='3'>
            <Users />
          </TabPane>
        </Tabs>
      ) : (
        <div className='text-gray-600 text-md text-center mt-20'>
          You are not authorized to view this page
        </div>
      )}
    </div>
  );
}

export default Admin;
