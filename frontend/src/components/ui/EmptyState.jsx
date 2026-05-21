import { BookOpen } from 'lucide-react';

const EmptyState = ({ title = 'Nothing here yet', message = '', icon: Icon = BookOpen, action }) => (
    <div className="text-center py-16">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Icon className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2 font-serif">{title}</h3>
        {message && <p className="text-slate-500 max-w-sm mx-auto">{message}</p>}
        {action && <div className="mt-6">{action}</div>}
    </div>
);

export default EmptyState;
