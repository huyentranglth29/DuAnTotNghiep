import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Ban,
  Boxes,
  Eye,
  Layers,
  Package,
  PackageX,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
} from 'lucide-react';
import productApi from '../../api/productApi';
import Modal from '../../components/Modal';
import {formatVnd} from '../../utils/adminFormatters';

const LOW_STOCK = 20;
const PAGE_SIZE_OPTIONS = [8, 10, 12, 16];

const CATEGORY_OPTIONS = [
  {value: 'combo', label: 'Combo'},
  {value: 'popcorn', label: 'Bắp'},
  {value: 'drink', label: 'Nước'},
  {value: 'snack', label: 'Snack'},
];

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORY_OPTIONS.map(item => [item.value, item.label]),
);

const emptyForm = {
  name: '',
  image: '',
  price: '',
  stock: '',
  category: 'combo',
  description: '',
  isActive: 'true',
};

function normalizeText(value = '') {
  return String(value)
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/** Suy loại từ tên — ưu tiên hơn category mặc định "snack" của data cũ */
function detectCategoryFromName(name = '') {
  const text = normalizeText(name);
  if (!text) return null;
  if (text.includes('combo')) return 'combo';
  if (
    text.includes('bap') ||
    text.includes('popcorn') ||
    text.includes('corn')
  ) {
    return 'popcorn';
  }
  if (
    text.includes('nuoc') ||
    text.includes('drink') ||
    text.includes('coca') ||
    text.includes('pepsi') ||
    text.includes('sprite') ||
    text.includes('fanta') ||
    text.includes('tra ') ||
    text.startsWith('tra') ||
    text.includes(' soft') ||
    text.includes('nectar')
  ) {
    return 'drink';
  }
  if (
    text.includes('snack') ||
    text.includes('khoai') ||
    text.includes('nachos') ||
    text.includes('hotdog') ||
    text.includes('hot dog')
  ) {
    return 'snack';
  }
  return null;
}

function inferCategory(name = '', category) {
  const fromName = detectCategoryFromName(name);
  const stored =
    category && CATEGORY_LABEL[category] ? category : null;

  // Tên rõ loại (Combo/Bắp/Nước...) thắng category mặc định cũ
  if (fromName) return fromName;
  if (stored) return stored;
  return 'snack';
}

function getStockBadge(item) {
  const stock = Number(item.stock || 0);
  if (!item.isActive) {
    return {tone: 'muted', label: 'Ngừng bán'};
  }
  if (stock <= 0) {
    return {tone: 'danger', label: 'Hết hàng'};
  }
  if (stock < LOW_STOCK) {
    return {tone: 'warning', label: 'Sắp hết'};
  }
  return {tone: 'success', label: 'Hoạt động'};
}

function ProductList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productApi.getAll({limit: 200});
      const list = Array.isArray(response) ? response : response?.data || [];
      setItems(list);
    } catch (err) {
      setError(err.message || 'Không tải được sản phẩm.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = items.length;
    const combo = items.filter(
      item => inferCategory(item.name, item.category) === 'combo',
    ).length;
    const lowStock = items.filter(item => {
      const stock = Number(item.stock || 0);
      return item.isActive !== false && stock > 0 && stock < LOW_STOCK;
    }).length;
    const outOfStock = items.filter(item => Number(item.stock || 0) <= 0).length;
    return {total, combo, lowStock, outOfStock};
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = normalizeText(keyword.trim());
    let next = items.filter(item => {
      const category = inferCategory(item.name, item.category);
      const stock = Number(item.stock || 0);
      const active = item.isActive !== false;

      if (q) {
        const hay = normalizeText(
          `${item.name || ''} ${item.description || ''} ${CATEGORY_LABEL[category] || ''}`,
        );
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter && category !== categoryFilter) return false;
      if (statusFilter === 'active' && (!active || stock <= 0)) return false;
      if (statusFilter === 'low' && !(active && stock > 0 && stock < LOW_STOCK)) {
        return false;
      }
      if (statusFilter === 'out' && stock > 0) return false;
      if (statusFilter === 'inactive' && active) return false;
      return true;
    });

    next = [...next].sort((a, b) => {
      if (sortBy === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'stock-asc') return Number(a.stock || 0) - Number(b.stock || 0);
      if (sortBy === 'stock-desc') return Number(b.stock || 0) - Number(a.stock || 0);
      if (sortBy === 'name') {
        return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return next;
  }, [items, keyword, categoryFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [keyword, categoryFilter, statusFilter, sortBy, pageSize]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = item => {
    setEditing(item);
    setForm({
      name: item.name || '',
      image: item.image || '',
      price: item.price ?? '',
      stock: item.stock ?? '',
      category: inferCategory(item.name, item.category),
      description: item.description || '',
      isActive: item.isActive === false ? 'false' : 'true',
    });
    setModalOpen(true);
  };

  const handleSave = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: String(form.name || '').trim(),
        image: String(form.image || '').trim(),
        description: String(form.description || '').trim(),
        category: form.category || 'snack',
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        isActive: form.isActive === true || form.isActive === 'true',
      };
      if (editing) {
        await productApi.update(editing._id || editing.id, payload);
      } else {
        await productApi.create(payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      window.alert(err.message || 'Lưu sản phẩm thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async item => {
    const nextActive = item.isActive === false;
    const ok = window.confirm(
      nextActive
        ? `Mở bán lại "${item.name}"?`
        : `Ngừng bán "${item.name}"?`,
    );
    if (!ok) return;
    try {
      await productApi.update(item._id || item.id, {
        ...item,
        isActive: nextActive,
        category: inferCategory(item.name, item.category),
      });
      await loadData();
    } catch (err) {
      window.alert(err.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  const clearFilters = () => {
    setKeyword('');
    setCategoryFilter('');
    setStatusFilter('');
    setSortBy('newest');
    setPage(1);
  };

  const refreshData = () => {
    loadData();
  };

  const hasActiveFilters = Boolean(keyword || categoryFilter || statusFilter || sortBy !== 'newest');

  const rangeStart = filteredItems.length
    ? (currentPage - 1) * pageSize + 1
    : 0;
  const rangeEnd = Math.min(currentPage * pageSize, filteredItems.length);

  return (
    <section className="productPage">
      <header className="productHeader">
        <div>
          <h2>Quản lý sản phẩm</h2>
          <p>
            Quản lý các sản phẩm bán tại rạp như bắp, nước, combo, snack.
          </p>
        </div>
        <button type="button" className="productBtnPrimary" onClick={openCreate}>
          <Plus size={16} />
          Thêm sản phẩm
        </button>
      </header>

      <div className="productStatGrid">
        <article className="productStatCard">
          <span className="productStatIcon productStatIcon--blue">
            <Package size={18} />
          </span>
          <strong>{stats.total}</strong>
          <h3>Tổng sản phẩm</h3>
          <p>Tất cả sản phẩm</p>
        </article>
        <article className="productStatCard">
          <span className="productStatIcon productStatIcon--green">
            <Layers size={18} />
          </span>
          <strong>{stats.combo}</strong>
          <h3>Combo</h3>
          <p>Sản phẩm combo</p>
        </article>
        <article className="productStatCard">
          <span className="productStatIcon productStatIcon--orange">
            <TriangleAlert size={18} />
          </span>
          <strong>{stats.lowStock}</strong>
          <h3>Sắp hết hàng</h3>
          <p>Dưới {LOW_STOCK} sản phẩm</p>
        </article>
        <article className="productStatCard">
          <span className="productStatIcon productStatIcon--red">
            <PackageX size={18} />
          </span>
          <strong>{stats.outOfStock}</strong>
          <h3>Hết hàng</h3>
          <p>Không còn hàng</p>
        </article>
      </div>

      <div className="productFilterBar">
        <label className="productSearch">
          <Search size={16} />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
          />
        </label>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          aria-label="Loại sản phẩm">
          <option value="">Tất cả loại</option>
          {CATEGORY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Trạng thái">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang bán (còn hàng)</option>
          <option value="low">Sắp hết</option>
          <option value="out">Hết hàng</option>
          <option value="inactive">Ngừng bán</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          aria-label="Sắp xếp">
          <option value="newest">Sắp xếp: Mới nhất</option>
          <option value="name">Tên A-Z</option>
          <option value="price-asc">Giá tăng dần</option>
          <option value="price-desc">Giá giảm dần</option>
          <option value="stock-asc">Tồn kho tăng dần</option>
          <option value="stock-desc">Tồn kho giảm dần</option>
        </select>
        <button type="button" className="productBtnGhost" onClick={refreshData}>
          <RefreshCw size={15} />
          Làm mới
        </button>
        {hasActiveFilters && (
          <button type="button" className="productBtnGhost" onClick={clearFilters}>
            Xóa lọc
          </button>
        )}
      </div>

      {(keyword || categoryFilter || statusFilter) && !loading && (
        <p className="productFilterHint">
          Tìm thấy <strong>{filteredItems.length}</strong> sản phẩm
          {categoryFilter ? ` · loại ${CATEGORY_LABEL[categoryFilter]}` : ''}
          {statusFilter === 'active' ? ' · đang bán' : ''}
          {statusFilter === 'low' ? ' · sắp hết' : ''}
          {statusFilter === 'out' ? ' · hết hàng' : ''}
          {statusFilter === 'inactive' ? ' · ngừng bán' : ''}
          {keyword.trim() ? ` · “${keyword.trim()}”` : ''}
        </p>
      )}

      {error && <p className="productError">{error}</p>}
      {loading ? (
        <p className="productLoading">Đang tải sản phẩm...</p>
      ) : pageItems.length === 0 ? (
        <div className="productEmpty">
          <Boxes size={42} />
          <h3>Chưa có sản phẩm phù hợp</h3>
          <p>Thử đổi bộ lọc hoặc thêm sản phẩm mới cho quầy bán.</p>
        </div>
      ) : (
        <div className="productGrid">
          {pageItems.map(item => {
            const badge = getStockBadge(item);
            const category = inferCategory(item.name, item.category);
            const stock = Number(item.stock || 0);
            const soldToday = Number(item.soldToday || 0);
            return (
              <article key={item._id || item.id} className="productCard">
                <div className="productCardMedia">
                  {item.image ? (
                    <img src={item.image} alt={item.name || 'Sản phẩm'} />
                  ) : (
                    <div className="productCardPlaceholder">
                      <Package size={36} />
                    </div>
                  )}
                  <span className={`productBadge productBadge--${badge.tone}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="productCardBody">
                  <h3 title={item.name}>{item.name || 'Chưa đặt tên'}</h3>
                  <p className="productPrice">{formatVnd(item.price)}</p>
                  <div className="productMeta">
                    <div>
                      <span>Loại</span>
                      <strong>{CATEGORY_LABEL[category] || 'Snack'}</strong>
                    </div>
                    <div>
                      <span>Tồn kho</span>
                      <strong
                        className={
                          stock <= 0
                            ? 'is-danger'
                            : stock < LOW_STOCK
                              ? 'is-warning'
                              : 'is-ok'
                        }>
                        {stock}
                      </strong>
                    </div>
                    <div>
                      <span>Đã bán hôm nay</span>
                      <strong>{soldToday}</strong>
                    </div>
                  </div>
                  <div className="productCardActions">
                    <button
                      type="button"
                      className="productActionBtn"
                      onClick={() => setDetailItem(item)}>
                      <Eye size={14} />
                      Chi tiết
                    </button>
                    <button
                      type="button"
                      className="productActionBtn"
                      onClick={() => openEdit(item)}>
                      <Pencil size={14} />
                      Sửa
                    </button>
                    <button
                      type="button"
                      className={`productActionBtn ${
                        item.isActive === false
                          ? 'productActionBtn--ok'
                          : 'productActionBtn--danger'
                      }`}
                      onClick={() => toggleActive(item)}>
                      <Ban size={14} />
                      {item.isActive === false ? 'Mở bán' : 'Ngừng bán'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <footer className="productPagination">
        <p>
          Hiển thị {rangeStart} đến {rangeEnd} trong tổng số{' '}
          {filteredItems.length} sản phẩm
        </p>
        <div className="productPaginationControls">
          <button
            type="button"
            className="productBtnGhost"
            disabled={currentPage <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}>
            ‹
          </button>
          <span className="productPageCurrent">{currentPage}</span>
          <button
            type="button"
            className="productBtnGhost"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
            ›
          </button>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            aria-label="Số sản phẩm mỗi trang">
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>
                {size} / trang
              </option>
            ))}
          </select>
        </div>
      </footer>

      <Modal
        open={modalOpen}
        title={editing ? 'Sửa sản phẩm' : '+ Thêm sản phẩm'}
        onClose={() => setModalOpen(false)}>
        <form className="formGrid productForm" onSubmit={handleSave}>
          <label>
            Tên sản phẩm
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({...f, name: e.target.value}))}
            />
          </label>
          <label>
            Loại sản phẩm
            <select
              value={form.category}
              onChange={e => setForm(f => ({...f, category: e.target.value}))}>
              {CATEGORY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ảnh URL
            <input
              value={form.image}
              onChange={e => setForm(f => ({...f, image: e.target.value}))}
              placeholder="https://..."
            />
          </label>
          <label>
            Giá bán
            <input
              required
              type="number"
              min="0"
              value={form.price}
              onChange={e => setForm(f => ({...f, price: e.target.value}))}
            />
          </label>
          <label>
            Tồn kho
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={e => setForm(f => ({...f, stock: e.target.value}))}
            />
          </label>
          <label>
            Trạng thái
            <select
              value={form.isActive}
              onChange={e => setForm(f => ({...f, isActive: e.target.value}))}>
              <option value="true">Hoạt động</option>
              <option value="false">Ngừng bán</option>
            </select>
          </label>
          <label className="full">
            Mô tả
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({...f, description: e.target.value}))}
              rows={3}
            />
          </label>
          <div className="formActions">
            <button
              className="ghost"
              type="button"
              onClick={() => setModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailItem)}
        title="Chi tiết sản phẩm"
        onClose={() => setDetailItem(null)}>
        {detailItem && (
          <div className="productDetail">
            {detailItem.image ? (
              <img src={detailItem.image} alt={detailItem.name} />
            ) : (
              <div className="productCardPlaceholder">
                <Package size={40} />
              </div>
            )}
            <h3>{detailItem.name}</h3>
            <p className="productPrice">{formatVnd(detailItem.price)}</p>
            <dl>
              <div>
                <dt>Loại</dt>
                <dd>
                  {CATEGORY_LABEL[
                    inferCategory(detailItem.name, detailItem.category)
                  ]}
                </dd>
              </div>
              <div>
                <dt>Tồn kho</dt>
                <dd>{Number(detailItem.stock || 0)}</dd>
              </div>
              <div>
                <dt>Đã bán hôm nay</dt>
                <dd>{Number(detailItem.soldToday || 0)}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>{getStockBadge(detailItem).label}</dd>
              </div>
            </dl>
            <p>{detailItem.description || 'Chưa có mô tả.'}</p>
            <div className="formActions">
              <button
                type="button"
                className="ghost"
                onClick={() => setDetailItem(null)}>
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = detailItem;
                  setDetailItem(null);
                  openEdit(item);
                }}>
                Sửa sản phẩm
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

export default ProductList;
