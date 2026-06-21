import { BookOpen, Clock, Star, Heart, Users, ShoppingCart } from 'lucide-react';

const CourseCard = ({ course, isFavorite, onFavorite, onClick, onAddToCart }) => {
    const title = course.courseTitle || course.title || 'Untitled Course';
    const category = course.courseCategory || 'General';
    const price = course.coursePrice ?? course.price;
    const instructor = course.instructorName || 'BodhGanga Faculty';
    const rating = course.rating || 4.5;
    const students = course.enrolledStudents || 0;
    const duration = course.courseDuration ? `${course.courseDuration}h` : null;

    return (
        <div
            className="card-premium flex flex-col group cursor-pointer h-full relative"
            onClick={() => onClick?.(course.id)}
        >
            {/* Thumbnail */}
            <div className="relative w-full h-48 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl overflow-hidden mb-4 border border-emerald/5 shadow-inner">
                {course.thumbnailUrl ? (
                    <img
                        src={course.thumbnailUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gradient-to-br from-emerald/90 to-emerald-dark">
                        <BookOpen className="w-12 h-12 text-gold" />
                        <span className="text-[10px] text-gold/60 uppercase tracking-widest font-serif font-semibold">BodhGanga Academy</span>
                    </div>
                )}

                {/* Category badge */}
                <span className="absolute top-3.5 left-3.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-emerald/95 text-gold border border-gold/25 backdrop-blur-md">
                    {category}
                </span>

                {/* Favorite */}
                <button
                    onClick={e => { e.stopPropagation(); onFavorite?.(); }}
                    className="absolute top-3.5 right-3.5 w-8.5 h-8.5 bg-white/95 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 border border-emerald/5"
                    aria-label="Toggle favourite"
                >
                    <Heart className={`w-4 h-4 transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-emerald/50 hover:text-red-500'}`} />
                </button>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-grow px-1">
                <h3 className="font-bold text-emerald-dark text-lg mb-1.5 font-serif line-clamp-2 leading-snug tracking-tight group-hover:text-emerald transition-colors">
                    {title}
                </h3>
                <p className="text-xs text-emerald/70 font-semibold mb-3 tracking-wide">{instructor}</p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-emerald/60 font-semibold mb-4 mt-auto">
                    <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                        {rating.toFixed(1)}
                    </span>
                    {students > 0 && (
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {students.toLocaleString()}
                        </span>
                    )}
                    {duration && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {duration}
                        </span>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-3.5 border-t border-emerald/5 mt-auto">
                    <div>
                        {price != null && price > 0 ? (
                            <span className="text-xl font-bold text-emerald">₹{price}</span>
                        ) : (
                            <span className="text-xl font-bold text-emerald-light">Free</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                onAddToCart?.(course);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald/10 hover:bg-emerald text-emerald hover:text-white rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all border border-emerald/10"
                            title="Add to Cart"
                        >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add
                        </button>
                        <span className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1 transition-colors">
                            Learn More <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
