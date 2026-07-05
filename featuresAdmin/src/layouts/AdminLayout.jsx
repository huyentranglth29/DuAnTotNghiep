import {Outlet} from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function AdminLayout() {
  return (
    <div className="adminLayout">
      <Sidebar />
      <main>
        <Header />
        <div className="pageContent">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
