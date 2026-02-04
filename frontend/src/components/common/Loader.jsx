const Loader = ({ size = 'medium', fullScreen = false }) => {
    const sizeClasses = {
        small: 'w-6 h-6 border-2',
        medium: 'w-12 h-12 border-4',
        large: 'w-16 h-16 border-4',
    };

    const spinner = (
        <div
            className={`${sizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
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
