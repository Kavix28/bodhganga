import { Link } from 'react-router-dom';
import { MapPin, BookOpen, Award, ArrowRight } from 'lucide-react';

const stats = [
    { label: 'States', value: '28', icon: '🗺️' },
    { label: 'Union Territories', value: '8', icon: '🏛️' },
    { label: 'Official Languages', value: '22', icon: '🗣️' },
    { label: 'UNESCO Heritage Sites', value: '42', icon: '🏛️' },
    { label: 'National Parks', value: '106', icon: '🌿' },
    { label: 'Districts', value: '766', icon: '📍' },
];

const AboutIndia = () => (
    <div className="min-h-screen bg-ivory">
        {/* Hero */}
        <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-20">
            <div className="container-custom text-center">
                <div className="text-6xl mb-6">🇮🇳</div>
                <h1 className="text-5xl font-bold mb-4 font-serif">About India</h1>
                <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
                    Explore the rich diversity, heritage, and geography of Bharat — the world's largest democracy.
                </p>
            </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-white">
            <div className="container-custom">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {stats.map(s => (
                        <div key={s.label} className="text-center p-6 heritage-card">
                            <div className="text-4xl mb-3">{s.icon}</div>
                            <div className="text-3xl font-bold text-emerald-700 font-serif">{s.value}</div>
                            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-ivory">
            <div className="container-custom max-w-4xl">
                <div className="prose prose-lg max-w-none">
                    <h2 className="text-3xl font-bold text-emerald-700 font-serif mb-6">The Land of Diversity</h2>
                    <p className="text-slate-700 leading-relaxed mb-6">
                        India, officially the Republic of India, is a country in South Asia. It is the seventh-largest country by area, the most populous country, and from the time of its independence in 1947, the world's most populous democracy.
                    </p>
                    <p className="text-slate-700 leading-relaxed mb-6">
                        Bounded by the Indian Ocean on the south, the Arabian Sea on the southwest, and the Bay of Bengal on the southeast, it shares land borders with Pakistan to the west; China, Nepal, and Bhutan to the north; and Bangladesh and Myanmar to the east.
                    </p>
                    <h2 className="text-3xl font-bold text-emerald-700 font-serif mb-6">For Exam Aspirants</h2>
                    <p className="text-slate-700 leading-relaxed mb-6">
                        Understanding India's geography, history, polity, and culture is essential for all government competitive examinations including UPSC, SSC, State PSC, and more. BodhGanga provides comprehensive state-wise study material to help you master every aspect.
                    </p>
                </div>

                <div className="mt-10 flex gap-4">
                    <Link to="/states" className="btn-gold btn-lg">
                        <MapPin className="w-5 h-5 mr-2" />
                        Explore States
                    </Link>
                    <Link to="/question-bank" className="btn-outline btn-lg">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Practice Questions
                    </Link>
                </div>
            </div>
        </section>
    </div>
);

export default AboutIndia;
