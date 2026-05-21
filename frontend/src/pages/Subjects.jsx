import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';

const subjects = [
    { id: 'history', name: 'History', icon: '📜', desc: 'Ancient, Medieval & Modern Indian History', count: '1,200+' },
    { id: 'geography', name: 'Geography', icon: '🗺️', desc: 'Physical, Human & Economic Geography', count: '980+' },
    { id: 'polity', name: 'Polity', icon: '⚖️', desc: 'Indian Constitution & Governance', count: '1,100+' },
    { id: 'economy', name: 'Economy', icon: '📊', desc: 'Indian Economy & Financial Systems', count: '870+' },
    { id: 'science', name: 'Science & Tech', icon: '🔬', desc: 'General Science & Technology', count: '760+' },
    { id: 'environment', name: 'Environment', icon: '🌿', desc: 'Ecology, Biodiversity & Climate', count: '540+' },
    { id: 'current-affairs', name: 'Current Affairs', icon: '📰', desc: 'Monthly & Annual Current Events', count: '2,400+' },
    { id: 'maths', name: 'Quantitative Aptitude', icon: '🔢', desc: 'Arithmetic, Algebra & Data Interpretation', count: '1,500+' },
    { id: 'reasoning', name: 'Reasoning', icon: '🧩', desc: 'Logical & Analytical Reasoning', count: '1,300+' },
    { id: 'english', name: 'English', icon: '📝', desc: 'Grammar, Comprehension & Vocabulary', count: '900+' },
];

const Subjects = () => (
    <div className="min-h-screen bg-ivory py-12">
        <div className="container-custom">
            <div className="text-center mb-12 slide-up">
                <div className="inline-flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full mb-4">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">All Subjects</span>
                </div>
                <h1 className="text-4xl font-bold text-emerald-700 mb-3 font-serif">Subject-wise Study Material</h1>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Comprehensive notes and questions organized by subject for all competitive exams.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {subjects.map(subject => (
                    <Link
                        key={subject.id}
                        to={`/states`}
                        className="heritage-card group text-center"
                    >
                        <div className="text-5xl mb-4">{subject.icon}</div>
                        <h3 className="text-lg font-bold text-emerald-700 mb-2 font-serif">{subject.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">{subject.desc}</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gold-600 font-semibold">{subject.count} Questions</span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                Explore <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    </div>
);

export default Subjects;
