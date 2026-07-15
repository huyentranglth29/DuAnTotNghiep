import {Link} from 'react-router-dom';
import {QRCodeSVG} from 'qrcode.react';

export function PageTitle({title, action, to}) {
  return (
    <div className="pageTitle">
      <h2>{title}</h2>
      {action && (to ? <Link to={to}>{action}</Link> : <button type="button">{action}</button>)}
    </div>
  );
}

export function MiniChart({type = 'line'}) {
  return <div className={`miniChart ${type}`} />;
}

export function DataBars({items = [], labelKey = 'label', valueKey = 'value', formatValue = value => value}) {
  const max = Math.max(...items.map(item => Number(item[valueKey] || 0)), 1);

  if (items.length === 0) {
    return <p>Không có dữ liệu.</p>;
  }

  return (
    <div className="barList">
      {items.map(item => {
        const value = Number(item[valueKey] || 0);
        return (
          <p key={item[labelKey]}>
            <span style={{width: `${Math.max((value / max) * 100, 6)}%`}} />
            {item[labelKey]} - {formatValue(value)}
          </p>
        );
      })}
    </div>
  );
}

export function QRBlock({value = ''}) {
  return (
    <div className="qrBox" aria-label={`QR ${value}`}>
      <QRCodeSVG value={String(value || 'FILMGO')} size={156} level="M" includeMargin />
    </div>
  );
}
