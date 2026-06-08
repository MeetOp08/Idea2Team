import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../../styles/register.css';

const Register = () => {
    function handleSubmit() {
        const role = document.querySelector('input[name="role"]:checked')?.value;
        const full_name = document.querySelector("#full_name").value;
        const email = document.querySelector("#email").value;
        const password = document.querySelector("#password").value;
        const phone = document.querySelector("#phone").value;


        if (!role || !full_name || !email || !password || !phone) {
            return Swal.fire("Error", "Please fill in all the required fields.", "error");
        } else { console.log(role, full_name, email, password, phone); }

        axios.post("/api/register", {
            role,
            full_name,
            email,
            password,
            phone
        }).then((res) => {
            console.log(res);
            return Swal.fire("Success", "Your account has been created successfully!", "success")
            .then(()=>{
                window.location.href = "/login";
            });
            

        }).catch((err) => {
            console.error(err);
            return Swal.fire("Error", err.response?.data?.message || "An error occurred while creating your account. Please try again.", "error");
        })
    }

    const handleOAuth = async (provider) => {
        // Read the role selected on the registration page
        const role = document.querySelector('input[name="role"]:checked')?.value || 'freelancer';

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
            const mockOAuthData = {
                email: `demo_${provider.toLowerCase()}@example.com`,
                full_name: `${provider} User`,
                provider: provider,
                role: role // Pass the selected role
            };

            axios.post("/api/oauth", mockOAuthData)
                .then((res) => {
                    if (res.data.success) {
                        sessionStorage.setItem("user_id", res.data.user.user_id);
                        sessionStorage.setItem("role", res.data.user.role);
                        sessionStorage.setItem("fullname", res.data.user.fullname);

                        Swal.fire({
                            title: "Authentication Successful!",
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
        <div className="register-page">
            <div className="register-visual">
                <div className="register-visual-content">
                    <h2>Join Idea2Team</h2>
                    <p>Create your account and start building or finding opportunities on the best freelancer platform.</p>
                    <div className="register-visual-graphic">💡</div>
                </div>
            </div>

            <div className="register-form-container">
                <div className="register-form">
                    <div className="register-form-header">
                        <Link to="/" className="register-header-link">
                            <span className="register-header-logo-icon">I2</span>
                            <span className="register-header-logo-text">Idea2Team</span>
                        </Link>
                        <h1>Create Account</h1>
                        <p>Choose your role and get started in minutes</p>
                    </div>

                    {/* Role Selector */}
                    <div className="role-selector">
                        <label className="role-option">
                            <input type="radio" name="role" value="founder" defaultChecked />
                            <div className="role-option-icon">🏢</div>
                            <div className="role-option-label">I'm a Founder</div>
                            <p className="register-role-desc">Post projects & hire talent</p>
                        </label>
                        <label className="role-option">
                            <input type="radio" name="role" value="freelancer" />
                            <div className="role-option-icon">💻</div>
                            <div className="role-option-label">I'm a Freelancer</div>
                            <p className="register-role-desc">Find projects & earn money</p>
                        </label>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input id="full_name" type="text" className="form-input" placeholder="Enter your full name" />
                        </div>

                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input id="email" type="email" className="form-input" placeholder="Enter Your Email" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input id="password" type="password" className="form-input" placeholder="Create a strong password" />
                        <p className="form-helper">Must be at least 8 characters with a number and special character</p>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input id="phone" type="tel" className="form-input" placeholder="Enter your phone number" />
                    </div>
                    <div className="register-terms">
                        <label className="register-terms-label">
                            <input type="checkbox" className="register-terms-checkbox" />
                            I agree to the <a href="#terms" className="register-terms-link">Terms of Service</a> and <a href="#privacy" className="register-terms-link">Privacy Policy</a>
                        </label>
                    </div>
                    <button className="register-btn register-btn-primary" onClick={handleSubmit}>Create Account</button>

                    <div className="register-divider">or</div>

                    <button className="register-btn register-btn-secondary register-mb-8" onClick={() => handleOAuth('Google')}>
                        🔵 Sign up with Google
                    </button>
                    <button className="register-btn register-btn-secondary" onClick={() => handleOAuth('GitHub')} style={{marginTop: '10px'}}>
                        ⚫ Sign up with GitHub
                    </button>

                    <p className="register-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
