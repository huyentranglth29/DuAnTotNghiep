import {useEffect, useMemo, useState} from 'react';
import reviewApi from '../../api/reviewApi';
import Table from '../../components/Table';
import {formatDateTime} from '../../utils/adminFormatters';

const STATUS_META = {
  pending: {label: 'Chờ duyệt', tone: 'pending'},
  approved: {label: 'Đã duyệt', tone: 'approved'},
  rejected: {label: 'Đã từ chối', tone: 'rejected'},
};

function MissingReference({children}) {
  return <span className="reviewMissingReference">{children}</span>;
}

function getReviewId(item) {
  return item?._id || item?.id;
}

function getCustomerName(item) {
  if (item.user && typeof item.user === 'object') {
    return item.user.fullName || item.user.name || item.user.email || item.user.phone || '';
  }
  return item.userName || item.customerName || item.fullName || item.email || '';
}

function getCustomerMeta(item) {
  if (item.user && typeof item.user === 'object') {
    return item.user.email || item.user.phone || '';
  }
  return item.userEmail || item.customerEmail || item.phone || '';
}

function getMovieTitle(item) {
  if (item.movie && typeof item.movie === 'object') {
    return item.movie.title || item.movie.name || '';
  }
  return item.movieTitle || item.title || '';
}

function ReviewList() {
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const loadData = async (nextPage = page, nextKeyword = keyword) => {
    setLoading(true);
    setError('');
    try {
      const response = await reviewApi.getAll({
        page: nextPage,
        limit: 10,
        keyword: nextKeyword || undefined,
      });
      setItems(Array.isArray(response) ? response : response?.data || []);
      setPagination(Array.isArray(response) ? null : response?.pagination || null);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu đánh giá.');
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, '');
  }, []);

  const submitSearch = event => {
    event.preventDefault();
    setPage(1);
    loadData(1, keyword);
  };

  const refresh = () => {
    setKeyword('');
    setPage(1);
    loadData(1, '');
  };

  const updateStatus = async (item, status) => {
    const id = getReviewId(item);
    if (!id || updatingId) return;
    setUpdatingId(id);
    try {
      await reviewApi.update(id, {status});
      await loadData(page, keyword);
    } catch (err) {
      window.alert(err.message || 'Cập nhật trạng thái thất bại.');
    } finally {
      setUpdatingId('');
    }
  };

  const removeReview = async item => {
    const id = getReviewId(item);
    if (!id || !window.confirm('Xóa đánh giá này?')) return;
    setUpdatingId(id);
    try {
      await reviewApi.remove(id);
      await loadData(page, keyword);
    } catch (err) {
      window.alert(err.message || 'Xóa đánh giá thất bại.');
    } finally {
      setUpdatingId('');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'user',
        title: 'Khách hàng',
        render: item => {
          const name = getCustomerName(item);
          const meta = getCustomerMeta(item);
          if (!name) {
            return <MissingReference>Tài khoản không còn tồn tại</MissingReference>;
          }
          return (
            <div className="reviewPerson">
              <span className="reviewAvatar">{name.charAt(0).toUpperCase()}</span>
              <span>
                <strong>{name}</strong>
                {meta && <small>{meta}</small>}
              </span>
            </div>
          );
        },
      },
      {
        key: 'movie',
        title: 'Phim',
        render: item => getMovieTitle(item) || (
          <MissingReference>Phim không còn tồn tại</MissingReference>
        ),
      },
      {
        key: 'rating',
        title: 'Đánh giá',
        render: item => {
          const rating = Math.round(Math.max(0, Math.min(5, Number(item.rating) || 0)));
          return (
            <div className="reviewRating" aria-label={`${rating} trên 5 sao`}>
              <span>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
              <strong>{rating}/5</strong>
            </div>
          );
        },
      },
      {
        key: 'comment',
        title: 'Nội dung',
        render: item => <span className="reviewComment">{item.comment || 'Không có nội dung'}</span>,
      },
      {
        key: 'createdAt',
        title: 'Thời gian',
        render: item => formatDateTime(item.createdAt || item.updatedAt) || '—',
      },
      {
        key: 'status',
        title: 'Trạng thái',
        render: item => {
          const meta = STATUS_META[item.status] || {label: item.status || 'Không rõ', tone: 'unknown'};
          return <span className={`reviewStatus reviewStatus--${meta.tone}`}>{meta.label}</span>;
        },
      },
      {
        key: 'actions',
        title: 'Hành động',
        render: item => {
          const id = getReviewId(item);
          const busy = updatingId === id;
          return (
            <div className="actionGroup reviewActions">
              <button
                type="button"
                disabled={busy || item.status === 'approved'}
                onClick={() => updateStatus(item, 'approved')}>
                Duyệt
              </button>
              <button
                type="button"
                disabled={busy || item.status === 'rejected'}
                onClick={() => updateStatus(item, 'rejected')}>
                Từ chối
              </button>
              <button
                type="button"
                className="danger"
                disabled={busy}
                onClick={() => removeReview(item)}>
                Xóa
              </button>
            </div>
          );
        },
      },
    ],
    [updatingId, page, keyword],
  );

  const totalPages = pagination?.totalPages || 1;

  return (
    <section>
      <div className="pageTitle">
        <h2>Quản lý đánh giá phim</h2>
      </div>

      <form className="toolbar" onSubmit={submitSearch}>
        <input
          placeholder="Tìm theo khách hàng, phim, nội dung hoặc trạng thái..."
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
        />
        <button type="submit">Tìm kiếm</button>
        <button className="ghost" type="button" onClick={refresh}>
          Làm mới
        </button>
      </form>

      {error && <p className="loginError">{error}</p>}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <Table columns={columns} data={items} emptyText="Không có đánh giá nào" />
      )}

      {pagination && (
        <div className="formActions">
          <button
            className="ghost"
            type="button"
            disabled={page <= 1}
            onClick={() => {
              const nextPage = Math.max(1, page - 1);
              setPage(nextPage);
              loadData(nextPage, keyword);
            }}>
            Trước
          </button>
          <span>{page}/{totalPages}</span>
          <button
            className="ghost"
            type="button"
            disabled={page >= totalPages}
            onClick={() => {
              const nextPage = Math.min(totalPages, page + 1);
              setPage(nextPage);
              loadData(nextPage, keyword);
            }}>
            Sau
          </button>
        </div>
      )}
    </section>
  );
}

export default ReviewList;
