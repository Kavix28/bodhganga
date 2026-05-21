import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

const Error = () => {
    const navigate = useNavigate();

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <FiAlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
                <p className="text-gray-600 mb-[16px]">
                    We're sorry for the inconvenience. Please try again or contact support if the problem persists.
                </p>
                <div className="flex gap-[14px] justify-center">
                    <button onClick={handleRefresh} className="btn-primary">
                        Refresh Page
                    </button>
                    <button onClick={handleGoBack} className="btn-secondary">
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Error;
