import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import Chart from "react-google-charts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PopularInterestsReport = () => {
  const [interestData, setInterestData] = useState([["Interest", "Count"]]);

  useEffect(() => {
    const itinerariesCollection = collection(db, "itineraries");
    const unsubscribe = onSnapshot(itinerariesCollection, (snapshot) => {
      const interestsCount = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.interests) {
          data.interests.forEach((interest) => {
            interestsCount[interest] = (interestsCount[interest] || 0) + 1;
          });
        }
      });

      // Prepare data for the interests chart
      const interestChartData = [["Interest", "Count"]];
      for (let interest in interestsCount) {
        interestChartData.push([interest, interestsCount[interest]]);
      }
      setInterestData(interestChartData);
    });

    return () => unsubscribe();
  }, []);

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
      pdf.addImage(imgData, "PNG", 10, 10);
      pdf.save("PopularInterestsReport.pdf");
    });
  };

  // Handle downloading the report as an Image
  const handleDownloadImage = () => {
    const input = document.getElementById("report");
    html2canvas(input).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "PopularInterestsReport.png";
      link.click();
    });
  };

  return (
    <div id="report" className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Most Popular Interests</h2>
      <Chart
        chartType="BarChart"
        width="100%"
        height="400px"
        data={interestData}
        options={{
          title: "Most Popular Interests",
          hAxis: { title: "Count" },
          vAxis: { title: "Interest" },
        }}
      />
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
      </div>
    </div>
  );
};

export default PopularInterestsReport;
