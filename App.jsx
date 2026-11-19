import { useMemo, useState } from 'react';

const USERS = [
  { id: 'user-01', name: 'User 01', initials: 'U1', role: 'Workspace user' },
  { id: 'user-02', name: 'User 02', initials: 'U2', role: 'Workspace user' },
];

const FIELDS = {
  product: [
    { key: 'Part Number', label: 'Part Number' },
    { key: 'Manufacturer', label: 'Manufacturer' },
    { key: 'Quantity', label: 'Quantity', type: 'number' },
  ],
  supplier: [
    { key: 'Supplier name', label: 'Supplier name' },
    { key: 'Supplier Quantity', label: 'Quantity', type: 'number' },
    { key: 'Date code', label: 'Date code' },
    { key: 'Cost per piece ( USD )', label: 'Cost per piece ( USD )', type: 'number' },
    { key: 'Cost per piece ( INR )', label: 'Cost per piece ( INR )', type: 'number' },
    { key: 'Total cost -USD', label: 'Total cost -USD', type: 'number' },
    { key: 'Total cost -INR', label: 'Total cost -INR', type: 'number' },
  ],
  customer: [
    { key: 'Customer name', label: 'Customer name' },
    { key: 'Customer Quantity', label: 'Quantity', type: 'number' },
    { key: 'Invoice number', label: 'Invoice number' },
    { key: 'Cost per piece (USD)', label: 'Cost per piece (USD)', type: 'number' },
    { key: 'Cost per piece (INR)', label: 'Cost per piece (INR)', type: 'number' },
    { key: 'Total cost (USD)', label: 'Total cost (USD)', type: 'number' },
    { key: 'Total cost (INR)', label: 'Total cost (INR)', type: 'number' },
  ],
  import: [
    { key: 'BOE', label: 'BOE' },
    { key: 'Date', label: 'Date', type: 'date' },
    { key: 'Duty payment', label: 'Duty payment', type: 'number' },
  ],
};

const ATTACHMENT_COLUMNS = [
  { header: 'Attach1', category: 'Supplier PI' },
  { header: 'Attach2', category: 'Supplier Invoice' },
  { header: 'Attach3', category: 'Outward Remittance' },
  { header: 'Attach4', category: 'BOE' },
  { header: 'Attach5', category: 'Customer Invoice' },
  { header: 'Attach6', category: 'Customer PO' },
  { header: 'Attach7', category: 'Test report' },
  { header: 'Attach8', category: 'Cust payment details' },
  { header: 'Attach9', category: 'Export shp bill' },
  { header: 'Attach10', category: 'Airway bill' },
  { header: 'Attach11', category: 'Part photo' },
  { header: 'Attach12', category: 'Attach12' },
  { header: 'Attach13', category: 'Attach13' },
  { header: 'Attach14', category: 'Attach14' },
  { header: 'Attach15', category: 'Attach15' },
];
const ATTACHMENTS = ATTACHMENT_COLUMNS.map(({ category }) => category);

const GROUPS = [
  { id: 'product', title: 'Part details', hint: 'Product identification from your sheet', fields: FIELDS.product },
  { id: 'supplier', title: 'Supplier Detail', hint: 'Supplier and purchase costs', fields: FIELDS.supplier },
  { id: 'customer', title: 'Customer Details', hint: 'Customer, invoice and selling costs', fields: FIELDS.customer },
  { id: 'import', title: 'Import Details', hint: 'Customs and import records', fields: FIELDS.import },
];

const PAYMENT_METHODS = [
  { label: 'Bank transfer', icon: 'bank' },
  { label: 'UPI', icon: 'phone' },
  { label: 'Card', icon: 'card' },
  { label: 'Cash', icon: 'cash' },
  { label: 'Other', icon: 'dots' },
];

const EMPTY_RECORD = {
  'Part Number': '', Manufacturer: '', Quantity: '', 'Supplier name': '',
  'Supplier Quantity': '', 'Date code': '', 'Cost per piece ( USD )': '',
  'Cost per piece ( INR )': '', 'Total cost -USD': '', 'Total cost -INR': '',
  'Customer name': '', 'Customer Quantity': '', 'Invoice number': '',
  'Cost per piece (USD)': '', 'Cost per piece (INR)': '',
  'Total cost (USD)': '', 'Total cost (INR)': '', BOE: '', Date: '',
  'Duty payment': '', 'Payment Method': '', 'Payment Status': 'Pending',
  'Payment Amount': '', 'Payment Date': '', Remarks: '',
  attachments: {},
};

