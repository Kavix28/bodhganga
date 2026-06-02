import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowRight, Tag, AlertCircle, ChevronRight, Package } from 'lucide-react';
import { getCart } from '../services/cartService';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const GST_RATE = 0.18;

const Cart = () => {
    const navigate = useNavigate();
    const { removeFromCart, clearCart, refreshCount } = useCart();
    const [cartData, setCartData] = useState({ items: [], count: 0, subtotal: 0 });
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);
    const [coupon, setCoupon] = useState('');

    const loadCart = async () => {
        try {
            setLoading(true);
            const data = await getCart();
            setCartData(data || { items: [], count: 0, subtotal: 0 });
        } catch {
            toast.error('Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCart(); }, []);

    const handleRemove = async (productId) => {
        await removeFromCart(productId);
        loadCart();
    };

    const subtotal = cartData.items.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : 0;
        return sum + price;
    }, 0);
    const gst = subtotal * GST_RATE;
    const total = subtotal + gst;

    const handleCheckout = async () => {
        if (cartData.items.length === 0) return;
        setCheckingOut(true);
        try {
            // For each item, create individual orders (existing flow supports single-item)
            // Multi-item cart: we process first item as primary and unlock rest on webhook
            const firstItem = cartData.items[0];
            const isCoure = firstItem.productType === 'COURSE';

            const orderPayload = {
                amountPaise: Math.round(total * 100),
                productId: isCoure ? undefined : firstItem.productId,
                courseId: isCoure ? firstItem.productId : undefined,
            };

            const orderRes = await api.post('/payment/create-order', orderPayload);
            if (!orderRes?.success) throw new Error(orderRes?.message || 'Order creation failed');

            const { orderId, amount, currency, keyId } = orderRes.data;

            const options = {
                key: keyId,
                amount,
                currency,
                name: 'BodhGanga',
                description: `Cart Checkout (${cartData.items.length} item${cartData.items.length > 1 ? 's' : ''})`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await api.post('/payment/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            courseId: isCoure ? firstItem.productId : undefined,
                            productId: isCoure ? undefined : firstItem.productId,
                        });
                        if (verifyRes?.success) {
                            await clearCart();
                            await refreshCount();
                            toast.success('Payment successful! Your course is unlocked.');
                            navigate('/orders');
                        } else {
                            toast.error('Payment verification failed.');
                        }
                    } catch {
                        toast.error('Payment verification error. Contact support.');
                    }
                },
                prefill: {},
                theme: { color: '#C9A961' },
                modal: { ondismiss: () => setCheckingOut(false) },
            };

            if (!window.Razorpay) {
                toast.error('Payment gateway not loaded. Refresh the page and try again.');
                setCheckingOut(false);
                return;
            }

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error(err?.message || 'Checkout failed. Please try again.');
            setCheckingOut(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <ShoppingCart className="w-8 h-8 text-gold" />
                    <div>
                        <h1 className="text-2xl font-black text-white font-serif tracking-wide">Shopping Cart</h1>
                        <p className="text-slate-400 text-sm">{cartData.count} item{cartData.count !== 1 ? 's' : ''} in your cart</p>
                    </div>
                </div>

                {cartData.items.length === 0 ? (
                    /* Empty state */
                    <div className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-16 text-center space-y-6">
                        <Package className="w-16 h-16 text-slate-600 mx-auto" />
                        <h2 className="text-xl font-bold text-white font-serif">Your cart is empty</h2>
                        <p className="text-slate-400 text-sm">Add courses or study materials to get started on your preparation journey.</p>
                        <Link to="/courses"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-emerald-950 font-extrabold text-sm rounded-xl hover:opacity-90 transition-opacity">
                            Browse Courses <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart items list */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartData.items.map((item) => (
                                <div key={item.productId}
                                    className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-5 flex gap-4 hover:border-gold/20 transition-colors">
                                    {/* Thumbnail */}
                                    <div className="w-24 h-20 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt={item.title}
                                                className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-gold mb-1">
                                                    {item.productType === 'COURSE' ? 'Course' : 'Study Material'}
                                                    {item.category && ` · ${item.category}`}
                                                </p>
                                                <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">
                                                    {item.title || 'Unnamed Item'}
                                                </h3>
                                                {item.instructor && (
                                                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">by {item.instructor}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.productId)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors flex-shrink-0"
                                                title="Remove from cart">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="mt-3">
                                            <span className="text-lg font-black text-gold font-serif">
                                                {typeof item.price === 'number'
                                                    ? `₹${item.price.toLocaleString('en-IN')}`
                                                    : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-4">
                            {/* Coupon */}
                            <div className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-5 space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gold flex items-center gap-2">
                                    <Tag className="w-4 h-4" /> Coupon Code
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={coupon}
                                        onChange={e => setCoupon(e.target.value)}
                                        placeholder="Enter code..."
                                        className="flex-1 bg-slate-950 border border-emerald-950 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-gold/40"
                                    />
                                    <button className="px-4 py-2 bg-slate-800 border border-emerald-950 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors">
                                        Apply
                                    </button>
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-5 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-emerald-950/60 pb-3">
                                    Order Summary
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Subtotal ({cartData.items.length} items)</span>
                                        <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>GST (18%)</span>
                                        <span>₹{Math.round(gst).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between font-black text-white text-base border-t border-emerald-950/60 pt-2 mt-2">
                                        <span>Total</span>
                                        <span className="text-gold font-serif">₹{Math.round(total).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={checkingOut}
                                    className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark text-emerald-950 font-extrabold text-sm uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                    {checkingOut ? (
                                        <><span className="w-4 h-4 border-2 border-emerald-950/40 border-t-emerald-950 rounded-full animate-spin" /> Processing...</>
                                    ) : (
                                        <>Proceed to Payment <ChevronRight className="w-4 h-4" /></>
                                    )}
                                </button>

                                <p className="text-[10px] text-slate-500 text-center font-semibold">
                                    🔒 Secured by Razorpay · 256-bit SSL Encryption
                                </p>
                            </div>

                            <Link to="/courses"
                                className="flex items-center gap-2 text-xs text-slate-400 hover:text-gold transition-colors font-semibold justify-center pt-2">
                                ← Continue Shopping
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
