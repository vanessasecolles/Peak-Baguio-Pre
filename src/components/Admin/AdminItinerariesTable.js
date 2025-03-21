import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const AdminItinerariesTable = () => {
  const [itineraries, setItineraries] = useState([]);
  const [filteredItineraries, setFilteredItineraries] = useState([]);
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const reportRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'itineraries'), snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItineraries(data);
      setFilteredItineraries(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetFilter, periodFilter, itineraries]);

  const applyFilters = () => {
    let filtered = itineraries;

    if (budgetFilter !== 'all') {
      filtered = filtered.filter(item => item.budget === budgetFilter);
    }

    if (periodFilter !== 'all') {
      filtered = filtered.filter(item => item.explorePeriod === periodFilter);
    }

    setFilteredItineraries(filtered);
  };

  const handlePrint = () => {
    const printContent = reportRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const handleDownloadPDF = () => {
    html2canvas(reportRef.current, { scale: 2 }).then(canvas => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('ItinerariesReport.pdf');
    });
  };

  const handleDownloadExcel = () => {
    const worksheetData = filteredItineraries.map(({ budget, explorePeriod, itinerary, spot }) => ({
      Budget: budget || 'N/A',
      ExplorePeriod: explorePeriod || 'N/A',
      Itinerary: itinerary || 'N/A',
      Spot: spot || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Itineraries');
    XLSX.writeFile(workbook, 'ItinerariesReport.xlsx');
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Admin Itineraries Table</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="font-semibold mr-2">Budget:</label>
          <select
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All</option>
            <option value="Luxury Range">Luxury Range</option>
            <option value="Mid Range">Mid Range</option>
            <option value="Low Range">Low Range</option>
          </select>
        </div>

        <div>
          <label className="font-semibold mr-2">Explore Period:</label>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div ref={reportRef} className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Budget</th>
              <th className="py-2 px-4 border-b">Explore Period</th>
              <th className="py-2 px-4 border-b">Itinerary</th>
              <th className="py-2 px-4 border-b">Spot</th>
            </tr>
          </thead>
          <tbody>
            {filteredItineraries.map(({ id, budget, explorePeriod, itinerary, spot }) => (
              <tr key={id}>
                <td className="py-2 px-4 border-b">{budget || 'N/A'}</td>
                <td className="py-2 px-4 border-b">{explorePeriod || 'N/A'}</td>
                <td className="py-2 px-4 border-b whitespace-pre-wrap">{itinerary || 'N/A'}</td>
                <td className="py-2 px-4 border-b">{spot || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-end gap-3 mt-6">
        <button
          onClick={handlePrint}
          className="bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 transition"
        >
          Print Report
        </button>
        <button
          onClick={handleDownloadPDF}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Download as PDF
        </button>
        <button
          onClick={handleDownloadExcel}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition"
        >
          Download as Excel
        </button>
      </div>
    </div>
  );
};

export default AdminItinerariesTable;
