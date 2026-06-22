import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// Complete canonical list of all 28 States + 8 UTs of India
const ALL_REGIONS = [
  // — 28 States —
  { name: "Andhra Pradesh",           slug: "andhra-pradesh",            type: "STATE", region: "South" },
  { name: "Arunachal Pradesh",        slug: "arunachal-pradesh",         type: "STATE", region: "North-East" },
  { name: "Assam",                    slug: "assam",                     type: "STATE", region: "North-East" },
  { name: "Bihar",                    slug: "bihar",                     type: "STATE", region: "East" },
  { name: "Chhattisgarh",             slug: "chhattisgarh",              type: "STATE", region: "Central" },
  { name: "Goa",                      slug: "goa",                       type: "STATE", region: "West" },
  { name: "Gujarat",                  slug: "gujarat",                   type: "STATE", region: "West" },
  { name: "Haryana",                  slug: "haryana",                   type: "STATE", region: "North" },
  { name: "Himachal Pradesh",         slug: "himachal-pradesh",          type: "STATE", region: "North" },
  { name: "Jharkhand",                slug: "jharkhand",                 type: "STATE", region: "East" },
  { name: "Karnataka",                slug: "karnataka",                 type: "STATE", region: "South" },
  { name: "Kerala",                   slug: "kerala",                    type: "STATE", region: "South" },
  { name: "Madhya Pradesh",           slug: "madhya-pradesh",            type: "STATE", region: "Central" },
  { name: "Maharashtra",              slug: "maharashtra",               type: "STATE", region: "West" },
  { name: "Manipur",                  slug: "manipur",                   type: "STATE", region: "North-East" },
  { name: "Meghalaya",                slug: "meghalaya",                 type: "STATE", region: "North-East" },
  { name: "Mizoram",                  slug: "mizoram",                   type: "STATE", region: "North-East" },
  { name: "Nagaland",                 slug: "nagaland",                  type: "STATE", region: "North-East" },
  { name: "Odisha",                   slug: "odisha",                    type: "STATE", region: "East" },
  { name: "Punjab",                   slug: "punjab",                    type: "STATE", region: "North" },
  { name: "Rajasthan",                slug: "rajasthan",                 type: "STATE", region: "North" },
  { name: "Sikkim",                   slug: "sikkim",                    type: "STATE", region: "North-East" },
  { name: "Tamil Nadu",               slug: "tamil-nadu",                type: "STATE", region: "South" },
  { name: "Telangana",                slug: "telangana",                 type: "STATE", region: "South" },
  { name: "Tripura",                  slug: "tripura",                   type: "STATE", region: "North-East" },
  { name: "Uttar Pradesh",            slug: "uttar-pradesh",             type: "STATE", region: "North" },
  { name: "Uttarakhand",              slug: "uttarakhand",               type: "STATE", region: "North" },
  { name: "West Bengal",              slug: "west-bengal",               type: "STATE", region: "East" },
  // — 8 Union Territories —
  { name: "Delhi",                    slug: "delhi",                     type: "UT",    region: "North" },
  { name: "Jammu & Kashmir",          slug: "jammu-and-kashmir",         type: "UT",    region: "North" },
  { name: "Ladakh",                   slug: "ladakh",                    type: "UT",    region: "North" },
  { name: "Puducherry",               slug: "puducherry",                type: "UT",    region: "South" },
  { name: "Chandigarh",               slug: "chandigarh",                type: "UT",    region: "North" },
  { name: "Lakshadweep",              slug: "lakshadweep",               type: "UT",    region: "South" },
  { name: "Andaman & Nicobar Islands",slug: "andaman-and-nicobar-islands",type: "UT",  region: "East" },
];

// A deterministic gradient per state initial letter
const GRADIENTS = [
  ["#1a4731", "#0f5132"],  // deep emerald
  ["#1e3a5f", "#1d4ed8"],  // royal blue
  ["#4a1942", "#7e22ce"],  // deep purple
  ["#5c2800", "#c2410c"],  // burnt orange
  ["#1a3a1a", "#15803d"],  // forest green
  ["#3b1f00", "#b45309"],  // amber brown
  ["#1a1a3e", "#4338ca"],  // indigo
  ["#2d1b69", "#6d28d9"],  // violet
];

const S3_BASE = "https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/state-covers";

