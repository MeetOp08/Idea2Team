import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../../styles/forgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            Swal.fire("Error", "Please enter your email", "error");
            return;
        }

        try {
            // Note: Update URL based on actual API
            await axios.post("/api/forgot-password", { email });
            Swal.fire("Success", "Password reset instructions sent to your email.", "success");
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Failed to process request", "error");
        }
    };

    return (
        <div className="forgot-page">
            <div className="forgot-visual">
                <div className="forgot-visual-content">
                    <h2>Reset Password</h2>
                    <p>Enter your email to receive instructions on how to reset your password.</p>
                    <div className="forgot-visual-graphic">🔐</div>
                </div>
            </div>

            <div className="forgot-form-container">
                <div className="forgot-form">
                    <div className="forgot-form-header">
                        <Link to="/" className="forgot-header-link">
                            <span className="forgot-header-logo-icon">I2</span>
                            <span className="forgot-header-logo-text">Idea2Team</span>
                        </Link>
                        <h1>Forgot Password?</h1>
                        <p>No worries, we'll send you reset instructions.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input 
                                type="email" 
                                className="form-input" 
                                placeholder="Enter your email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button className="forgot-btn forgot-btn-primary" type="submit">
                            Reset Password
                        </button>
                    </form>

                    <div className="forgot-footer">
                        <Link to="/login" className="forgot-footer-link">← Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
