import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const AdminItinerariesTable = () => {
  const [itineraries, setItineraries] = useState([]);
  const [filteredItineraries, setFilteredItineraries] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Fetch itineraries from Firestore
    const itinerariesCollection = collection(db, 'itineraries');
    const unsubscribe = onSnapshot(itinerariesCollection, (snapshot) => {
      const fetchedItineraries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItineraries(fetchedItineraries);
      setFilteredItineraries(fetchedItineraries);
    });

    return () => unsubscribe();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilter(value);

    if (value === 'all') {
      setFilteredItineraries(itineraries);
    } else if (value === 'used') {
      setFilteredItineraries(itineraries.filter((itinerary) => itinerary.used));
    } else if (value === 'planned') {
      setFilteredItineraries(itineraries.filter((itinerary) => itinerary.planned && !itinerary.used));
    } else if (value === 'unused') {
      setFilteredItineraries(itineraries.filter((itinerary) => !itinerary.used && !itinerary.planned));
    } else if (value === 'liked') {
      setFilteredItineraries(itineraries.filter((itinerary) => itinerary.feedback === 'liked'));
    } else if (value === 'unliked') {
      setFilteredItineraries(itineraries.filter((itinerary) => itinerary.feedback === 'disliked'));
    }
  };

  // Handle printing the report
  const handlePrint = () => {
    window.print();
  };

  // Handle downloading the report as a PDF
  const handleDownloadPDF = () => {
    const input = document.getElementById('report');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
      pdf.save('ItinerariesReport.pdf');
    });
  };

  // Handle downloading the report as an image
  const handleDownloadImage = () => {
    const input = document.getElementById('report');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'ItinerariesReport.png';
      link.click();
    });
  };

  // Handle downloading the report as an Excel file
  const handleDownloadExcel = () => {
    const worksheetData = filteredItineraries.map((itinerary) => ({
      Date: new Date(itinerary.timestamp?.seconds * 1000).toLocaleDateString(),
      Itinerary: itinerary.itinerary,
      Status: itinerary.used ? 'Used' : itinerary.planned ? 'Planned' : 'Unused',
      Feedback: itinerary.feedback ? (itinerary.feedback === 'liked' ? 'Liked' : 'Unliked') : 'No Feedback',
      Budget: itinerary.budget || 'N/A',
      Duration: itinerary.duration || 'N/A',
      Interests: itinerary.interests?.join(', ') || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Itineraries');
    XLSX.writeFile(workbook, 'ItinerariesReport.xlsx');
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Admin Itineraries Table</h2>
      <div className="mb-4">
        <label htmlFor="filter" className="mr-2 font-semibold">Filter:</label>
        <select id="filter" value={filter} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-md">
          <option value="all">All</option>
          <option value="used">Used</option>
          <option value="planned">Planned</option>
          <option value="unused">Unused</option>
          <option value="liked">Liked</option>
          <option value="unliked">Unliked</option>
        </select>
      </div>

      <div id="report" className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b border-gray-300 text-left">Date</th>
              <th className="py-2 px-4 border-b border-gray-300 text-left">Itinerary</th>
              <th className="py-2 px-4 border-b border-gray-300 text-left">Status</th>
              <th className="py-2 px-4 border-b border-gray-300 text-left">Feedback</th>
              <th className="py-2 px-4 border-b border-gray-300 text-left">Choices</th>
            </tr>
          </thead>
          <tbody>
            {filteredItineraries.map((itinerary) => (
              <tr key={itinerary.id}>
                <td className="py-2 px-4 border-b border-gray-300">{new Date(itinerary.timestamp?.seconds * 1000).toLocaleDateString()}</td>
                <td className="py-2 px-4 border-b border-gray-300 whitespace-pre-wrap">{itinerary.itinerary}</td>
                <td className="py-2 px-4 border-b border-gray-300">
                  {itinerary.used ? 'Used' : itinerary.planned ? 'Planned' : 'Unused'}
                </td>
                <td className="py-2 px-4 border-b border-gray-300">
                  {itinerary.feedback ? itinerary.feedback === 'liked' ? 'Liked' : 'Unliked' : 'No Feedback'}
                </td>
                <td className="py-2 px-4 border-b border-gray-300 whitespace-pre-wrap">
                  Budget: {itinerary.budget || 'N/A'}, Duration: {itinerary.duration || 'N/A'}, Interests: {itinerary.interests?.join(', ') || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={handlePrint}
          className="bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center space-x-2 transition duration-300 ease-in-out"
        >
          Print Report
        </button>
        <button
          onClick={handleDownloadPDF}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 flex items-center space-x-2 transition duration-300 ease-in-out"
        >
          Download as PDF
        </button>
        <button
          onClick={handleDownloadImage}
          className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 flex items-center space-x-2 transition duration-300 ease-in-out"
        >
          Download as Image
        </button>
        <button
          onClick={handleDownloadExcel}
          className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 flex items-center space-x-2 transition duration-300 ease-in-out"
        >
          Download as Excel
        </button>
      </div>
    </div>
  );
};

export default AdminItinerariesTable;
