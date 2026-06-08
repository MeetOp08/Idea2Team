import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useState } from "react";
import '../../styles/login.css';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    function handleLogin() {
        const email = document.querySelector("#login_email").value;
        const password = document.querySelector("#login_password").value;

        axios.post("/api/login", {
            email,
            password
        }).then((res) => {
            Swal.fire("Success", "Login successful!", "success");

            // Store user info in sessionStorage
            if (res.data && res.data.user) {
                sessionStorage.setItem("user_id", res.data.user.user_id);
                sessionStorage.setItem("role", res.data.user.role);
                sessionStorage.setItem("fullname", res.data.user.fullname);
            }

            // Redirect based on role
            const role = res.data?.user?.role;
            if (role === 'founder') {
                window.location.href = "/founder/dashboard";
            } else {
                window.location.href = "/freelancer/dashboard";
            }
        }).catch((err) => {
            console.error(err);
            if (err.response?.status === 403) {
                Swal.fire({
                    // icon: "error", //this is used to show error icon
                    title: "Account Blocked",
                    html: `
                        Your account is blocked.<br/><br/>
                        <a href="/help" style="color:#3085d6; font-weight:bold;">
                            Help & Support
                        </a>
                    `
                });
            }
            else {
                Swal.fire("Error", err.response?.data?.message || "Invalid credentials", "error");
            }
        });
    }

    const handleOAuth = async (provider) => {
        // Simulated OAuth Pop-up
        Swal.fire({
            title: `Connecting to ${provider}...`,
            html: 'Please wait while we securely authenticate you.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Simulate network delay for OAuth redirection flow
        setTimeout(() => {
            // Simulated OAuth payload that you would normally get from Google/GitHub
            const mockOAuthData = {
                email: `demo_${provider.toLowerCase()}@example.com`,
                full_name: `${provider} User`,
                provider: provider,
                role: 'freelancer' // Defaults to freelancer, but we can't easily ask during a 1-click login unless we redirect to onboarding
            };

            axios.post("/api/oauth", mockOAuthData)
                .then((res) => {
                    if (res.data.success) {
                        sessionStorage.setItem("user_id", res.data.user.user_id);
                        sessionStorage.setItem("role", res.data.user.role);
                        sessionStorage.setItem("fullname", res.data.user.fullname);

                        Swal.fire({
                            title: res.data.isNew ? "Account Created!" : "Welcome Back!",
                            text: `Successfully authenticated via ${provider}`,
                            icon: "success",
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            if (res.data.user.role === 'founder') {
                                window.location.href = "/founder/dashboard";
                            } else {
                                window.location.href = "/freelancer/dashboard";
                            }
                        });
                    }
                }).catch(err => {
                    Swal.fire("Error", err.response?.data?.message || `${provider} authentication failed.`, "error");
                });
        }, 1500); // 1.5 second simulated redirect
    };

    return (
        <div className="login-page">
            <div className="login-visual">
                <div className="login-visual-content">
                    <h2>Welcome Back!</h2>
                    <p>Sign in to access your dashboard, manage projects, and connect with your team.</p>
                    <div className="login-visual-graphic">🚀</div>
                </div>
            </div>

            <div className="login-form-container">
                <div className="login-form">
                    <div className="login-form-header">
                        <Link to="/" className="login-header-link">
                            <span className="login-header-logo-icon">I2</span>
                            <span className="login-header-logo-text">Idea2Team</span>
                        </Link>
                        <h1>Sign In</h1>
                        <p>Enter your credentials to access your account</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input id="login_email" type="email" className="form-input" placeholder="Enter your email" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>

                        <div style={{ position: "relative" }}>
                            <input
                                id="login_password"
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                placeholder="Enter your password"
                            />

                            <span
                                onClick={() => setShowPassword(!showPassword)}
                                className="login-password-toggle"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </span>
                        </div>
                    </div>

                    <div className="login-options">
                        <label className="login-remember-me">
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="#forgot" className="login-forgot-link">Forgot password?</a>
                    </div>
                    <button className="login-btn login-btn-primary" onClick={handleLogin}>Sign In</button>

                    <div className="login-divider">or</div>

                    <button className="login-btn login-btn-secondary login-mb-8" onClick={() => handleOAuth('Google')}>
                        🔵 Continue with Google
                    </button>
                    <button className="login-btn login-btn-secondary" onClick={() => handleOAuth('GitHub')}>
                        ⚫ Continue with GitHub
                    </button>

                    <p className="login-footer">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                    <p className="login-admin-link">
                        <a href="http://localhost:3001">Admin Login →</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;