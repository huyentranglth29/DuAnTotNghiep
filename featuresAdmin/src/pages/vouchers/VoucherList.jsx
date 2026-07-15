import {useEffect, useMemo, useState} from 'react';
import voucherApi from '../../api/voucherApi';
import Modal from '../../components/Modal';
import {formatDate, formatVnd} from '../../utils/adminFormatters';

const STATUS_LABEL = {
  active: 'Đang hoạt động',
  inactive: 'Tạm tắt',
  expired: 'Hết hạn',
};

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  minOrderValue: '',
  maxDiscount: '',
  quantity: '',
  startDate: '',
  endDate: '',
  status: 'active',
};

function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function LineChart({points}) {
  const width = 360;
  const height = 160;
  const pad = 24;
  const maxY = Math.max(5, ...points.map(p => p.count));
  const stepX =
    points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = height - pad - (p.count / maxY) * (height - pad * 2);
    return {x, y, ...p};
  });

  const path = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const area =
    coords.length > 0
      ? `${path} L ${coords[coords.length - 1].x} ${height - pad} L ${coords[0].x} ${height - pad} Z`
      : '';

  const labelIdx = [
    0,
    Math.floor(points.length / 4),
    Math.floor(points.length / 2),
    Math.floor((points.length * 3) / 4),
    points.length - 1,
  ].filter((v, i, arr) => v >= 0 && arr.indexOf(v) === i);

  return (
    <svg className="voucherChartSvg" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map(t => {
        const y = height - pad - t * (height - pad * 2);
        return (
          <line
            key={t}
            className="voucherGridLine"
            x1={pad}
            x2={width - pad}
            y1={y}
            y2={y}
          />
        );
      })}
      <path className="voucherAreaPath" d={area} />
      <path className="voucherLinePath" d={path} />
      {coords.map((c, i) => (
        <g key={c.date} className="voucherDotGroup">
          <circle className="voucherDot" cx={c.x} cy={c.y} r={3.5}>
            <title>{`${c.date}: ${c.count} lượt`}</title>
          </circle>
        </g>
      ))}
      {labelIdx.map(i => {
        const c = coords[i];
        if (!c) return null;
        return (
          <text key={`lbl-${c.date}`} className="voucherAxisLabel" x={c.x} y={height - 6}>
            {c.date.slice(8)}
          </text>
        );
      })}
    </svg>
  );
}

