import { useState } from "react";

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // ✉️ This is fake. In production, this would send somewhere.
    console.log("Form submitted:", form);
    setSubmitted(true);
  };

  return (
    <div className="info-page">
      <h2>Contact Us</h2>
      {submitted ? (
        <p>Thanks for reaching out! We’ll get back to you like a wave at high tide 🌊</p>
      ) : (
        <form onSubmit={handleSubmit} className="contact-form">
          <input name="name" placeholder="Your Name" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Your Email" onChange={handleChange} required />
          <textarea name="message" placeholder="What's on your mind?" onChange={handleChange} required />
          <button type="submit">Send Message</button>
        </form>
      )}
    </div>
  );
}

export default ContactForm;
