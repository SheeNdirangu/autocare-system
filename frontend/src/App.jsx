import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import { Toaster } from "react-hot-toast"; // <-- 1. IMPORT ADDED HERE
import ErrorBoundary from "./pages/ErrorBoundary.jsx";

import Home from "./pages/Home";
import Register from "./pages/Register.jsx"; 
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx";

import Layout from "./pages/Layout.jsx";
import CustomerDashboardHome from "./pages/CustomerDashboardHome.jsx";
import BookService from "./pages/BookService.jsx";
import MyBooking from "./pages/MyBooking.jsx";
import History from "./pages/History.jsx";
import CustomerProfile from "./pages/CustomerProfile.jsx";
import VehicleList from "./pages/VehicleList.jsx";
import ServiceTracking from "./pages/ServiceTracking.jsx";
import VehicleReg from "./pages/VehicleReg.jsx";

import MechanicPortal from "./pages/MechanicPortal.jsx";

import AdminLayout from "./admin/AdminLayout.jsx"; 
import AdminDashboard from "./admin/AdminDashboard.jsx";
import Bookings from "./admin/Bookings.jsx";
import Customers from './admin/Customers';
import MechanicsDashboard from "./admin/MechanicsDashboard.jsx";
import Assignments from "./admin/Assignments.jsx";
import AdminAnalytics from './admin/AdminAnalytics.jsx';
import AdminReports from "./admin/AdminReports.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      
      {/* 2. GLOBAL TOASTER ADDED HERE */}
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        }}
      />

      <ErrorBoundary>
        <Router>
            <Routes>

            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />}/>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* CUSTOMER PORTAL */}
            <Route path="/customer" element={<ProtectedRoute allowedRole="customer" />}>
                <Route element={<Layout />}>
                    <Route index element={<CustomerDashboardHome />} />
                    <Route path="book" element={<BookService />} />
                    <Route path="tracking" element={<ServiceTracking />} />
                    <Route path="bookings" element={<MyBooking />} />
                    <Route path="vehicles" element={<VehicleList />} />
                    <Route path="history" element={<History />} />
                    <Route path="profile" element={<CustomerProfile />} />
                    <Route path="add-vehicle" element={<VehicleReg />} />
                </Route>
            </Route>

            {/* MECHANIC PORTAL */}
            <Route path="/mechanic" element={<ProtectedRoute allowedRole="mechanic" />}>
                <Route index element={<MechanicPortal />} />
            </Route>

            {/* ADMIN PORTAL */}
            <Route path="/admin" element={<ProtectedRoute allowedRole="admin" />}>
                <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="bookings" element={<Bookings />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="mechanics" element={<MechanicsDashboard />} />
                    <Route path="assignments" element={<Assignments />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="reports" element={<AdminReports />} />
                </Route>
            </Route>

            </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default App;