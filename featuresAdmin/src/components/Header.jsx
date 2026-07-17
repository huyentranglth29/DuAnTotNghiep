import {Link} from 'react-router-dom';
import {useAdminTheme} from '../theme/AdminThemeContext';

function Header() {
  const {darkMode, toggleDarkMode} = useAdminTheme();

  return (
    <header className="header">
      <div>
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
        <Link className="avatar" to="/personal-information" aria-label="Thông tin tài khoản">
          A
        </Link>
      </div>
    </header>
  );
}

export default Header;