const STATE_IMAGE_MAP = {
  "andhra-pradesh":            "AndhraPradesh-image.png",
  "arunachal-pradesh":         "Arunahcal Pradesh-image.png",
  "assam":                     "Assam-image.png",
  "bihar":                     "Bihar-image.png",
  "chhattisgarh":              "Chhattisgarh.png",
  "goa":                       "Goa-image.png",
  "gujarat":                   "Gujarat-image.png",
  "haryana":                   "Haryana-image.png",
  "himachal-pradesh":          "Himachal Pradesh-image.png",
  "jharkhand":                 "Jharkhand-image.png",
  "karnataka":                 "Karnataka-image.png",
  "kerala":                    "Kerala-image.png",
  "madhya-pradesh":            "Madhya Pradesh-image.png",
  "maharashtra":               "Maharashtra-image.png",
  "manipur":                   "Manipur-image.png",
  "meghalaya":                 "Meghalaya-image.png",
  "mizoram":                   "Mizoram-image.png",
  "nagaland":                  "Nagaland-image.png",
  "odisha":                    "Odisha-image.png",
  "punjab":                    "Punjab-image.png",
  "rajasthan":                 "Rajasthan-image.png",
  "sikkim":                    "Sikkim-image.png",
  "tamil-nadu":                "Tamil Nadu-image.png",
  "telangana":                 "Telanagana-image.png",
  "tripura":                   "Tripura-image.png",
  "uttar-pradesh":             "Uttar Pradesh-image.png",
  "uttarakhand":               "Uttarakhand-image.png",
  "west-bengal":               "West Bengal-image.png",
  "delhi":                     "Delhi-image.png",
  "jammu-and-kashmir":         "Jammu & Kashmir-image.png",
  "ladakh":                    "Ladakh-image.png",
  "puducherry":                "Puducherry-image.png",
  "chandigarh":                "Chandigarh-image.png",
  "lakshadweep":               "Lakshadweep-image.png",
  "andaman-and-nicobar-islands": null,
};

function getStateImage(slug) {
  const file = STATE_IMAGE_MAP[slug];
  if (!file) return null;
  return `${S3_BASE}/${encodeURIComponent(file)}`;
}

