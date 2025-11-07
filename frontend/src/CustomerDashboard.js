import React, { useEffect, useState } from "react";
import api from "./api";

export default function CustomerDashboard({ token, onLogout, userData }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    sourceAccount: "",
    targetAccount: "",
    beneficiaryName: "",
    beneficiaryBank: "",
    amount: "",
    currency: "USD",
    purpose: "",
  });
  const [creating, setCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showCustomSwift, setShowCustomSwift] = useState(false);

  // Common SWIFT codes for major banks
  const swiftCodes = [
    { code: "BOFAUS3N", bank: "Bank of America", country: "USA" },
    { code: "CITIUS33", bank: "Citibank", country: "USA" },
    { code: "CHASUS33", bank: "JPMorgan Chase", country: "USA" },
    { code: "WFBIUS6S", bank: "Wells Fargo", country: "USA" },
    { code: "HSBCUS33", bank: "HSBC Bank USA", country: "USA" },
    { code: "DEUTUS33", bank: "Deutsche Bank", country: "USA" },
    { code: "BARBGB22", bank: "Barclays Bank", country: "UK" },
    { code: "HSBCGB2L", bank: "HSBC UK", country: "UK" },
    { code: "LOYDGB2L", bank: "Lloyds Bank", country: "UK" },
    { code: "NWBKGB2L", bank: "NatWest", country: "UK" },
    { code: "DEUTDEFF", bank: "Deutsche Bank", country: "Germany" },
    { code: "COBADEFF", bank: "Commerzbank", country: "Germany" },
    { code: "BNPAFRPP", bank: "BNP Paribas", country: "France" },
    { code: "SOGEFRPP", bank: "Société Générale", country: "France" },
  ];

  // Load payments
  useEffect(() => {
    const loadPayments = async () => {
      try {
        console.log("🔄 Loading customer payments...");
        const resPayments = await api.get("/payments/my-payments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ Customer payments loaded:", resPayments.data.payments);
        setPayments(resPayments.data.payments);
      } catch (err) {
        console.error("❌ Failed to load payments:", err);
        if (err.response?.status === 403) {
          alert("Access denied. Please log in again.");
          onLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [token, onLogout]);

  // Auto-refresh payments every 15 seconds to get status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const resPayments = await api.get("/payments/my-payments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPayments(resPayments.data.payments);
      } catch (err) {
        console.error("Failed to refresh payments:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [token]);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Handle SWIFT code selection
  const handleSwiftCodeChange = (e) => {
    if (e.target.value === "custom") {
      setShowCustomSwift(true);
      setFormData({ ...formData, beneficiaryBank: "" });
    } else {
      setShowCustomSwift(false);
      setFormData({ ...formData, beneficiaryBank: e.target.value });
    }
  };

  // Client-side validation
  const validateForm = () => {
    const errors = [];
    const { sourceAccount, targetAccount, beneficiaryName, beneficiaryBank, amount, purpose } = formData;

    // Check required fields
    if (!sourceAccount.trim() || !targetAccount.trim() || !beneficiaryName.trim() || 
        !beneficiaryBank.trim() || !amount || !purpose.trim()) {
      errors.push('Please fill in all fields');
      setValidationErrors(errors);
      return false;
    }

    // Validate account numbers
    const accountRegex = /^[A-Z0-9]{8,34}$/;
    if (!accountRegex.test(sourceAccount.toUpperCase())) {
      errors.push('Invalid source account number format (8-34 uppercase alphanumeric characters)');
    }
    if (!accountRegex.test(targetAccount.toUpperCase())) {
      errors.push('Invalid target account number format (8-34 uppercase alphanumeric characters)');
    }

    // Check if accounts are the same
    if (sourceAccount.toUpperCase() === targetAccount.toUpperCase()) {
      errors.push('Source and Target accounts cannot be the same');
    }

    // Validate amount format
    const amountRegex = /^\d+(\.\d{1,2})?$/;
    if (!amountRegex.test(amount) || parseFloat(amount) <= 0) {
      errors.push('Invalid amount format. Use format like: 1000.00');
    }

    // Validate SWIFT code
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    if (!swiftRegex.test(beneficiaryBank.toUpperCase()) || 
        (beneficiaryBank.length !== 8 && beneficiaryBank.length !== 11)) {
      errors.push('Invalid SWIFT code. Must be 8 or 11 characters (e.g., BOFAUS3N)');
    }

    // Validate purpose length
    if (purpose.length < 5 || purpose.length > 200) {
      errors.push('Payment purpose must be between 5 and 200 characters');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }

    setValidationErrors([]);
    return true;
  };

  // Handle payment creation
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      setValidationErrors([]);

      console.log("🚀 Starting payment creation...");
      console.log("👤 User Data:", userData);
      console.log("📝 Form Data:", formData);

      if (!validateForm()) {
        console.log("❌ Client-side validation failed");
        setCreating(false);
        return;
      }

      console.log("✅ Client-side validation passed");

      const payload = {
        sourceAccount: formData.sourceAccount.trim().toUpperCase(),
        targetAccount: formData.targetAccount.trim().toUpperCase(),
        beneficiaryName: formData.beneficiaryName.trim(),
        beneficiaryBank: formData.beneficiaryBank.trim().toUpperCase(),
        amount: parseFloat(formData.amount).toFixed(2),
        currency: formData.currency,
        purpose: formData.purpose.trim(),
      };

      console.log("📤 Sending payment payload:", payload);

      const res = await api.post("/payments/create", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Payment creation response:", res.data);

      alert(`Payment created successfully! Reference: ${res.data.reference}\nStatus: Pending Verification`);

      // Reset form
      setFormData({
        sourceAccount: "",
        targetAccount: "",
        beneficiaryName: "",
        beneficiaryBank: "",
        amount: "",
        currency: "USD",
        purpose: "",
      });
      setShowCustomSwift(false);

      // Refresh payments
      const resPayments = await api.get("/payments/my-payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(resPayments.data.payments);

    } catch (err) {
      console.error('❌ Payment creation error:', err);
      console.error('Error response:', err.response);
      
      if (err.response) {
        console.error('Error response data:', err.response.data);
        
        if (err.response.data.errors) {
          setValidationErrors(err.response.data.errors);
          alert('Please fix the validation errors:\n• ' + err.response.data.errors.join('\n• '));
        } else {
          alert(err.response.data?.message || "Failed to create payment");
        }
      } else if (err.request) {
        alert('Network error: Unable to connect to server');
      } else {
        alert('Unexpected error: ' + err.message);
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading)
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
        <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Loading Dashboard</div>
        <div style={{ fontSize: 16, opacity: 0.9 }}>Please wait while we load your payment information...</div>
      </div>
    );

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
              💳
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
                Payment Portal
              </h1>
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                Secure International Payments
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{userData?.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>ID: {userData?.userId}</div>
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
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: 32,
          alignItems: "start"
        }}>
          
          {/* Left Column - Main Content */}
          <div>
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
                  👋
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
                    Welcome back, {userData?.name}!
                  </h2>
                  <p style={{ 
                    margin: "8px 0 0 0", 
                    color: "#718096",
                    fontSize: 16 
                  }}>
                    Create and manage your international payment requests
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, #fed7d7, #feb2b2)",
                color: "#742a2a",
                padding: 20,
                borderRadius: 12,
                marginBottom: 24,
                border: "1px solid #fc8181",
                boxShadow: "0 4px 16px rgba(254, 178, 178, 0.3)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 20 }}>⚠️</div>
                  <strong style={{ fontSize: 16 }}>Please fix the following errors:</strong>
                </div>
                <ul style={{ 
                  margin: 0, 
                  paddingLeft: 24,
                  fontSize: 14
                }}>
                  {validationErrors.map((error, index) => (
                    <li key={index} style={{ marginBottom: 4 }}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Create Payment Form */}
            <div style={{
              background: "white",
              padding: 32,
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              marginBottom: 32,
              border: "1px solid rgba(0,0,0,0.05)"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12, 
                marginBottom: 24 
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #48bb78, #38a169)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "white"
                }}>
                  ➕
                </div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 22, 
                  fontWeight: 600,
                  color: "#2d3748"
                }}>
                  New Payment Request
                </h3>
              </div>

              <form onSubmit={handleCreatePayment} style={{ display: "grid", gap: 20 }}>
                {/* Two Column Grid for Account Numbers */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: 20 
                }}>
                  {/* Source Account */}
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: "#4a5568",
                      fontSize: 14
                    }}>
                      Your Account Number *
                    </label>
                    <input
                      name="sourceAccount"
                      value={formData.sourceAccount}
                      onChange={handleChange}
                      placeholder="ACC123456789012"
                      required
                      style={{ 
                        padding: "14px 16px", 
                        borderRadius: 10, 
                        border: "2px solid #e2e8f0", 
                        fontSize: 15,
                        width: "100%",
                        transition: "all 0.3s ease",
                        background: "#fafafa"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#667eea";
                        e.target.style.background = "white";
                        e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e2e8f0";
                        e.target.style.background = "#fafafa";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Target Account */}
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: "#4a5568",
                      fontSize: 14
                    }}>
                      Recipient Account Number *
                    </label>
                    <input
                      name="targetAccount"
                      value={formData.targetAccount}
                      onChange={handleChange}
                      placeholder="ACC987654321098"
                      required
                      style={{ 
                        padding: "14px 16px", 
                        borderRadius: 10, 
                        border: "2px solid #e2e8f0", 
                        fontSize: 15,
                        width: "100%",
                        transition: "all 0.3s ease",
                        background: "#fafafa"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#667eea";
                        e.target.style.background = "white";
                        e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e2e8f0";
                        e.target.style.background = "#fafafa";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {/* Beneficiary Name */}
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600, 
                    color: "#4a5568",
                    fontSize: 14
                  }}>
                    Beneficiary Name *
                  </label>
                  <input
                    name="beneficiaryName"
                    value={formData.beneficiaryName}
                    onChange={handleChange}
                    placeholder="Full name of the recipient"
                    required
                    style={{ 
                      padding: "14px 16px", 
                      borderRadius: 10, 
                      border: "2px solid #e2e8f0", 
                      fontSize: 15,
                      width: "100%",
                      transition: "all 0.3s ease",
                      background: "#fafafa"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#667eea";
                      e.target.style.background = "white";
                      e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.background = "#fafafa";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                
                {/* SWIFT Code Selector */}
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600, 
                    color: "#4a5568",
                    fontSize: 14
                  }}>
                    Bank SWIFT Code *
                  </label>
                  <select
                    value={showCustomSwift ? "custom" : formData.beneficiaryBank}
                    onChange={handleSwiftCodeChange}
                    style={{ 
                      padding: "14px 16px", 
                      borderRadius: 10, 
                      border: "2px solid #e2e8f0", 
                      fontSize: 15, 
                      width: "100%",
                      marginBottom: 12,
                      transition: "all 0.3s ease",
                      background: "#fafafa",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                      backgroundSize: "12px"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#667eea";
                      e.target.style.background = "white";
                      e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.background = "#fafafa";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="">Select a bank SWIFT code</option>
                    {swiftCodes.map((swift) => (
                      <option key={swift.code} value={swift.code}>
                        {swift.code} - {swift.bank} ({swift.country})
                      </option>
                    ))}
                    <option value="custom">Enter custom SWIFT code</option>
                  </select>
                  
                  {showCustomSwift && (
                    <input
                      name="beneficiaryBank"
                      value={formData.beneficiaryBank}
                      onChange={handleChange}
                      placeholder="Enter 8 or 11 character SWIFT code"
                      required
                      style={{ 
                        padding: "14px 16px", 
                        borderRadius: 10, 
                        border: "2px solid #667eea", 
                        fontSize: 15, 
                        width: "100%",
                        transition: "all 0.3s ease",
                        background: "#f8f9ff",
                        boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)"
                      }}
                    />
                  )}
                </div>

                {/* Amount and Currency */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "2fr 1fr", 
                  gap: 20 
                }}>
                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: "#4a5568",
                      fontSize: 14
                    }}>
                      Amount *
                    </label>
                    <input
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      type="number"
                      step="0.01"
                      min="10"
                      placeholder="1000.00"
                      required
                      style={{ 
                        padding: "14px 16px", 
                        borderRadius: 10, 
                        border: "2px solid #e2e8f0", 
                        fontSize: 15,
                        width: "100%",
                        transition: "all 0.3s ease",
                        background: "#fafafa"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#667eea";
                        e.target.style.background = "white";
                        e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e2e8f0";
                        e.target.style.background = "#fafafa";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      color: "#4a5568",
                      fontSize: 14
                    }}>
                      Currency *
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      required
                      style={{ 
                        padding: "14px 16px", 
                        borderRadius: 10, 
                        border: "2px solid #e2e8f0", 
                        fontSize: 15,
                        width: "100%",
                        transition: "all 0.3s ease",
                        background: "#fafafa",
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 16px center",
                        backgroundSize: "12px"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#667eea";
                        e.target.style.background = "white";
                        e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e2e8f0";
                        e.target.style.background = "#fafafa";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600, 
                    color: "#4a5568",
                    fontSize: 14
                  }}>
                    Payment Purpose *
                  </label>
                  <textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    placeholder="Describe the purpose of this payment (5-200 characters)"
                    required
                    rows="4"
                    style={{ 
                      padding: "14px 16px", 
                      borderRadius: 10, 
                      border: "2px solid #e2e8f0", 
                      resize: "vertical", 
                      fontSize: 15, 
                      width: "100%",
                      transition: "all 0.3s ease",
                      background: "#fafafa",
                      fontFamily: "inherit"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#667eea";
                      e.target.style.background = "white";
                      e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.background = "#fafafa";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: "16px 32px",
                    borderRadius: 12,
                    border: "none",
                    background: creating 
                      ? "#cbd5e0" 
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    cursor: creating ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 16,
                    transition: "all 0.3s ease",
                    boxShadow: creating 
                      ? "none" 
                      : "0 8px 25px rgba(102, 126, 234, 0.3)"
                  }}
                  onMouseOver={(e) => {
                    if (!creating) {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 12px 30px rgba(102, 126, 234, 0.4)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!creating) {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.3)";
                    }
                  }}
                >
                  {creating ? (
                    <>
                      <span style={{ marginRight: 8 }}>⏳</span>
                      Creating Payment Request...
                    </>
                  ) : (
                    <>
                      <span style={{ marginRight: 8 }}>🚀</span>
                      Create Payment Request
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* My Payments */}
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
                gap: 12, 
                marginBottom: 24 
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #ed8936, #dd6b20)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "white"
                }}>
                  📋
                </div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 22, 
                  fontWeight: 600,
                  color: "#2d3748"
                }}>
                  My Payment Requests ({payments.length})
                </h3>
              </div>
              
              {payments.length === 0 ? (
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
                    No payment requests yet
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>
                    Create your first payment request using the form above
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {payments.map((payment) => (
                    <div
                      key={payment._id}
                      style={{
                        padding: 24,
                        background: "linear-gradient(135deg, #f7fafc, #edf2f7)",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        transition: "all 0.3s ease",
                        cursor: "pointer"
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                        e.target.style.background = "linear-gradient(135deg, #fff, #f7fafc)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                        e.target.style.background = "linear-gradient(135deg, #f7fafc, #edf2f7)";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 12, 
                            marginBottom: 12 
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
                              padding: "4px 12px",
                              borderRadius: 20,
                              background: 
                                payment.status === 'completed' ? 
                                  "linear-gradient(135deg, #48bb78, #38a169)" :
                                payment.status === 'approved' ? 
                                  "linear-gradient(135deg, #48bb78, #38a169)" :
                                payment.status === 'pending' ? 
                                  "linear-gradient(135deg, #ed8936, #dd6b20)" :
                                payment.status === 'rejected' ? 
                                  "linear-gradient(135deg, #f56565, #e53e3e)" : 
                                  "linear-gradient(135deg, #a0aec0, #718096)",
                              color: "white",
                              fontWeight: 600,
                            }}>
                              {payment.status?.toUpperCase()}
                            </div>
                          </div>
                          
                          <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: "1fr 1fr", 
                            gap: 16,
                            marginBottom: 12 
                          }}>
                            <div>
                              <div style={{ fontSize: 12, color: "#718096", fontWeight: 600 }}>FROM ACCOUNT</div>
                              <div style={{ fontSize: 14, color: "#4a5568", fontWeight: 500 }}>{payment.sourceAccount}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 12, color: "#718096", fontWeight: 600 }}>TO ACCOUNT</div>
                              <div style={{ fontSize: 14, color: "#4a5568", fontWeight: 500 }}>{payment.targetAccount}</div>
                            </div>
                          </div>

                          <div style={{ fontSize: 14, color: "#4a5568", marginBottom: 8 }}>
                            <strong>Beneficiary:</strong> {payment.beneficiaryName} • {payment.beneficiaryBank}
                          </div>
                          <div style={{ fontSize: 14, color: "#4a5568", marginBottom: 12 }}>
                            <strong>Purpose:</strong> {payment.purpose}
                          </div>
                          
                          {payment.reviewedBy && (
                            <div style={{ 
                              fontSize: 12, 
                              color: "#667eea", 
                              padding: "8px 12px",
                              background: "rgba(102, 126, 234, 0.1)",
                              borderRadius: 6,
                              display: "inline-block"
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
                            padding: "4px 8px",
                            borderRadius: 6
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
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div style={{ position: "sticky", top: 100 }}>
            {/* Account Info Card */}
            <div style={{
              background: "white",
              padding: 24,
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              marginBottom: 24,
              border: "1px solid rgba(0,0,0,0.05)"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12, 
                marginBottom: 20 
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "white"
                }}>
                  👤
                </div>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: 18, 
                  fontWeight: 600,
                  color: "#2d3748"
                }}>
                  Account Information
                </h4>
              </div>
              
              <div style={{ 
                padding: 16,
                background: "linear-gradient(135deg, #f7fafc, #edf2f7)",
                borderRadius: 12,
                border: "1px solid #e2e8f0"
              }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#718096", fontWeight: 600 }}>CUSTOMER NAME</div>
                  <div style={{ fontSize: 16, color: "#2d3748", fontWeight: 600 }}>{userData?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#718096", fontWeight: 600 }}>CUSTOMER ID</div>
                  <div style={{ 
                    fontSize: 14, 
                    color: "#667eea", 
                    fontWeight: 500,
                    fontFamily: "monospace" 
                  }}>
                    {userData?.userId}
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Card */}
            <div style={{
              background: "white",
              padding: 24,
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              marginBottom: 24,
              border: "1px solid rgba(0,0,0,0.05)"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12, 
                marginBottom: 16 
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #ed8936, #dd6b20)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "white"
                }}>
                  📋
                </div>
                <h5 style={{ 
                  margin: 0, 
                  fontSize: 16, 
                  fontWeight: 600,
                  color: "#2d3748"
                }}>
                  Payment Requirements
                </h5>
              </div>
              
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  "Account numbers: 8-34 uppercase characters",
                  "Source and Target accounts must be different",
                  "Amount format: 1000.00 (Min: 10, Max: 100,000)",
                  "SWIFT code: 8 or 11 characters",
                  "Purpose: 5-200 characters"
                ].map((requirement, index) => (
                  <div key={index} style={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: 8,
                    fontSize: 13,
                    color: "#4a5568",
                    lineHeight: 1.4
                  }}>
                    <div style={{ 
                      color: "#48bb78",
                      fontWeight: "bold",
                      flexShrink: 0,
                      marginTop: 2
                    }}>✓</div>
                    {requirement}
                  </div>
                ))}
              </div>
            </div>

            {/* Status Guide Card */}
            <div style={{
              background: "white",
              padding: 24,
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              marginBottom: 24,
              border: "1px solid rgba(0,0,0,0.05)"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12, 
                marginBottom: 16 
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #48bb78, #38a169)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "white"
                }}>
                  🔄
                </div>
                <h5 style={{ 
                  margin: 0, 
                  fontSize: 16, 
                  fontWeight: 600,
                  color: "#2d3748"
                }}>
                  Status Guide
                </h5>
              </div>
              
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  { color: '#ed8936', label: 'Pending - Awaiting review', emoji: '⏳' },
                  { color: '#48bb78', label: 'Approved - Payment processing', emoji: '✅' },
                  { color: '#f56565', label: 'Rejected - Check details', emoji: '❌' },
                  { color: '#4299e1', label: 'Completed - Payment sent', emoji: '🎉' }
                ].map((status, index) => (
                  <div key={index} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12,
                    fontSize: 13,
                    color: "#4a5568"
                  }}>
                    <div style={{ 
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: status.color,
                      flexShrink: 0
                    }}></div>
                    <span style={{ marginRight: 6 }}>{status.emoji}</span>
                    {status.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Test Data Card */}
            <div style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              padding: 24,
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
              color: "white"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12, 
                marginBottom: 16 
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  backdropFilter: "blur(10px)"
                }}>
                  🧪
                </div>
                <h5 style={{ 
                  margin: 0, 
                  fontSize: 16, 
                  fontWeight: 600
                }}>
                  Test Data
                </h5>
              </div>
              
              <div style={{ 
                background: "rgba(255,255,255,0.1)",
                padding: 16,
                borderRadius: 12,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)"
              }}>
                <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                  <div><strong>Source:</strong> TEST123456789012</div>
                  <div><strong>Target:</strong> TEST987654321098</div>
                  <div><strong>SWIFT:</strong> BOFAUS3N</div>
                  <div><strong>Amount:</strong> 100.00</div>
                  <div><strong>Purpose:</strong> Test payment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}