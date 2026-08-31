import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { getAuthToken } from "../utils/storage";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function DistrictPage() {
  const { stateSlug } = useParams();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [purchasedSlugs, setPurchasedSlugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stateName, setStateName] = useState("");
  const [unlockingSlug, setUnlockingSlug] = useState(null);

  const fetchPurchasedDistricts = async () => {
    try {
      const pRes = await api.get("/payment/district/purchased");
      const list = Array.isArray(pRes) ? pRes : (pRes?.data || []);
      setPurchasedSlugs(list);
    } catch {
      // Guest user or network error
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/products/state/${stateSlug}`);
        const products = Array.isArray(res) ? res : (res?.data || []);

        const map = {};
        products.forEach(p => {
          const slug = p.districtSlug;
          if (!slug) return;
          if (!map[slug]) {
            map[slug] = {
              districtSlug: slug,
              districtName: p.district || p.districtName || slug,
              stateName: p.state || p.stateName || stateSlug,
              resources: []
            };
          }
          map[slug].resources.push(p);
        });

        const grouped = Object.values(map);
        setDistricts(grouped);
        if (grouped.length > 0) setStateName(grouped[0].stateName);

        await fetchPurchasedDistricts();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [stateSlug]);

  const handleUnlock = async (district) => {
    const token = getAuthToken() || sessionStorage.getItem("admin_jwt");
    if (!token) {
      toast.error("Please log in to unlock this district");
      navigate("/login");
      return;
    }

    if (unlockingSlug) return;
    setUnlockingSlug(district.districtSlug);

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Payment SDK failed to load. Please check your internet connection.");
        setUnlockingSlug(null);
        return;
      }

      const orderRes = await api.post("/payment/create-order", {
        amountPaise: 100,
        districtSlug: district.districtSlug,
        stateSlug
      });

      const orderData = orderRes?.data?.data || orderRes?.data || orderRes;
      const { orderId, amount, currency, keyId } = orderData || {};

      if (!orderId || !keyId) {
        toast.error("Could not create payment order. Please try again.");
        setUnlockingSlug(null);
        return;
      }

      const options = {
        key: keyId,
        amount,
        currency: currency || "INR",
        name: "Bodhganga",
        description: `Unlock ${district.districtName} – ${stateName}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post("/payment/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              districtSlug: district.districtSlug,
              stateSlug
            });
            toast.success("District unlocked! Enjoy your resources 🎉");
            await fetchPurchasedDistricts();
          } catch (verifyErr) {
            console.error(verifyErr);
            toast.error(verifyErr?.message || "Payment verification failed. Contact support.");
          } finally {
            setUnlockingSlug(null);
          }
        },
        theme: { color: "#f59e0b" },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled");
            setUnlockingSlug(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        console.error("Payment failed:", resp);
        toast.error("Payment failed. Please try again.");
        setUnlockingSlug(null);
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Could not initiate payment. Try again.");
      setUnlockingSlug(null);
    }
  };

  const isUnlocked = (district) => {
    const hasResources = district.resources && district.resources.length > 0;
    const allFree = hasResources && district.resources.every(r => r.isFree === true || r.free === true || r.price === 0);
    return allFree || purchasedSlugs.includes(district.districtSlug);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-400 animate-pulse">Loading districts...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/store")}
          className="text-gray-400 hover:text-amber-400 mb-6 flex items-center gap-1 text-sm">
          ← Back to States
        </button>
        <h1 className="text-3xl font-bold text-amber-400 mb-2">{stateName}</h1>
        <p className="text-gray-400 mb-8">Select a district to access study material</p>
        {districts.length === 0 ? (
          <div className="text-gray-500 text-center py-20">No districts found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {districts.map(district => {
              const unlocked = isUnlocked(district);
              const hasResources = district.resources && district.resources.length > 0;
              const allFree = hasResources && district.resources.every(r => r.isFree === true || r.free === true || r.price === 0);
              return (
                <div key={district.districtSlug}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-bold text-white">{district.districtName}</h2>
                    {allFree
                      ? <span className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded-full">Free</span>
                      : unlocked
                        ? <span className="text-xs bg-amber-900 text-amber-400 px-2 py-1 rounded-full">✅ Unlocked</span>
                        : <span className="text-xl">🔒</span>
                    }
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    {district.resources.length} resource{district.resources.length !== 1 ? "s" : ""}
                  </p>
                  {unlocked ? (
                    <button
                      onClick={() => navigate(`/store/${stateSlug}/${district.districtSlug}`)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                      View Resources →
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlock(district)}
                      disabled={unlockingSlug === district.districtSlug}
                      className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-amber-500 text-amber-400 font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                      {unlockingSlug === district.districtSlug ? (
                        <>
                          <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                          Processing...
                        </>
                      ) : (
                        "Unlock District – ₹1"
                      )}
                    </button>
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
