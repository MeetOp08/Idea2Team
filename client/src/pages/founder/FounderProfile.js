import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import axios from "axios";
import Swal from "sweetalert2";
import '../../styles/FounderProfile.css';

const FounderProfile = () => {
    const user_id = sessionStorage.getItem("user_id");
    const [user, setUser] = useState({});
    const [profile, setProfile] = useState({
        phone: "",
        location: "",
        bio: "",
        company_name: "",
        company_website: "",
        industry: "Technology",
        company_description: "",
        image: "",
    });
    
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (user_id) {
            console.log("Fetching founder profile for user_id:", user_id);
            
            axios.get(`/api/founder-profile/${user_id}`)
                .then(res => {
                    console.log("Founder profile data fetched:", res.data);
                    const data = res.data;
                    
                    if (data.full_name || data.email) {
                        setUser({
                            full_name: data.full_name || "",
                            email: data.email || ""
                        });
                    }
                    
                    if (data) {
                        setProfile({
                            phone: data.phone || "",
                            location: data.location || "",
                            bio: data.bio || "",
                            company_name: data.company_name || "",
                            company_website: data.company_website || "",
                            industry: data.industry || "Technology",
                            company_description: data.company_description || "",
                            image: data.image || "",
                        });
                    }
                })
                .catch(err => console.error("Error fetching founder profile:", err));
        } else {
            console.warn("No user_id found in sessionStorage");
        }
    }, [user_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append("user_id", user_id);
        formData.append("phone", profile.phone);
        formData.append("location", profile.location);
        formData.append("bio", profile.bio);
        formData.append("company_name", profile.company_name);
        formData.append("company_website", profile.company_website);
        formData.append("industry", profile.industry);
        formData.append("company_size", profile.company_size);
        formData.append("company_description", profile.company_description);

        if (selectedFile) {
            formData.append("image", selectedFile);
        } else {
            formData.append("image", profile.image);
        }

        axios.post("/api/founder-profile", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
            .then((res) => {
                console.log("Founder profile saved:", res.data);
                // Update image with filename returned from server
                if (res.data.image) {
                    setProfile(prev => ({ ...prev, image: res.data.image }));
                    setSelectedFile(null);
                }
                Swal.fire("Success", "Profile updated successfully!", "success");
            })
            .catch(err => {
                console.error("Error saving founder profile:", err);
                Swal.fire("Error", "Failed to update profile", "error");
            });
    };


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setProfile(prev => ({ ...prev, image: URL.createObjectURL(file) }));
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith("blob:") || imagePath.startsWith("data:")) {
            return imagePath;
        }
        return `/public/${imagePath}`;
    };

    return (
        <DashboardLayout role="founder">
            <div className="fdp-page-header">
                <div>
                    <h1>🧑‍💼 My Profile</h1>
                    <p>Manage your personal and company information.</p>
                </div>
            </div>

            <div className="fdp-profile-page">
                <div className="fdp-header-card">
                    <div className="fdp-cover"></div>
                    <div className="fdp-avatar-section">
                        <div className="fdp-avatar-wrapper">
                            <label htmlFor="avatar-upload" className="fdp-avatar-label">
                                <div className="fdp-avatar-large">
                                    {profile.image ? (
                                        <img src={getImageUrl(profile.image)} alt="Avatar" className="fdp-avatar-img" />
                                    ) : (
                                        <span>{user?.full_name?.charAt(0) || "F"}</span>
                                    )}
                                    <div className="fdp-avatar-overlay">
                                        <span className="fdp-edit-icon">📷</span>
                                    </div>
                                </div>
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/jpeg, image/png, image/webp, image/gif"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file && (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic"))) {
                                        Swal.fire("Error", "HEIC format is not supported by browsers. Please upload a JPG or PNG.", "error");
                                        e.target.value = "";
                                        return;
                                    }
                                    handleImageChange(e);
                                }}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div className="fdp-user-info">
                            <h2>{user?.full_name}</h2>
                            <p>{profile.company_name ? `Founder at ${profile.company_name}` : "Startup Founder"}</p>
                        </div>
                    </div>
                    <div className="fdp-details">
                        <div className="fdp-details-list">
                            <span>📍 {profile.location || "Location not set"}</span>
                            <span>🏢 {profile.company_name || "Company not set"}</span>
                            <span>📅 Member</span>
                            <span>⭐ 5.0 Rating</span>
                        </div>
                    </div>
                </div>

                <div className="fdp-form-card">
                    <div className="fdp-form-section">
                        <div className="fdp-form-section-header">
                            <span className="fdp-form-section-icon">👤</span>
                            <div>
                                <h3 className="fdp-form-section-title">Personal Information</h3>
                                <p className="fdp-form-section-desc">Update your profile details and public information.</p>
                            </div>
                        </div>
                        <div className="fdp-form-grid">
                            <div className="fdp-form-group">
                                <label className="fdp-form-label">Full Name</label>
                                <input type="text" className="fdp-form-input" value={user?.full_name || ""} readOnly />
                            </div>
                            <div className="fdp-form-group">
                                <label className="fdp-form-label">Email</label>
                                <input type="email" className="fdp-form-input" value={user?.email || ""} readOnly />
                            </div>
                        </div>
                        <div className="fdp-form-group">
                            <label className="fdp-form-label">Phone</label>
                            <input name="phone" type="tel" className="fdp-form-input" placeholder="+1 (555) 123-4567" value={profile.phone} onChange={handleChange} />
                        </div>
                        <div className="fdp-form-group">
                            <label className="fdp-form-label">Location</label>
                            <input name="location" type="text" className="fdp-form-input" placeholder="San Francisco, CA" value={profile.location} onChange={handleChange} />
                        </div>
                        <div className="fdp-form-group">
                            <label className="fdp-form-label">Bio</label>
                            <textarea name="bio" className="fdp-form-input fdp-form-textarea" placeholder="Tell us about yourself..." value={profile.bio} onChange={handleChange}></textarea>
                        </div>
                    </div>

                    <div className="fdp-form-section">
                        <div className="fdp-form-section-header">
                            <span className="fdp-form-section-icon">🏢</span>
                            <div>
                                <h3 className="fdp-form-section-title">Company Information</h3>
                                <p className="fdp-form-section-desc">Details about your startup or company.</p>
                            </div>
                        </div>
                        <div className="fdp-form-group">
                            <label className="fdp-form-label">Company Name</label>
                            <input name="company_name" type="text" className="fdp-form-input" placeholder="TechVista Inc." value={profile.company_name} onChange={handleChange} />
                        </div>
                        <div className="fdp-form-group">
                            <label className="fdp-form-label">Company Website</label>
                            <input name="company_website" type="text" className="fdp-form-input" placeholder="https://techvista.io" value={profile.company_website} onChange={handleChange} />
                        </div>
                        <div className="fdp-form-grid">
                            <div className="fdp-form-group">
                                <label className="fdp-form-label">Industry</label>
                                <select name="industry" className="fdp-form-input fdp-form-select" value={profile.industry} onChange={handleChange}>
                                    {['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Marketing', 'Startup', 'Other',].map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="fdp-form-group">
                            <label className="fdp-form-label">Company Description</label>
                            <textarea name="company_description" className="fdp-form-input fdp-form-textarea" value={profile.company_description} onChange={handleChange}></textarea>
                        </div>
                    </div>

                    <div className="fdp-save-btn-container">
                        <button onClick={handleSave}>Save Profile Changes</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FounderProfile;