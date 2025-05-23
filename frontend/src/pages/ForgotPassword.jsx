import React, { useState } from "react";
import "../styles/AuthForm.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="auth-form-container">
      <h2>Reset Password</h2>
      {submitted ? (
        <p style={{ textAlign: "center" }}>
          If an account with that email exists, a reset link has been sent.
          <br />
          <a href="/login">Go back to Login</a>
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="input-field"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Reset Link</button>
        </form>
      )}
    </div>
  );
}

export default ForgotPassword;
