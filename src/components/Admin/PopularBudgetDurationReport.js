import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import Chart from "react-google-charts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PopularBudgetDurationReport = () => {
  const [budgetData, setBudgetData] = useState([["Budget", "Count"]]);
  const [durationData, setDurationData] = useState([["Duration", "Count"]]);
  const reportRef = useRef();

  useEffect(() => {
    const itinerariesCollection = collection(db, "itineraries");
    const unsubscribe = onSnapshot(itinerariesCollection, (snapshot) => {
      const budgetsCount = {};
      const durationsCount = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.budget) {
          budgetsCount[data.budget] = (budgetsCount[data.budget] || 0) + 1;
        }
        if (data.duration) {
          durationsCount[data.duration] = (durationsCount[data.duration] || 0) + 1;
        }
      });

      // Prepare data for the budget chart
      const budgetChartData = [["Budget", "Count"]];
      for (let budget in budgetsCount) {
        budgetChartData.push([budget, budgetsCount[budget]]);
      }
      setBudgetData(budgetChartData);

      // Prepare data for the duration chart
      const durationChartData = [["Duration", "Count"]];
      for (let duration in durationsCount) {
        durationChartData.push([duration, durationsCount[duration]]);
      }
      setDurationData(durationChartData);
    });

    return () => unsubscribe();
  }, []);

  // Function to print the report
  const handlePrint = () => {
    if (reportRef.current) {
      const printContents = reportRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
    }
  };

  // Function to download the report as an image or PDF
  const handleDownload = (type) => {
    html2canvas(reportRef.current).then((canvas) => {
      if (type === "image") {
        const link = document.createElement("a");
        link.download = "popular_budget_duration_report.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else if (type === "pdf") {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
        pdf.save("popular_budget_duration_report.pdf");
      }
    });
  };

  return (
    <div ref={reportRef} className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Popular Budget and Duration Choices</h2>

      <div className="mb-8">
        <Chart
          chartType="PieChart"
          width="100%"
          height="300px"
          data={budgetData}
          options={{ title: "Popular Budgets" }}
        />
      </div>

      <div className="mb-8">
        <Chart
          chartType="PieChart"
          width="100%"
          height="300px"
          data={durationData}
          options={{ title: "Popular Durations" }}
        />
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={handlePrint}
          className="bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center space-x-2 transition duration-300 ease-in-out"
        >
          Print Report
        </button>
        <button
          onClick={() => handleDownload("image")}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 flex items-center space-x-2 transition duration-300 ease-in-out"
        >
          Download as Image
        </button>
        <button
          onClick={() => handleDownload("pdf")}
          className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 flex items-center space-x-2 transition duration-300 ease-in-out"
        >
          Download as PDF
        </button>
      </div>
    </div>
  );
};

export default PopularBudgetDurationReport;
