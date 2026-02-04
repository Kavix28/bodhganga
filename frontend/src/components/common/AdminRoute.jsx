import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminSessionValid, extendAdminSession } from '../../config/adminConfig';
import AdminPasswordGate from '../admin/AdminPasswordGate';
import Loader from './Loader';

const AdminRoute = ({ children }) => {
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        // Check if admin session is valid
        const validSession = isAdminSessionValid();
        setIsAdminAuthenticated(validSession);
        setIsCheckingSession(false);

        // Extend session on activity
        if (validSession) {
            extendAdminSession();
        }
    }, []);

    const handleAuthenticated = () => {
        setIsAdminAuthenticated(true);
    };

    // Show loader while checking session
    if (isCheckingSession) {
        return <Loader fullScreen />;
    }

    // Show password gate if not authenticated
    if (!isAdminAuthenticated) {
        return <AdminPasswordGate onAuthenticated={handleAuthenticated} />;
    }

    // Render admin content if authenticated
    return children;
};

export default AdminRoute;