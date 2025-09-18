import React from "react";
import Navbar from "../../components/Navbar/Navbar";  // ✅ Adjust path if different
import Footer from "../../components/Footer/Footer";  // ✅ New Footer component
import "./AboutUs.css";

const AboutUs = () => {
  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Main About Us Section */}
      <div className="about-container">
        <section className="about-hero">
          <h1 className="about-title">About MediCare</h1>
          <p className="about-subtitle">
            Your trusted healthcare partner, connecting patients, doctors,
            pharmacists, and delivery agents seamlessly.
          </p>
        </section>

        <section className="about-content">
          <div className="about-card">
            <h2>Our Mission</h2>
            <p>
              To make healthcare accessible and reliable for everyone by
              leveraging technology and professional care providers.
            </p>
          </div>

          <div className="about-card">
            <h2>Our Vision</h2>
            <p>
              To build a digital healthcare ecosystem where patients can consult
              doctors, order medicines, and track deliveries effortlessly.
            </p>
          </div>

          <div className="about-card">
            <h2>Why Choose Us?</h2>
            <ul>
              <li>✔ Trusted and Verified Doctors</li>
              <li>✔ Fast and Reliable Medicine Delivery</li>
              <li>✔ Secure and Easy-to-Use Platform</li>
              <li>✔ 24/7 Customer Support</li>
            </ul>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default AboutUs;
