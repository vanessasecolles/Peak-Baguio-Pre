import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import Chart from "react-google-charts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const SpotSelectionReport = () => {
  const [spotCounts, setSpotCounts] = useState({});
  const [spotNames, setSpotNames] = useState({});

  // Fetch all spots for name lookup
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "spots"));
      const mapping = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        mapping[doc.id] = data.name;
      });
      setSpotNames(mapping);
    })();
  }, []);

  // Listen to itineraries and count spot selections
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "itineraries"), snapshot => {
      const counts = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const spotId = data.spot;
        if (!spotId) return;
        counts[spotId] = (counts[spotId] || 0) + 1;
      });
      setSpotCounts(counts);
    });
    return () => unsub();
  }, []);

  // Prepare chart data
  const chartData = [["Spot", "Selections"]];
  Object.entries(spotCounts).forEach(([id, count]) => {
    const name = spotNames[id] || id;
    chartData.push([name, count]);
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const input = document.getElementById("spot-report");
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      pdf.save("SpotSelectionReport.pdf");
    });
  };

  const handleDownloadImage = () => {
    const input = document.getElementById("spot-report");
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "SpotSelectionReport.png";
      link.click();
    });
  };

  return (
    <div
      id="spot-report"
      className="p-6 bg-white shadow-lg rounded-lg mx-auto w-full sm:max-w-2xl"
    >
      <h2 className="text-2xl font-bold mb-4">Spot Selection Report</h2>
      <Chart
        chartType="PieChart"
        width="100%"
        height="400px"
        data={chartData}
        options={{ title: "User-Selected Spots Breakdown" }}
      />
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
        <button
          onClick={handlePrint}
          className="bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center w-full sm:w-auto transition duration-300 ease-in-out"
        >
          Print Report
        </button>
        <button
          onClick={handleDownloadPDF}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 flex items-center justify-center w-full sm:w-auto transition duration-300 ease-in-out"
        >
          Download as PDF
        </button>
        <button
          onClick={handleDownloadImage}
          className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 flex items-center justify-center w-full sm:w-auto transition duration-300 ease-in-out"
        >
          Download as Image
        </button>
      </div>
    </div>
  );
};

export default SpotSelectionReport;