function readRecords() {
  return readUserRecords(USERS[0].id);
}

function readUserRecords(userId) {
  try {
    const stored = JSON.parse(localStorage.getItem(`partfolio-records-${userId}`) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error('Unable to read saved Partfolio records.', error);
    window.alert('Saved records could not be read from this browser. You can still add a new record or restore from an exported CSV.');
    return [];
  }
}

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

function toCsvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function recordCsv(record) {
  const headers = [
    'Sr no', 'Part Number', 'Manufacturer', 'Quantity',
    ...FIELDS.supplier.map((field) => field.label),
    ...FIELDS.customer.map((field) => field.label),
    ...FIELDS.import.map((field) => field.label),
    ...ATTACHMENT_COLUMNS.map(({ header }) => header),
    'Remarks',
  ];
  const row = [
    record['Sr no'], record['Part Number'], record.Manufacturer, record.Quantity,
    ...FIELDS.supplier.map(({ key }) => record[key]),
    ...FIELDS.customer.map(({ key }) => record[key]),
    ...FIELDS.import.map(({ key }) => record[key]),
    ...ATTACHMENT_COLUMNS.map(({ category }) => (record.attachments?.[category] || []).map((file) => file.name).join('; ')),
    record.Remarks,
  ];
  return { headers, row };
}

function recordsCsv(records) {
  const { headers } = recordCsv(EMPTY_RECORD);
  const rows = records.map((record) => recordCsv(record).row);
  return [headers, ...rows].map((row) => row.map(toCsvCell).join(',')).join('\r\n') + '\r\n';
}

function paymentsCsv(records) {
  const headers = [
    'Customer name', 'Supplier name', 'Part Number', 'Invoice number',
    'Payment Method', 'Payment Status', 'Payment Amount', 'Payment Date',
  ];
  const rows = records.map((record) => [
    record['Customer name'], record['Supplier name'], record['Part Number'], record['Invoice number'],
    record['Payment Method'], record['Payment Status'], record['Payment Amount'], record['Payment Date'],
  ]);
  return [headers, ...rows].map((row) => row.map(toCsvCell).join(',')).join('\r\n') + '\r\n';
}
function downloadText(filename, content, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadAttachment(file) {
  if (!file.data) {
    window.alert('This file is only available in the browser session where it was uploaded. Please attach it again.');
    return;
  }
  const link = document.createElement('a');
  link.href = file.data;
  link.download = file.name;
  link.click();
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.7 7.5 4.4 7.5-4.4M12 12v8.5" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18m-14 5h4" /></>,
    bank: <><path d="M3 9h18M5 9v9m4-9v9m6-9v9m4-9v9M3 21h18M12 3 3 8h18L12 3Z" /></>,
    phone: <><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></>,
    cash: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M7 9h.01M17 15h.01" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 20h16" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5M4 20h16" /></>,
    clip: <><path d="m8 12.5 6.6-6.6a3 3 0 0 1 4.2 4.2l-8.5 8.5a5 5 0 0 1-7.1-7.1l8.5-8.5" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function App() {
  const [records, setRecords] = useState(readRecords);
  const [activeUser, setActiveUser] = useState(USERS[0]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState(EMPTY_RECORD);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filteredRecords = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => {
      const searchable = [
        ...Object.values(record).filter((value) => typeof value === 'string'),
        ...Object.values(record.attachments || {}).flat().map((file) => file.name),
      ];
      return searchable.some((value) => value.toLowerCase().includes(term));
    });
  }, [records, query]);

  const totalQuantity = records.reduce((sum, record) => sum + (Number(record.Quantity) || 0), 0);
  const pendingPayments = records.filter((record) => record['Payment Status'] !== 'Paid').length;
  const attachedFiles = records.reduce((sum, record) => sum + Object.values(record.attachments || {}).flat().length, 0);
  const paidRecords = records.filter((record) => record['Payment Status'] === 'Paid');
  const partiallyPaidRecords = records.filter((record) => record['Payment Status'] === 'Partially paid');
  const unpaidRecords = records.filter((record) => record['Payment Status'] !== 'Paid');
  const totalPaymentReceived = records.reduce((sum, record) => {
    if (record['Payment Status'] === 'Paid' || record['Payment Status'] === 'Partially paid') {
      return sum + (Number(record['Payment Amount']) || 0);
    }
    return sum;
  }, 0);

  function persist(nextRecords) {
    try {
      localStorage.setItem(`partfolio-records-${activeUser.id}`, JSON.stringify(nextRecords));
      setRecords(nextRecords);
      setNotice('Changes saved on this device');
      window.setTimeout(() => setNotice(''), 2600);
      return true;
    } catch {
      window.alert('Could not save this record in browser storage. The files may be too large. Try smaller files and save again.');
      return false;
    }
  }

  function startNew() {
    const nextSerial = records.reduce((largest, record) => Math.max(largest, Number(record['Sr no']) || 0), 0) + 1;
    setDraft({ ...EMPTY_RECORD, 'Sr no': String(nextSerial) });
    setModal('edit');
  }

  function startEdit(record) {
    setDraft({ ...EMPTY_RECORD, ...record, attachments: record.attachments || {} });
    setModal('edit');
  }

  async function handleFileChange(category, fileList) {
    const files = Array.from(fileList || []).slice(0, 1);
    if (!files.length) return;
    try {
      const converted = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, size: file.size, type: file.type, data: reader.result });
        reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
        reader.readAsDataURL(file);
      })));
      setDraft((current) => ({
        ...current,
        attachments: { ...current.attachments, [category]: converted },
      }));
    } catch (error) {
      window.alert(error.message);
    }
  }

  function saveDraft(event) {
    event.preventDefault();
    if (!draft['Part Number'].trim()) {
      window.alert('Please enter a Part Number before saving.');
      return;
    }
    const exists = records.some((record) => record.id === draft.id);
    const saved = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      'Sr no': draft['Sr no'] || String(records.length + 1),
      updatedAt: new Date().toISOString(),
    };
    const next = exists
      ? records.map((record) => record.id === saved.id ? saved : record)
      : [saved, ...records];
    if (persist(next)) setModal(null);
  }

  function removeRecord(id) {
    if (!window.confirm('Delete this complete record and its attachments? This cannot be undone.')) return;
    if (persist(records.filter((record) => record.id !== id))) setSelectedRecord(null);
  }

  function openRecord(record) {
    setSelectedRecord(record);
    setModal('details');
  }

  function markPaymentPaid(record) {
    const updated = {
      ...record,
      'Payment Status': 'Paid',
      'Payment Date': record['Payment Date'] || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    };
    if (persist(records.map((item) => item.id === record.id ? updated : item))) {
      setSelectedRecord(updated);
    }
  }

  function renderDetails(record) {
    return (
      <>
        {GROUPS.map((group) => (
          <section className="detail-section" key={group.id}>
            <div className="detail-section-heading">{group.title}</div>
            <div className="detail-grid">
              {group.fields.map(({ key, label }) => (
                <div className="detail-field" key={key}>
                  <span>{label}</span>
                  <strong>{formatValue(record[key])}</strong>
                </div>
              ))}
            </div>
          </section>
        ))}
        <section className="detail-section">
          <div className="detail-section-heading">Payment</div>
          <div className="detail-grid">
            <div className="detail-field"><span>Payment Method</span><strong>{formatValue(record['Payment Method'])}</strong></div>
            <div className="detail-field"><span>Payment Status</span><strong>{formatValue(record['Payment Status'])}</strong></div>
            <div className="detail-field"><span>Payment Amount</span><strong>{record['Payment Amount'] ? `₹${Number(record['Payment Amount']).toLocaleString('en-IN')}` : '—'}</strong></div>
            <div className="detail-field"><span>Payment Date</span><strong>{formatValue(record['Payment Date'])}</strong></div>
          </div>
        </section>
        <section className="detail-section">
          <div className="detail-section-heading">Attachments</div>
          <div className="attachment-list">
            {ATTACHMENTS.flatMap((category) => (record.attachments?.[category] || []).map((file, index) => (
              <button className="attachment-file" key={`${category}-${file.name}-${index}`} onClick={() => downloadAttachment(file)} type="button">
                <span className="file-icon"><Icon name="clip" size={15} /></span>
                <span><strong>{file.name}</strong><small>{category} · {(file.size / 1024).toFixed(0)} KB</small></span>
                <Icon name="download" size={16} />
              </button>
            )))}
            {!ATTACHMENTS.some((category) => record.attachments?.[category]?.length) && <p className="empty-note">No attachments on this record.</p>}
          </div>
        </section>
        {record.Remarks && <section className="detail-section"><div className="detail-section-heading">Remarks</div><p className="remarks-copy">{record.Remarks}</p></section>}
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Partfolio home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>partfolio<span className="brand-dot">.</span><small>RECORDS WORKSPACE</small></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-select" type="button">
          <span className="workspace-emblem">P</span>
          <span>Parts &amp; Imports<small>Personal workspace</small></span>
          <span className="chevron">⌄</span>
        </button>
        <div className="nav-label">MENU</div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className="nav-item active" type="button"><Icon name="grid" /> Overview</button>
          <button className="nav-item" type="button" onClick={() => document.getElementById('records')?.scrollIntoView({ behavior: 'smooth' })}><Icon name="box" /> Part records <span className="nav-count">{records.length}</span></button>
          <button className="nav-item" type="button" onClick={() => document.getElementById('payments-panel')?.scrollIntoView({ behavior: 'smooth' })}><Icon name="card" /> Payments</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon">?</span><strong>Need a hand?</strong><p>Your records stay on this device. Download a copy anytime.</p><button type="button" onClick={() => downloadText('partfolio-template.csv', recordsCsv([{ ...EMPTY_RECORD, 'Sr no': '' }]))}>Download template <Icon name="arrow" size={14} /></button></div>
          <div className="user-switch">
            <span className="avatar">{activeUser.initials}</span>
            <span className="user-name">{activeUser.name}<small>{activeUser.role}</small></span>
            <select aria-label="Switch user" value={activeUser.id} onChange={(event) => {
              const nextUser = USERS.find((user) => user.id === event.target.value);
              if (nextUser) {
                setActiveUser(nextUser);
                setRecords(readUserRecords(nextUser.id));
              }
            }}>
              {USERS.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            <span className="chevron">⌄</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="topbar-right"><span className="status-dot" /> All changes saved locally <span className="topbar-divider" /><span className="top-avatar">{activeUser.initials}</span></div>
        </header>
        <div className="page-wrap">
          <div className="welcome-row">
            <div><div className="eyebrow">YOUR OPERATIONS, IN ONE PLACE</div><h1>Good morning, {activeUser.name}<span className="wave">✦</span></h1><p>Keep your parts, supplier and import records organized.</p></div>
            <button className="primary-button" onClick={startNew} type="button"><Icon name="plus" size={17} /> Add new record</button>
          </div>

          <section className="stat-grid" aria-label="Record summary">
            <article className="stat-card"><div className="stat-top"><span>Total records</span><span className="stat-icon purple"><Icon name="box" /></span></div><div className="stat-value">{records.length.toString().padStart(2, '0')}</div><div className="stat-caption"><span className="caption-dot lavender" /> All part records</div></article>
            <article className="stat-card"><div className="stat-top"><span>Units tracked</span><span className="stat-icon blue"><Icon name="grid" /></span></div><div className="stat-value">{totalQuantity.toLocaleString()}</div><div className="stat-caption"><span className="caption-dot blue-dot" /> Across all records</div></article>
            <article className="stat-card" id="payment-card"><div className="stat-top"><span>Payments to review</span><span className="stat-icon amber"><Icon name="card" /></span></div><div className="stat-value">{pendingPayments.toString().padStart(2, '0')}</div><div className="stat-caption"><span className="caption-dot amber-dot" /> Pending or not set as paid</div></article>
            <article className="stat-card"><div className="stat-top"><span>Files attached</span><span className="stat-icon green"><Icon name="clip" /></span></div><div className="stat-value">{attachedFiles.toString().padStart(2, '0')}</div><div className="stat-caption"><span className="caption-dot green-dot" /> Across all records</div></article>
          </section>

          <section className="records-panel payments-panel" id="payments-panel">
            <div className="panel-heading">
              <div>
                <div className="panel-title-row"><h2>Payments</h2><span className="record-pill">{records.length} records</span></div>
                <p>Complete payment details across every customer and supplier record.</p>
              </div>
              <button className="outline-button" type="button" onClick={() => downloadText('partfolio-payments.csv', paymentsCsv(records))}><Icon name="download" size={16} /> Export payments</button>
            </div>
            <div className="payment-summary">
              <div className="payment-summary-item"><span>Total received</span><strong>₹{totalPaymentReceived.toLocaleString('en-IN')}</strong><small>{paidRecords.length + partiallyPaidRecords.length} paid / partial records</small></div>
              <div className="payment-summary-item"><span>Fully paid</span><strong>{paidRecords.length}</strong><small>₹{paidRecords.reduce((sum, record) => sum + (Number(record['Payment Amount']) || 0), 0).toLocaleString('en-IN')} received</small></div>
              <div className="payment-summary-item"><span>Partially paid</span><strong>{partiallyPaidRecords.length}</strong><small>Payment in progress</small></div>
              <div className="payment-summary-item pending"><span>Pending / unpaid</span><strong>{unpaidRecords.length}</strong><small>{unpaidRecords.filter((record) => record['Payment Status'] === 'Pending').length} pending records</small></div>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>CUSTOMER / PARTY</th><th>PART NUMBER</th><th>INVOICE</th><th>PAYMENT METHOD</th><th>STATUS</th><th>AMOUNT</th><th>PAYMENT DATE</th><th /></tr></thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td><strong className="payment-party">{formatValue(record['Customer name'] || record['Supplier name'])}</strong></td>
                      <td>{formatValue(record['Part Number'])}</td>
                      <td>{formatValue(record['Invoice number'])}</td>
                      <td>{formatValue(record['Payment Method'])}</td>
                      <td><span className={`payment-badge ${(record['Payment Status'] || 'Pending').toLowerCase()}`}>{record['Payment Status'] || 'Pending'}</span></td>
                      <td className="quantity-cell">{record['Payment Amount'] ? `₹${Number(record['Payment Amount']).toLocaleString('en-IN')}` : '—'}</td>
                      <td>{formatValue(record['Payment Date'])}</td>
                      <td><button className="more-button" aria-label={`Open ${record['Part Number']} payment record`} onClick={() => openRecord(record)} type="button"><Icon name="dots" /></button></td>
                    </tr>
                  ))}
                  {!records.length && (
                    <tr><td colSpan="8"><div className="empty-state"><span className="empty-illustration"><Icon name="card" size={25} /></span><strong>No payment records yet</strong><p>Add a part record and enter its payment details to see payment totals here.</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="records-panel" id="records">
            <div className="panel-heading">
              <div><div className="panel-title-row"><h2>Part records</h2><span className="record-pill">{records.length} total</span></div><p>Search, review and download your complete record details.</p></div>
              <button className="outline-button" type="button" onClick={() => downloadText('partfolio-records.csv', recordsCsv(records.length ? records : [{ ...EMPTY_RECORD, 'Sr no': '' }]))}><Icon name="download" size={16} /> Export CSV</button>
            </div>
            <div className="toolbar">
              <label className="searchbox"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search part number, supplier, invoice..." aria-label="Search records" />{query && <button aria-label="Clear search" onClick={() => setQuery('')} type="button"><Icon name="close" size={15} /></button>}<kbd>⌘ K</kbd></label>
              <div className="toolbar-note"><span className="secure-dot" /><Icon name="shield" size={14} /> Private to this browser</div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th rowSpan="2">Sr no</th><th rowSpan="2">Part Number</th><th rowSpan="2">Manufacturer</th><th rowSpan="2">Quantity</th>
                    <th colSpan={FIELDS.supplier.length}>Supplier Detail</th>
                    <th colSpan={FIELDS.customer.length}>Customer Details</th>
                    <th colSpan={FIELDS.import.length}>Import Details</th>
                    <th colSpan={ATTACHMENT_COLUMNS.length}>Attachment</th>
                    <th rowSpan="2">Remarks</th><th rowSpan="2" aria-label="Actions" />
                  </tr>
                  <tr>
                    {FIELDS.supplier.map(({ label, key }) => <th key={`supplier-${key}`}>{label}</th>)}
                    {FIELDS.customer.map(({ label, key }) => <th key={`customer-${key}`}>{label}</th>)}
                    {FIELDS.import.map(({ label, key }) => <th key={`import-${key}`}>{label}</th>)}
                    {ATTACHMENT_COLUMNS.map(({ header }) => <th key={header}>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} onDoubleClick={() => openRecord(record)}>
                      <td>{formatValue(record['Sr no'])}</td>
                      <td><button className="part-link" type="button" onClick={() => openRecord(record)}><span className="part-avatar">{(record['Part Number'] || '?').slice(0, 1).toUpperCase()}</span><span>{formatValue(record['Part Number'])}</span></button></td>
                      <td>{formatValue(record.Manufacturer)}</td>
                      <td>{formatValue(record.Quantity)}</td>
                      {FIELDS.supplier.map(({ key }) => <td key={`supplier-${key}`}>{formatValue(record[key])}</td>)}
                      {FIELDS.customer.map(({ key }) => <td key={`customer-${key}`}>{formatValue(record[key])}</td>)}
                      {FIELDS.import.map(({ key }) => <td key={`import-${key}`}>{formatValue(record[key])}</td>)}
                      {ATTACHMENT_COLUMNS.map(({ header, category }) => {
                        const files = record.attachments?.[category] || [];
                        return <td key={header} title={files.map((file) => file.name).join(', ') || undefined}>{files.length ? <span className="files-count"><Icon name="clip" size={14} />{files.length}</span> : '—'}</td>;
                      })}
                      <td>{formatValue(record.Remarks)}</td>
                      <td><button className="more-button" aria-label={`Open ${record['Part Number']} record`} onClick={() => openRecord(record)} type="button"><Icon name="dots" /></button></td>
                    </tr>
                  ))}
                  {!filteredRecords.length && (
                    <tr><td colSpan={4 + FIELDS.supplier.length + FIELDS.customer.length + FIELDS.import.length + ATTACHMENT_COLUMNS.length + 2}><div className="empty-state"><span className="empty-illustration"><Icon name={query ? 'search' : 'box'} size={25} /></span><strong>{query ? 'No matching records' : 'Your records start here'}</strong><p>{query ? 'Try another part number, supplier or invoice.' : 'Add a part record to keep supplier, customer, payment and import details together.'}</p>{query ? <button className="text-button" onClick={() => setQuery('')} type="button">Clear search</button> : <button className="primary-button small-button" onClick={startNew} type="button"><Icon name="plus" size={15} /> Add first record</button>}</div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{filteredRecords.length ? 1 : 0}–{filteredRecords.length}</strong> of <strong>{records.length}</strong> records</span><span>Double-click a row or select its part number to view all details <Icon name="arrow" size={14} /></span></div>
          </section>

          <footer className="page-footer"><span>PARTFOLIO <span className="footer-dot">·</span> Your parts records, thoughtfully organized.</span><span>Local browser storage <span className="footer-dot">·</span> Export backups regularly</span></footer>
        </div>
      </main>

      {notice && <div className="toast"><Icon name="check" size={16} />{notice}</div>}

      {modal === 'edit' && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <div className="modal edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
            <div className="modal-header"><div><div className="eyebrow">PART RECORD</div><h2 id="edit-title">{draft.id ? 'Edit record' : 'Add new record'}</h2><p>Enter details using the same fields as your spreadsheet.</p></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Close" type="button"><Icon name="close" /></button></div>
            <form onSubmit={saveDraft}>
              <div className="form-scroll">
                {GROUPS.map((group) => (
                  <section className="form-section" key={group.id}>
                    <div className="form-section-title"><span className="section-step">{GROUPS.indexOf(group) + 1}</span><div><h3>{group.title}</h3><p>{group.hint}</p></div></div>
                    <div className="form-grid">
                      {group.fields.map(({ key, label, type }) => (
                        <label className="form-field" key={key}><span>{label}{key === 'Part Number' && <b>*</b>}</span><input required={key === 'Part Number'} type={type || 'text'} min={type === 'number' ? '0' : undefined} step={type === 'number' ? 'any' : undefined} value={draft[key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} placeholder={type === 'date' ? '' : `Enter ${label.toLowerCase()}`} /></label>
                      ))}
                    </div>
                  </section>
                ))}
                <section className="form-section">
                  <div className="form-section-title"><span className="section-step">5</span><div><h3>Payment</h3><p>Record the payment method and its status.</p></div></div>
                  <div className="form-grid">
                    <div className="form-field payment-method-field"><span>Payment Method</span><div className="payment-method-options" role="group" aria-label="Payment Method">
                      {PAYMENT_METHODS.map(({ label, icon }) => (
                        <button className={`payment-method-option${draft['Payment Method'] === label ? ' selected' : ''}`} key={label} type="button" aria-pressed={draft['Payment Method'] === label} onClick={() => setDraft((current) => ({ ...current, 'Payment Method': label }))}>
                          <Icon name={icon} size={20} /><span>{label}</span>
                        </button>
                      ))}
                    </div></div>
                    <label className="form-field"><span>Payment Status</span><select value={draft['Payment Status'] || 'Pending'} onChange={(event) => setDraft((current) => ({ ...current, 'Payment Status': event.target.value }))}><option>Pending</option><option>Paid</option><option>Partially paid</option></select></label>
                    <label className="form-field"><span>Payment Amount (INR)</span><input type="number" min="0" step="any" value={draft['Payment Amount'] || ''} onChange={(event) => setDraft((current) => ({ ...current, 'Payment Amount': event.target.value }))} placeholder="Enter amount" /></label>
                    <label className="form-field"><span>Payment Date</span><input type="date" value={draft['Payment Date'] || ''} onChange={(event) => setDraft((current) => ({ ...current, 'Payment Date': event.target.value }))} /></label>
                  </div>
                </section>
                <section className="form-section">
                  <div className="form-section-title"><span className="section-step">6</span><div><h3>Attachments</h3><p>Add documents to the matching spreadsheet attachment field.</p></div></div>
                  <div className="attachment-grid">
                    {ATTACHMENT_COLUMNS.map(({ header, category }) => {
                      const files = draft.attachments?.[category] || [];
                      const count = files.length;
                      return <div className="upload-field" key={header}><div className="upload-control"><input type="file" onChange={(event) => { handleFileChange(category, event.target.files); event.target.value = ''; }} aria-label={`Upload ${header}`} /><div className="upload-button" aria-hidden="true"><Icon name="upload" size={15} /><span><strong>{header}</strong><small>{count > 1 ? `${count} files attached` : files[0]?.name || (category === header ? 'Choose file' : category)}</small></span><Icon name="plus" size={15} /></div></div>{count > 0 && <button className="remove-file" onClick={() => setDraft((current) => ({ ...current, attachments: { ...current.attachments, [category]: [] } }))} type="button">Remove file</button>}</div>;
                    })}
                  </div>
                </section>
                <section className="form-section">
                  <label className="form-field"><span>Remarks</span><textarea rows="3" value={draft.Remarks || ''} onChange={(event) => setDraft((current) => ({ ...current, Remarks: event.target.value }))} placeholder="Add a note about this record..." /></label>
                </section>
                <div className="storage-note"><Icon name="shield" size={16} /><span><strong>Stored in this browser</strong><small>Data and uploaded files are saved locally on this device, not sent to a server.</small></span></div>
              </div>
              <div className="modal-actions"><button className="outline-button" onClick={() => setModal(null)} type="button">Cancel</button><button className="primary-button" type="submit"><Icon name="check" size={16} /> Save record</button></div>
            </form>
          </div>
        </div>
      )}

      {modal === 'details' && selectedRecord && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <div className="modal details-modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
            <div className="modal-header detail-header"><div><div className="eyebrow">PART RECORD · #{selectedRecord['Sr no']}</div><h2 id="details-title">{selectedRecord['Part Number']}</h2><p>{formatValue(selectedRecord.Manufacturer)} <span className="header-separator">·</span> Updated {selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleDateString() : '—'}</p></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Close" type="button"><Icon name="close" /></button></div>
            <div className="details-body">{renderDetails(selectedRecord)}</div>
            <div className="modal-actions detail-actions"><button className="danger-button" onClick={() => removeRecord(selectedRecord.id)} type="button">Delete</button><div className="action-spacer" />{selectedRecord['Payment Status'] !== 'Paid' && <button className="outline-button" onClick={() => markPaymentPaid(selectedRecord)} type="button"><Icon name="check" size={16} /> Mark as paid</button>}<button className="outline-button" onClick={() => downloadText(`${selectedRecord['Part Number']}-record.csv`, recordsCsv([selectedRecord]))} type="button"><Icon name="download" size={16} /> Download</button><button className="primary-button" onClick={() => startEdit(selectedRecord)} type="button">Edit record</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
