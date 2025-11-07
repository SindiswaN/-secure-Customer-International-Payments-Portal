// App.js
import React, { useState, useEffect } from "react";
import Login from "./Login";
import CustomerDashboard from "./CustomerDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import api from "./api";

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const response = await api.get("/user/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          setUserData(response.data);
          setToken(savedToken);
        } catch (error) {
          console.error("Auto-login failed:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (token, userData) => {
    setToken(token);
    setUserData(userData);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setToken(null);
    setUserData(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // Route based on user role
  if (userData?.role === 'employee') {
    return <EmployeeDashboard token={token} onLogout={handleLogout} userData={userData} />;
  } else {
    // Default to customer dashboard
    return <CustomerDashboard token={token} onLogout={handleLogout} userData={userData} />;
  }
}

export default App;