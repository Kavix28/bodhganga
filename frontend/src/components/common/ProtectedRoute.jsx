import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <Loader fullScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ showAuthModal: true }} replace />;
    }

    return children;
};

export default ProtectedRoute;
