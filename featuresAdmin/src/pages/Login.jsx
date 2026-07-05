function Login() {
  return (
    <section className="loginPage">
      <form className="loginBox">
        <h1>Đăng nhập Admin</h1>
        <label>
          Email
          <input type="email" placeholder="admin@filmgo.vn" />
        </label>
        <label>
          Mật khẩu
          <input type="password" placeholder="Nhập mật khẩu" />
        </label>
        <button type="button">Đăng nhập</button>
      </form>
    </section>
  );
}

export default Login;
