import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const ALL_INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli",
  "Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
];

function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function StatesPage() {
  const [uploadedStates, setUploadedStates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/states/available")
      .then(res => {
        const raw = res;
        let data = [];
        if (Array.isArray(raw)) {
          data = raw;
        } else if (Array.isArray(raw?.data)) {
          data = raw.data;
        }
        console.log("[StatesPage] parsed states:", data.map(s => ({ id: s.id, name: s.name })));
        setUploadedStates(data);
      })
      .catch(err => {
        console.error("[StatesPage] API error:", err);
        setUploadedStates([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const uploadedSlugs = useMemo(
    () => new Set(uploadedStates.map(s => s.id || s.stateSlug || toSlug(s.name || ""))),
    [uploadedStates]
  );

  const filtered = ALL_INDIA_STATES.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-400 mb-2">States and Union Territories</h1>
        <p className="text-gray-400 mb-6">Select your state to explore district-wise study material</p>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search states or UTs..."
          className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 mb-8 focus:outline-none focus:border-amber-500"
        />
        {loading ? (
          <div className="text-amber-400 animate-pulse">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(name => {
              const slug = toSlug(name);
              const uploaded = uploadedSlugs.has(slug);
              const stateData = uploadedStates.find(s =>
                (s.id === slug) || (s.stateSlug === slug) || toSlug(s.name || "") === slug
              );
              return (
                <div
                  key={name}
                  onClick={() => uploaded && navigate("/states-browse/" + slug)}
                  className={"bg-gray-900 border rounded-xl p-5 transition-all duration-200 " +
                    (uploaded
                      ? "border-gray-700 hover:border-amber-500 cursor-pointer hover:bg-gray-800"
                      : "border-gray-800 opacity-60 cursor-default")}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-base font-bold text-white">{name}</h2>
                    {uploaded
                      ? <span className="text-xs bg-amber-900 text-amber-400 px-2 py-0.5 rounded-full">Available</span>
                      : <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">Coming Soon</span>
                    }
                  </div>
                  {uploaded && stateData && (
                    <p className="text-gray-500 text-xs mb-3">
                      {stateData.districts?.length ?? 0} districts · {stateData.notesCount ?? 0} resources
                    </p>
                  )}
                  {!uploaded && (
                    <p className="text-gray-600 text-xs mb-3">Stay tuned — content coming soon</p>
                  )}
                  {uploaded && (
                    <div className="text-amber-400 text-xs font-medium">Explore ?</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
