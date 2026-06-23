import { Link } from 'react-router-dom';
import { Home, Search, BookOpen } from 'lucide-react';

const NotFound = () => (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center bg-ivory">
        {/* Visual */}
        <div className="relative mb-8">
            <div className="text-[120px] font-bold text-emerald-100 font-serif leading-none select-none">
                404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-emerald-500" />
                </div>
            </div>
        </div>

        <h1 className="text-3xl font-bold text-emerald-700 mb-3 font-serif">Page Not Found</h1>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
        </p>

        {/* Gold accent line */}
        <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-gold-500 rounded-full mb-8" />

        <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/" className="btn-gold btn-lg flex items-center gap-2">
                <Home className="w-5 h-5" />
                Back to Home
            </Link>
            <Link to="/state" className="btn-outline btn-lg flex items-center gap-2">
                <Search className="w-5 h-5" />
                Browse States
            </Link>
        </div>
    </div>
);

export default NotFound;

