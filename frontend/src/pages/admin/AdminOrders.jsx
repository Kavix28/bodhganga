import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, RotateCcw, Download, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAdminOrders, refundOrder } from '../../services/adminService';
import toast from 'react-hot-toast';

const STATUS_TABS = ['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'];

const STATUS_STYLE = {
    SUCCESS:  'bg-emerald-950/40 border-emerald-800 text-emerald-400',
    PAID:     'bg-emerald-950/40 border-emerald-800 text-emerald-400',
    FAILED:   'bg-red-950/40 border-red-900 text-red-400',
    PENDING:  'bg-amber-950/40 border-amber-800 text-amber-400',
    REFUNDED: 'bg-slate-800 border-slate-600 text-slate-300',
};

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtRupee = (n) => {
    if (n == null) return '—';
    return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('ALL');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refunding, setRefunding] = useState(null);

    const PAGE_SIZE = 25;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminOrders(page, PAGE_SIZE, status, search);
            setOrders(data.orders || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch (e) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [page, status, search]);

    useEffect(() => { load(); }, [load]);

    const handleRefund = async (orderId) => {
        if (!window.confirm(`Issue refund for order ${orderId}?`)) return;
        setRefunding(orderId);
        try {
            await refundOrder(orderId);
            toast.success('Refund initiated successfully');
            load();
        } catch (e) {
            toast.error(e?.message || 'Refund failed');
        } finally {
            setRefunding(null);
        }
    };

    const handleExportCSV = () => {
        if (orders.length === 0) return;
        const headers = ['Order ID', 'Payment ID', 'User Email', 'User Name', 'Product', 'Amount', 'Status', 'Date'];
        const rows = orders.map(o => [
            o.orderId || '',
            o.paymentId || '',
            o.userEmail || '',
            o.userName || '',
            o.productName || '',
            o.amount || '',
            o.status || '',
            o.createdAt ? new Date(o.createdAt).toISOString() : '',
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bodhganga-orders-${status}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 bg-slate-950 text-slate-100 p-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-white font-serif tracking-wide uppercase">Order Management</h1>
                    <p className="text-slate-400 text-xs mt-1 font-semibold">{total} total transactions · Page {page + 1} of {pages}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={load}
                        className="p-2.5 bg-slate-900 border border-emerald-950 hover:border-gold/30 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-emerald-950 hover:border-gold/30 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        placeholder="Search by order ID, payment ID, or user email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-emerald-950 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-gold/40"
                    />
                </div>

                {/* Status tabs */}
                <div className="flex gap-1 bg-slate-900 border border-emerald-950 rounded-xl p-1">
                    {STATUS_TABS.map(s => (
                        <button key={s} onClick={() => { setStatus(s); setPage(0); }}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                status === s
                                    ? 'bg-gold text-emerald-950'
                                    : 'text-slate-400 hover:text-white'
                            }`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-emerald-950/60 bg-slate-950/60">
                                <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Order ID</th>
                                <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">User</th>
                                <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Product</th>
                                <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i} className="border-b border-emerald-950/30">
                                        {[...Array(7)].map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 bg-slate-800 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-semibold">
                                        No orders found for the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order, i) => {
                                    const s = order.status || 'PENDING';
                                    const sStyle = STATUS_STYLE[s] || STATUS_STYLE.PENDING;
                                    return (
                                        <tr key={order.orderId || i}
                                            className="border-b border-emerald-950/30 hover:bg-slate-900/40 transition-colors">
                                            <td className="px-4 py-3 font-mono text-slate-300 text-[10px]">
                                                <div>{order.orderId?.slice(0, 20) || '—'}...</div>
                                                {order.paymentId && (
                                                    <div className="text-slate-500 text-[9px] mt-0.5">{order.paymentId?.slice(0, 18)}...</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-white">{order.userName || 'Unknown'}</div>
                                                <div className="text-slate-500 text-[10px]">{order.userEmail || '—'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-slate-200 max-w-[150px] truncate">
                                                    {order.productName || '—'}
                                                </div>
                                                {order.productType && (
                                                    <div className="text-gold text-[9px] font-black uppercase mt-0.5">{order.productType}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-black text-gold font-serif">
                                                {fmtRupee(order.amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${sStyle}`}>
                                                    {s}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-[10px]">
                                                {fmtDate(order.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {s === 'SUCCESS' && (
                                                    <button
                                                        onClick={() => handleRefund(order.orderId)}
                                                        disabled={refunding === order.orderId}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-black uppercase text-red-400 border border-red-900 hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50">
                                                        <RotateCcw className="w-3 h-3" />
                                                        {refunding === order.orderId ? 'Processing...' : 'Refund'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-emerald-950/60">
                        <span className="text-[10px] text-slate-400 font-semibold">
                            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                className="p-1.5 rounded-lg bg-slate-900 border border-emerald-950 text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}
                                className="p-1.5 rounded-lg bg-slate-900 border border-emerald-950 text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
