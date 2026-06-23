import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import imgAndhraPradesh from '../assets/states/andhra-pradesh-image.png';
import imgArunachalPradesh from '../assets/states/arunachal-pradesh-image.png';
import imgAssam from '../assets/states/assam-image.png';
import imgBihar from '../assets/states/bihar-image.png';
import imgChhattisgarh from '../assets/states/chhattisgarh-image.png';
import imgGoa from '../assets/states/goa-image.png';
import imgGujarat from '../assets/states/gujarat-image.png';
import imgHaryana from '../assets/states/haryana-image.png';
import imgHimachalPradesh from '../assets/states/himachal-pradesh-image.png';
import imgJharkhand from '../assets/states/jharkhand-image.png';
import imgKarnataka from '../assets/states/karnataka-image.png';
import imgKerala from '../assets/states/kerala-image.png';
import imgMadhyaPradesh from '../assets/states/madhya-pradesh-image.png';
import imgMaharashtra from '../assets/states/maharashtra-image.png';
import imgManipur from '../assets/states/manipur-image.png';
import imgMeghalaya from '../assets/states/meghalaya-image.png';
import imgMizoram from '../assets/states/mizoram-image.png';
import imgNagaland from '../assets/states/nagaland-image.png';
import imgOdisha from '../assets/states/odisha-image.png';
import imgPunjab from '../assets/states/punjab-image.png';
import imgRajasthan from '../assets/states/rajasthan-image.png';
import imgSikkim from '../assets/states/sikkim-image.png';
import imgTamilNadu from '../assets/states/tamil-nadu-image.png';
import imgTelangana from '../assets/states/telangana-image.png';
import imgTripura from '../assets/states/tripura-image.png';
import imgUttarPradesh from '../assets/states/uttar-pradesh-image.png';
import imgUttarakhand from '../assets/states/uttarakhand-image.png';
import imgWestBengal from '../assets/states/west-bengal-image.png';
import imgDelhi from '../assets/states/delhi-image.png';
import imgJammuKashmir from '../assets/states/jammu-kashmir-image.png';
import imgLadakh from '../assets/states/ladakh-image.png';
import imgChandigarh from '../assets/states/chandigarh-image.png';
import imgPuducherry from '../assets/states/puducherry-image.png';
import imgLakshadweep from '../assets/states/lakshadweep-image.png';
import imgAndaman from '../assets/states/andaman-image.png';

const S3 = "https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/state-images";
const STATE_IMGS = {
  "andhra-pradesh": imgAndhraPradesh,
  "arunachal-pradesh": imgArunachalPradesh,
  "assam": imgAssam,
  "bihar": imgBihar,
  "chhattisgarh": imgChhattisgarh,
  "goa": imgGoa,
  "gujarat": imgGujarat,
  "haryana": imgHaryana,
  "himachal-pradesh": imgHimachalPradesh,
  "jharkhand": imgJharkhand,
  "karnataka": imgKarnataka,
  "kerala": imgKerala,
  "madhya-pradesh": imgMadhyaPradesh,
  "maharashtra": imgMaharashtra,
  "manipur": imgManipur,
  "meghalaya": imgMeghalaya,
  "mizoram": imgMizoram,
  "nagaland": imgNagaland,
  "odisha": imgOdisha,
  "punjab": imgPunjab,
  "rajasthan": imgRajasthan,
  "sikkim": imgSikkim,
  "tamil-nadu": imgTamilNadu,
  "telangana": imgTelangana,
  "tripura": imgTripura,
  "uttar-pradesh": imgUttarPradesh,
  "uttarakhand": imgUttarakhand,
  "west-bengal": imgWestBengal,
  "delhi": imgDelhi,
  "jammu-kashmir": imgJammuKashmir,
  "ladakh": imgLadakh,
  "chandigarh": imgChandigarh,
  "puducherry": imgPuducherry,
  "lakshadweep": imgLakshadweep,
  "andaman-nicobar": imgAndaman,
};
const GRADS = [
  "from-emerald-900 to-teal-800",
  "from-amber-900 to-orange-800",
  "from-blue-900 to-indigo-800",
  "from-purple-900 to-violet-800",
  "from-rose-900 to-pink-800",
  "from-cyan-900 to-sky-800",
  "from-lime-900 to-green-800",
  "from-red-900 to-rose-800",
];

function StateCard({ state, onClick }) {
  const name = state.name || state.stateName || state.id || "";
  const slug = state.id || state.stateSlug || "";
  const [imgErr, setImgErr] = useState(false);
  const grad = GRADS[name.charCodeAt(0) % GRADS.length];

  return (
    <div
      onClick={onClick}
      className="rounded-xl overflow-hidden border border-gray-700 hover:border-amber-500 cursor-pointer hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 group relative"
    >
      {!imgErr ? (
        <img
          src={STATE_IMGS[slug] || `${S3}/${slug}-image.png`}
          alt={name}
          onError={() => setImgErr(true)}
          className="w-full object-contain block"
        />
      ) : (
        <div className={`w-full h-48 bg-gradient-to-br ${grad} flex items-center justify-center`}>
          <span className="text-4xl font-bold text-white/20 font-serif">
            {name.charAt(0)}
          </span>
        </div>
      )}
      <div className="absolute top-2 right-2">
        <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold shadow">
          Available
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-white">{name}</h2>
          <span className="text-amber-400 text-xs group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </div>
        <p className="text-white/60 text-xs mt-0.5">
          {state.notesCount != null ? `${state.notesCount} resources` : ""}
        </p>
      </div>
    </div>
  );
}

export default function StatesPage() {
  const [states, setStates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/states/available")
      .then((res) => {
        // /api/states/available returns List<State> directly (no ApiResponseDTO wrapper)
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        setStates(data);
      })
      .catch((err) => {
        console.error("Failed to load states:", err);
        setError("Failed to load states. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      states.filter((s) => {
        const name = s.name || s.stateName || s.id || "";
        return name.toLowerCase().includes(search.toLowerCase());
      }),
    [states, search]
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="px-4 pt-10 pb-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-400 mb-2">
          States &amp; Union Territories
        </h1>
        <p className="text-gray-400 mb-6">
          Select your state to explore district-wise study material
        </p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search states or UTs..."
          className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="px-4 pb-16 max-w-6xl mx-auto">
        {loading ? (
          <div className="text-amber-400 animate-pulse py-20 text-center">
            Loading states...
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-20">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-center py-20">
            {search
              ? `No states matching "${search}".`
              : "No states available yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((state) => {
              const slug = state.id || state.stateSlug || "";
              return (
                <StateCard
                  key={slug}
                  state={state}
                  onClick={() => navigate("/states-browse/" + slug)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



