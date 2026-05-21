const Loader = ({ size = 'medium', fullScreen = false }) => {
    const sizeClasses = {
        small: 'w-6 h-6 border-2',
        medium: 'w-12 h-12 border-4',
        large: 'w-16 h-16 border-4',
    };

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <div
                className={`${sizeClasses[size]} border-emerald-200 border-t-emerald-600 rounded-full animate-spin`}
                role="status"
                aria-label="Loading"
            >
                <span className="sr-only">Loading...</span>
            </div>
            {size !== 'small' && (
                <p className="text-sm text-slate-500 font-medium">Loading...</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-ivory/90 backdrop-blur-sm flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center p-8">
            {spinner}
        </div>
    );
};

export default Loader;
