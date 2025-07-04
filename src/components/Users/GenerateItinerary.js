import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimes,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Modal.setAppElement("#root");

// Fisher–Yates shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GenerateItinerary = () => {
  const [spots, setSpots] = useState([]);
  const [formData, setFormData] = useState({
    spot: "",
    budget: "",
    explorePeriod: "",
  });
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch spots
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "spots"));
        setSpots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        toast.error("Error fetching spots.");
      }
    })();
  }, []);

  // Fetch activities + dining
  const fetchSpotData = async (spotId, explorePeriod) => {
    try {
      let times = ["morning", "afternoon", "evening"];
      if (explorePeriod.toLowerCase() !== "whole day") {
        times = [explorePeriod.toLowerCase()];
      }

      const activities = await Promise.all(
        times.map(async t => {
          const snap = await getDocs(
            collection(db, "spots", spotId, "activities", t, "list")
          );
          return { timeOfDay: t, activities: snap.docs.map(d => d.data()) };
        })
      );

      const budgetOptions = ["lowBudget", "midRange", "luxury"];
      const dining = await Promise.all(
        budgetOptions.map(async key => {
          const snap = await getDocs(
            collection(db, "spots", spotId, "dining", key, "list")
          );
          return { budget: key, diningOptions: snap.docs.map(d => d.data()) };
        })
      );

      return { activities, dining };
    } catch (err) {
      console.error(err);
      toast.error("Error fetching spot data.");
      return { activities: [], dining: [] };
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const budgetMap = {
        "Low Budget": "lowBudget",
        "Mid Range": "midRange",
        Luxury: "luxury",
      };
      const { spot, budget: uiBudget, explorePeriod } = formData;
      const budgetKey = budgetMap[uiBudget];
      if (!budgetKey) throw new Error(`Invalid budget selection: ${uiBudget}`);

      const { activities, dining } = await fetchSpotData(spot, explorePeriod);

      // pick dining
      const filteredDining = dining
        .filter(group => group.budget === budgetKey)
        .flatMap(group => group.diningOptions);
      const selectedDining = shuffleArray(filteredDining).slice(0, 3);
      const formattedDining = selectedDining
        .map(opt => `- ${opt.name}: ${opt.description} (${opt.price})`)
        .join("\n\n"); // extra line between items

      // helper for activities
      const pickActivities = arr =>
        shuffleArray(arr)
          .slice(0, 5)
          .map(a => `- ${a.name}: ${a.description} (Price: ₱${a.price})`)
          .join("\n\n"); // extra line between items

      // slug
      const slug = spot.toLowerCase().replace(/\s+/g, "-");

      // build prompt
      let prompt = "";
      if (explorePeriod.toLowerCase() === "whole day") {
        const mg = activities.find(g => g.timeOfDay === "morning")?.activities || [];
        const ag = activities.find(g => g.timeOfDay === "afternoon")?.activities || [];
        const eg = activities.find(g => g.timeOfDay === "evening")?.activities || [];

        prompt = `
You are a travel planner specializing in Baguio City.

Please produce your response in Markdown format with the following structure and headings.
Only the headings for **Title**, **Overview**, **Morning**, **Afternoon**, **Evening**, and **Dining Options** should be bolded. Do not bold the individual items.
-----------------------------------------------------------------------
## **Title**
One-line itinerary title

## **Overview**
A short summary of the activity areas and dining options.

## **Morning**
${pickActivities(mg)}

## **Afternoon**
${pickActivities(ag)}

## **Evening**
${pickActivities(eg)}

## **Dining Options**
${formattedDining}

[read more about ${spot} by clicking here](http://localhost:3000/spots/${slug})
END
-----------------------------------------------------------------------
- Spot: ${spot}
- Explore Period: ${explorePeriod}
- Budget: ${uiBudget}
`.trim();
      } else {
        const tg = activities
          .find(g => g.timeOfDay === explorePeriod.toLowerCase())
          ?.activities || [];

        prompt = `
You are a travel planner specializing in Baguio City.

Please produce your response in Markdown format with the following structure and headings.
Only the headings for **Title**, **Overview**, **Activities**, and **Dining Options** should be bolded. Do not bold the individual items.
-----------------------------------------------------------------------
## **Title**
One-line itinerary title

## **Overview**
A short summary of the activity areas and dining options.

## **Activities**
${pickActivities(tg)}

## **Dining Options**
${formattedDining}

[read more about ${spot} by clicking here](http://localhost:3000/spots/${slug})
END
-----------------------------------------------------------------------
- Spot: ${spot}
- Explore Period: ${explorePeriod}
- Budget: ${uiBudget}
`.trim();
      }

      // call OpenAI
      const res = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
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
        }
      );
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      let gen = (await res.json()).choices[0].message.content.trim();
      gen = gen.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+$/gm, "");

      setItinerary(gen);
      setIsModalOpen(true);

      // save if logged in
      const user = getAuth().currentUser;
      if (user) {
        await addDoc(collection(db, "itineraries"), {
          userId: user.uid,
          itinerary: gen,
          timestamp: new Date(),
          ...formData,
        });
        toast.success("Itinerary generated and saved successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setItinerary("");
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
            className="w-full p-4 border border-teal-300 rounded-lg focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Select a Spot</option>
            {spots.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
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
            className="w-full p-4 border border-teal-300 rounded-lg focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Choose a Budget</option>
            <option value="Low Budget">Low Budget (100–500 PHP per person)</option>
            <option value="Mid Range">Mid Range (500–1 000 PHP per person)</option>
            <option value="Luxury">Luxury (1 000 PHP and up per person)</option>
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
            className="w-full p-4 border border-teal-300 rounded-lg focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Choose Explore Period</option>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Evening</option>
            <option>Whole Day</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:ring-4 focus:ring-teal-500 w-full"
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          <span className="ml-2">{loading ? "Generating..." : "Generate Itinerary"}</span>
        </button>
      </form>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Generated Itinerary"
        className="modal-content bg-white p-8 rounded-lg shadow-2xl max-w-3xl mx-auto mt-20 overflow-y-auto max-h-[80vh]"
        overlayClassName="modal-overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <h3 className="text-3xl font-bold mb-6 text-teal-700">Your AI-Generated Itinerary</h3>
        <div className="prose prose-teal bg-gray-50 p-4 rounded-lg max-h-[60vh] overflow-auto">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a {...props} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" />
              ),
              li: ({ node, ...props }) => <li className="mb-4" {...props} />,
            }}
          >
            {itinerary}
          </ReactMarkdown>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={closeModal}
            className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-500"
          >
            <FontAwesomeIcon icon={faTimes} /> Close
          </button>
          <button
            onClick={() => navigate("/my-itineraries")}
            className="bg-teal-700 text-white py-3 px-6 rounded-lg hover:bg-teal-800 focus:ring-4 focus:ring-teal-500"
          >
            <FontAwesomeIcon icon={faArrowRight} /> View My Itineraries
          </button>
        </div>
      </Modal>

      <ToastContainer />
    </section>
  );
};

export default GenerateItinerary;
