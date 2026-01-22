import React, { useEffect, useState } from "react";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("signup");
  // TRACK LOGGED IN USER
  const [loggedInUserEmail, setLoggedInUserEmail] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const endpoint = mode === "signup" ? "/api/register" : "/api/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || data.message || "Action failed");
        return;
      }

      setMessage(data.message);
      
      if (mode === "signin") {
        setLoggedInUserEmail(formData.email); // Save email on login
      } else {
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/records");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteUser(userId) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterEmail: loggedInUserEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      await fetchUsers();
      setMessage(data.message);
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  }

  useEffect(() => {
    if (mode === "signin") fetchUsers();
  }, [mode]);

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="toggle-buttons">
          <button 
            onClick={() => setMode("signup")} 
            className={`toggle-button ${mode === "signup" ? "active-toggle" : ""}`}
          >
            Signup
          </button>
          <button 
            onClick={() => setMode("signin")} 
            className={`toggle-button ${mode === "signin" ? "active-toggle" : ""}`}
          >
            Signin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-fields">
            {mode === "signup" && <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />}
            <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
            {mode === "signup" && <input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />}
          </div>
          <button type="submit">{mode === "signup" ? "Register" : "Login"}</button>
          {message && <div className={`message ${message.includes("Error") ? "error" : "success"}`}>{message}</div>}
        </form>
      </div>

      {mode === "signin" && (
      <div className="users-container">
        {users.length > 0 ? (
          <ul className="user-list">
            {users.map((user) => (
              <li key={user.id || user._id} className="user-card">
              <div className="user-item-content">
                <div className="user-item-name">{user.name}</div>
                <div className="user-item-email">— {user.email}</div>
              </div>
            
              {/* Only show 'x' button for the logged-in user's own data */}
              {user.email === loggedInUserEmail && (
                <button 
                  className="delete-button" 
                  onClick={() => handleDeleteUser(user.id || user._id)}
                >
                  ×
                </button>
              )}
            </li>
            ))}
          </ul>
        ) : (
          <p className="no-users-text">No registered users found.</p>
        )}
      </div>
    )}
    </div>
  );
}
