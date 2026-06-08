import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/match.css";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Swal from "sweetalert2";
import { Sparkles, User, CheckCircle2, XCircle, MoveLeft, ChevronRight, UserPlus } from "lucide-react";

const SmartMatching = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState({});
    const { id } = useParams();
    const navigate = useNavigate();

    // Get current founder securely from session storage first, fallback to local storage
    const founderId = sessionStorage.getItem("user_id") || JSON.parse(localStorage.getItem('user') || '{}').user_id;

    useEffect(() => {
        axios
            .get(`/api/match/${id}`)
            .then((res) => {
                setData(res.data.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    const handleInvite = async (freelancerId) => {
        if (!founderId) {
            Swal.fire({
                icon: "error",
                title: "Session Expired",
                text: "Please log in again."
            });
            return;
        }

        setInviting(prev => ({ ...prev, [freelancerId]: 'loading' }));

        try {
            const res = await axios.post("/api/invite", {
                project_id: id,
                freelancer_id: freelancerId,
                founder_id: founderId
            });
            
            if (res.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Success",
                    text: "Invitation sent successfully!",
                    timer: 2000,
                    showConfirmButton: false
                });
                setInviting(prev => ({ ...prev, [freelancerId]: 'success' }));
            }
        } catch (err) {
            if (err.response && err.response.status === 400) {
                Swal.fire({
                    icon: "info",
                    title: "Already Invited",
                    text: err.response.data.message
                });
                setInviting(prev => ({ ...prev, [freelancerId]: 'success' }));
            } else {
                console.error(err);
                Swal.fire({
                    icon: "error",
                    title: "Action Failed",
                    text: "Failed to send invitation. Please try again."
                });
                setInviting(prev => ({ ...prev, [freelancerId]: null }));
            }
        }
    };

    const getScoreColorClass = (score) => {
        if (score >= 75) return "score-excellent";
        if (score >= 50) return "score-good";
        return "score-fair";
    };

    return (
        <DashboardLayout role="founder">
            <div className="match-page-wrapper">
                <div className="match-page-header">
                    <div>
                        <button className="back-button" onClick={() => navigate(-1)}>
                            <MoveLeft size={18} /> Back to Projects
                        </button>
                        <h1 className="match-title">
                            <Sparkles className="title-icon" /> AI Smart Matching
                        </h1>
                        <p className="match-subtitle">Discover top-tier freelancers perfectly aligned with your project requirements.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="match-loading">
                        <div className="spinner"></div>
                        <p>Analyzing profiles and calculating match scores...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="match-empty">
                        <User size={48} className="empty-icon" />
                        <h3>No matches found</h3>
                        <p>We couldn't find freelancers that match your project requirements. Try broadening your project skills.</p>
                    </div>
                ) : (
                    <div className="match-card-grid">
                        {data.map((f, index) => {
                            const scoreClass = getScoreColorClass(f.score);
                            const inviteState = inviting[f.user_id];

                            return (
                                <div key={f.user_id} className={`match-card fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="match-card-top">
                                        <div className="freelancer-info">
                                            <div className="avatar-wrapper">
                                                {f.image ? (
                                                    <img src={`/public/${f.image}`} alt={f.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <User size={24} className="avatar-icon" />
                                                )}
                                            </div>
                                            <div>
                                                <h3>{f.full_name || "Unknown Freelancer"}</h3>
                                                {f.title && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{f.title}</p>}
                                                <span className={`match-badge ${scoreClass}`}>
                                                    {f.score >= 75 ? "Top Match" : f.score >= 50 ? "Great Match" : "Potential"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`score-ring ${scoreClass}`}>
                                            <svg viewBox="0 0 36 36" className="circular-chart">
                                                <path className="circle-bg"
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <path className="circle"
                                                    strokeDasharray={`${f.score}, 100`}
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                <text x="18" y="20.35" className="percentage">{Math.round(f.score)}%</text>
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="skills-section">
                                        <div className="skills-list">
                                            <p className="skills-label"><CheckCircle2 size={16} className="text-success" /> Matched Skills ({f.matchedSkills?.length || 0})</p>
                                            <div className="skills-chips">
                                                {f.matchedSkills?.length > 0 ? (
                                                    f.matchedSkills.map((skill, i) => <span key={i} className="chip chip-success">{skill}</span>)
                                                ) : (
                                                    <span className="no-skills">-</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="skills-list">
                                            <p className="skills-label"><XCircle size={16} className="text-danger" /> Missing Skills ({f.missingSkills?.length || 0})</p>
                                            <div className="skills-chips">
                                                {f.missingSkills?.length > 0 ? (
                                                    f.missingSkills.map((skill, i) => <span key={i} className="chip chip-danger">{skill}</span>)
                                                ) : (
                                                    <span className="no-skills">None! Perfect fit.</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="match-card-actions">
                                        <button className="match-btn btn-outline" onClick={() => navigate('/freelancer/profile/' + f.user_id)}>
                                            View Profile <ChevronRight size={16} />
                                        </button>
                                        <button 
                                            className={`match-btn ${inviteState === 'success' ? 'btn-success' : 'btn-primary'}`}
                                            onClick={() => handleInvite(f.user_id)}
                                            disabled={inviteState === 'loading' || inviteState === 'success'}
                                        >
                                            {inviteState === 'loading' ? 'Inviting...' : inviteState === 'success' ? 'Invited ✅' : <><UserPlus size={16} /> Invite</>}
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

export default SmartMatching;