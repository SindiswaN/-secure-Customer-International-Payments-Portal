import React, { useEffect, useState } from "react";
import api from "./api";

export default function EmployeeDashboard({ token, onLogout, userData }) {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState(null);

  // Load payments for verification
  useEffect(() => {
    const loadPayments = async () => {
      try {
        console.log("🔄 Loading employee payments...");
        console.log("👤 Employee Data:", userData);
        console.log("🔑 Token present:", !!token);

        const [pendingRes, allRes] = await Promise.all([
          api.get("/payments/pending", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/payments/all", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        console.log("✅ Pending payments response:", pendingRes.data);
        console.log("✅ All payments response:", allRes.data);
        
        setPendingPayments(pendingRes.data.payments || []);
        setAllPayments(allRes.data.payments || []);
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load payments:", err);
        console.error("Error details:", err.response?.data);
        
        if (err.response?.status === 403) {
          setError("Access denied. You are not authorized as an employee.");
          alert("Access denied. You are not authorized as an employee.");
          onLogout();
        } else if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          onLogout();
        } else {
          setError(err.response?.data?.message || "Failed to load payments. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadPayments();
    }
  }, [token, onLogout, userData]);

  // Load debug information
  const loadDebugInfo = async () => {
    try {
      console.log("🔧 Loading debug information...");
      const response = await api.get("/payments/debug-data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDebugInfo(response.data);
      console.log("✅ Debug info loaded:", response.data);
    } catch (err) {
      console.error("❌ Failed to load debug info:", err);
      alert("Debug info failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Test database connection
  const testDatabase = async () => {
    try {
      console.log("🧪 Testing database connection...");
      const response = await api.get("/payments/test-db");
      console.log("✅ Database test result:", response.data);
      alert(`Database Test: ${response.data.message}\nTotal Payments: ${response.data.totalPayments}\nDatabase: ${response.data.database}`);
    } catch (err) {
      console.error("❌ Database test failed:", err);
      alert("Database test failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Refresh payments manually
  const refreshPayments = async () => {
    setLoading(true);
    try {
      console.log("🔄 Manually refreshing payments...");
      const [pendingRes, allRes] = await Promise.all([
        api.get("/payments/pending", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/payments/all", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setPendingPayments(pendingRes.data.payments || []);
      setAllPayments(allRes.data.payments || []);
      setError(null);
      console.log("✅ Payments refreshed successfully");
    } catch (err) {
      console.error("❌ Failed to refresh payments:", err);
      setError("Failed to refresh payments: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle payment verification
  const handlePaymentAction = async (paymentId, action) => {
    setActionLoading(paymentId);
    try {
      console.log(`🔄 ${action}ing payment: ${paymentId}`);
      
      const response = await api.patch(`/payments/${paymentId}/status`, 
        { status: action === 'approve' ? 'approved' : 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`✅ Payment ${action}ed successfully:`, response.data);

      alert(`Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);

      // Refresh payments to get updated status
      await refreshPayments();

    } catch (err) {
      console.error(`❌ Failed to ${action} payment:`, err);
      console.error("Error details:", err.response?.data);
      alert(err.response?.data?.message || `Failed to ${action} payment`);
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-refresh payments every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && token) {
        refreshPayments();
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [loading, token]);

  if (loading) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Loading Employee Portal</div>
        <div style={{ fontSize: 16, opacity: 0.9 }}>Please wait while we load payment verification data...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "20px 40px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 40,
              height: 40,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: 18
            }}>
              🔒
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: 24, 
                fontWeight: 700,
                background: "linear-gradient(45deg, #fff, #e3f2fd)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                Employee Verification Portal
              </h1>
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                Secure Payment Authorization System
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{userData?.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Employee ID: {userData?.userId}</div>
            </div>
            
            <div style={{ 
              display: "flex", 
              gap: 8,
              background: "rgba(255,255,255,0.1)",
              padding: "8px 12px",
              borderRadius: 10,
              backdropFilter: "blur(10px)"
            }}>
              <button
                onClick={refreshPayments}
                disabled={loading}
                style={{
                  background: loading ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.background = "rgba(255,255,255,0.4)";
                    e.target.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.background = "rgba(255,255,255,0.3)";
                    e.target.style.transform = "translateY(0)";
                  }
                }}
              >
                {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
              </button>
              
              <button
                onClick={testDatabase}
                style={{
                  background: "rgba(255,255,255,0.3)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.4)";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.3)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                🗄️ Test DB
              </button>
              
              <button
                onClick={loadDebugInfo}
                style={{
                  background: "rgba(255,255,255,0.3)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.4)";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.3)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                🔧 Debug
              </button>
            </div>

            <button
              onClick={onLogout}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "10px 20px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255,255,255,0.3)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(255,255,255,0.2)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        padding: "40px 20px",
        maxWidth: 1400,
        margin: "0 auto"
      }}>
        {/* Welcome Card */}
        <div style={{
          background: "white",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          marginBottom: 32,
          border: "1px solid rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 60,
              height: 60,
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: "white"
            }}>
              👨‍💼
            </div>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: 28, 
                fontWeight: 700,
                color: "#2d3748",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                Welcome, {userData?.name}!
              </h2>
              <p style={{ 
                margin: "8px 0 0 0", 
                color: "#718096",
                fontSize: 16 
              }}>
                Review and authorize customer payment requests securely
              </p>
            </div>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            marginTop: 24
          }}>
            <div style={{
              background: "linear-gradient(135deg, #fed7d7, #feb2b2)",
              padding: 20,
              borderRadius: 12,
              textAlign: "center",
              border: "1px solid #fc8181"
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#742a2a" }}>
                {pendingPayments.length}
              </div>
              <div style={{ fontSize: 14, color: "#742a2a", fontWeight: 600 }}>
                Pending Review
              </div>
            </div>
            
            <div style={{
              background: "linear-gradient(135deg, #c6f6d5, #9ae6b4)",
              padding: 20,
              borderRadius: 12,
              textAlign: "center",
              border: "1px solid #68d391"
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#22543d" }}>
                {allPayments.length}
              </div>
              <div style={{ fontSize: 14, color: "#22543d", fontWeight: 600 }}>
                Total Payments
              </div>
            </div>
            
            <div style={{
              background: "linear-gradient(135deg, #bee3f8, #90cdf4)",
              padding: 20,
              borderRadius: 12,
              textAlign: "center",
              border: "1px solid #63b3ed"
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#1a365d" }}>
                {allPayments.filter(p => p.status === 'approved').length}
              </div>
              <div style={{ fontSize: 14, color: "#1a365d", fontWeight: 600 }}>
                Approved
              </div>
            </div>
            
            <div style={{
              background: "linear-gradient(135deg, #e9d8fd, #d6bcfa)",
              padding: 20,
              borderRadius: 12,
              textAlign: "center",
              border: "1px solid #b794f4"
            }}>
              <div style={{ fontSize: 12, color: "#44337a", fontWeight: 600, marginBottom: 8 }}>
                Auto-refresh
              </div>
              <div style={{ fontSize: 14, color: "#44337a", fontWeight: 700 }}>
                Every 2 minutes
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: "linear-gradient(135deg, #fed7d7, #feb2b2)",
            color: "#742a2a",
            padding: 20,
            borderRadius: 12,
            marginBottom: 24,
            border: "1px solid #fc8181",
            boxShadow: "0 4px 16px rgba(254, 178, 178, 0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ fontSize: 20, marginTop: 2 }}>⚠️</div>
                <div>
                  <strong style={{ fontSize: 16 }}>System Error</strong>
                  <div style={{ fontSize: 14, marginTop: 4 }}>{error}</div>
                </div>
              </div>
              <button 
                onClick={() => setError(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#742a2a",
                  cursor: "pointer",
                  fontSize: "20px",
                  fontWeight: "bold",
                  padding: "4px 8px",
                  borderRadius: "4px"
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(116, 42, 42, 0.1)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "none";
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <div style={{
            background: "linear-gradient(135deg, #e6fffa, #b2f5ea)",
            padding: 24,
            borderRadius: 16,
            marginBottom: 32,
            border: "1px solid #81e6d9",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "white"
                }}>
                  🔍
                </div>
                <h4 style={{ 
                  margin: 0, 
                  color: "#0f766e",
                  fontSize: 18,
                  fontWeight: 600
                }}>
                  System Diagnostics
                </h4>
              </div>
              <button 
                onClick={() => setDebugInfo(null)}
                style={{
                  background: "rgba(13, 148, 136, 0.1)",
                  border: "1px solid rgba(13, 148, 136, 0.3)",
                  color: "#0f766e",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(13, 148, 136, 0.2)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "rgba(13, 148, 136, 0.1)";
                }}
              >
                Close
              </button>
            </div>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 16,
              marginBottom: 16
            }}>
              <div style={{
                background: "rgba(255,255,255,0.8)",
                padding: 16,
                borderRadius: 8,
                textAlign: "center"
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f766e" }}>
                  {debugInfo.totalPayments}
                </div>
                <div style={{ fontSize: 12, color: "#0f766e", fontWeight: 600 }}>
                  Total Payments
                </div>
              </div>
              
              <div style={{
                background: "rgba(255,255,255,0.8)",
                padding: 16,
                borderRadius: 8,
                textAlign: "center"
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f766e" }}>
                  {debugInfo.totalUsers}
                </div>
                <div style={{ fontSize: 12, color: "#0f766e", fontWeight: 600 }}>
                  Total Users
                </div>
              </div>
            </div>
            
            <details>
              <summary style={{ 
                cursor: "pointer", 
                fontWeight: "bold", 
                color: "#0f766e",
                padding: "8px 0",
                fontSize: 14
              }}>
                View Raw System Data
              </summary>
              <pre style={{ 
                background: "rgba(255,255,255,0.9)", 
                padding: 16, 
                borderRadius: 8, 
                overflow: "auto",
                fontSize: 12,
                marginTop: 12,
                maxHeight: "300px",
                border: "1px solid rgba(13, 148, 136, 0.2)"
              }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div style={{
          display: "grid",
          gap: 32
        }}>
          {/* Pending Payments Section */}
          <div style={{
            background: "white",
            padding: 32,
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.05)"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 16, 
              marginBottom: 24 
            }}>
              <div style={{
                width: 50,
                height: 50,
                background: "linear-gradient(135deg, #ed8936, #dd6b20)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                color: "white"
              }}>
                ⏳
              </div>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 24, 
                  fontWeight: 600,
                  color: "#2d3748"
                }}>
                  Pending Verification
                </h3>
                <div style={{ 
                  fontSize: 16, 
                  color: "#718096",
                  marginTop: 4
                }}>
                  {pendingPayments.length === 0 
                    ? "No payments awaiting review" 
                    : `${pendingPayments.length} payment(s) require your attention`
                  }
                </div>
              </div>
            </div>
            
            {pendingPayments.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: "60px 40px", 
                color: "#718096",
                background: "linear-gradient(135deg, #f7fafc, #edf2f7)",
                borderRadius: 12,
                border: "2px dashed #e2e8f0"
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  No Pending Payments
                </div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>
                  Payments created by customers will appear here for your review and authorization
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 20 }}>
                {pendingPayments.map((payment) => (
                  <div
                    key={payment._id}
                    style={{
                      padding: 28,
                      background: "linear-gradient(135deg, #fffaf0, #feebc8)",
                      borderRadius: 12,
                      border: "2px solid #ed8936",
                      transition: "all 0.3s ease",
                      position: "relative",
                      overflow: "hidden"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 8px 25px rgba(237, 137, 54, 0.2)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ 
                      position: "absolute", 
                      top: 0, 
                      left: 0, 
                      right: 0,
                      height: 4,
                      background: "linear-gradient(90deg, #ed8936, #dd6b20)"
                    }}></div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
                      <div>
                        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                          <div style={{ 
                            fontWeight: 700, 
                            color: "#2d3748", 
                            fontSize: 18,
                            background: "linear-gradient(135deg, #ed8936, #dd6b20)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                          }}>
                            {payment.reference}
                          </div>
                          <div style={{ 
                            fontWeight: 700, 
                            color: "#2d3748", 
                            fontSize: 20 
                          }}>
                            {payment.amount} {payment.currency}
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                          gap: 16,
                          marginBottom: 16
                        }}>
                          <div>
                            <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 4 }}>CUSTOMER</div>
                            <div style={{ fontSize: 14, color: "#4a5568", fontWeight: 500 }}>
                              {payment.customerName || 'Unknown'} 
                              <span style={{ fontSize: 12, color: "#718096", marginLeft: 8 }}>
                                (ID: {payment.customerId})
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 4 }}>BENEFICIARY</div>
                            <div style={{ fontSize: 14, color: "#4a5568", fontWeight: 500 }}>
                              {payment.beneficiaryName} • {payment.beneficiaryBank}
                            </div>
                          </div>
                        </div>

                        <div style={{ 
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                          marginBottom: 16
                        }}>
                          <div>
                            <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 4 }}>FROM ACCOUNT</div>
                            <div style={{ 
                              fontSize: 14, 
                              color: "#4a5568", 
                              fontWeight: 500,
                              fontFamily: "monospace"
                            }}>
                              {payment.sourceAccount}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 4 }}>TO ACCOUNT</div>
                            <div style={{ 
                              fontSize: 14, 
                              color: "#4a5568", 
                              fontWeight: 500,
                              fontFamily: "monospace"
                            }}>
                              {payment.targetAccount}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 4 }}>PAYMENT PURPOSE</div>
                          <div style={{ fontSize: 14, color: "#4a5568" }}>
                            {payment.purpose}
                          </div>
                        </div>
                        
                        <div style={{ 
                          fontSize: 12, 
                          color: "#718096", 
                          marginTop: 16,
                          padding: "8px 12px",
                          background: "rgba(237, 137, 54, 0.1)",
                          borderRadius: 6,
                          display: "inline-block"
                        }}>
                          🕒 Created: {new Date(payment.createdAt).toLocaleString()}
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                        <button
                          onClick={() => handlePaymentAction(payment._id, 'approve')}
                          disabled={actionLoading === payment._id}
                          style={{
                            padding: "12px 24px",
                            borderRadius: 10,
                            border: "none",
                            background: actionLoading === payment._id 
                              ? "#c6f6d5" 
                              : "linear-gradient(135deg, #48bb78, #38a169)",
                            color: actionLoading === payment._id ? "#22543d" : "white",
                            cursor: actionLoading === payment._id ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: 14,
                            transition: "all 0.3s ease",
                            boxShadow: actionLoading === payment._id 
                              ? "none" 
                              : "0 4px 15px rgba(72, 187, 120, 0.3)",
                            minWidth: 120
                          }}
                          onMouseOver={(e) => {
                            if (actionLoading !== payment._id) {
                              e.target.style.transform = "translateY(-2px)";
                              e.target.style.boxShadow = "0 6px 20px rgba(72, 187, 120, 0.4)";
                            }
                          }}
                          onMouseOut={(e) => {
                            if (actionLoading !== payment._id) {
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "0 4px 15px rgba(72, 187, 120, 0.3)";
                            }
                          }}
                        >
                          {actionLoading === payment._id ? (
                            <>⏳ Processing...</>
                          ) : (
                            <>✅ Approve Payment</>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handlePaymentAction(payment._id, 'reject')}
                          disabled={actionLoading === payment._id}
                          style={{
                            padding: "12px 24px",
                            borderRadius: 10,
                            border: "none",
                            background: actionLoading === payment._id 
                              ? "#fed7d7" 
                              : "linear-gradient(135deg, #f56565, #e53e3e)",
                            color: actionLoading === payment._id ? "#742a2a" : "white",
                            cursor: actionLoading === payment._id ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: 14,
                            transition: "all 0.3s ease",
                            boxShadow: actionLoading === payment._id 
                              ? "none" 
                              : "0 4px 15px rgba(245, 101, 101, 0.3)",
                            minWidth: 120
                          }}
                          onMouseOver={(e) => {
                            if (actionLoading !== payment._id) {
                              e.target.style.transform = "translateY(-2px)";
                              e.target.style.boxShadow = "0 6px 20px rgba(245, 101, 101, 0.4)";
                            }
                          }}
                          onMouseOut={(e) => {
                            if (actionLoading !== payment._id) {
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "0 4px 15px rgba(245, 101, 101, 0.3)";
                            }
                          }}
                        >
                          {actionLoading === payment._id ? (
                            <>⏳ Processing...</>
                          ) : (
                            <>❌ Reject Payment</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Payments Section */}
          <div style={{
            background: "white",
            padding: 32,
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.05)"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 16, 
              marginBottom: 24 
            }}>
              <div style={{
                width: 50,
                height: 50,
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                color: "white"
              }}>
                📊
              </div>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 24, 
                  fontWeight: 600,
                  color: "#2d3748"
                }}>
                  All Payments ({allPayments.length})
                </h3>
                <div style={{ 
                  fontSize: 16, 
                  color: "#718096",
                  marginTop: 4
                }}>
                  Complete payment history and audit trail
                </div>
              </div>
            </div>
            
            {allPayments.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: "60px 40px", 
                color: "#718096",
                background: "linear-gradient(135deg, #f7fafc, #edf2f7)",
                borderRadius: 12,
                border: "2px dashed #e2e8f0"
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  No Payments Found
                </div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>
                  The system will display all customer payments here once they are created
                </div>
              </div>
            ) : (
              <div style={{ 
                background: "linear-gradient(135deg, #f7fafc, #edf2f7)", 
                borderRadius: 12, 
                padding: 24,
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "grid", gap: 16 }}>
                  {allPayments.map((payment) => (
                    <div
                      key={payment._id}
                      style={{
                        padding: 24,
                        background: "white",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        borderLeft: `6px solid ${
                          payment.status === 'approved' ? '#48bb78' :
                          payment.status === 'rejected' ? '#f56565' :
                          payment.status === 'completed' ? '#4299e1' : '#ed8936'
                        }`
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                        e.target.style.background = "linear-gradient(135deg, #fff, #f7fafc)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                        e.target.style.background = "white";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 16, 
                            marginBottom: 16,
                            flexWrap: "wrap"
                          }}>
                            <div style={{ 
                              fontWeight: 700, 
                              color: "#2d3748", 
                              fontSize: 16,
                              background: "linear-gradient(135deg, #667eea, #764ba2)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent"
                            }}>
                              {payment.reference}
                            </div>
                            <div style={{ 
                              fontSize: 12,
                              padding: "6px 16px",
                              borderRadius: 20,
                              background: 
                                payment.status === 'approved' ? 
                                  "linear-gradient(135deg, #48bb78, #38a169)" :
                                payment.status === 'rejected' ? 
                                  "linear-gradient(135deg, #f56565, #e53e3e)" :
                                payment.status === 'completed' ? 
                                  "linear-gradient(135deg, #4299e1, #3182ce)" :
                                  "linear-gradient(135deg, #ed8936, #dd6b20)",
                              color: "white",
                              fontWeight: 600,
                            }}>
                              {payment.status?.toUpperCase()}
                            </div>
                          </div>
                          
                          <div style={{ 
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: 16,
                            marginBottom: 16
                          }}>
                            <div>
                              <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 4 }}>CUSTOMER</div>
                              <div style={{ fontSize: 14, color: "#4a5568", fontWeight: 500 }}>
                                {payment.customerName || 'Unknown'}
                                <span style={{ fontSize: 12, color: "#718096", marginLeft: 8 }}>
                                  (ID: {payment.customerId})
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 4 }}>ACCOUNTS</div>
                              <div style={{ fontSize: 14, color: "#4a5568", fontWeight: 500 }}>
                                {payment.sourceAccount} → {payment.targetAccount}
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: 14, color: "#4a5568", marginBottom: 12 }}>
                            <strong>Beneficiary:</strong> {payment.beneficiaryName} • {payment.beneficiaryBank}
                          </div>
                          
                          {payment.reviewedBy && (
                            <div style={{ 
                              fontSize: 12, 
                              color: "#667eea", 
                              padding: "8px 12px",
                              background: "rgba(102, 126, 234, 0.1)",
                              borderRadius: 6,
                              display: "inline-block",
                              fontWeight: 500
                            }}>
                              ✅ Reviewed by {payment.reviewedBy} on {new Date(payment.reviewedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ 
                            fontWeight: 700, 
                            color: "#2d3748", 
                            fontSize: 20,
                            marginBottom: 8
                          }}>
                            {payment.amount} {payment.currency}
                          </div>
                          <div style={{ 
                            fontSize: 12, 
                            color: "#718096",
                            background: "rgba(0,0,0,0.05)",
                            padding: "6px 12px",
                            borderRadius: 6,
                            fontWeight: 500
                          }}>
                            {new Date(payment.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}