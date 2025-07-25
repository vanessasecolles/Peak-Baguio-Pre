import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimes,
  faArrowRight,
  faPrint,
  faThumbsUp,
  faThumbsDown,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { marked } from "marked";

Modal.setAppElement("#root");

// strips any HTML tags (e.g. <p>…</p>)
const stripHtml = str => str.replace(/<[^>]+>/g, "").trim();

// Fisher–Yates shuffle to randomize arrays
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
  const [formData, setFormData] = useState({ spot: "", budget: "", explorePeriod: "" });
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docId, setDocId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  // Fetch spots on mount
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

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchSpotData = async (spotId, explorePeriod) => {
    let times = ["morning", "afternoon", "evening"];
    if (explorePeriod.toLowerCase() !== "whole day") times = [explorePeriod.toLowerCase()];

    const activities = await Promise.all(
      times.map(async t => {
        const snap = await getDocs(
          collection(db, "spots", spotId, "activities", t, "list")
        );
        return { timeOfDay: t, activities: snap.docs.map(d => d.data()) };
      })
    );

    const diningKeys = ["lowBudget", "midRange", "luxury"];
    const dining = await Promise.all(
      diningKeys.map(async key => {
        const snap = await getDocs(
          collection(db, "spots", spotId, "dining", key, "list")
        );
        return { budget: key, diningOptions: snap.docs.map(d => d.data()) };
      })
    );

    return { activities, dining };
  };

  // helper to get title & overview only
  const fetchTitleOverview = async (spotName, explorePeriod) => {
    const system = "You are a travel planner for Baguio City.";
    const user = `
Please reply with EXACTLY valid JSON (no prose) in this format:
{
  "title": "<one-line itinerary title>",
  "overview": "<short summary>"
}
Use the spot name "${spotName}" and period "${explorePeriod}" to tailor them.
`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user.trim() },
        ],
        max_tokens: 200,
        temperature: 0,
      }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
    const text = (await res.json()).choices[0].message.content.trim();
    return JSON.parse(text);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const budgetMap = { "Low Budget": "lowBudget", "Mid Range": "midRange", "Luxury": "luxury" };
      const { spot, budget, explorePeriod } = formData;
      const key = budgetMap[budget];
      const { activities, dining } = await fetchSpotData(spot, explorePeriod);

      // build the bullet lists from your DB,
      // trim name, strip HTML, and join with \n
      const pickActivities = arr =>
        shuffleArray(arr)
          .slice(0, 5)
          .map(a => `- **${a.name.trim()}**: ${stripHtml(a.description) || "No description available."}`)
          .join("\n");

      const formattedDining = shuffleArray(
        dining.find(d => d.budget === key)?.diningOptions || []
      )
        .slice(0, 3)
        .map(opt =>
          `- **${opt.name.trim()}**: ${stripHtml(opt.description) || "No description available."} (${opt.price})`
        )
        .join("\n");

      const slug = spot.toLowerCase().replace(/\s+/g, "-");
      const { title, overview } = await fetchTitleOverview(spot, explorePeriod);

      // assemble final markdown
      let md = `## **Title**\n${title}\n\n## **Overview**\n${overview}\n\n`;
      if (explorePeriod.toLowerCase() === "whole day") {
        md += `## **Morning**\n${pickActivities(activities.find(a => a.timeOfDay === "morning").activities)}\n\n`;
        md += `## **Afternoon**\n${pickActivities(activities.find(a => a.timeOfDay === "afternoon").activities)}\n\n`;
        md += `## **Evening**\n${pickActivities(activities.find(a => a.timeOfDay === "evening").activities)}\n\n`;
      } else {
        const group = activities.find(a => a.timeOfDay === explorePeriod.toLowerCase()).activities;
        md += `## **Activities**\n${pickActivities(group)}\n\n`;
      }
      md += `## **Dining Options**\n${formattedDining}\n\n`;
      md += `[read more about ${spot} by clicking here](/spots/${slug})\nEND`;

      setItinerary(md);
      setIsModalOpen(true);

      // save to Firestore
      const user = getAuth().currentUser;
      if (user) {
        const ref = await addDoc(collection(db, "itineraries"), {
          userId: user.uid,
          itinerary: md,
          timestamp: new Date(),
          ...formData,
        });
        setDocId(ref.id);
        toast.success("Itinerary generated and saved successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const cleanMd = itinerary
      .split("\n")
      .filter(
        line =>
          !line.trim().toLowerCase().startsWith("[read more") &&
          line.trim().toUpperCase() !== "END"
      )
      .join("\n");
    const html = marked(cleanMd);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<html><body>${html}</body></html>`);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    toast.info("Print preview opened!");
  };

  const handleFeedback = async type => {
    if (!docId) return;
    try {
      await updateDoc(doc(db, "itineraries", docId), { feedback: type });
      setFeedback(type);
      toast.success(`Marked ${type}!`);
    } catch {
      toast.error("Feedback failed.");
    }
  };

  const handleDelete = async () => {
    if (!docId) return;
    try {
      await deleteDoc(doc(db, "itineraries", docId));
      toast.success("Itinerary deleted.");
      setIsModalOpen(false);
    } catch {
      toast.error("Delete failed.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setItinerary("");
    setDocId(null);
    setFeedback(null);
  };

  return (
    <section className="p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-4 text-center text-teal-700">Generate Your Itinerary</h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto">
        {/* Spot Select */}
        <div>
          <label htmlFor="spot" className="block mb-2 font-semibold text-teal-800">
            Choose a Spot
          </label>
          <select
            id="spot"
            name="spot"
            value={formData.spot}
            onChange={handleChange}
            className="w-full p-4 border rounded-lg border-teal-300 focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Select a Spot</option>
            {spots.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Budget Select */}
        <div>
          <label htmlFor="budget" className="block mb-2 font-semibold text-teal-800">
            Select Your Budget
          </label>
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full p-4 border rounded-lg border-teal-300 focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Choose a Budget</option>
            <option value="Low Budget">Low Budget (100–500 PHP per person)</option>
            <option value="Mid Range">Mid Range (500–1,000 PHP per person)</option>
            <option value="Luxury">Luxury (1,000 PHP and up per person)</option>
          </select>
        </div>

        {/* Explore Period Select */}
        <div>
          <label htmlFor="explorePeriod" className="block mb-2 font-semibold text-teal-800">
            Explore Period
          </label>
          <select
            id="explorePeriod"
            name="explorePeriod"
            value={formData.explorePeriod}
            onChange={handleChange}
            className="w-full p-4 border rounded-lg border-teal-300 focus:ring-4 focus:ring-teal-500"
            required
          >
            <option value="">Choose Explore Period</option>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Evening</option>
            <option>Whole Day</option>
          </select>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-teal-700 text-white rounded-lg hover:bg-teal-800 focus:ring-4 focus:ring-teal-500"
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          <span className="ml-2">{loading ? "Generating..." : "Generate Itinerary"}</span>
        </button>
      </form>

      {/* Modal */}
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
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children, ...props }) => (
                <a href={href} {...props} className="text-blue-600 hover:underline">
                  {children}
                </a>
              )
            }}
          >
            {itinerary}
          </ReactMarkdown>
        </div>



        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-2 mt-6">
          <button onClick={handlePrint} className="flex items-center space-x-2 py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            <FontAwesomeIcon icon={faPrint} /> <span>Print</span>
          </button>
          <button onClick={() => handleFeedback("liked")} disabled={feedback === "liked"} title={feedback === "liked" ? "Already liked" : "Like"} className={`flex items-center space-x-2 py-2 px-4 text-white rounded-lg ${feedback === "liked" ? "bg-green-800 opacity-50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
            <FontAwesomeIcon icon={faThumbsUp} /> <span>{feedback === "liked" ? "Liked" : "Like"}</span>
          </button>
          <button onClick={() => handleFeedback("disliked")} disabled={feedback === "disliked"} title={feedback === "disliked" ? "Already disliked" : "Dislike"} className={`flex items-center space-x-2 py-2 px-4 text-white rounded-lg ${feedback === "disliked" ? "bg-red-800 opacity-50 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}>
            <FontAwesomeIcon icon={faThumbsDown} /> <span>{feedback === "disliked" ? "Disliked" : "Dislike"}</span>
          </button>
          <button onClick={handleDelete} className="flex items-center space-x-2 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            <FontAwesomeIcon icon={faTrash} /> <span>Delete</span>
          </button>
          <button onClick={closeModal} className="flex items-center space-x-2 py-3 px-6 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            <FontAwesomeIcon icon={faTimes} /> <span>Close</span>
          </button>
          <button onClick={() => navigate("/my-itineraries")} className="flex items-center space-x-2 py-3 px-6 bg-teal-700 text-white rounded-lg hover:bg-teal-800">
            <FontAwesomeIcon icon={faArrowRight} /> <span>View My Itineraries</span>
          </button>
        </div>
      </Modal>

      <ToastContainer />
    </section>
  );
};

export default GenerateItinerary;
