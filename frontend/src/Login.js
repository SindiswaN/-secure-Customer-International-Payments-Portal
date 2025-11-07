import React, { useState } from "react";
import api from "./api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer"); // Default to customer
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    try {
      const res = await api.post("/user/login", { 
        username, 
        password,
        role 
      });
      const token = res.data.token;
      const userData = res.data.user;
      
      if (token && userData) {
        localStorage.setItem("token", token);
        onLogin(token, userData); // Pass both token and user data
      } else {
        setMessage("Login failed: no token or user data returned");
      }
    } catch (err) {
      setMessage("Login failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Floating Gradient Background Shapes */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          overflow: "hidden",
          zIndex: -1,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
            top: "-100px",
            left: "-150px",
            animation: "float 15s ease-in-out infinite",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "50%",
            bottom: "-80px",
            right: "-100px",
            animation: "floatReverse 20s ease-in-out infinite",
          }}
        ></div>
      </div>

      {/* Login Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 400,
          margin: "80px auto",
          padding: "50px 35px",
          borderRadius: "15px",
          backgroundColor: "#ffffff",
          boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "30px" }}>
          <div style={{
            width: 60,
            height: 60,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: '50%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            P
          </div>
        </div>

        <h2
          style={{
            marginBottom: "10px",
            color: "#333",
            fontSize: "24px",
            fontWeight: "600",
          }}
        >
          Payment Portal Login
        </h2>
        
        <p style={{
          marginBottom: "30px",
          color: "#666",
          fontSize: "14px"
        }}>
          Access your {role === 'customer' ? 'customer' : 'employee'} account
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column" }}
        >
          {/* Role Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              textAlign: "left",
              color: "#333",
              fontWeight: "500"
            }}>
              Login As:
            </label>
            <div style={{
              display: "flex",
              borderRadius: "8px",
              border: "1px solid #ccc",
              overflow: "hidden"
            }}>
              <button
                type="button"
                onClick={() => setRole("customer")}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  backgroundColor: role === "customer" ? "#667eea" : "#f8f9fa",
                  color: role === "customer" ? "white" : "#333",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  fontWeight: role === "customer" ? "600" : "400"
                }}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole("employee")}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  backgroundColor: role === "employee" ? "#667eea" : "#f8f9fa",
                  color: role === "employee" ? "white" : "#333",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  fontWeight: role === "employee" ? "600" : "400"
                }}
              >
                Employee
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              padding: "12px 15px",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
              outline: "none",
              transition: "all 0.3s",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.boxShadow = "0 0 5px rgba(102,126,234,0.5)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ccc";
              e.target.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.1)";
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "12px 15px",
              marginBottom: "25px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "16px",
              outline: "none",
              transition: "all 0.3s",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.boxShadow = "0 0 5px rgba(102,126,234,0.5)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ccc";
              e.target.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.1)";
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 15px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: loading ? "#ccc" : "#667eea",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#5a67d8";
                e.target.style.transform = "scale(1.03)";
                e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#667eea";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            {loading ? "Logging in..." : `Login as ${role === 'customer' ? 'Customer' : 'Employee'}`}
          </button>
        </form>

        {/* Demo Accounts Info */}
        <div style={{
          marginTop: "25px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#666",
          textAlign: "left"
        }}>
          <strong>Demo Accounts:</strong>
          <div style={{ marginTop: "8px" }}>
            <div><strong>Customer:</strong> john_doe / password123</div>
            <div><strong>Employee:</strong> admin / admin123</div>
          </div>
        </div>

        {message && (
          <p style={{ 
            marginTop: "20px", 
            color: "#ff4d4f", 
            fontWeight: "500",
            padding: "10px",
            backgroundColor: "#fff2f0",
            borderRadius: "6px",
            border: "1px solid #ffccc7"
          }}>
            {message}
          </p>
        )}

        <p style={{ 
          marginTop: "30px", 
          fontSize: "14px", 
          color: "#888",
          borderTop: "1px solid #eee",
          paddingTop: "20px"
        }}>
          Secure Payment Portal System
        </p>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(30px); }
          }
          @keyframes floatReverse {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-30px); }
          }
        `}
      </style>
    </div>
  );
}