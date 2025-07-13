import React from "react";
import PopularBudgetDurationReport from "../components/Admin/PopularBudgetDurationReport";
import PopularInterestsReport from "../components/Admin/PopularInterestsReport";
import ItineraryUsageReport from "../components/Admin/ItineraryUsageReport";
import LikedVsUnlikedReport from "../components/Admin/LikedVsUnlikedReport";
import SpotSelectionReport from "../components/Admin/SpotSelectionReport";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 md:ml-64">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <SpotSelectionReport />
        <LikedVsUnlikedReport />
        {/* <PopularBudgetDurationReport /> */}
        {/* Uncomment if needed */}
        {/* <PopularInterestsReport /> */}
      </div>
    </div>
  );
};

export default AdminDashboard;
