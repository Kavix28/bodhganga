import { useState } from 'react';
import { ShoppingBag, Plus, Search, Package } from 'lucide-react';

const AdminMarketplace = () => {
    const [search, setSearch] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 font-serif">Marketplace Manager</h1>
                    <p className="text-slate-500 mt-1">Manage digital products and downloads</p>
                </div>
                <button className="btn-gold flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input pl-10 py-2.5 text-sm"
                />
            </div>

            {/* Info Banner */}
            <div className="bg-gold-50 border border-gold-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-gold-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-gold-800 mb-1">Marketplace API Coming Soon</h3>
                        <p className="text-sm text-gold-700">
                            The products API (<code>/api/products/**</code>) and Razorpay payment integration are being built. 
                            Once connected, you'll manage products, pricing, and purchases here.
                        </p>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl shadow-sm p-16 text-center">
                <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-2 font-serif">No Products Yet</h3>
                <p className="text-slate-400 mb-6">
                    Add your first digital product to start selling study materials.
                </p>
                <button className="btn-gold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Product
                </button>
            </div>
        </div>
    );
};

export default AdminMarketplace;
