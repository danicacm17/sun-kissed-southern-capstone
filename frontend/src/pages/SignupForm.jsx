import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/AuthForm.css";

function SignupForm() {
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { password } = formData;

    // Password validation: 7+ chars, 1 uppercase, 1 number
    const isValidPassword =
      password.length >= 7 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password);

    if (!isValidPassword) {
      setError("Password must be at least 7 characters and include one uppercase letter and one number.");
      return;
    }

    try {
      await signup(formData);
      navigate("/");
    } catch {
      setError("Signup failed");
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          className="input-field"
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
        />
        <input
          className="input-field"
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
        />
        <input
          className="input-field"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <div className="password-wrapper">
          <input
            className="input-field"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span className="eye-icon" onClick={() => setShowPassword((s) => !s)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}

export default SignupForm;
