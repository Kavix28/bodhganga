import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Calendar, CreditCard, Package, ChevronRight, AlertCircle } from 'lucide-react';
import { getMyOrders } from '../services/orderService';

const STATUS_STYLE = {
    SUCCESS: 'bg-emerald-950/40 border-emerald-800 text-emerald-400',
    PAID:    'bg-emerald-950/40 border-emerald-800 text-emerald-400',
    FAILED:  'bg-red-950/40 border-red-900 text-red-400',
    PENDING: 'bg-amber-950/40 border-amber-800 text-amber-400',
    REFUNDED:'bg-slate-800 border-slate-600 text-slate-400',
};

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtRupee = (n) => {
    if (n == null) return '—';
    return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getMyOrders()
            .then(data => setOrders(Array.isArray(data) ? data : []))
            .catch(e => setError(e?.message || 'Failed to load orders'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Receipt className="w-8 h-8 text-gold" />
                    <div>
                        <h1 className="text-2xl font-black text-white font-serif tracking-wide">Order History</h1>
                        <p className="text-slate-400 text-sm">{orders.length} purchase{orders.length !== 1 ? 's' : ''} found</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-950/40 border border-red-900 rounded-xl p-4 flex items-center gap-3 text-sm text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {orders.length === 0 && !error ? (
                    <div className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-16 text-center space-y-6">
                        <Package className="w-16 h-16 text-slate-600 mx-auto" />
                        <h2 className="text-xl font-bold text-white font-serif">No orders yet</h2>
                        <p className="text-slate-400 text-sm">Your purchased courses and materials will appear here.</p>
                        <Link to="/courses"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-emerald-950 font-extrabold text-sm rounded-xl hover:opacity-90 transition-opacity">
                            Browse Courses <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order, i) => {
                            const status = order.status || 'PAID';
                            const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
                            return (
                                <div key={order.id || i}
                                    className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-6 hover:border-gold/20 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Thumbnail + info */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-14 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden">
                                                {order.thumbnail ? (
                                                    <img src={order.thumbnail} alt={order.productName}
                                                        className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-gold mb-1">
                                                    {order.productType || 'Course'}
                                                </p>
                                                <h3 className="font-bold text-white text-sm line-clamp-1">
                                                    {order.productName || 'Study Material'}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                                                        <Calendar className="w-3 h-3" /> {fmtDate(order.purchaseDate)}
                                                    </span>
                                                    {order.paymentId && (
                                                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                                            <CreditCard className="w-3 h-3" /> {order.paymentId.slice(0, 16)}...
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Amount + Status */}
                                        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                                            <span className="text-xl font-black text-gold font-serif">
                                                {fmtRupee(order.amount)}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusStyle}`}>
                                                {status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order ID row */}
                                    {order.orderId && (
                                        <div className="mt-3 pt-3 border-t border-emerald-950/40">
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                Order ID: <span className="text-slate-400">{order.orderId}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
