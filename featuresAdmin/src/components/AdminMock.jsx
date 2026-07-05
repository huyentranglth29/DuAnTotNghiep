import {Link} from 'react-router-dom';
import {isValidElement} from 'react';

export const movies = [
  ['Avatar', 'Hành động', '162 phút', '01/05/2024', 'Đang chiếu'],
  ['Avengers', 'Hành động', '181 phút', '27/04/2024', 'Đang chiếu'],
  ['Superman', 'Hành động', '130 phút', '15/05/2024', 'Sắp chiếu'],
  ['Mission Impossible', 'Hành động', '143 phút', '10/06/2024', 'Đang chiếu'],
  ['Fast & Furious 10', 'Hành động', '141 phút', '20/04/2024', 'Hết suất'],
];

export const users = [
  ['Nguyễn Văn A', 'nguyenvana@gmail.com', '0901234567', 'Admin', 'Hoạt động'],
  ['Trần Thị B', 'tranthib@gmail.com', '0912345678', 'Nhân viên', 'Hoạt động'],
  ['Lê Văn C', 'levanc@gmail.com', '0934567890', 'Quản lý', 'Hoạt động'],
  ['Phạm Thị D', 'phamthid@gmail.com', '0945678901', 'Nhân viên', 'Tạm khóa'],
  ['Hoàng Văn E', 'hoangvane@gmail.com', '0967800123', 'Nhân viên', 'Hoạt động'],
];

export const showtimes = [
  ['Avatar', 'Phòng 01', '16/05/2024', '09:00', '120.000 đ', 'Đang mở bán'],
  ['Avatar', 'Phòng 01', '16/05/2024', '13:00', '120.000 đ', 'Đang mở bán'],
  ['Avengers', 'Phòng 02', '16/05/2024', '16:00', '130.000 đ', 'Đang mở bán'],
  ['Superman', 'Phòng 03', '16/05/2024', '19:00', '120.000 đ', 'Đang mở bán'],
  ['Mission Impossible', 'Phòng 04', '16/05/2024', '21:30', '120.000 đ', 'Đang mở bán'],
];

export const bookings = [
  ['DH001', 'Nguyễn Văn A', 'SC001', '240.000 đ', 'Đã thanh toán'],
  ['DH002', 'Trần Thị B', 'SC002', '360.000 đ', 'Đã thanh toán'],
  ['DH003', 'Lê Văn C', 'SC003', '120.000 đ', 'Chờ thanh toán'],
  ['DH004', 'Phạm Thị D', 'SC004', '480.000 đ', 'Đã hủy'],
  ['DH005', 'Hoàng Văn E', 'SC005', '240.000 đ', 'Đã thanh toán'],
];

export const tickets = [
  ['V001', 'DH001', 'Nguyễn Văn A', 'A5', 'Đã checkin'],
  ['V002', 'DH001', 'Nguyễn Văn A', 'A6', 'Đã checkin'],
  ['V003', 'DH002', 'Trần Thị B', 'B3', 'Chưa checkin'],
  ['V004', 'DH002', 'Trần Thị B', 'B4', 'Chưa checkin'],
  ['V005', 'DH003', 'Lê Văn C', 'C7', 'Đã hủy'],
];

export function PageTitle({title, action, to}) {
  return (
    <div className="pageTitle">
      <h2>{title}</h2>
      {action && (to ? <Link to={to}>{action}</Link> : <button type="button">{action}</button>)}
    </div>
  );
}

export function StatusBadge({value}) {
  const text = String(value);
  const tone =
    text.includes('hủy') || text.includes('Hủy') || text.includes('khóa') || text.includes('Hết')
      ? 'danger'
      : text.includes('Chờ') || text.includes('Sắp') || text.includes('VIP')
        ? 'warning'
        : text.includes('Đã nhận')
          ? 'info'
          : 'success';

  return <span className={`badge ${tone}`}>{value}</span>;
}

export function DataTable({headers, rows, actions = true}) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header}>{header}</th>
            ))}
            {actions && <th>Hành động</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>
                  {isValidElement(cell)
                    ? cell
                    : cellIndex === row.length - 1
                      ? <StatusBadge value={cell} />
                      : cell}
                </td>
              ))}
              {actions && (
                <td>
                  <div className="actionGroup">
                    <button type="button">Sửa</button>
                    <button type="button">Xóa</button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SearchBar({placeholder = 'Tìm kiếm...'}) {
  return (
    <div className="toolbar">
      <input placeholder={placeholder} />
    </div>
  );
}

export function FormShell({title, children}) {
  return (
    <section>
      <PageTitle title={title} />
      <div className="panel">
        <div className="tabs">
          <button className="active" type="button">Thông tin chính</button>
          <button type="button">Trailer</button>
          <button type="button">Hình ảnh</button>
        </div>
        <form className="formGrid">{children}</form>
      </div>
    </section>
  );
}

export function MiniChart({type = 'line'}) {
  return <div className={`miniChart ${type}`} />;
}

export function QRBlock() {
  return (
    <div className="qrBox" aria-label="QR code">
      {Array.from({length: 64}, (_, index) => (
        <span key={index} className={index % 3 === 0 || index % 7 === 0 ? 'on' : ''} />
      ))}
    </div>
  );
}
