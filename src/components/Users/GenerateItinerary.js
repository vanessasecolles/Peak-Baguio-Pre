import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { doc, onSnapshot, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimes, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Modal.setAppElement("#root");

const GenerateItinerary = () => {
  const [budgets, setBudgets] = useState([]);
  const [durations, setDurations] = useState([]);
  const [formData, setFormData] = useState({
    budget: "",
    duration: "",
    hasAccommodation: false,
    accommodation: "",
    mustSeeAttractions: "",
    optionalPreferences: "",
    additionalNotes: "",
  });
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coordinates, setCoordinates] = useState([]);
  const navigate = useNavigate();

  // Fetch options from Firestore
  useEffect(() => {
    const itineraryDoc = doc(db, "itineraryFields", "fields");
    const unsubscribe = onSnapshot(itineraryDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBudgets(data.budgets || []);
        setDurations(data.durations || []);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const prompt = `
        You are a travel planner specializing in Baguio City. The user has provided the following details:

        - *Trip Duration*: ${formData.duration} (e.g., Day Trip, Weekend, Extended Stay)
        - *Budget*: ${formData.budget} (Low Range, Mid Range, Luxury Range)
        - *Accommodation*: ${formData.hasAccommodation ? formData.accommodation : "No accommodation provided"}
        - *Must-See Attractions*: ${formData.mustSeeAttractions || "No specific spots mentioned"}
        - *Optional Preferences*: ${formData.optionalPreferences || "No preference"}
        - *Additional Notes*: ${formData.additionalNotes || "None"}

        Your tasks:
        1. Validate whether the provided accommodation, attractions, and restaurants are located in Baguio City.
           - If valid, confirm and include them in the itinerary.
           - If not valid, suggest up to three alternatives that are accurate and suitable for the user's preferences.
        2. Create a detailed travel itinerary based on the user's preferences:
           - Include **popular attractions** and **hidden gems** in Baguio City.
           - Ensure activities are **grouped by proximity** to minimize travel time.
           - Add a **duration time** for each activity (e.g., 1.5 hours, 2 hours).
        3. Incorporate recommendations for **nearby attractions** and **optional preferences** to enhance the experience.
        4. Ensure the itinerary is well-structured and dynamic, balancing popular locations with offbeat suggestions.

        Provide the itinerary in a format where each activity includes:
        - The activity name in bold
        - A brief description
        - The duration listed directly below the activity name

        Ensure the itinerary aligns with the trip duration and user inputs while maintaining flexibility and variety.
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
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        let generatedItinerary = data.choices[0].message.content.trim();

        // Fetch coordinates for locations in the generated itinerary
        const coords = await fetchCoordinates(generatedItinerary);

        // Add Google Maps links to the itinerary
        const updatedItinerary = addGoogleMapsLinksToItinerary(coords, generatedItinerary);

        // Set itinerary and coordinates state
        setItinerary(updatedItinerary);
        setCoordinates(coords);

        // Open modal to show the generated itinerary
        setIsModalOpen(true);

        // Save the itinerary, coordinates, and additional metadata to Firestore
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const itinerariesCollectionRef = collection(db, "itineraries");
          await addDoc(itinerariesCollectionRef, {
            userId: user.uid,
            itinerary: updatedItinerary,
            coordinates: coords,
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

  const getGeocode = async (placeName) => {
    const apiKey = process.env.REACT_APP_OPENCAGE_API_KEY;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(placeName)}&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      if (response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry;
        return { lat, lng };
      }
      return null;
    } catch (error) {
      toast.error("Error fetching geocode");
      return null;
    }
  };

  const fetchCoordinates = async (generatedItinerary) => {
    const places = extractPlacesFromItinerary(generatedItinerary);
    let coords = [];

    for (const place of places) {
      const geocode = await getGeocode(place);
      if (geocode) {
        coords.push({ name: place, ...geocode });
      }
    }
    return coords;
  };

  const extractPlacesFromItinerary = (itineraryText) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    let matches;
    let places = [];
    let isFirstBold = true;

    while ((matches = boldRegex.exec(itineraryText)) !== null) {
      let place = matches[1].trim();

      if (isFirstBold) {
        isFirstBold = false;
        continue;
      }

      const nonLocationKeywords = ["Breakfast at", "Lunch at", "Dinner at"];
      if (nonLocationKeywords.some((keyword) => place.startsWith(keyword))) {
        continue;
      }

      if (
        !place.toLowerCase().includes("day") &&
        !place.toLowerCase().includes("morning") &&
        !place.toLowerCase().includes("afternoon") &&
        !place.toLowerCase().includes("evening") &&
        !place.toLowerCase().includes("stay") &&
        !place.endsWith(":")
      ) {
        places.push(place);
      }
    }

    return places;
  };

  const generateGoogleMapsLink = (start, end) => {
    const startEncoded = encodeURIComponent(`${start}, Baguio, Philippines`);
    const endEncoded = encodeURIComponent(`${end}, Baguio, Philippines`);
    return `https://www.google.com/maps/dir/?api=1&origin=${startEncoded}&destination=${endEncoded}`;
  };

  const addGoogleMapsLinksToItinerary = (coords, generatedItinerary) => {
    let updatedItinerary = generatedItinerary;

    for (let i = 0; i < coords.length - 1; i++) {
      const start = coords[i].name;
      const end = coords[i + 1].name;
      if (start && end) {
        const googleMapsLink = generateGoogleMapsLink(start, end);
        updatedItinerary += `\n\nTravel from **${start}** to **${end}**. [**View Directions on Google Maps**](${googleMapsLink}).`;
      }
    }

    return updatedItinerary;
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setItinerary("");
  };

  const handleVisitMyItineraries = () => {
    navigate("/my-itineraries");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <section className="min-h-screen p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-8 text-center text-teal-700">Generate Your Itinerary</h2>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
        {/* Section 1: General Info */}
        <h3 className="text-2xl font-semibold mb-4 text-teal-800">Section 1: General Info</h3>
        <div>
          <label htmlFor="budget" className="block font-semibold mb-3 text-teal-800">Select Your Budget</label>
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
            required
          >
            <option value="">Choose a Budget</option>
            {budgets.map((budget, index) => (
              <option key={index} value={budget}>{budget}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="duration" className="block font-semibold mb-3 text-teal-800">Duration of Stay</label>
          <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
            required
          >
            <option value="">Choose Duration</option>
            {durations.map((duration, index) => (
              <option key={index} value={duration}>{duration}</option>
            ))}
          </select>
        </div>

        {/* Section 2: Accommodation */}
        <h3 className="text-2xl font-semibold mb-4 text-teal-800">Section 2: Accommodation</h3>
        <div>
          <label className="block font-semibold mb-3 text-teal-800">Do you already have accommodation?</label>
          <div className="flex items-center space-x-4">
            <label>
              <input
                type="radio"
                name="hasAccommodation"
                value={true}
                checked={formData.hasAccommodation === true}
                onChange={() => setFormData({ ...formData, hasAccommodation: true })}
                className="mr-2"
              />
              Yes, I already have one.
            </label>
            <label>
              <input
                type="radio"
                name="hasAccommodation"
                value={false}
                checked={formData.hasAccommodation === false}
                onChange={() => setFormData({ ...formData, hasAccommodation: false })}
                className="mr-2"
              />
              No, I need a recommendation.
            </label>
          </div>
        </div>

        {formData.hasAccommodation && (
          <div>
            <label htmlFor="accommodation" className="block font-semibold mb-3 text-teal-800">If Yes, please specify your accommodation</label>
            <input
              type="text"
              id="accommodation"
              name="accommodation"
              value={formData.accommodation}
              onChange={handleChange}
              className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
            />
          </div>
        )}

        {/* Section 3: Interests and Preferences */}
        <h3 className="text-2xl font-semibold mb-4 text-teal-800">Section 3: Interests and Preferences</h3>
        <div>
          <label htmlFor="mustSeeAttractions" className="block font-semibold mb-3 text-teal-800">Must-See Attractions</label>
          <input
            type="text"
            id="mustSeeAttractions"
            name="mustSeeAttractions"
            value={formData.mustSeeAttractions}
            onChange={handleChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
          />
        </div>

        <div>
          <label htmlFor="optionalPreferences" className="block font-semibold mb-3 text-teal-800">Optional Preferences</label>
          <input
            type="text"
            id="optionalPreferences"
            name="optionalPreferences"
            value={formData.optionalPreferences}
            onChange={handleChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
          />
        </div>

        {/* Section 4: Final Notes */}
        <h3 className="text-2xl font-semibold mb-4 text-teal-800">Section 4: Final Notes</h3>
        <div>
          <label htmlFor="additionalNotes" className="block font-semibold mb-3 text-teal-800">Additional Notes</label>
          <textarea
            id="additionalNotes"
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
            rows="3"
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 w-full flex items-center justify-center space-x-3 transition-transform transform hover:scale-105 duration-300 ease-in-out"
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
            <ReactMarkdown className="itinerary-content">
              {itinerary}
            </ReactMarkdown>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={closeModal}
              className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500 flex items-center space-x-2 transition duration-300 ease-in-out"
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Close</span>
            </button>
            <button
              onClick={handleVisitMyItineraries}
              className="bg-teal-700 text-white py-3 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center space-x-2 transition duration-300 ease-in-out"
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