function getGradient(name) {
  const idx = name.charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

// Region emoji flags
const REGION_EMOJIS = {
  North: "🏔️", South: "🌴", East: "🌊", West: "🏜️",
  Central: "🌾", "North-East": "🍃",
};

function StateCard({ region, isActive, productCount, onClick }) {
  const [g1, g2] = getGradient(region.name);

  return (
    <div
      onClick={isActive ? onClick : undefined}
      title={isActive ? `View ${region.name} districts` : "Content coming soon"}
      className={[
        "relative rounded-2xl overflow-hidden border transition-all duration-200 select-none",
        isActive
          ? "border-gray-700 hover:border-amber-500 cursor-pointer hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-0.5"
          : "border-gray-800 cursor-not-allowed opacity-60",
      ].join(" ")}
    >
      {/* Card background */}
      <div
        className="h-28 flex items-center justify-center relative"
        style={getStateImage(region.slug) ? { backgroundImage: `url(${getStateImage(region.slug)})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: `linear-gradient(135deg, ${g1}, ${g2})` }}
      >
        {/* Big initial watermark */}
        <span className="absolute text-7xl font-black text-white/10 select-none pointer-events-none">
          {region.name.charAt(0)}
        </span>

        {/* Region emoji + type badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="text-base" title={region.region}>
            {REGION_EMOJIS[region.region] || "🗺️"}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/70 bg-black/30 px-1.5 py-0.5 rounded-full">
            {region.type}
          </span>
        </div>

        {/* Active / Coming Soon badge */}
        <div className="absolute top-3 right-3">
          {isActive ? (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded-full shadow">
              Active
            </span>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
          )}
        </div>

        {/* Coming-soon ribbon overlay */}
        {!isActive && (
          <div className="absolute inset-0 bg-gray-950/40 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-400 bg-gray-900/80 px-3 py-1 rounded-full border border-gray-700">
              🕐 Coming Soon
            </span>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white leading-tight">{region.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isActive
              ? productCount > 0
                ? `${productCount} resource${productCount !== 1 ? "s" : ""}`
                : "Resources available"
              : "Content being prepared"}
          </p>
        </div>
        {isActive && (
          <span className="text-amber-400 text-lg flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        )}
      </div>
    </div>
  );
}

const REGIONS_FILTER = ["All", "North", "South", "East", "West", "Central", "North-East"];
const TYPE_FILTERS = [
  { id: "all", label: "All Regions (35)" },
  { id: "STATE", label: "28 States" },
  { id: "UT", label: "7 UTs" },
];

export default function AllStatesPage() {
  const navigate = useNavigate();
  const [activeSlugSet, setActiveSlugSet] = useState(new Set());
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("All");

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch all published drive products to derive active states
        const res = await api.get("/products", {
          params: { importedFromDrive: true, published: true, size: 1000 },
        });
        const products = Array.isArray(res) ? res : (res?.data?.content || res?.data || []);

        // Build a Set of active slugs and a count map
        const slugSet = new Set();
        const counts = {};
        products.forEach((p) => {
          const slug = p.stateSlug || p.state?.toLowerCase().replace(/\s+/g, "-");
          if (!slug) return;
          slugSet.add(slug);
          counts[slug] = (counts[slug] || 0) + 1;
        });
        setActiveSlugSet(slugSet);
        setProductCounts(counts);
      } catch (err) {
        console.error("Failed to load active states:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return ALL_REGIONS.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (regionFilter !== "All" && r.region !== regionFilter) return false;
      if (search.trim()) {
        return r.name.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [search, typeFilter, regionFilter]);

  const activeCount = filtered.filter((r) => activeSlugSet.has(r.slug)).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── HEADER ── */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">
            <span>🇮🇳</span>
            <span>BodhGanga Academy · NDDE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
            States & Union Territories
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Select your state to explore district-wise study material — notes, maps, MCQs
            and more curated for every major PSC examination.
          </p>

          {/* Stats row */}
          {!loading && (
            <div className="flex gap-6 mt-5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <span>
                <span className="text-amber-400 text-base font-extrabold">{activeSlugSet.size}</span>{" "}
                Active States
              </span>
              <span>
                <span className="text-gray-400 text-base font-extrabold">
                  {ALL_REGIONS.length - activeSlugSet.size}
                </span>{" "}
                Coming Soon
              </span>
              <span>
                <span className="text-white text-base font-extrabold">{ALL_REGIONS.length}</span>{" "}
                Total
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── FILTERS + SEARCH ── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4 space-y-4">
        {/* Type tabs */}
        <div className="flex gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800 self-start inline-flex">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={[
                "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                typeFilter === t.id
                  ? "bg-amber-500 text-black shadow"
                  : "text-gray-400 hover:text-white",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Region filters row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search states or UTs..."
            className="w-full sm:max-w-xs bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Zone:</span>
            {REGIONS_FILTER.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={[
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  regionFilter === r
                    ? "bg-gray-700 text-amber-400 border border-amber-500/50"
                    : "bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-600 hover:text-gray-300",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Result summary */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
          Showing {filtered.length} regions · {activeCount} active
        </p>
      </div>

      {/* ── GRID ── */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-gray-900 border border-gray-800 animate-pulse"
              >
                <div className="h-28 bg-gray-800 rounded-t-2xl" />
                <div className="px-4 py-3 space-y-2">
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                  <div className="h-2 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-bold">No states match &quot;{search}&quot;</p>
            <button
              onClick={() => { setSearch(""); setRegionFilter("All"); setTypeFilter("all"); }}
              className="mt-4 text-amber-400 text-sm underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Active states first */}
            {filtered.some((r) => activeSlugSet.has(r.slug)) && (
              <div className="mb-10">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                  Active — Content Available
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered
                    .filter((r) => activeSlugSet.has(r.slug))
                    .map((r) => (
                      <StateCard
                        key={r.slug}
                        region={r}
                        isActive={true}
                        productCount={productCounts[r.slug] || 0}
                        onClick={() => navigate(`/state/${r.slug}/districts`)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Coming Soon states */}
            {filtered.some((r) => !activeSlugSet.has(r.slug)) && (
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-700 inline-block" />
                  Coming Soon — Being Prepared
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered
                    .filter((r) => !activeSlugSet.has(r.slug))
                    .map((r) => (
                      <StateCard
                        key={r.slug}
                        region={r}
                        isActive={false}
                        productCount={0}
                        onClick={null}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
