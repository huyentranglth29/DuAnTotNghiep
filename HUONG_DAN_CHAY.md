# Hướng dẫn chạy dự án FilmGo (cho team)

## Yêu cầu máy

- Node.js 18+
- Android Studio + Emulator (hoặc máy Android USB debug)
- MongoDB Atlas (URI trong `backend/.env`)

---

## 1. Lấy code

```powershell
git pull
cd C:\DuAnTotNghiep
npm install
cd backend
npm install
cd ..
```

---

## 2. Cấu hình Backend

```powershell
copy backend\.env.example backend\.env
```

Mở `backend\.env` và điền:

- `MONGO_URI=...` (Atlas của nhóm)
- `JWT_SECRET=...` (chuỗi bất kỳ, cùng nhóm thì dùng chung)
- `GOOGLE_CLIENT_ID=...` (đã có sẵn trong `.env.example` — giữ nguyên)

Chạy backend:

```powershell
cd backend
npm start
```

API mặc định: `http://localhost:3000`

---

## 3. Cấu hình App User (React Native)

File gốc `.env` (tùy chọn — Web Client ID đã có trong `src/config/google.config.js`):

```powershell
copy .env.example .env
```

Chỉnh `API_BASE_URL` nếu cần:

- Emulator Android: `http://10.0.2.2:3000`
- Máy thật: `http://<IP-máy-tính>:3000`

Chạy Metro + app:

```powershell
cd C:\DuAnTotNghiep
npm start
```

Terminal khác:

```powershell
cd C:\DuAnTotNghiep
npx react-native run-android
```

App đã cài sẵn thì chỉ cần `npm start` rồi mở icon FilmGo trên emulator.

---

## 4. Đăng nhập Google

1. Dùng keystore chung `android/app/debug-filmgo.keystore` (đã commit) — **đừng đổi** `build.gradle` signing.
2. Nhờ admin Google Cloud thêm **Gmail của bạn** vào:  
   Google Cloud → FilmGo → **Khán giả** → **Người dùng thử nghiệm**.
3. Trên app bấm **Tiếp tục với Google** → chọn đúng Gmail đã thêm.

Email + mật khẩu vẫn dùng bình thường (không cần Google).

---

## 5. Admin (Vite)

```powershell
cd featuresAdmin
npm install
npm run dev
```

Đăng nhập admin bằng tài khoản `role: admin` (email/password) — **không** dùng Google.

---

## Lưu ý

- **Không commit** file `.env` / `backend/.env` (chứa secret).
- Lỗi Google `DEVELOPER_ERROR` / sai SHA-1: kiểm tra đang build bằng `debug-filmgo.keystore`, rồi `npx react-native run-android` lại.
- Backend phải chạy trước khi login (email hoặc Google).
