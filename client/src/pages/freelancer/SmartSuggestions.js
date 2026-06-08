import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Sparkles, Briefcase, CheckCircle2, XCircle, ChevronRight, ArrowRight } from "lucide-react";
import "../../styles/match.css";

const SmartSuggestions = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const freelancerId = sessionStorage.getItem('user_id') || currentUser.user_id;

    useEffect(() => {
        if (!freelancerId) {
            setLoading(false);
            return;
        }

        axios
            .get(`/api/recommended-projects/${freelancerId}`)
            .then((res) => {
                setProjects(res.data.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [freelancerId]);

    const getScoreColorClass = (score) => {
        if (score >= 75) return "score-excellent";
        if (score >= 50) return "score-good";
        return "score-fair";
    };

    return (
        <DashboardLayout role="freelancer">
            <div className="match-page-wrapper">
                <div className="match-page-header">
                    <div>
                        <h1 className="match-title">
                            <Sparkles className="title-icon" /> AI Smart Suggestions
                        </h1>
                        <p className="match-subtitle">Discover the perfect projects matching your unique skill set.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="match-loading">
                        <div className="spinner"></div>
                        <p>Analyzing your skills against active projects...</p>
                    </div>
                ) : !freelancerId ? (
                    <div className="match-empty">
                        <p>Please log in to see your recommendations.</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="match-empty">
                        <Briefcase size={48} className="empty-icon" />
                        <h3>No perfect matches found</h3>
                        <p>Try adding more skills to your profile or checking back later.</p>
                        <button className="match-btn btn-primary" onClick={() => navigate('/freelancer/browse')} style={{ marginTop: '1rem' }}>
                            Browse All Projects
                        </button>
                    </div>
                ) : (
                    <div className="match-card-grid">
                        {projects.map((p, index) => {
                            const scoreClass = getScoreColorClass(p.score);

                            return (
                                <div key={p.project_id} className={`match-card fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="match-card-top">
                                        <div className="freelancer-info">
                                            <div className="avatar-wrapper">
                                                <Briefcase size={24} className="avatar-icon" />
                                            </div>
                                            <div>
                                                <h3>{p.title}</h3>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                                    {p.experience_level || "Any Experience"} • Budget: {p.budget}
                                                </p>
                                                <span className={`match-badge ${scoreClass}`}>
                                                    {p.score >= 75 ? "Top Match" : p.score >= 50 ? "Great Match" : "Potential"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`score-ring ${scoreClass}`}>
                                            <svg viewBox="0 0 36 36" className="circular-chart">
                                                <path className="circle-bg"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path className="circle"
                                                    strokeDasharray={`${p.score}, 100`}
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <text x="18" y="20.35" className="percentage">{Math.round(p.score)}%</text>
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="skills-section">
                                        <div className="skills-list">
                                            <p className="skills-label"><CheckCircle2 size={16} className="text-success" /> Matched Skills ({p.matchedSkills?.length || 0})</p>
                                            <div className="skills-chips">
                                                {p.matchedSkills?.length > 0 ? (
                                                    p.matchedSkills.map((skill, i) => <span key={i} className="chip chip-success">{skill}</span>)
                                                ) : (
                                                    <span className="no-skills">-</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="skills-list">
                                            <p className="skills-label"><XCircle size={16} className="text-danger" /> Missing Skills ({p.missingSkills?.length || 0})</p>
                                            <div className="skills-chips">
                                                {p.missingSkills?.length > 0 ? (
                                                    p.missingSkills.map((skill, i) => <span key={i} className="chip chip-danger">{skill}</span>)
                                                ) : (
                                                    <span className="no-skills">None! Perfect fit.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="match-card-actions">
                                        <button className="match-btn btn-primary" onClick={() => navigate('/apply-project/' + p.project_id)}>
                                            <ArrowRight size={16} /> Apply Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SmartSuggestions;
