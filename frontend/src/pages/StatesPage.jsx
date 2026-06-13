import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const S3 = "https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/state-images";
const GRADS = ["from-emerald-900 to-teal-800","from-amber-900 to-orange-800","from-blue-900 to-indigo-800","from-purple-900 to-violet-800","from-rose-900 to-pink-800","from-cyan-900 to-sky-800","from-lime-900 to-green-800","from-red-900 to-rose-800"];
const ALL_INDIA_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli","Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];

function toSlug(name) { return name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""); }

function StateCard({ name, uploaded, stateData, onClick }) {
  const slug = toSlug(name);
  const [imgErr, setImgErr] = useState(false);
  const grad = GRADS[name.charCodeAt(0) % GRADS.length];
  return (
    <div onClick={onClick} className={`rounded-xl overflow-hidden border transition-all duration-200 group ${uploaded ? "border-gray-700 hover:border-amber-500 cursor-pointer hover:shadow-lg hover:shadow-amber-500/10" : "border-gray-800 opacity-50 cursor-default"}`}>
      <div className="relative w-full" style={{paddingBottom:"56.25%"}}>
        {!imgErr
          ? <img src={`${S3}/${slug}.jpg`} alt={name} onError={() => setImgErr(true)} className="absolute inset-0 w-full h-full object-cover" />
          : <div className={`absolute inset-0 bg-gradient-to-br ${grad} flex items-center justify-center`}><span className="text-4xl font-bold text-white/20 font-serif">{name.charAt(0)}</span></div>
        }
        <div className="absolute top-2 right-2">
          {uploaded
            ? <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold shadow">Available</span>
            : <span className="text-xs bg-black/60 text-gray-400 px-2 py-0.5 rounded-full backdrop-blur-sm">Coming Soon</span>
          }
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
      <div className="bg-gray-900 px-4 py-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-white">{name}</h2>
          {uploaded && <span className="text-amber-400 text-xs group-hover:translate-x-0.5 transition-transform">?</span>}
        </div>
        {uploaded && stateData && <p className="text-gray-500 text-xs mt-0.5">{stateData.districts?.length ?? 0} districts · {stateData.notesCount ?? 0} resources</p>}
        {!uploaded && <p className="text-gray-600 text-xs mt-0.5">?? Stay tuned</p>}
      </div>
    </div>
  );
}

export default function StatesPage() {
  const [uploadedStates, setUploadedStates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/states/available")
      .then(res => { const data = Array.isArray(res) ? res : (res?.data || []); setUploadedStates(data); })
      .catch(() => setUploadedStates([]))
      .finally(() => setLoading(false));
  }, []);

  const uploadedSlugs = useMemo(() => new Set(uploadedStates.map(s => s.id || s.stateSlug || toSlug(s.name || ""))), [uploadedStates]);
  const filtered = ALL_INDIA_STATES.filter(n => n.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="px-4 pt-10 pb-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-400 mb-2">States & Union Territories</h1>
        <p className="text-gray-400 mb-6">Select your state to explore district-wise study material</p>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="?? Search states or UTs..." className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500" />
      </div>
      <div className="px-4 pb-16 max-w-6xl mx-auto">
        {loading ? (
          <div className="text-amber-400 animate-pulse py-20 text-center">Loading states...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(name => {
              const slug = toSlug(name);
              const uploaded = uploadedSlugs.has(slug);
              const stateData = uploadedStates.find(s => s.id === slug || s.stateSlug === slug || toSlug(s.name||"") === slug);
              return <StateCard key={name} name={name} uploaded={uploaded} stateData={stateData} onClick={() => uploaded && navigate("/states-browse/"+slug)} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
