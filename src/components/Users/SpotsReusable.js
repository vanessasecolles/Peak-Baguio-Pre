import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const budgetMap = {
  "Low Budget": "lowBudget",
  "Mid Range": "midRange",
  "Luxury": "luxury",
};

const SpotDetails = () => {
  const { spotId } = useParams();
  const [activities, setActivities] = useState([]);
  const [dining, setDining] = useState([]);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [budgets] = useState(Object.keys(budgetMap));
  const [timeOfDayOptions] = useState(["Morning", "Afternoon", "Evening"]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [parkingArea, setParkingArea] = useState("");
  const [spotImage, setSpotImage] = useState("");

  const title = spotId.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  useEffect(() => {
    const fetchSpotDetails = async () => {
      setLoading(true);
      try {
        const originalSpotId = title;

        const spotDocRef = doc(db, "spots", originalSpotId);
        const spotSnapshot = await getDoc(spotDocRef);
        if (spotSnapshot.exists()) {
          const spotData = spotSnapshot.data();
          setDescription(spotData.description || "");
          setParkingArea(spotData.parkingArea || "No information available.");
          setSpotImage(spotData.image || "");
        }

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
      } finally {
        setLoading(false);
      }
    };

    fetchSpotDetails();
  }, [spotId, timeOfDayOptions, title]);

  const filteredActivities = selectedTimeOfDay
    ? activities
        .filter((activity) => activity.timeOfDay === selectedTimeOfDay.toLowerCase())
        .flatMap((activity) => activity.activities || [])
    : activities.flatMap((activity) => activity.activities || []);

  const filteredDining = selectedBudget
    ? dining
        .filter((option) => option.budget === budgetMap[selectedBudget])
        .flatMap((option) => option.diningOptions || [])
    : dining.flatMap((option) => option.diningOptions || []);

  if (loading) {
    return (
      <section className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-r from-blue-100 via-teal-100 to-green-100">
      <div className="max-w-4xl mx-auto px-6 mb-12 text-center">
        <h2 className="text-4xl font-bold text-teal-800 mb-4">{title}</h2>
        {spotImage && (
          <img
            src={spotImage}
            alt={title}
            className="w-full rounded-lg shadow-md h-64 object-cover mb-4"
          />
        )}
        <p className="text-md text-gray-600 font-semibold">
  <span className="text-teal-800 block mb-2">Parking Area:</span>
  <ul className="list-disc list-inside">
    {parkingArea.split("\n").map((line, idx) => (
      <li key={idx}>{line}</li>
    ))}
  </ul>
</p>
      </div>

      <div className="max-w-4xl mx-auto mb-8 px-6">
        <div className="mb-4">
          <label className="block font-semibold text-teal-800 mb-2">
            Filter by Time of Day
          </label>
          <select
            className="w-full p-4 border border-teal-300 rounded-lg"
            value={selectedTimeOfDay}
            onChange={(e) => setSelectedTimeOfDay(e.target.value)}
          >
            <option value="">All Times of Day</option>
            {timeOfDayOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-teal-800 mb-2">
            Filter by Budget
          </label>
          <select
            className="w-full p-4 border border-teal-300 rounded-lg"
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
          >
            <option value="">All Budgets</option>
            {budgets.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <h3 className="col-span-full text-2xl font-bold text-teal-800 mb-4">Activities</h3>
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => (
            <div key={index} className="rounded-lg shadow-xl bg-white overflow-hidden">
              {activity.image && (
                <img
                  src={activity.image}
                  alt={activity.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2 text-teal-800">{activity.name}</h4>
                <p className="text-gray-700 mb-4">{activity.description}</p>
                <p className="text-gray-700 font-semibold">Starts at: {activity.price}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-lg col-span-full">No activities available.</p>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        <h3 className="col-span-full text-2xl font-bold text-teal-800 mb-4">Dining Options</h3>
        {filteredDining.length > 0 ? (
          filteredDining.map((option, index) => (
            <div key={index} className="rounded-lg shadow-xl bg-white overflow-hidden">
              {option.image && (
                <img
                  src={option.image}
                  alt={option.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2 text-teal-800">{option.name}</h4>
                <p className="text-gray-700 mb-4">{option.description}</p>
                <p className="text-gray-700 font-semibold">Starts at: {option.price}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-lg col-span-full">No dining options available.</p>
        )}
      </div>
    </section>
  );
};

export default SpotDetails;
