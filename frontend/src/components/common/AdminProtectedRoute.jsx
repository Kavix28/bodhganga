import { Navigate } from 'react-router-dom';
import { isAdminAuthenticated } from '../../utils/adminAuth';

const AdminProtectedRoute = ({ children }) => {
    const isAuthenticated = isAdminAuthenticated();

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminProtectedRoute;