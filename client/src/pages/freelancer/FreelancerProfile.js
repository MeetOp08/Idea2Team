import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import axios from "axios";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";
import '../../styles/FreelancerProfile.css';

const FreelancerProfile = () => {
    const { id } = useParams();
    const isPublicView = Boolean(id);
    const user_id = id || sessionStorage.getItem("user_id") || JSON.parse(localStorage.getItem('user') || '{}').user_id;
    const [user, setUser] = useState({});
    const [profile, setProfile] = useState({
        title: "",
        location: "",
        bio: "",
        contact_info: "",
        skills: "[]",
        experience: "",
        pricing: "",
        availability: "",
        github: "",
        linkedin: "",
        portfolio: "",
        image: "",
        resume:""
    });

    const [newSkill, setNewSkill] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedResume, setSelectedResume] = useState(null);

    useEffect(() => {
        if (user_id) {
            axios.get(`/api/userinfo/${user_id}`)
                .then(res => setUser(res.data.data))
                .catch(err => console.error(err));

            axios.get(`/api/profile/${user_id}`)
                .then(res => {
                    if (res.data && res.data.user_id) {
                        setProfile({
                            ...res.data,
                            skills: res.data.skills || "[]",
                            github: res.data.github || "",
                            linkedin: res.data.linkedin || "",
                            portfolio: res.data.portfolio || "",
                            image: res.data.image || "",
                            resume: res.data.resume || ""
                        });
                    }
                })
                .catch(err => console.error(err));
        }
    }, [user_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append("user_id", user_id);
        formData.append("title", profile.title || "");
        formData.append("location", profile.location || "");
        formData.append("bio", profile.bio || "");
        formData.append("contact_info", profile.contact_info || "");
        formData.append("skills", profile.skills || "[]");
        formData.append("experience", profile.experience || "");
        formData.append("github", profile.github || "");
        formData.append("linkedin", profile.linkedin || "");
        formData.append("portfolio", profile.portfolio || "");

        if (selectedFile) {
            formData.append("image", selectedFile);
        } else {
            formData.append("image", profile.image || "");
        }

        if (selectedResume) {
            formData.append("resume", selectedResume);
        } else {
            formData.append("resume", profile.resume || "");
        }

        axios.post("/api/profile", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
            .then(() => {
                Swal.fire("Success", "Profile updated successfully!", "success");
            })
            .catch(err => {
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

    let skillsList = [];
    try {
        if (typeof profile.skills === 'string') {
            skillsList = JSON.parse(profile.skills || "[]");
            if (!Array.isArray(skillsList)) skillsList = [];
        } else if (Array.isArray(profile.skills)) {
            skillsList = profile.skills;
        }
    } catch (e) {
        if (typeof profile.skills === 'string') {
            skillsList = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    const addSkill = (e) => {
        if (e.key === 'Enter' && newSkill.trim()) {
            const updatedSkills = [...skillsList, newSkill.trim()];
            setProfile(prev => ({ ...prev, skills: JSON.stringify(updatedSkills) }));
            setNewSkill("");
        }
    };
    const removeSkill = (index) => {
        const updatedSkills = skillsList.filter((_, i) => i !== index);
        setProfile(prev => ({ ...prev, skills: JSON.stringify(updatedSkills) }));
    };

    return (
        <DashboardLayout role="freelancer">
            <div className="fp-page-header">
                <div>
                    <h1>{isPublicView ? "👩‍💻 Freelancer Profile" : "👩‍💻 My Profile"}</h1>
                    <p>{isPublicView ? "Review this freelancer's skills and experience." : "Showcase your skills and attract the right projects."}</p>
                </div>
            </div>

            <div className="fp-profile-page">
                <div className="fp-header-card">
                    <div className="fp-cover"></div>
                    <div className="fp-avatar-section">
                        <label htmlFor="avatar-upload" className="fp-avatar-label">
                            <div className="fp-avatar-large">
                                {profile.image ? (
                                    <img src={getImageUrl(profile.image)} alt="Avatar" className="fp-avatar-img" />
                                ) : (
                                    user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : "FP"
                                )}
                                {!isPublicView && (
                                    <div className="fp-avatar-overlay">
                                        <span className="fp-edit-icon">📷</span>
                                    </div>
                                )}
                            </div>
                        </label>
                        {!isPublicView && (
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        )}
                        <div className="fp-user-info">
                            <h2>{user?.full_name}</h2>
                            <p>{profile.title || "Professional Freelancer"}</p>
                        </div>
                    </div>
                </div>

                <div className="fp-form-card">
                    <div className="fp-form-section">
                        <div className="fp-form-section-header">
                            <span className="fp-form-section-icon">👤</span>
                            <h3 className="fp-form-section-title">Personal & Contact Info</h3>
                        </div>
                        <div className="fp-form-grid">
                            <div className="fp-form-group">
                                <label className="fp-form-label">Full Name</label>
                                <input type="text" className="fp-form-input" value={user?.full_name || ""} readOnly />
                            </div>
                            <div className="fp-form-group">
                                <label className="fp-form-label">Email</label>
                                <input type="email" className="fp-form-input" value={user?.email || ""} readOnly />
                            </div>
                        </div>
                        <div className="fp-form-grid">
                            <div className="fp-form-group">
                                <label className="fp-form-label">Location</label>
                                <input name="location" type="text" className="fp-form-input" value={profile.location} onChange={handleChange} placeholder="e.g. New York, NY" readOnly={isPublicView} />
                            </div>
                            <div className="fp-form-group">
                                <label className="fp-form-label">Contact/Phone</label>
                                <input name="contact_info" type="text" className="fp-form-input" value={profile.contact_info} onChange={handleChange} placeholder="e.g. +1 234 567 890" readOnly={isPublicView} />
                            </div>
                        </div>
                        <div className="fp-form-group">
                            <label className="fp-form-label">Professional Title</label>
                            <input name="title" type="text" className="fp-form-input" value={profile.title} onChange={handleChange} placeholder="e.g. Full-Stack Developer" readOnly={isPublicView} />
                        </div>
                        <div className="fp-form-group">
                            <label className="fp-form-label">Bio</label>
                            <textarea name="bio" className="fp-form-input fp-form-textarea" value={profile.bio} onChange={handleChange} placeholder="Tell us about yourself..." readOnly={isPublicView} />
                        </div>
                    </div>

                    <div className="fp-form-section">
                        <div className="fp-form-section-header">
                            <span className="fp-form-section-icon">⚡</span>
                            <h3 className="fp-form-section-title">Skills & Expertise</h3>
                        </div>

                        {!isPublicView && (
                            <div className="fp-form-group">
                                <input
                                    type="text"
                                    className="fp-form-input"
                                    placeholder="react,node,mongodb (comma separated)"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyPress={addSkill}
                                />
                            </div>
                        )}
                        <div className="fp-skills-container">
                            {skillsList.map((s, i) => (
                                <span key={i} className="fp-skill-tag">
                                    {s} {!isPublicView && <span className="fp-skill-remove-btn" onClick={() => removeSkill(i)}>✕</span>}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="fp-form-section">
                        <div className="fp-form-section-header">
                            <span className="fp-form-section-icon">💼</span>
                            <h3 className="fp-form-section-title">Experience & Social</h3>
                        </div>
                        <div className="fp-form-grid">
                            <div className="fp-form-group">
                                <label className="fp-form-label">Experience (Years)</label>
                                <input name="experience" type="text" className="fp-form-input" value={profile.experience} onChange={handleChange} placeholder="e.g. 5 years" readOnly={isPublicView} />
                            </div>
                        </div>
                        <div className="fp-form-grid">
                            <div className="fp-form-group">
                                <label className="fp-form-label">GitHub URL  {
                                    profile.github && (
                                        <a href={profile.github || undefined}
                                            target="_blank"
                                            rel ="nooper noreferrer">
                                          🔗view 
                                        </a>
                                    )
                                }</label>
                                
                                <input name="github" type="url" className="fp-form-input" value={profile.github} onChange={handleChange} placeholder="https://github.com/username" readOnly={isPublicView} />
                            </div>


                            <div className="fp-form-group">
                                <label className="fp-form-label">LinkedIn URL {
                                    profile.linkedin && (
                                        <a href={profile.linkedin || undefined}
                                            target="_blank"
                                            rel ="nooper noreferrer">
                                          🔗view 
                                        </a>
                                    )
                                }</label>
                                <input name="linkedin" type="url" className="fp-form-input" value={profile.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" readOnly={isPublicView} />
                            </div>


                            <div className="fp-form-group">
                                <label className="fp-form-label">Portfolio URL {
                                  
                                    profile.portfolio && (
                                        <a href={profile.portfolio || undefined}
                                            target="_blank"
                                            rel ="nooper noreferrer">
                                          🔗view 
                                        </a>
                                    )}</label>
                                <input name="portfolio" type="url" className="fp-form-input" value={profile.portfolio} onChange={handleChange} placeholder="https://yourportfolio.com" readOnly={isPublicView} />
                            </div>

                            <div className="fp-form-group">
                                <label className="fp-form-label">{isPublicView ? "Resume" : "Add resume"} {
                                    profile.resume && (
                                        <a href={profile.resume ? `/public/${profile.resume}` : undefined}
                                            target="_blank"
                                            rel="noreferrer">
                                          🔗view 
                                        </a>
                                    )
                                }</label>
                                {!isPublicView ? (
                                    <input name="resume" type="file" className="fp-form-input" onChange={(e) => setSelectedResume(e.target.files[0])} />
                                ) : (
                                    <input type="text" className="fp-form-input" value={profile.resume ? 'Resume Available' : 'No Resume Provided'} readOnly />
                                )}
                            </div>
                        </div>
                    </div>

                    {!isPublicView && (
                        <div style={{ textAlign: "right", marginTop: "20px" }}>
                            <button onClick={handleSave}>Save Profile Changes</button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};


export default FreelancerProfile;