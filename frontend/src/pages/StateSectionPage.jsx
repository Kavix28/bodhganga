import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import StateSectionTabs from "../components/states/StateSectionTabs";
import StateNavbar from "../components/states/StateNavbar";

export default function StateSectionPage() {
  const { stateSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sectionRaw = location.pathname.split("/").pop();
  const sectionMap = {
    history: "history",
    "heritage-monuments": "heritage-monuments",
    "heritage-sites-monuments": "heritage-monuments",
    monuments: "heritage-monuments",
    geography: "geography",
    "art-culture": "art-culture",
    "art-and-culture": "art-culture",
  };
  const section = sectionMap[sectionRaw] || "history";

  const titles = {
    history: "History",
    "heritage-monuments": "Heritage Sites & Monuments",
    geography: "Geography",
    "art-culture": "Art & Culture",
  };

  const [districts, setDistricts] = useState([]);
  const [products, setProducts] = useState([]);
  const [stateName, setStateName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const distRes = await api.get(`/states/${stateSlug}/districts`);
        const distList = Array.isArray(distRes) ? distRes : (distRes?.data || []);

        const prodRes = await api.get(`/products/state/${stateSlug}`);
        const prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.data || []);
        setProducts(prodList);

        if (prodList.length > 0) {
          setStateName(prodList[0].state || prodList[0].stateName || stateSlug);
        } else {
          const formatted = stateSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          setStateName(formatted);
        }

        const NON_DISTRICT_KEYS = ["general", "state-images", "stateimages", "images", "state images"];
        const cleanDistList = distList.filter((d) => {
          const normSlug = String(d.districtSlug || "").toLowerCase().trim();
          const normName = String(d.district || "").toLowerCase().trim();
          return !NON_DISTRICT_KEYS.includes(normSlug) && !NON_DISTRICT_KEYS.includes(normName);
        });

        setDistricts(cleanDistList.sort((a, b) => a.district.localeCompare(b.district)));
      } catch (err) {
        console.error("Failed to load section data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [stateSlug]);

  const isSectionAvailableForDistrict = (districtSlug) => {
    const distProds = products.filter((p) => p.districtSlug === districtSlug && (p.isFree || p.free || p.price === 0));
    return distProds.some((p) => {
      const cat = String(p.category || "").toLowerCase();
      const title = String(p.title || p.displayTitle || "").toLowerCase();
      const desc = String(p.description || "").toLowerCase();
      const combined = `${cat} ${title} ${desc}`;

      if (section === "heritage-monuments") {
        return combined.includes("heritage") || combined.includes("monument") || combined.includes("landmark");
      }
      if (section === "geography") {
        return combined.includes("geography") || combined.includes("geographic") || combined.includes("demography") || combined.includes("map");
      }
      if (section === "art-culture") {
        return combined.includes("art") || combined.includes("culture") || combined.includes("tradition") || combined.includes("festival");
      }
      if (section === "history") {
        const isOther = (combined.includes("heritage") || combined.includes("monument") || combined.includes("landmark")) ||
                        (combined.includes("geography") || combined.includes("geographic") || combined.includes("demography") || combined.includes("map")) ||
                        (combined.includes("art") || combined.includes("culture") || combined.includes("tradition") || combined.includes("festival"));
        return !isOther || combined.includes("history") || combined.includes("historical") || combined.includes("notes");
      }
      return true;
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(`/state/${stateSlug}/districts`)}
            className="text-gray-500 hover:text-amber-400 text-sm mb-4 flex items-center gap-1 transition-colors"
          >
            ← Back to Districts
          </button>
          <h1 className="text-3xl font-extrabold text-amber-400 capitalize">
            {stateName || stateSlug.replace(/-/g, " ")} — {titles[section] || section}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Select a district to explore {titles[section] || section} study materials
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <StateNavbar />

        <StateSectionTabs stateSlug={stateSlug} activeSection={section} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-amber-400 text-sm font-semibold">Loading districts…</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {districts.length} Districts in {stateName}
              </h2>
              <span className="text-xs text-gray-500">
                Click district to view {titles[section]}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {districts.map((d) => {
                const isAvailable = isSectionAvailableForDistrict(d.districtSlug);
                return (
                  <div
                    key={d.districtSlug}
                    onClick={() => navigate(`/state/${stateSlug}/district/${d.districtSlug}/products?section=${section}`)}
                    className="bg-gray-900 border border-gray-800 hover:border-amber-500 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-sm font-bold text-white leading-snug">{d.district}</h3>
                      <span className="text-amber-400 text-base group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Status:</span>
                      {isAvailable ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Available
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300/80 border border-amber-500/20">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}