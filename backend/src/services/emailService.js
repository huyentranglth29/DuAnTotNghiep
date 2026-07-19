const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_SECURE } =
    process.env;
  if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASSWORD) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: Number(MAIL_PORT),
    secure: String(MAIL_SECURE).toLowerCase() === "true",
    auth: { user: MAIL_USER, pass: MAIL_PASSWORD },
  });
  return transporter;
}

async function sendLoginNotification({ email, fullName, provider = "FilmGo" }) {
  const mailer = getTransporter();
  if (!mailer || !email) {
    console.warn(
      "Bỏ qua email đăng nhập: chưa cấu hình SMTP hoặc thiếu email người nhận.",
    );
    return false;
  }

  const now = new Date().toLocaleString("vi-VN", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const displayName = fullName || "bạn";

  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: "Đăng nhập FilmGo thành công",
    text: `Xin chào ${displayName},\n\nTài khoản của bạn vừa đăng nhập FilmGo bằng ${provider} lúc ${now}.\n\nNếu không phải bạn, hãy đổi mật khẩu và liên hệ hỗ trợ FilmGo.`,
    html: `<p>Xin chào <strong>${displayName}</strong>,</p>
      <p>Tài khoản của bạn vừa đăng nhập FilmGo bằng <strong>${provider}</strong> lúc <strong>${now}</strong>.</p>
      <p>Nếu không phải bạn, hãy đổi mật khẩu và liên hệ hỗ trợ FilmGo.</p>`,
  });
  return true;
}

module.exports = { sendLoginNotification };
