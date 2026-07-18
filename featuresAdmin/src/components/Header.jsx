import {Link} from 'react-router-dom';
import {useAdminTheme} from '../theme/AdminThemeContext';

function Header() {
  const {darkMode, toggleDarkMode} = useAdminTheme();

  return (
    <header className="header">
      <div className="headerTitle">
        <strong>Admin Dashboard</strong>
        <span>Quản lý rạp chiếu phim FilmGo</span>
      </div>
      <div className="headerUser">
        <button
          className="headerThemeButton"
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          title={darkMode ? 'Giao diện sáng' : 'Giao diện tối'}>
          {darkMode ? '☀' : '◐'}
        </button>
        <Link className="headerAdminProfile" to="/personal-information" aria-label="Thông tin tài khoản Admin">
          <span className="avatar" aria-hidden="true">
            A
          </span>
          <span className="headerAdminMeta">
            <strong>Admin</strong>
            <small>Tài khoản</small>
          </span>
        </Link>
      </div>
    </header>
  );
}

export default Header;
