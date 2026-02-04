import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-primary-600">404</h1>
                <h2 className="text-3xl font-semibold text-gray-900 mt-4">Page Not Found</h2>
                <p className="text-gray-600 mt-2 mb-8">
                    The page you're looking for doesn't exist.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link to="/dashboard" className="btn-primary">
                        Go to Dashboard
                    </Link>
                    <Link to="/courses" className="btn-secondary">
                        Browse Courses
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
