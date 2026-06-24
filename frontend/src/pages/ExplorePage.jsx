import { useEffect, useState } from "react";
import { Map, MapPin, BookOpen, Gift, Gem, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const ALL_STATES = [
  { name: "Andhra Pradesh", slug: "andhra-pradesh" },
  { name: "Arunachal Pradesh", slug: "arunachal-pradesh" },
  { name: "Assam", slug: "assam" },
  { name: "Bihar", slug: "bihar" },
  { name: "Chhattisgarh", slug: "chhattisgarh" },
  { name: "Goa", slug: "goa" },
  { name: "Gujarat", slug: "gujarat" },
  { name: "Haryana", slug: "haryana" },
  { name: "Himachal Pradesh", slug: "himachal-pradesh" },
  { name: "Jharkhand", slug: "jharkhand" },
  { name: "Karnataka", slug: "karnataka" },
  { name: "Kerala", slug: "kerala" },
  { name: "Madhya Pradesh", slug: "madhya-pradesh" },
  { name: "Maharashtra", slug: "maharashtra" },
  { name: "Manipur", slug: "manipur" },
  { name: "Meghalaya", slug: "meghalaya" },
  { name: "Mizoram", slug: "mizoram" },
  { name: "Nagaland", slug: "nagaland" },
  { name: "Odisha", slug: "odisha" },
  { name: "Punjab", slug: "punjab" },
  { name: "Rajasthan", slug: "rajasthan" },
  { name: "Sikkim", slug: "sikkim" },
  { name: "Tamil Nadu", slug: "tamil-nadu" },
  { name: "Telangana", slug: "telangana" },
  { name: "Tripura", slug: "tripura" },
  { name: "Uttar Pradesh", slug: "uttar-pradesh" },
  { name: "Uttarakhand", slug: "uttarakhand" },
  { name: "West Bengal", slug: "west-bengal" },
  { name: "Delhi", slug: "delhi" },
  { name: "Jammu & Kashmir", slug: "jammu-and-kashmir" },
  { name: "Ladakh", slug: "ladakh" },
  { name: "Puducherry", slug: "puducherry" },
  { name: "Chandigarh", slug: "chandigarh" },
  { name: "Lakshadweep", slug: "lakshadweep" },
  { name: "Andaman & Nicobar Islands", slug: "andaman-and-nicobar-islands" },
];

const GRADIENTS = [
  ["#1a4731", "#0f5132"],
  ["#1e3a5f", "#1d4ed8"],
  ["#4a1942", "#7e22ce"],
  ["#5c2800", "#c2410c"],
  ["#1a3a1a", "#15803d"],
  ["#3b1f00", "#b45309"],
  ["#1a1a3e", "#4338ca"],
  ["#2d1b69", "#6d28d9"],
];

const IN_PROGRESS = [
  "Himachal Pradesh / Chamba",
  "Andhra Pradesh / Alluri Sitharama Raju",
];

function getGradient(name) {
  const idx = name.charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function CountUp({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{val}</span>;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ states: 0, districts: 0, total: 0, free: 0, paid: 0 });
  const [activeStates, setActiveStates] = useState({});
  const [districtCounts, setDistrictCounts] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/products", {
          params: { importedFromDrive: true, published: true, size: 1000 },
        });
        const products = Array.isArray(res) ? res : (res?.data?.content || res?.data || []);
        const stateSet = new Set();
        const districtSet = new Set();
        const dCounts = {};
        let free = 0, paid = 0;
        products.forEach((p) => {
          const ss = p.stateSlug || p.state?.toLowerCase().replace(/\s+/g, "-");
          const ds = p.districtSlug || p.district?.toLowerCase().replace(/\s+/g, "-");
          if (ss) { stateSet.add(ss); dCounts[ss] = (dCounts[ss] || new Set()); if (ds) dCounts[ss].add(ds); }
          if (ds) districtSet.add(ds);
          if (p.free) free++; else paid++;
        });
        const activeMap = {};
        stateSet.forEach(s => activeMap[s] = true);
        setActiveStates(activeMap);
        const dcFinal = {};
        Object.keys(dCounts).forEach(s => dcFinal[s] = dCounts[s].size);
        setDistrictCounts(dcFinal);
        setStats({ states: stateSet.size, districts: districtSet.size, total: products.length, free, paid });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeList = ALL_STATES.filter(s => activeStates[s.slug]);
  const plannedList = ALL_STATES.filter(s => !activeStates[s.slug]);

  const STATS = [
    { label: "States Covered", value: stats.states, icon: <Map className="w-6 h-6 text-amber-400 mx-auto" />, color: "text-amber-400" },
    { label: "Districts Live", value: stats.districts, icon: <MapPin className="w-6 h-6 text-blue-400 mx-auto" />, color: "text-blue-400" },
    { label: "Study Materials", value: stats.total, icon: <BookOpen className="w-6 h-6 text-green-400 mx-auto" />, color: "text-green-400" },
    { label: "Free Resources", value: stats.free, icon: <Gift className="w-6 h-6 text-emerald-400 mx-auto" />, color: "text-emerald-400" },
    { label: "Paid Resources", value: stats.paid, icon: <Gem className="w-6 h-6 text-purple-400 mx-auto" />, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">
            <span>🇮🇳</span>
            <span>BodhGanga Academy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Explore BodhGanga</h1>
          <p className="text-gray-400 text-sm max-w-xl">Live stats, coverage map and roadmap for district-wise study materials across India.</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="mb-1">{s.icon}</div>
              <div className={`text-2xl font-extrabold ${s.color}`}>
                {loading ? "—" : <CountUp target={s.value} />}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* States Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
          Active States
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {activeList.map((s) => {
                const [g1, g2] = getGradient(s.name);
                return (
                  <div key={s.slug} onClick={() => navigate(`/state/${s.slug}/districts`)}
                    className="rounded-xl border border-amber-500/30 cursor-pointer hover:border-amber-400/60 hover:-translate-y-0.5 transition-all overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">LIVE</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{s.name}</h3>
                      <p className="text-[10px] text-gray-300 mt-1">{districtCounts[s.slug] || 0} district{districtCounts[s.slug] !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <h2 className="text-xs font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-700 inline-block" />
              Coming Soon
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {plannedList.map((s) => {
                const [g1, g2] = getGradient(s.name);
                return (
                  <div key={s.slug} className="rounded-xl border border-gray-800 opacity-40 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-2 h-2 rounded-full bg-gray-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">SOON</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{s.name}</h3>
                      <p className="text-[10px] text-gray-400 mt-1">Coming soon</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Roadmap */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <h2 className="text-xs font-black uppercase tracking-widest text-white mb-6">Progress Roadmap</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Completed */}
          <div className="bg-gray-900 border border-green-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✅</span>
              <h3 className="text-xs font-black uppercase tracking-widest text-green-400">Completed</h3>
            </div>
            <div className="space-y-2">
              {activeList.length === 0 && <p className="text-gray-600 text-xs">None yet</p>}
              {activeList.map(s => (
                <div key={s.slug} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  {s.name} <span className="text-gray-600 text-xs">({districtCounts[s.slug] || 0} districts)</span>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🔄</span>
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">In Progress</h3>
            </div>
            <div className="space-y-2">
              {IN_PROGRESS.map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Planned */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📋</span>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Planned</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {plannedList.map(s => (
                <div key={s.slug} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0" />
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}