import React from "react";
import PopularBudgetDurationReport from "../components/Admin/PopularBudgetDurationReport";
import PopularInterestsReport from "../components/Admin/PopularInterestsReport";

import ItineraryUsageReport from "../components/Admin/ItineraryUsageReport";
import LikedVsUnlikedReport from "../components/Admin/LikedVsUnlikedReport";
const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <ItineraryUsageReport/>
      <LikedVsUnlikedReport/>
      <PopularBudgetDurationReport/>
      {/*<PopularInterestsReport/>*/}
      
    
    </div>
  );
};

export default AdminDashboard;
