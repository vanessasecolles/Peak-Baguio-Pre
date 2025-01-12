import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

// Utility to map display-friendly names to Firestore keys
const budgetMap = {
  "Low Budget": "lowBudget",
  "Mid Range": "midRange",
  "Luxury": "luxury",
};

const SpotDetails = () => {
  const { spotId } = useParams(); // Get slugified ID from the URL
  const [activities, setActivities] = useState([]);
  const [dining, setDining] = useState([]);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [budgets] = useState(Object.keys(budgetMap)); // Use display-friendly names
  const [timeOfDayOptions] = useState(["Morning", "Afternoon", "Evening"]);
  const title = spotId.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  useEffect(() => {
    const fetchSpotDetails = async () => {
      try {
        const originalSpotId = spotId.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

        // Fetch all activities
        const activitiesPromises = timeOfDayOptions.map(async (time) => {
          const activitiesListRef = collection(
            db,
            "spots",
            originalSpotId,
            "activities",
            time.toLowerCase(),
            "list"
          );
          const activitiesSnapshot = await getDocs(activitiesListRef);
          return {
            timeOfDay: time.toLowerCase(),
            activities: activitiesSnapshot.docs.map((doc) => doc.data()),
          };
        });

        const activitiesData = await Promise.all(activitiesPromises);
        setActivities(activitiesData);

        // Fetch all dining options
        const diningPromises = Object.values(budgetMap).map(async (firestoreKey) => {
          const diningListRef = collection(
            db,
            "spots",
            originalSpotId,
            "dining",
            firestoreKey,
            "list"
          );
          const diningSnapshot = await getDocs(diningListRef);
          return {
            budget: firestoreKey,
            diningOptions: diningSnapshot.docs.map((doc) => doc.data()),
          };
        });

        const diningData = await Promise.all(diningPromises);
        setDining(diningData);
      } catch (error) {
        console.error("Error fetching spot details: ", error);
      }
    };

    fetchSpotDetails();
  }, [spotId, timeOfDayOptions]);

  const filteredActivities = selectedTimeOfDay
    ? activities
        .filter((activity) => activity.timeOfDay === selectedTimeOfDay.toLowerCase())
        .flatMap((activity) => activity.activities || [])
    : activities.flatMap((activity) => activity.activities || []);

  const filteredDining = selectedBudget
    ? dining
        .filter((option) => option.budget === budgetMap[selectedBudget]) // Map display name to Firestore key
        .flatMap((option) => option.diningOptions || [])
    : dining.flatMap((option) => option.diningOptions || []);

  return (
    <section className="py-16 bg-gradient-to-r from-blue-100 via-teal-100 to-green-100">
      <h2 className="text-4xl font-bold mb-8 text-center text-teal-800">{title}</h2>

      <div className="max-w-4xl mx-auto mb-8">
        <div className="mb-4">
          <label htmlFor="timeOfDay" className="block font-semibold text-teal-800 mb-2">
            Filter by Time of Day
          </label>
          <select
            id="timeOfDay"
            className="w-full p-4 border border-teal-300 rounded-lg"
            value={selectedTimeOfDay}
            onChange={(e) => setSelectedTimeOfDay(e.target.value)}
          >
            <option value="">All Times of Day</option>
            {timeOfDayOptions.map((time) => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="budget" className="block font-semibold text-teal-800 mb-2">
            Filter by Budget
          </label>
          <select
            id="budget"
            className="w-full p-4 border border-teal-300 rounded-lg"
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
          >
            <option value="">All Budgets</option>
            {budgets.map((budget) => (
              <option key={budget} value={budget}>{budget}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <h3 className="col-span-full text-2xl font-bold text-teal-800 mb-4">Activities</h3>
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => (
            <div
              key={index}
              className="group rounded-lg shadow-xl overflow-hidden bg-white transform transition-transform duration-500 hover:scale-105"
            >
              {activity.image && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={activity.image}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2 text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
                  {activity.name}
                </h4>
                <p className="text-gray-700 mb-4">
                  <span className="font-bold text-teal-800">Description:</span> {activity.description}
                </p>
                <p className="text-gray-700">
                  <span className="font-bold text-teal-800">Price:</span> ₱{activity.price}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-lg text-gray-700 col-span-full">
            No activities available for the selected time of day.
          </p>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        <h3 className="col-span-full text-2xl font-bold text-teal-800 mb-4">Dining Options</h3>
        {filteredDining.length > 0 ? (
          filteredDining.map((option, index) => (
            <div
              key={index}
              className="group rounded-lg shadow-xl overflow-hidden bg-white transform transition-transform duration-500 hover:scale-105"
            >
              {option.image && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={option.image}
                    alt={option.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2 text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
                  {option.name}
                </h4>
                <p className="text-gray-700 mb-4">
                  <span className="font-bold text-teal-800">Description:</span> {option.description}
                </p>
                <p className="text-gray-700">
                  <span className="font-bold text-teal-800">Price:</span> ₱{option.price}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-lg text-gray-700 col-span-full">
            No dining options available for the selected budget.
          </p>
        )}
      </div>
    </section>
  );
};

export default SpotDetails;
