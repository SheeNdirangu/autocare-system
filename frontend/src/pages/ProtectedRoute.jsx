import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole }) => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    // 1. If no token exists, kick them back to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. If they have a token, but are trying to access a portal they don't own
    if (allowedRole && userRole !== allowedRole) {
        // Kick them back to their correct home base
        if (userRole === 'admin') return <Navigate to="/admin" replace />;
        if (userRole === 'mechanic') return <Navigate to="/mechanic" replace />;
        return <Navigate to="/customer" replace />;
    }

    // 3. If everything is good, render the requested page
    return <Outlet />;
};

export default ProtectedRoute;