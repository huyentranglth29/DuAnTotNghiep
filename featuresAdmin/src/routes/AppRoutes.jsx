import {Navigate, Route, Routes} from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import MovieList from '../pages/movies/MovieList';
import MovieAdd from '../pages/movies/MovieAdd';
import MovieEdit from '../pages/movies/MovieEdit';
import MovieRevenue from '../pages/movies/MovieRevenue';
import RoomList from '../pages/rooms/RoomList';
import SeatManagement from '../pages/seats/SeatManagement';
import ShowtimeList from '../pages/showtimes/ShowtimeList';
import ShowtimeAdd from '../pages/showtimes/ShowtimeAdd';
import CreateShowtime from '../pages/showtimes/CreateShowtime';
import ShowtimeStatus from '../pages/showtimes/ShowtimeStatus';
import BookingDetail from '../pages/bookings/BookingDetail';
import BookingList from '../pages/bookings/BookingList';
import UserList from '../pages/users/UserList';
import RolePermission from '../pages/roles/RolePermission';
import TicketList from '../pages/tickets/TicketList';
import ElectronicTicket from '../pages/tickets/ElectronicTicket';
import GenerateQR from '../pages/tickets/GenerateQR';
import TicketCheckin from '../pages/tickets/TicketCheckin';
import CheckinResult from '../pages/tickets/CheckinResult';
import TicketStatus from '../pages/tickets/TicketStatus';
import VoucherList from '../pages/vouchers/VoucherList';
import ProductList from '../pages/products/ProductList';
import ReviewList from '../pages/reviews/ReviewList';
import NotificationList from '../pages/notifications/NotificationList';
import CreateNotification from '../pages/notifications/CreateNotification';
import PersonalInformation from '../pages/personal information/PersonalInformation';
import PaymentHistory from '../pages/payments/PaymentHistory';
import PaymentStatus from '../pages/payments/PaymentStatus';
import RevenueReport from '../pages/reports/RevenueReport';
import NewsEventList from '../pages/news-events/NewsEventList';

function isAuthenticated() {
  return Boolean(localStorage.getItem('filmgo_admin_token'));
}

function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}

function LoginRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserList />} />
        <Route path="roles" element={<RolePermission />} />
        <Route path="movies" element={<MovieList />} />
        <Route path="movies/add" element={<MovieAdd />} />
        <Route path="movies/:id/edit" element={<MovieEdit />} />
        <Route path="movies/:id/revenue" element={<MovieRevenue />} />
        <Route path="rooms" element={<RoomList />} />
        <Route path="seats" element={<SeatManagement />} />
        <Route path="showtimes" element={<ShowtimeList />} />
        <Route path="showtimes/add" element={<ShowtimeAdd />} />
        <Route path="showtimes/create" element={<CreateShowtime />} />
        <Route path="showtimes/:id/edit" element={<CreateShowtime />} />
        <Route path="showtimes/status" element={<ShowtimeStatus />} />
        <Route path="bookings" element={<BookingList />} />
        <Route path="bookings/detail" element={<BookingDetail />} />
        <Route path="payments/status" element={<PaymentStatus />} />
        <Route path="payments/history" element={<PaymentHistory />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/electronic" element={<ElectronicTicket />} />
        <Route path="tickets/qr" element={<GenerateQR />} />
        <Route path="tickets/checkin" element={<TicketCheckin />} />
        <Route path="tickets/checkin-result" element={<CheckinResult />} />
        <Route path="tickets/status" element={<TicketStatus />} />
        <Route path="vouchers" element={<VoucherList />} />
        <Route path="products" element={<ProductList />} />
        <Route path="reviews" element={<ReviewList />} />
        <Route path="notifications" element={<NotificationList />} />
        <Route path="notifications/create" element={<CreateNotification />} />
        <Route path="news-events" element={<NewsEventList />} />
        <Route path="personal-information" element={<PersonalInformation />} />
        <Route path="reports/revenue" element={<RevenueReport />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
