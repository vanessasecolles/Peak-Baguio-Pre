import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import Chart from "react-google-charts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ItineraryUsageReport = () => {
  const [usedCount, setUsedCount] = useState(0);
  const [plannedCount, setPlannedCount] = useState(0);
  const [unusedCount, setUnusedCount] = useState(0);

  useEffect(() => {
    // Fetch itineraries from Firestore
    const itinerariesCollection = collection(db, "itineraries");
    const unsubscribe = onSnapshot(itinerariesCollection, (snapshot) => {
      let used = 0;
      let planned = 0;
      let unused = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.used) {
          used++;
        } else if (data.planned) {
          planned++;
        } else {
          unused++;
        }
      });

      setUsedCount(used);
      setPlannedCount(planned);
      setUnusedCount(unused);
    });

    return () => unsubscribe();
  }, []);

  // Prepare data for the chart
  const data = [
    ["Status", "Count"],
    ["Used Itineraries", usedCount],
    ["Planned Itineraries", plannedCount],
    ["Unused Itineraries", unusedCount],
  ];

  // Handle printing the report
  const handlePrint = () => {
    window.print();
  };

  // Handle downloading the report as a PDF
  const handleDownloadPDF = () => {
    const input = document.getElementById("report");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      pdf.save("ItineraryUsageReport.pdf");
    });
  };

  // Handle downloading the report as an image
  const handleDownloadImage = () => {
    const input = document.getElementById("report");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "ItineraryUsageReport.png";
      link.click();
    });
  };

  return (
    <div
      id="report"
      className="p-6 bg-white shadow-lg rounded-lg mx-auto w-full sm:max-w-2xl"
    >
      <h2 className="text-2xl font-bold mb-4">Itinerary Usage Report</h2>
      <Chart
        chartType="PieChart"
        width="100%"
        height="400px"
        data={data}
        options={{
          title: "Itinerary Usage Breakdown",
        }}
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

export default ItineraryUsageReport;
