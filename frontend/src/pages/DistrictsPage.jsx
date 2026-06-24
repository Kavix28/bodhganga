import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useCart } from '../context/CartContext';
import { GraduationCap, Mail, MessageCircle, ArrowLeft, ArrowRight, Printer } from 'lucide-react';

function ReceiptModal({ receipt, onClose }) {
  const handlePrint = () => window.print();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" id="receipt-modal">
        {/* Receipt Header */}
        <div className="bg-emerald-800 rounded-t-2xl px-6 py-5 text-center">
          <div className="flex justify-center mb-1"><GraduationCap className="w-8 h-8 text-white" /></div>
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
            View Resources â†’
          </button>
          <button
            onClick={handlePrint}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm">
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
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
          <h2 className="text-white font-bold">Payment Failed &mdash; Contact Support</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">x</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-400 text-sm">
            Your payment for <span className="text-amber-400 font-semibold">{districtName}</span> could not be processed. Please contact our support team.
          </p>
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Email Support</p>
                <a href="mailto:support@bodhganga.in" className="text-amber-400 font-semibold text-sm hover:underline">
                  support@bodhganga.in
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
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
  const { addToCart } = useCart();
  const [districts, setDistricts] = useState([]);
  const [purchasedSlugs, setPurchasedSlugs] = useState([]);
  const [stateName, setStateName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [failedDistrict, setFailedDistrict] = useState(null);
  const [addedDistricts, setAddedDistricts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the authoritative district aggregation endpoint - never miss a district
        const distRes = await api.get("/states/" + stateSlug + "/districts");
        const distList = Array.isArray(distRes) ? distRes : (distRes?.data || []);

        // Also fetch products to compute free/paid counts per district
        const prodRes = await api.get("/products/state/" + stateSlug);
        const products = Array.isArray(prodRes) ? prodRes : (prodRes?.data || []);

        // Build free/paid count map keyed by districtSlug
        const countMap = {};
        products.forEach(p => {
          const slug = p.districtSlug;
          if (!slug) return;
          if (!countMap[slug]) countMap[slug] = { freeCount: 0, paidCount: 0 };
          if (p.free || p.isFree || p.price === 0) countMap[slug].freeCount++;
          else countMap[slug].paidCount++;
        });

        // Merge: district list drives structure, products drive counts
        const merged = distList.map(d => ({
          districtSlug: d.districtSlug,
          districtName: d.district,
          stateName: stateSlug,
          freeCount: countMap[d.districtSlug]?.freeCount ?? 0,
          paidCount: countMap[d.districtSlug]?.paidCount ?? 0,
        }));

        setDistricts(merged);

        // Derive readable state name from first product
        if (products.length > 0) {
          setStateName(products[0].state || products[0].stateName || stateSlug);
        }

        // Fetch purchased slugs (requires auth, fail silently)
        try {
          const pRes = await api.get("/payment/district/purchased");
          const list = Array.isArray(pRes) ? pRes : (pRes?.data || []);
          setPurchasedSlugs(list);
        } catch {}
      } catch (e) {
        console.error("Failed to load districts:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [stateSlug]);

  const handleAddToCart = async (district) => {
    const success = await addToCart({
      productId: "district-bundle-" + district.districtSlug,
      name: district.districtName + " — Complete Notes Bundle",
      state: stateName,
      district: district.districtName,
      stateSlug: stateSlug,
      districtSlug: district.districtSlug,
      price: 99,
      type: "BUNDLE",
      files: []
    });
    if (success) {
      setAddedDistricts(prev => ({ ...prev, [district.districtSlug]: true }));
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
        <button onClick={() => navigate("/state")}
          className="text-gray-400 hover:text-amber-400 mb-6 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to States
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
                          View Paid Resources â†’
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(district)}
                          disabled={addedDistricts[district.districtSlug]}
                          className={`w-full font-semibold py-2 px-4 rounded-lg text-sm transition-colors ${
                            addedDistricts[district.districtSlug] 
                              ? 'bg-green-900/50 text-green-400 border border-green-800 cursor-not-allowed' 
                              : 'bg-gray-800 hover:bg-gray-700 border border-amber-500 text-amber-400'
                          }`}>
                          {addedDistricts[district.districtSlug] ? "✓ Added to Cart" : "🛒 Add to Cart"}
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

