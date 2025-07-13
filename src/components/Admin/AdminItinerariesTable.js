import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const rowsPerPageOptions = [5, 10, 20];

// Helper to strip markdown syntax for PDF export
const stripMarkdown = (text = '') =>
  text
    // Remove links but keep text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Bold and italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Inline code
    .replace(/`([^`]*)`/g, '$1')
    // Headings
    .replace(/^#+\s*(.*)/gm, '$1')
    // Remove any remaining Markdown chars
    .replace(/[>*~`-]/g, '')
    .trim();

const AdminItinerariesTable = () => {
  const [itineraries, setItineraries] = useState([]);
  const [filteredItineraries, setFilteredItineraries] = useState([]);
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [spotFilter, setSpotFilter] = useState('all');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [spotNames, setSpotNames] = useState({});
  const [uniqueSpots, setUniqueSpots] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Load data
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'itineraries'), snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItineraries(data);
      setFilteredItineraries(data);
      setUniqueSpots(Array.from(new Set(data.map(i => i.spot).filter(Boolean))));
    });
    return () => unsub();
  }, []);

  // Load spot names
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'spots'));
      const map = {};
      snap.docs.forEach(d => (map[d.id] = d.data().name || d.id));
      setSpotNames(map);
    })();
  }, []);

  // Apply filters & sorting
  useEffect(() => {
    let data = [...itineraries];
    if (budgetFilter !== 'all') data = data.filter(i => i.budget === budgetFilter);
    if (periodFilter !== 'all') data = data.filter(i => i.explorePeriod === periodFilter);
    if (spotFilter !== 'all') data = data.filter(i => i.spot === spotFilter);
    if (feedbackFilter !== 'all') data = data.filter(i => i.feedback === feedbackFilter);
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = (a[sortConfig.key] || '').toString().toLowerCase();
        const bVal = (b[sortConfig.key] || '').toString().toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredItineraries(data);
    setPage(0);
  }, [itineraries, budgetFilter, periodFilter, spotFilter, feedbackFilter, sortConfig]);

  const requestSort = key => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const toggleRow = id => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Pagination
  const start = page * rowsPerPage;
  const displayed = filteredItineraries.slice(start, start + rowsPerPage);
  const pageCount = Math.ceil(filteredItineraries.length / rowsPerPage) || 1;

  // PDF export using jsPDF-AutoTable with stripped markdown
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const head = [['Budget', 'Period', 'Spot', 'Feedback', 'Itinerary']];
    const body = filteredItineraries.map(({ budget, explorePeriod, spot, feedback, itinerary }) => [
      budget || 'N/A',
      explorePeriod || 'N/A',
      spotNames[spot] || spot || 'N/A',
      feedback || 'None',
      stripMarkdown(itinerary) // plain text
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 20,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [224, 224, 224] },
      theme: 'striped',
      margin: { left: 10, right: 10 }
    });
    doc.save('ItinerariesReport.pdf');
  };

  // Excel export
  const handleDownloadExcel = () => {
    const wsData = filteredItineraries.map(({ budget, explorePeriod, spot, feedback, itinerary }) => ({
      Budget: budget || 'N/A',
      Period: explorePeriod || 'N/A',
      Spot: spotNames[spot] || spot || 'N/A',
      Feedback: feedback || 'None',
      Itinerary: stripMarkdown(itinerary)
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Itineraries');
    XLSX.writeFile(wb, 'ItinerariesReport.xlsx');
  };

  return (
    <div className="container mx-auto p-6 md:ml-64">
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-semibold">Admin Itineraries Report</h1>
        <div className="space-x-2">
          <button onClick={handleDownloadPDF} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Export PDF</button>
          <button onClick={handleDownloadExcel} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Export Excel</button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg shadow-sm no-print mb-4">
        <button onClick={() => setShowFilters(sf => !sf)} className="text-blue-600">
          {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
        </button>
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Filter label="Budget" value={budgetFilter} onChange={setBudgetFilter} options={['all','Low Budget','Mid Range','Luxury']} />
            <Filter label="Period" value={periodFilter} onChange={setPeriodFilter} options={['all','Morning','Afternoon','Evening','Whole Day']} />
            <Filter label="Spot" value={spotFilter} onChange={setSpotFilter} options={['all',...uniqueSpots]} displayMap={spotNames} />
            <Filter label="Feedback" value={feedbackFilter} onChange={setFeedbackFilter} options={['all','liked','disliked']} />
          </div>
        )}
      </div>

      <div className="overflow-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 sticky top-0">
            <tr>
              {['budget','explorePeriod','spot','feedback','itinerary'].map(key => (
                <th key={key} onClick={() => requestSort(key)} className="px-4 py-3 text-left cursor-pointer font-medium uppercase tracking-wide">
                  {key === 'explorePeriod' ? 'Period' : key.charAt(0).toUpperCase() + key.slice(1)}
                  {sortConfig.key === key && (sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(({ id, budget, explorePeriod, spot, feedback, itinerary }) => (
              <tr key={id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{budget || 'N/A'}</td>
                <td className="px-4 py-2">{explorePeriod || 'N/A'}</td>
                <td className="px-4 py-2">{spotNames[spot] || spot || 'N/A'}</td>
                <td className="px-4 py-2 capitalize">{feedback || 'None'}</td>
                <td className="px-4 py-2">
                  {expandedRows.has(id) ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{itinerary}</ReactMarkdown>
                  ) : (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{`${itinerary.slice(0, 100)}${itinerary.length > 100 ? '...' : ''}`}</ReactMarkdown>
                      {itinerary.length > 100 && <button onClick={() => toggleRow(id)} className="text-indigo-600 ml-2 no-print">More</button>}
                    </>
                  )}
                  {expandedRows.has(id) && <button onClick={() => toggleRow(id)} className="text-indigo-600 ml-2 no-print">Less</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 no-print">
        <div>
          <label className="mr-2">Rows per page:</label>
          <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))} className="border rounded p-1">
            {rowsPerPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="space-x-2">
          <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0} className="px-3 py-1 border rounded">Prev</button>
          <span>{page + 1} / {pageCount}</span>
          <button onClick={() => setPage(p => Math.min(p + 1, pageCount - 1))} disabled={page >= pageCount - 1} className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>
    </div>
  );
};

const Filter = ({ label, value, onChange, options, displayMap }) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-700 mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="p-2 border rounded-md">
      {options.map(opt => (
        <option key={opt} value={opt}>{opt === 'all' ? 'All' : displayMap ? displayMap[opt] || opt : opt}</option>
      ))}
    </select>
  </div>
);

export default AdminItinerariesTable;
