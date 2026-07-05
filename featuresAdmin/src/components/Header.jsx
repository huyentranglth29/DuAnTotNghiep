import {Link} from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div>
        <strong>Admin Dashboard</strong>
        <span>Quản lý rạp chiếu phim FilmGo</span>
      </div>
      <div className="headerUser">
        <Link className="avatar" to="/personal-information" aria-label="Thông tin tài khoản">
          A
        </Link>
      </div>
    </header>
  );
}

export default Header;
