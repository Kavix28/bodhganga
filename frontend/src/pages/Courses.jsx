import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiSearch } from 'react-icons/fi';
import { BookOpen, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useFavorites } from '../hooks/useFavorites';
import SkeletonLoader from '../components/common/SkeletonLoader';
import CourseCard from '../components/ui/CourseCard';
import EmptyState from '../components/ui/EmptyState';
import { useCart } from '../context/CartContext';

const Courses = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isFavorite, toggleFavorite } = useFavorites('courses');
    const { addToCart } = useCart();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const debouncedSearch = useDebounce(searchQuery, 400);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const { data: coursesData = {}, isLoading } = useQuery({
        queryKey: ['courses'],
        queryFn: () => api.get('/courses/list?size=50'),
        staleTime: 5 * 60 * 1000,
    });

    const courses = coursesData?.data?.courses || coursesData?.courses || (Array.isArray(coursesData?.data) ? coursesData.data : []);

    const categories = useMemo(() => {
        const cats = new Set(courses.map(c => c.courseCategory || 'General'));
        return ['All', ...Array.from(cats).sort()];
    }, [courses]);

    const filtered = useMemo(() => {
        let list = [...courses];
        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase();
            list = list.filter(c =>
                (c.courseTitle || c.title || '').toLowerCase().includes(q) ||
                (c.instructorName || '').toLowerCase().includes(q)
            );
        }
        if (selectedCategory !== 'All') {
            list = list.filter(c => (c.courseCategory || 'General') === selectedCategory);
        }
        return list;
    }, [courses, debouncedSearch, selectedCategory]);

    useEffect(() => {
        setSearchParams(searchQuery ? { q: searchQuery } : {});
    }, [searchQuery]);

    return (
        <div className="min-h-screen bg-ivory-light">
            {/* Header Banner */}
            <section className="bg-gradient-to-b from-emerald-dark to-emerald-950 text-white relative overflow-hidden py-16 border-b border-gold/15 px-4 text-center">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald via-gold to-emerald" />
                <div className="relative max-w-4xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4.5 py-1.5 rounded-full backdrop-blur-md">
                        <BookOpen className="w-3.5 h-3.5 text-gold animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest text-gold uppercase">Academic Curriculum</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">Courses & Studies</h1>
                    <p className="text-white/60 text-sm max-w-xl mx-auto font-medium">
                        Explore state-of-the-art preparation materials designed meticulously for UPSC, SSC, and State PSC examinations.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/60" />
                        <input
                            type="text"
                            placeholder="Search courses, instructors, or syllabus..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full py-3 pl-11 pr-4 rounded-xl border border-emerald/10 bg-white text-sm font-semibold transition-all duration-300 focus:border-emerald focus:ring-4 focus:ring-emerald/10 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <SlidersHorizontal className="w-4 h-4 text-emerald/60" />
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="py-3 px-4.5 rounded-xl border border-emerald/10 bg-white text-xs font-bold uppercase tracking-wider text-emerald-dark transition-all focus:border-emerald outline-none cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Count */}
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-dark/50">
                    {isLoading ? 'Fetching courses...' : `${filtered.length} courses mapped`}
                </p>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <SkeletonLoader type="card" count={8} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card-premium bg-white p-12">
                        <EmptyState
                            title="No Courses Found"
                            message={debouncedSearch ? `No matches found for "${debouncedSearch}"` : 'Courses database currently updating.'}
                            icon={BookOpen}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                        {filtered.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                isFavorite={isFavorite(course.id)}
                                onFavorite={() => toggleFavorite(course.id)}
                                onClick={id => navigate(`/courses/${id}`)}
                                onAddToCart={c => addToCart(c.id, 'COURSE', c.courseTitle || c.title)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Courses;
