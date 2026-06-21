import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, BookOpen, ArrowRight, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { useFavorites } from '../hooks/useFavorites';
import { useCart } from '../context/CartContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import CourseCard from '../components/ui/CourseCard';
import EmptyState from '../components/ui/EmptyState';

const Wishlist = () => {
    const navigate = useNavigate();
    const { toggleFavorite, favorites } = useFavorites('courses');
    const { addToCart } = useCart();

    const { data: coursesData = {}, isLoading } = useQuery({
        queryKey: ['courses'],
        queryFn: () => api.get('/courses/list?size=50'),
        staleTime: 5 * 60 * 1000,
    });

    const courses = coursesData?.data?.courses || coursesData?.courses || (Array.isArray(coursesData?.data) ? coursesData.data : []);

    const wishlistedCourses = useMemo(() => {
        return courses.filter(c => favorites.has(c.id));
    }, [courses, favorites]);

    return (
        <div className="min-h-screen bg-ivory-light py-12 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-emerald/10 pb-5">
                    <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
                    <div>
                        <h1 className="text-2xl font-black text-emerald-dark font-serif tracking-wide">My Wishlist</h1>
                        <p className="text-emerald/60 text-sm font-medium">Your favorited courses and study materials</p>
                    </div>
                </div>

                {/* Content Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <SkeletonLoader type="card" count={4} />
                    </div>
                ) : wishlistedCourses.length === 0 ? (
                    <div className="card-premium bg-white p-16 text-center space-y-6 max-w-2xl mx-auto rounded-2xl border border-emerald/5 shadow-md">
                        <Heart className="w-16 h-16 text-emerald/20 mx-auto" />
                        <h2 className="text-xl font-bold text-emerald-dark font-serif">Your wishlist is empty</h2>
                        <p className="text-emerald/60 text-sm font-medium">Explore our courses and tap the heart icon on any course to add it here.</p>
                        <Link to="/courses"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-emerald-950 font-extrabold text-sm rounded-xl hover:opacity-90 transition-opacity">
                            Browse Courses <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                        {wishlistedCourses.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                isFavorite={true}
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

export default Wishlist;
