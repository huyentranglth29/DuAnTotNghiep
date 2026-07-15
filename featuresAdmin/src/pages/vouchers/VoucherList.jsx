import voucherApi from '../../api/voucherApi';
import AdminListPage from '../../components/AdminListPage';
import {formatDate, formatVnd} from '../../utils/adminFormatters';

function VoucherList() {
  return (
    <AdminListPage
      title="Quản lý voucher"
      api={voucherApi}
      searchPlaceholder="Tìm kiếm voucher..."
      fields={[
        {name: 'code', label: 'Mã voucher', required: true},
        {name: 'description', label: 'Mô tả', type: 'textarea'},
        {
          name: 'discountType',
          label: 'Loại giảm',
          type: 'select',
          defaultValue: 'percent',
          options: [
            {value: 'percent', label: 'Phần trăm'},
            {value: 'amount', label: 'Số tiền'},
          ],
        },
        {name: 'discountValue', label: 'Giá trị giảm', type: 'number', required: true},
        {name: 'minOrderValue', label: 'Đơn tối thiểu', type: 'number'},
        {name: 'maxDiscount', label: 'Giảm tối đa', type: 'number'},
        {name: 'quantity', label: 'Số lượng', type: 'number'},
        {name: 'startDate', label: 'Ngày bắt đầu', type: 'date', required: true},
        {name: 'endDate', label: 'Ngày kết thúc', type: 'date', required: true},
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          defaultValue: 'active',
          options: [
            {value: 'active', label: 'Hoạt động'},
            {value: 'inactive', label: 'Tạm tắt'},
            {value: 'expired', label: 'Hết hạn'},
          ],
        },
      ]}
      columns={[
        {key: 'code', title: 'Mã voucher'},
        {key: 'discountType', title: 'Loại'},
        {
          key: 'discountValue',
          title: 'Giá trị',
          render: item => item.discountType === 'percent' ? `${item.discountValue}%` : formatVnd(item.discountValue),
        },
        {key: 'endDate', title: 'Ngày hết hạn', render: item => formatDate(item.endDate)},
        {key: 'status', title: 'Trạng thái'},
      ]}
    />
  );
}

export default VoucherList;
