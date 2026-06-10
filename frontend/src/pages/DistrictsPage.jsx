import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function DistrictsPage() {
  const { stateSlug } = useParams();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [purchasedSlugs, setPurchasedSlugs] = useState([]);
  const [stateName, setStateName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/products/state/" + stateSlug);
        const products = res.data?.data || [];
        const map = {};
        products.forEach(p => {
          const slug = p.districtSlug;
          if (!slug) return;
          if (!map[slug]) {
            map[slug] = {
              districtSlug: slug,
              districtName: p.district || p.districtName || slug,
              stateName: p.state || p.stateName || stateSlug,
              freeCount: 0,
              paidCount: 0,
            };
          }
          if (p.free || p.isFree || p.price === 0) map[slug].freeCount++;
          else map[slug].paidCount++;
        });
        const grouped = Object.values(map);
        setDistricts(grouped);
        if (grouped.length > 0) setStateName(grouped[0].stateName);
        try {
          const pRes = await api.get("/api/payment/district/purchased");
          setPurchasedSlugs(pRes.data?.data || []);
        } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [stateSlug]);

  const handleUnlock = async (district) => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token) { toast.error("Please log in to unlock"); navigate("/login"); return; }
    try {
      const orderRes = await api.post("/api/payment/create-order", {
        amountPaise: 9900, districtSlug: district.districtSlug, stateSlug
      });
      const { orderId, amount, currency, keyId } = orderRes.data.data;
      const options = {
        key: keyId, amount, currency,
        name: "Bodhganga",
        description: "Unlock " + district.districtName,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post("/api/payment/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              districtSlug: district.districtSlug, stateSlug
            });
            toast.success("District unlocked!");
            setPurchasedSlugs(prev => [...prev, district.districtSlug]);
          } catch { toast.error("Verification failed. Contact support."); }
        },
        theme: { color: "#f59e0b" },
        modal: { ondismiss: () => toast("Payment cancelled") }
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => toast.error("Payment failed."));
      rzp.open();
    } catch (e) { console.error(e); toast.error("Could not initiate payment."); }
  };

  const filtered = districts.filter(d =>
    d.districtName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-400 animate-pulse">Loading districts...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/states-browse")}
          className="text-gray-400 hover:text-amber-400 mb-6 flex items-center gap-1 text-sm">
          Back to States
        </button>
        <h1 className="text-3xl font-bold text-amber-400 mb-1">{stateName}</h1>
        <p className="text-gray-400 mb-6">Select a district to access study material</p>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search districts..."
          className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 mb-8 focus:outline-none focus:border-amber-500"
        />
        {filtered.length === 0 ? (
          <div className="text-gray-500 text-center py-20">No districts found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(district => {
              const unlocked = purchasedSlugs.includes(district.districtSlug);
              const allFree = district.paidCount === 0;
              return (
                <div key={district.districtSlug} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-base font-bold text-white">{district.districtName}</h2>
                    {allFree
                      ? <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full">Free</span>
                      : unlocked
                        ? <span className="text-xs bg-amber-900 text-amber-400 px-2 py-0.5 rounded-full">Unlocked</span>
                        : <span className="text-xl">🔒</span>
                    }
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 mb-4">
                    {district.freeCount > 0 && <span className="text-green-500">{district.freeCount} free</span>}
                    {district.paidCount > 0 && <span className="text-amber-500">{district.paidCount} paid</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {district.freeCount > 0 && (
                      <button
                        onClick={() => navigate("/states-browse/" + stateSlug + "/" + district.districtSlug + "?tab=free")}
                        className="w-full bg-green-900 hover:bg-green-800 text-green-300 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                        Free Resources
                      </button>
                    )}
                    {district.paidCount > 0 && (
                      unlocked || allFree ? (
                        <button
                          onClick={() => navigate("/states-browse/" + stateSlug + "/" + district.districtSlug + "?tab=paid")}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                          Paid Resources
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlock(district)}
                          className="w-full bg-gray-800 hover:bg-gray-700 border border-amber-500 text-amber-400 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                          Unlock District - Rs.99
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
