import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function ReceiptModal({ receipt, onClose }) {
  const handlePrint = () => window.print();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" id="receipt-modal">
        {/* Receipt Header */}
        <div className="bg-emerald-800 rounded-t-2xl px-6 py-5 text-center">
          <div className="text-2xl mb-1">🎓</div>
          <h2 className="text-white font-bold text-lg">Payment Successful!</h2>
          <p className="text-emerald-200 text-xs mt-1">Bodhganga Academy</p>
        </div>

        {/* Receipt Body */}
        <div className="px-6 py-5 space-y-3">
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-emerald-800">₹1</span>
            <p className="text-gray-500 text-xs mt-1">District Study Pack Unlocked</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">District</span>
              <span className="font-semibold text-gray-800">{receipt.districtName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">State</span>
              <span className="font-semibold text-gray-800">{receipt.stateName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment ID</span>
              <span className="font-mono text-xs text-gray-700 truncate max-w-[160px]">{receipt.paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono text-xs text-gray-700 truncate max-w-[160px]">{receipt.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold text-gray-800">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-bold text-emerald-700">₹1.00</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
            View Resources →
          </button>
          <button
            onClick={handlePrint}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm">
            🖨 Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactSupportModal({ onClose, districtName }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-white font-bold">Payment Failed — Contact Support</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-400 text-sm">
            Your payment for <span className="text-amber-400 font-semibold">{districtName}</span> could not be processed. Please contact our support team.
          </p>
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">📧</span>
              <div>
                <p className="text-xs text-gray-500">Email Support</p>
                <a href="mailto:support@bodhganga.in" className="text-amber-400 font-semibold text-sm hover:underline">
                  support@bodhganga.in
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <div>
                <p className="text-xs text-gray-500">WhatsApp Support</p>
                <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer"
                  className="text-amber-400 font-semibold text-sm hover:underline">
                  +91 99999 99999
                </a>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Please share your phone number and the district name when contacting support. We'll resolve it within 24 hours.
          </p>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DistrictsPage() {
  const { stateSlug } = useParams();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [purchasedSlugs, setPurchasedSlugs] = useState([]);
  const [stateName, setStateName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [failedDistrict, setFailedDistrict] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/products/state/" + stateSlug);
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
          const pRes = await api.get("/payment/district/purchased");
          const list = Array.isArray(pRes) ? pRes : (pRes?.data || []);
          setPurchasedSlugs(list);
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
    const token = JSON.parse(localStorage.getItem("auth_token"));
    if (!token) { toast.error("Please log in to unlock"); navigate("/login"); return; }
    try {
      const orderRes = await api.post("/payment/create-order", {
        amountPaise: 100, districtSlug: district.districtSlug, stateSlug
      });
      const { orderId, amount, currency, keyId } = orderRes?.data || orderRes;
      const options = {
        key: keyId, amount, currency,
        name: "Bodhganga Academy",
        description: "Unlock " + district.districtName + " District Pack",
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/payment/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              districtSlug: district.districtSlug, stateSlug
            });
            if (verifyRes?.success) {
              setPurchasedSlugs(prev => [...prev, district.districtSlug]);
              setReceipt({
                districtName: district.districtName,
                stateName: district.stateName || stateName,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
            } else {
              toast.error("Payment verification failed. Contact support.");
            }
          } catch {
            setFailedDistrict(district);
          }
        },
        prefill: {},
        theme: { color: "#065f46" },
        modal: {
          ondismiss: () => toast("Payment cancelled")
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => setFailedDistrict(district));
      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error("Could not initiate payment. Try again.");
    }
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

      {receipt && (
        <ReceiptModal
          receipt={receipt}
          onClose={() => {
            setReceipt(null);
            navigate("/states-browse/" + stateSlug + "/" + receipt.districtName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "?tab=paid");
          }}
        />
      )}

      {failedDistrict && (
        <ContactSupportModal
          districtName={failedDistrict.districtName}
          onClose={() => setFailedDistrict(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate("/states-browse")}
          className="text-gray-400 hover:text-amber-400 mb-6 flex items-center gap-1 text-sm">
          ← Back to States
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
                        : <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-bold">Locked</span>
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
                          View Paid Resources →
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlock(district)}
                          className="w-full bg-gray-800 hover:bg-gray-700 border border-amber-500 text-amber-400 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                          Unlock District — ₹1
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
