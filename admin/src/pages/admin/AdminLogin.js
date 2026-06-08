import React from 'react';
import Button from '../../components/common/Button';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import {useState} from 'react';

const AdminLogin = () => {
  const[showPassword, setShowPassword] = useState(false);

    function handleLogin() {
        const email = document.querySelector("#email").value;
        const password = document.querySelector("#password").value;

        if(!email || !password) {
            return Swal.fire("Error", "Please enter both email and password.", "error");
            
        }
        axios.post("/api/admin-login", {
            email,
            password
        }).then((res) => {
            if (res.data.message === "Admin Login Successful") {
                sessionStorage.setItem("admin_id", res.data.admin_id || "1");
                sessionStorage.setItem("role", "admin");
                Swal.fire("Success", "Welcome back, Admin!", "success").then(() => {
                    window.location.href = "/dashboard";
                });
            } else {
                Swal.fire("Error", res.data.message || "Invalid admin credentials.", "error");
            }
        }).catch((err) => {
            Swal.fire("Error", "Invalid admin credentials.", "error");
        });
    }

    return (
        <div className="auth-page">
            <div className="auth-visual" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)' }}>
                <div className="auth-visual-content">
                    <h2>Admin Panel</h2>
                    <p>Secure access to the Idea2Team administration dashboard.</p>
                    <div className="auth-visual-graphic">🛡️</div>
                </div>
            </div>

            <div className="auth-form-container">
                <div className="auth-form">
                    <div className="auth-form-header">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--gray-900)' }}>
                            <span style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #0f172a, #312e81)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px' }}>I2</span>
                            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '18px' }}>Idea2Team Admin</span>
                        </div>
                        <div style={{ display: 'inline-block', padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
                            🔒 ADMIN ACCESS ONLY
                        </div>
                        <h1>Admin Sign In</h1>
                        <p>Enter your admin credentials to access the dashboard</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Admin Email</label>
                        <input id="email" type="email" className="form-input" placeholder="admin@idea2team.com" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input id="password" type={showPassword ? "text" : "password"} className="form-input" placeholder="Enter admin password" />
                        <span   onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right:'200px',marginTop: '12px', cursor: 'pointer', color: "blue",fontSize: '14px', fontWeight: 'bold' }}>
                            {showPassword ? "Hide" : "Show"}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--gray-600)', cursor: 'pointer' }}>
                            <input type="checkbox" /> Remember me
                        </label>
                    </div>
                    <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={handleLogin}>Sign In as Admin</Button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
