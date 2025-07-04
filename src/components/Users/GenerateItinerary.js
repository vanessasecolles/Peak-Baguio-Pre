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
  const [explorePeriods] = useState(["Morning", "Afternoon", "Evening", "Whole Day"]);
  const [formData, setFormData] = useState({
    spot: "",
    budget: "",
    explorePeriod: "",
  });
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch spots and budgets from Firestore
  useEffect(() => {
    const fetchSpotsAndBudgets = async () => {
      try {
        const spotsSnapshot = await getDocs(collection(db, "spots"));
        const spotsData = spotsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSpots(spotsData);

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

      if (explorePeriod.toLowerCase() !== "whole day") {
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
      const budgetMap = {
        "Low Budget": "lowBudget",
        "Mid Range": "midRange",
        "Luxury": "luxury",
      };

      const timeOfDay = formData.explorePeriod.toLowerCase();
      const budget = budgetMap[formData.budget];
      if (!budget) {
        throw new Error(`Invalid budget selection: ${formData.budget}`);
      }

      const { activities, dining } = await fetchSpotData(
        formData.spot,
        formData.explorePeriod
      );

      // Filter and shuffle dining
      const filteredDining = dining
        .filter((diningGroup) => diningGroup.budget === budget)
        .flatMap((group) => group.diningOptions);
      const selectedDining = filteredDining.sort(() => Math.random() - 0.5).slice(0, 3);

      // ONLY for dining: remove "Price:" and the "₱" symbol => just show (xxx)
      const formattedDining = selectedDining
        .map(
          (option) =>
            `- ${option.name}: ${option.description} (${option.price})`
        )
        .join("\n");

      // Create a slug for the chosen spot (e.g., "burnham-park")
      const spotSlug = formData.spot.toLowerCase().replace(/\s+/g, "-");

      let prompt = "";

      // ---------------------------------------
      // IF WHOLE DAY
      // ---------------------------------------
      if (formData.explorePeriod.toLowerCase() === "whole day") {
        const morningGroup =
          activities.find((group) => group.timeOfDay === "morning") || {
            activities: [],
          };
        const afternoonGroup =
          activities.find((group) => group.timeOfDay === "afternoon") || {
            activities: [],
          };
        const eveningGroup =
          activities.find((group) => group.timeOfDay === "evening") || {
            activities: [],
          };

        const morningActivities = morningGroup.activities
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);
        const afternoonActivities = afternoonGroup.activities
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);
        const eveningActivities = eveningGroup.activities
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);

        const formattedMorningActivities = morningActivities
          .map(
            (activity) =>
              `- ${activity.name}: ${activity.description} (Price: ₱${activity.price})`
          )
          .join("\n");

        const formattedAfternoonActivities = afternoonActivities
          .map(
            (activity) =>
              `- ${activity.name}: ${activity.description} (Price: ₱${activity.price})`
          )
          .join("\n");

        const formattedEveningActivities = eveningActivities
          .map(
            (activity) =>
              `- ${activity.name}: ${activity.description} (Price: ₱${activity.price})`
          )
          .join("\n");

        // Prompt
        prompt = `
You are a travel planner specializing in Baguio City.

Please produce your response in Markdown format with the following structure and headings. Only the headings for **Title**, **Overview**, and **Explore Periods** should be bolded. Do not bold the individual activity or dining items.
-----------------------------------------------------------------------
## **Title**
One-line itinerary title

## **Overview**
A short summary of the activity areas and dining options.

## **Morning**
1. Activity 1 (Price: ₱xxx)
2. Activity 2 (Price: ₱xxx)

## **Afternoon**
1. Activity 1 (Price: ₱xxx)
2. Activity 2 (Price: ₱xxx)

## **Evening**
1. Activity 1 (Price: ₱xxx)
2. Activity 2 (Price: ₱xxx)

## **Dining Options**
1. Dining Option 1 (xxx)
2. Dining Option 2 (xxx)

[read more about ${formData.spot} by clicking here](http://localhost:3000/spots/${spotSlug})
END
-----------------------------------------------------------------------

Now, strictly follow that Markdown format (no extra blank lines) and use the following data:

- Spot: ${formData.spot}
- Explore Period: ${formData.explorePeriod}
- Budget: ${formData.budget}

### Morning Activities:
${formattedMorningActivities || "No morning activities available."}

### Afternoon Activities:
${formattedAfternoonActivities || "No afternoon activities available."}

### Evening Activities:
${formattedEveningActivities || "No evening activities available."}

### Dining Options:
${formattedDining || "No dining options available."}
`;
      } 
      // ---------------------------------------
      // IF SINGLE PERIOD
      // ---------------------------------------
      else {
        const filteredActivities = activities
          .filter((activityGroup) => activityGroup.timeOfDay === timeOfDay)
          .flatMap((group) => group.activities);
        const selectedActivities = filteredActivities
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);

        const formattedActivities = selectedActivities
          .map(
            (activity) =>
              `- ${activity.name}: ${activity.description} (Price: ₱${activity.price})`
          )
          .join("\n");

        // Prompt
        prompt = `
You are a travel planner specializing in Baguio City.

Please produce your response in Markdown format with the following structure and headings. Only the headings for **Title**, **Overview**, and **Explore Period** should be bolded. Do not bold the individual activity or dining items.
-----------------------------------------------------------------------
## **Title**
One-line itinerary title

## **Overview**
A short summary of the activity areas and dining options.

## **Activities**
1. Activity 1 (Price: ₱xxx)
2. Activity 2 (Price: ₱xxx)

## **Dining Options**
1. Dining Option 1 (xxx)
2. Dining Option 2 (xxx)

[read more about ${formData.spot} by clicking here](http://localhost:3000/spots/${spotSlug})
END
-----------------------------------------------------------------------

Now, strictly follow that Markdown format (no extra blank lines) and use the following data:

- Spot: ${formData.spot}
- Explore Period: ${formData.explorePeriod}
- Budget: ${formData.budget}

### Activities:
${formattedActivities || "No activities available."}

### Dining Options:
${formattedDining || "No dining options available."}
`;
      }

      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an AI that generates travel itineraries.",
            },
            {
              role: "user",
              content: prompt,
            },
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
        // Post-process to remove extra blank lines if needed
        let generatedItinerary = data.choices[0].message.content.trim();
        generatedItinerary = generatedItinerary.replace(/\n{3,}/g, "\n\n");
        generatedItinerary = generatedItinerary.replace(/[ \t]+$/gm, "");

        setItinerary(generatedItinerary);
        setIsModalOpen(true);

        // Save to Firestore if user is authenticated
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
      <h2 className="text-4xl font-bold mb-4 text-center text-teal-700">
        Generate Your Itinerary
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto">
        <div>
          <label htmlFor="spot" className="block font-semibold mb-3 text-teal-800">
            Choose a Spot
          </label>
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
              <option key={spot.id} value={spot.id}>
                {spot.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="budget" className="block font-semibold mb-3 text-teal-800">
            Select Your Budget
          </label>
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Choose a Budget</option>
            <option value="Low Budget">Low Budget (100-500 PHP per person)</option>
            <option value="Mid Range">Mid Range (500-1,000 PHP per person)</option>
            <option value="Luxury">Luxury (1,000 and up per person)</option>
          </select>
        </div>

        <div>
          <label htmlFor="explorePeriod" className="block font-semibold mb-3 text-teal-800">
            Explore Period
          </label>
          <select
            id="explorePeriod"
            name="explorePeriod"
            value={formData.explorePeriod}
            onChange={handleChange}
            className="w-full p-4	border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Choose Explore Period</option>
            {explorePeriods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 w-full"
          disabled={loading}
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          <span className="ml-2">
            {loading ? "Generating..." : "Generate Itinerary"}
          </span>
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
          <h3 className="text-3xl font-bold mb-6 text-teal-700">
            Your AI-Generated Itinerary
          </h3>
          <div className="p-4 border border-teal-300 rounded-lg whitespace-pre-line bg-gray-50 text-gray-800 overflow-y-auto max-h-[60vh]">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            >
              {itinerary}
            </ReactMarkdown>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={closeModal}
              className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500"
            >
              <FontAwesomeIcon icon={faTimes} />
              <span className="ml-2">Close</span>
            </button>
            <button
              onClick={handleVisitMyItineraries}
              className="bg-teal-700 text-white py-3 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500"
            >
              <FontAwesomeIcon icon={faArrowRight} />
              <span className="ml-2">View My Itineraries</span>
            </button>
          </div>
        </div>
      </Modal>
      <ToastContainer />
    </section>
  );
};

export default GenerateItinerary;
