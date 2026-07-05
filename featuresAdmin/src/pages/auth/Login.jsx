import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [error, setError] = useState('');

  const handleSubmit = event => {
    event.preventDefault();

    if (
      email.trim().toLowerCase() === ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      localStorage.setItem('filmgo_admin_logged_in', 'true');
      navigate('/');
      return;
    }

    setError('Email hoặc mật khẩu không đúng.');
  };

  return (
    <section className="loginSplit">
      <div className="loginPanel">
        <div className="brand">FILMGO</div>
        <p>Admin Dashboard</p>
        <form className="loginCard" onSubmit={handleSubmit}>
          <h1>Đăng nhập hệ thống</h1>
          <label>Email</label>
          <input
            autoComplete="username"
            onChange={event => {
              setEmail(event.target.value);
              setError('');
            }}
            type="email"
            value={email}
          />
          <label>Mật khẩu</label>
          <input
            autoComplete="current-password"
            onChange={event => {
              setPassword(event.target.value);
              setError('');
            }}
            type="password"
            value={password}
          />
          {error && <p className="loginError">{error}</p>}
          <div className="loginOptions">
            <label><input defaultChecked type="checkbox" /> Ghi nhớ đăng nhập</label>
            <a>Quên mật khẩu?</a>
          </div>
          <button type="submit">Đăng nhập</button>
        </form>
        <small>© 2034 FilmGo. All rights reserved.</small>
      </div>
      <div className="cinemaHero">
        <div className="screen">FILMGO</div>
        <div className="snacks">🍿 🥤</div>
      </div>
    </section>
  );
}

export default Login;