function DonutChart({slices}) {
  const size = 150;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const colors = ['#2563eb', '#22c55e'];

  const total = slices.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="voucherDonutWrap">
      <svg className="voucherChartSvg" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e8edf5"
          strokeWidth={stroke}
        />
        {slices.map((slice, index) => {
          const len = total ? (slice.count / total) * c : 0;
          const el = (
            <circle
              key={slice.discountType}
              className="voucherDonutSlice"
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            >
              <title>{`${slice.label}: ${slice.percent}%`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
        <text
          className="voucherDonutCenter"
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {total}
        </text>
      </svg>
      <ul className="voucherDonutLegend">
        {slices.map((slice, index) => (
          <li key={slice.discountType}>
            <span style={{background: colors[index % colors.length]}} />
            {slice.label} ({slice.percent}%)
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarChart({items}) {
  const max = Math.max(1, ...items.map(i => i.percent || i.count || 0));
  return (
    <div className="voucherBarChart">
      {items.length === 0 && <p className="voucherEmptyHint">Chưa có dữ liệu sử dụng</p>}
      {items.map(item => {
        const value = item.percent ?? item.count;
        const height = Math.max(6, Math.round((value / max) * 100));
        return (
          <div key={item.genre} className="voucherBarCol" title={`${item.genre}: ${item.count} lượt`}>
            <div className="voucherBarTrack">
              <div className="voucherBarFill" style={{height: `${height}%`}} />
            </div>
            <span>{item.genre}</span>
            <small>{item.percent}%</small>
          </div>
        );
      })}
    </div>
  );
}

function VoucherList() {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const [statsRes, listRes] = await Promise.all([
        voucherApi.getStats(params),
        voucherApi.getAll({limit: 100, status: statusFilter || undefined}),
      ]);

      const statsData = statsRes?.data || statsRes;
      setStats(statsData);

      const list = Array.isArray(listRes) ? listRes : listRes?.data || [];
      const usageMap = Object.fromEntries(
        (statsData?.vouchers || []).map(v => [String(v._id), v]),
      );
      setItems(
        list.map(item => ({
          ...item,
          usedCount: usageMap[String(item._id)]?.usedCount ?? 0,
          usagePercent: usageMap[String(item._id)]?.usagePercent ?? 0,
        })),
      );
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu voucher.');
      setItems([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      [item.code, item.description, item.status, item.discountType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [items, keyword]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = item => {
    setEditing(item);
    setForm({
      code: item.code || '',
      description: item.description || '',
      discountType: item.discountType || 'percent',
      discountValue: item.discountValue ?? '',
      minOrderValue: item.minOrderValue ?? '',
      maxDiscount: item.maxDiscount ?? '',
      quantity: item.quantity ?? '',
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
      status: item.status || 'active',
    });
    setModalOpen(true);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: String(form.code || '').trim().toUpperCase(),
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue || 0),
        maxDiscount: form.maxDiscount === '' ? undefined : Number(form.maxDiscount),
        quantity: Number(form.quantity || 0),
      };

      if (editing) {
        await voucherApi.update(editing._id || editing.id, payload);
      } else {
        await voucherApi.create(payload);
      }
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      window.alert(err.message || 'Lưu voucher thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async item => {
    if (!window.confirm(`Xóa voucher ${item.code}?`)) return;
    try {
      await voucherApi.remove(item._id || item.id);
      await loadAll();
    } catch (err) {
      window.alert(err.message || 'Xóa thất bại.');
    }
  };

  const copyCode = async code => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (_) {
      /* ignore */
    }
  };

  const applyDateFilter = event => {
    event.preventDefault();
    loadAll();
  };

  const trend = stats?.usageTrend || [];
  const types = stats?.typeDistribution || [
    {discountType: 'percent', label: 'Giảm %', count: 0, percent: 0},
    {discountType: 'amount', label: 'Giảm số tiền', count: 0, percent: 0},
  ];
  const genres = stats?.usageByGenre || [];
  const topCards = stats?.topVouchers || [];

  return (
    <section className="voucherPage">
      <header className="voucherPageHeader">
        <div>
          <p className="voucherEyebrow">Admin Dashboard</p>
          <h1>Thống kê & Quản lý Voucher</h1>
        </div>
        <div className="voucherToolbar">
          <label className="voucherFilter">
            Trạng thái
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm tắt</option>
              <option value="expired">Hết hạn</option>
            </select>
          </label>
          <form className="voucherDateRange" onSubmit={applyDateFilter}>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              aria-label="Từ ngày"
            />
            <span>—</span>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              aria-label="Đến ngày"
            />
            <button type="submit" className="voucherGhostBtn">
              Lọc
            </button>
          </form>
          <button type="button" className="voucherPrimaryBtn" onClick={openCreate}>
            + Tạo Voucher mới
          </button>
        </div>
      </header>

      {error && <p className="voucherError">{error}</p>}
      {loading && <p className="voucherLoading">Đang tải...</p>}

      <div className="voucherCharts">
        <article className="voucherChartCard">
          <h2>Xu hướng sử dụng Voucher (30 ngày)</h2>
          <p className="voucherChartHint">
            Đếm từ booking: mỗi khách dùng voucher = +1 theo ngày đặt
          </p>
          <LineChart points={trend} />
        </article>
        <article className="voucherChartCard">
          <h2>Phân bổ loại Voucher</h2>
          <p className="voucherChartHint">Theo loại giảm giá trong các lần dùng thật</p>
          <DonutChart slices={types} />
        </article>
        <article className="voucherChartCard">
          <h2>Tỷ lệ sử dụng theo thể loại phim</h2>
          <p className="voucherChartHint">
            Booking có voucher → suất chiếu → phim → genre
          </p>
          <BarChart items={genres} />
        </article>
      </div>

      <div className="voucherUsageCards">
        {topCards.map(card => (
          <article key={card._id} className="voucherUsageCard">
            <div className="voucherUsageTop">
              <h3>{card.description || card.code}</h3>
              <button
                type="button"
                className="voucherCopyBtn"
                onClick={() => copyCode(card.code)}
                title="Copy mã"
              >
                {card.code} ⧉
              </button>
            </div>
            <p>
              {card.usedCount}/{card.quantity || 0} ({card.usagePercent}%)
            </p>
            <div className="voucherProgress">
              <span style={{width: `${card.usagePercent}%`}} />
            </div>
          </article>
        ))}
        {!loading && topCards.length === 0 && (
          <p className="voucherEmptyHint">
            Chưa có lượt dùng. Khi khách đặt vé kèm voucher, biểu đồ sẽ hiện.
          </p>
        )}
      </div>

      <div className="voucherListPanel">
        <div className="voucherListHead">
          <h2>Danh sách Voucher</h2>
          <input
            className="voucherSearch"
            placeholder="Tìm mã / mô tả..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </div>
        <div className="voucherTableWrap">
          <table className="voucherTable">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Loại ưu đãi</th>
                <th>Giá trị</th>
                <th>Điều kiện</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Tổng SL</th>
                <th>Đã dùng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id || item.id}>
                  <td>
                    <button
                      type="button"
                      className="voucherCodeCell"
                      onClick={() => copyCode(item.code)}
                    >
                      {item.code}
                    </button>
                  </td>
                  <td>
                    {item.discountType === 'percent' ? 'Giảm %' : 'Giảm số tiền'}
                  </td>
                  <td>
                    {item.discountType === 'percent'
                      ? `${item.discountValue}%`
                      : formatVnd(item.discountValue)}
                  </td>
                  <td>
                    {item.minOrderValue
                      ? `Đơn từ ${formatVnd(item.minOrderValue)}`
                      : '—'}
                  </td>
                  <td>{formatDate(item.startDate)}</td>
                  <td>{formatDate(item.endDate)}</td>
                  <td>{item.quantity ?? 0}</td>
                  <td>{item.usedCount ?? 0}</td>
                  <td>
                    <span className={`voucherStatus voucherStatus--${item.status}`}>
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                  </td>
                  <td>
                    <div className="voucherRowActions">
                      <button type="button" onClick={() => openEdit(item)} title="Sửa">
                        ✎
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(item)}
                        title="Xóa"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="voucherEmptyHint">
                    Không có voucher nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Sửa voucher' : 'Tạo Voucher mới'}
        onClose={() => setModalOpen(false)}
      >
        <form className="formGrid" onSubmit={handleSubmit}>
          <label>
            Mã voucher
            <input
              required
              value={form.code}
              onChange={e => setForm(f => ({...f, code: e.target.value}))}
            />
          </label>
          <label>
            Mô tả
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({...f, description: e.target.value}))}
            />
          </label>
          <label>
            Loại giảm
            <select
              value={form.discountType}
              onChange={e => setForm(f => ({...f, discountType: e.target.value}))}
            >
              <option value="percent">Giảm %</option>
              <option value="amount">Giảm số tiền</option>
            </select>
          </label>
          <label>
            Giá trị
            <input
              required
              type="number"
              min="0"
              value={form.discountValue}
              onChange={e => setForm(f => ({...f, discountValue: e.target.value}))}
            />
          </label>
          <label>
            Đơn tối thiểu
            <input
              type="number"
              min="0"
              value={form.minOrderValue}
              onChange={e => setForm(f => ({...f, minOrderValue: e.target.value}))}
            />
          </label>
          <label>
            Giảm tối đa
            <input
              type="number"
              min="0"
              value={form.maxDiscount}
              onChange={e => setForm(f => ({...f, maxDiscount: e.target.value}))}
            />
          </label>
          <label>
            Tổng số lượng
            <input
              type="number"
              min="0"
              value={form.quantity}
              onChange={e => setForm(f => ({...f, quantity: e.target.value}))}
            />
          </label>
          <label>
            Ngày bắt đầu
            <input
              required
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({...f, startDate: e.target.value}))}
            />
          </label>
          <label>
            Ngày kết thúc
            <input
              required
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({...f, endDate: e.target.value}))}
            />
          </label>
          <label>
            Trạng thái
            <select
              value={form.status}
              onChange={e => setForm(f => ({...f, status: e.target.value}))}
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm tắt</option>
              <option value="expired">Hết hạn</option>
            </select>
          </label>
          <div className="formActions">
            <button type="button" onClick={() => setModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default VoucherList;
