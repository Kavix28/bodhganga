import { useParams, useLocation, useNavigate } from "react-router-dom";
import StateNavbar from "../components/states/StateNavbar";

export default function StateSectionPage() {
  const { stateSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const section = location.pathname.split("/").pop();

  const titles = {
    history: "History",
    "heritage-sites-monuments": "Heritage Sites & Monuments",
    geography: "Geography",
    "art-and-culture": "Art & Culture",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 py-8">

          <button
            onClick={() => navigate("/state")}
            className="text-gray-500 hover:text-amber-400 text-sm mb-4"
          >
            ← Back to All States
          </button>

          <h1 className="text-3xl font-extrabold text-amber-400 capitalize">
            {stateSlug.replace(/-/g, " ")}
          </h1>

          <p className="text-gray-400 mt-2">
            Explore {titles[section]} of {stateSlug.replace(/-/g, " ")}
          </p>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        <StateNavbar />

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">

          <h2 className="text-2xl font-bold text-amber-400 mb-4">
            {titles[section]}
          </h2>

          <p className="text-gray-300">
            This page will contain the {titles[section]} content of{" "}
            <span className="capitalize">{stateSlug.replace(/-/g, " ")}</span>.
          </p>

        </div>

      </div>
    </div>
  );
}