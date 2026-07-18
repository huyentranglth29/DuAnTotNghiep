/**
 * Google Sign-In — Web Client ID (OAuth 2.0 → Web application).
 *
 * Team:
 * - Commit file này + android/app/debug-filmgo.keystore để cùng SHA-1.
 * - Mỗi máy: copy backend/.env.example → backend/.env và giữ GOOGLE_CLIENT_ID.
 * - Google Cloud → Khán giả → thêm Gmail của từng người vào Người dùng thử nghiệm.
 * - Android client SHA-1 chung: FD:29:31:34:11:60:DC:15:56:4E:30:A6:12:85:18:B0:55:EC:DD:02
 */
const GOOGLE_CONFIG = {
  WEB_CLIENT_ID:
    '610098112221-81itiqbuku3n1acfnq863j2r5mg572ci.apps.googleusercontent.com',
};

export default GOOGLE_CONFIG;
