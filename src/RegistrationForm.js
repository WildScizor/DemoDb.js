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
  const [mode, setMode] = useState("signup"); // "signup" or "signin"

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      if (mode === "signup") {
        const res = await fetch("http://localhost:5000/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        let data;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          // Handle duplicate or validation errors with server message
          setMessage((data && data.message) || "Failed to register user");
          return;
        }

        // Successful signup
        setMessage((data && data.message) || "Registered successfully");
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        // Signin
        const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), 
          });
        });

        let data;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          setMessage(
            (data && (data.error || data.message)) || "Failed to login"
          );
          return;
        }

        setMessage(
          (data && data.message) ||
            `Welcome ${(data && data.user && data.user.name) || "user"}`
        );
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("http://localhost:5000/users");
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteUser(userId) {
    try {
      const res = await fetch(`http://localhost:5000/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete user");
      }

      // Refresh the user list after deletion
      await fetchUsers();
      setMessage("User deleted successfully");
      
      // Clear message after 2 seconds
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("Error: " + err.message);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  useEffect(() => {
    if (mode === "signin") {
      fetchUsers();
    }
  }, [mode]);

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="toggle-buttons">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`toggle-button ${
              mode === "signup" ? "active-toggle" : ""
            }`}
          >
            Signup
          </button>
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`toggle-button ${
              mode === "signin" ? "active-toggle" : ""
            }`}
          >
            Signin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-fields">
            {mode === "signup" && (
              <input
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            )}
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {mode === "signup" && (
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            )}
          </div>
          <button type="submit">
            {mode === "signup" ? "Register" : "Login"}
          </button>
          {message && (
            <div
              className={`message ${
                message.includes("Error") || message.includes("Failed")
                  ? "error"
                  : "success"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>

      {mode === "signin" && (
        <div className="users-container">
          {users.length > 0 ? (
            <ul className="user-list">
              {users.map((user) => (
                <li key={user.id}>
                  <div className="user-item-content">
                    <span className="user-item-name">{user.name}</span>
                    <span className="user-item-email">{user.email}</span>
                  </div>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteUser(user.id)}
                    title="Delete user"
                    aria-label="Delete user"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-users-message">
              No registered users found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

