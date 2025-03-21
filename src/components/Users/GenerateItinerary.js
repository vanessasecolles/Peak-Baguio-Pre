import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimes, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Modal.setAppElement("#root");

const GenerateItinerary = () => {
  const [spots, setSpots] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [explorePeriods] = useState(["Morning", "Afternoon", "Evening", "Whole Day"]); // Added "Whole Day"
  const [formData, setFormData] = useState({
    spot: "",
    budget: "",
    explorePeriod: "",
  });
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch spots and budgets
  useEffect(() => {
    const fetchSpotsAndBudgets = async () => {
      try {
        // Fetch spots
        const spotsSnapshot = await getDocs(collection(db, "spots"));
        const spotsData = spotsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSpots(spotsData);

        // Fetch budgets
        const budgetsDoc = await getDoc(doc(db, "itineraryFields", "fields"));
        if (budgetsDoc.exists()) {
          setBudgets(budgetsDoc.data().budgets || []);
        }
      } catch (error) {
        console.error("Error fetching spots or budgets:", error);
        toast.error("Error fetching data from Firestore.");
      }
    };

    fetchSpotsAndBudgets();
  }, []);

  const fetchSpotData = async (spotId, explorePeriod) => {
    try {
      let timeOfDayOptions = ["morning", "afternoon", "evening"];
      const budgetOptions = ["lowBudget", "midRange", "luxury"];
  
      if (explorePeriod.toLowerCase() === "whole day") {
        // If Whole Day is selected, use all time periods
        timeOfDayOptions = ["morning", "afternoon", "evening"];
      } else {
        // Otherwise, use only the selected period
        timeOfDayOptions = [explorePeriod.toLowerCase()];
      }
  
      const activitiesPromises = timeOfDayOptions.map(async (time) => {
        const activitiesListRef = collection(
          db,
          "spots",
          spotId,
          "activities",
          time,
          "list"
        );
        const activitiesSnapshot = await getDocs(activitiesListRef);
        return {
          timeOfDay: time,
          activities: activitiesSnapshot.docs.map((doc) => doc.data()),
        };
      });
  
      const diningPromises = budgetOptions.map(async (budget) => {
        const diningListRef = collection(
          db,
          "spots",
          spotId,
          "dining",
          budget,
          "list"
        );
        const diningSnapshot = await getDocs(diningListRef);
        return {
          budget,
          diningOptions: diningSnapshot.docs.map((doc) => doc.data()),
        };
      });
  
      const [activities, dining] = await Promise.all([
        Promise.all(activitiesPromises),
        Promise.all(diningPromises),
      ]);
  
      return { activities, dining };
    } catch (error) {
      console.error("Error fetching spot data:", error);
      toast.error("Error fetching spot data.");
      return { activities: [], dining: [] };
    }
  };

  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map user-friendly input to Firestore field keys
      const budgetMap = {
        "Low Budget": "lowBudget",
        "Mid Range": "midRange",
        "Luxury": "luxury",
      };

      console.log("Selected Budget:", formData.budget); // Debugging

      const timeOfDay = formData.explorePeriod.toLowerCase();
      const budget = budgetMap[formData.budget];

      if (!budget) {
        throw new Error(`Invalid budget selection: ${formData.budget}`); // Add more context to the error
      }

      const { activities, dining } = await fetchSpotData(formData.spot, formData.explorePeriod);

      const filteredActivities = formData.explorePeriod.toLowerCase() === "whole day"
          ? activities.flatMap(group => group.activities)
          : activities
              .filter((activityGroup) => activityGroup.timeOfDay === timeOfDay)
              .flatMap((group) => group.activities);
        filteredActivities.sort(() => Math.random() - 0.5).slice(0, 5); // Increased the number for a full day

        const filteredDining = dining
          .filter((diningGroup) => diningGroup.budget === budget)
          .flatMap((group) => group.diningOptions);
        filteredDining.sort(() => Math.random() - 0.5).slice(0, 3); // Increased number for a full day


        const formattedActivities = filteredActivities
        .map((activity) => `• ${activity.name}: ${activity.description} (Price: ₱${activity.price})`)
        .join("\n");
      
      const formattedDining = filteredDining
        .map((option) => `• ${option.name}: ${option.description} (Price: ₱${option.price})`)
        .join("\n");

      if (!formattedActivities && !formattedDining) {
        throw new Error("No suitable options for the selected time of day and budget.");
      }

      const prompt = `
        You are a travel planner specializing in Baguio City. The user has provided the following details:

        - Spot: ${formData.spot}
        - Time of Day: ${formData.explorePeriod} (can be Morning, Afternoon, Evening, or Whole Day)
        - Budget: ${formData.budget} (Low Budget, Mid Range, Luxury)

        ### Activities:
        ${formattedActivities || "No activities available for the selected time of day."}

        ### Dining Options:
        ${formattedDining || "No dining options available for the selected budget."}

        Your task:
        - Create a detailed itinerary tailored strictly to the selected spot (${formData.spot}), time of day (${formData.explorePeriod}), and budget (${formData.budget}).
        - Ensure the itinerary is engaging and well-structured, starting with activities for the selected time of day, followed by dining suggestions.
      `;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an AI that generates travel itineraries." },
            { role: "user", content: prompt },
          ],
          max_tokens: 800,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        const generatedItinerary = data.choices[0].message.content.trim();
        
        setItinerary(generatedItinerary);
        setIsModalOpen(true);

        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const itinerariesCollectionRef = collection(db, "itineraries");
          await addDoc(itinerariesCollectionRef, {
            userId: user.uid,
            itinerary: generatedItinerary,
            timestamp: new Date(),
            ...formData,
          });
          toast.success("Itinerary generated and saved successfully!");
        }
      } else {
        throw new Error("No valid response from AI");
      }
    } catch (error) {
      toast.error(`Error generating itinerary: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setItinerary("");
  };

  const handleVisitMyItineraries = () => {
    navigate("/my-itineraries");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <section className="p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-8 text-center text-teal-700">Generate Your Itinerary</h2>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
        <div>
          <label htmlFor="spot" className="block font-semibold mb-3 text-teal-800">Choose a Spot</label>
          <select
            id="spot"
            name="spot"
            value={formData.spot}
            onChange={handleChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Select a Spot</option>
            {spots.map((spot) => (
              <option key={spot.id} value={spot.id}>{spot.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="budget" className="block font-semibold mb-3 text-teal-800">Select Your Budget</label>
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Choose a Budget</option>
            <option value="Low Budget">Low Budget</option>
            <option value="Mid Range">Mid Range</option>
            <option value="Luxury">Luxury</option>
          </select>
        </div>

        <div>
          <label htmlFor="explorePeriod" className="block font-semibold mb-3 text-teal-800">Explore Period</label>
          <select
            id="explorePeriod"
            name="explorePeriod"
            value={formData.explorePeriod}
            onChange={handleChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Choose Explore Period</option>
            {explorePeriods.map((explorePeriod) => (
              <option key={explorePeriod} value={explorePeriod}>{explorePeriod}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 w-full"
          disabled={loading}
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>{loading ? "Generating..." : "Generate Itinerary"}</span>
        </button>
      </form>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Generated Itinerary"
        className="modal-content bg-white p-8 rounded-lg shadow-2xl max-w-3xl mx-auto mt-20 overflow-y-auto max-h-[80vh]"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="p-6">
          <h3 className="text-3xl font-bold mb-6 text-teal-700">Your AI-Generated Itinerary</h3>
          <div className="p-4 border border-teal-300 rounded-lg whitespace-pre-line bg-gray-50 text-gray-800 overflow-y-auto max-h-[60vh]">
            <ReactMarkdown>{itinerary}</ReactMarkdown>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={closeModal}
              className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500"
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Close</span>
            </button>
            <button
              onClick={handleVisitMyItineraries}
              className="bg-teal-700 text-white py-3 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500"
            >
              <FontAwesomeIcon icon={faArrowRight} />
              <span>View My Itineraries</span>
            </button>
          </div>
        </div>
      </Modal>
      <ToastContainer />
    </section>
  );
};

export default GenerateItinerary;
