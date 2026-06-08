import '../../styles/BrowseProjects.css';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SearchBar from '../../components/common/SearchBar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BrowseProjects = () => {

    const [projects, setProjects] = useState([]);
    const [appliedProjects, setAppliedProjects] = useState([]);
    const [expanded, setExpanded] = useState({});
    const navigate = useNavigate();

    /* ===============================
       FETCH PROJECTS & APPLICATIONS
    ================================ */

    useEffect(() => {
        // Fetch Projects
        axios.get("/api/projects")
            .then(res => {
                setProjects(res.data.data);
            })
            .catch(err => console.log(err));
            
        // Fetch freelancer's applied projects
        const userStr = sessionStorage.getItem("user") || localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            const user_id = user.id || user.user_id;
            if (user_id) {
                axios.get(`/api/freelancer/myapplication/${user_id}`)
                    .then(res => {
                        const ids = res.data.data.map(app => app.project_id);
                        setAppliedProjects(ids);
                    })
                    .catch(err => console.error("Error fetching applied projects", err));
            }
        }
    }, []);

    // Toggle description
    const toggleDescription = (id) => {
        setExpanded(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    /* ===============================
       APPLY PROJECT
    ================================ */

    const handleApply = (id) => {
        navigate(`/apply-project/${id}`);
    };

    const[search,setSearch] = useState("");
    const filter = projects.filter((val)=>{
        return val.title.toLowerCase().includes(search.toLowerCase()) || val.required_skills.toLowerCase().includes(search.toLowerCase())
    })
    return (
        <DashboardLayout role="freelancer">
            <div className="BrowseProjects-scope">
            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h1>🔍 Browse Projects</h1>
                    <p>Discover projects that match your skills and interests.</p>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="table-container">
                <SearchBar placeholder="Search projects by title, skill, or company..." style={{ flex: 1 }} value={search} onChange={(e)=>setSearch(e.target.value)}/>
            </div>

            {/* PROJECT CARDS */}
            <div className="projects-grid">
                {filter.length === 0 ? (
                    <p>No projects available.</p>
                ) : (
                    filter.map((val) => {
                        const isExpanded = expanded[val.project_id];
                        const description = val.description ? (isExpanded ? val.description : val.description.slice(0, 120) + "...") : "";

                        return (
                            <div className="project-card" key={val.project_id}>
                                <h2 className="project-title">
                                    {val.title}
                                </h2>

                                <p className="project-description">
                                    {description}
                                    {val.description && val.description.length > 120 && (
                                        <span
                                            className="show-more"
                                            onClick={() => toggleDescription(val.project_id)}
                                        >
                                            {isExpanded ? " Show Less" : " Show More"}
                                        </span>
                                    )}
                                </p>

                                <p className="project-founder">
                                    <strong>Founder:</strong> {val.founder_name}
                                </p>

                                {/* Skills */}
                                <div className="skills">
                                    {val.required_skills?.split(',').map((skill, index) => (
                                        <span key={index} className="skill-tag">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>

                                <p className="project-budget">
                                    <strong>Budget:</strong> ₹{val.budget_min} - ₹{val.budget_max}
                                </p>

                                <p className="project-duration">
                                    <strong>Duration:</strong> {val.duration_weeks} weeks
                                </p>

                                {/* Deadline Info */}
                                {val.application_deadline && (() => {
                                    const deadlineDate = new Date(val.application_deadline);
                                    deadlineDate.setHours(23, 59, 59, 999);
                                    const now = new Date();
                                    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
                                    const isPast = now > deadlineDate;
                                    return (
                                        <p className="project-deadline" style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                                            background: isPast ? '#fef2f2' : daysLeft <= 3 ? '#fffbeb' : '#f0fdf4',
                                            color: isPast ? '#991b1b' : daysLeft <= 3 ? '#92400e' : '#166534',
                                            margin: '10px 0'
                                        }}>
                                            📅 Apply by: {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            {isPast ? ' — Closed' : ` — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                                        </p>
                                    );
                                })()}




                                <div className="project-team" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0' }}>
                                    <div style={{ flex: 1, background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            width: `${Math.min(((val.members_joined || 0) / (val.team_members_required || 1)) * 100, 100)}%`, 
                                            background: val.members_joined >= val.team_members_required ? '#10b981' : '#6366f1', 
                                            height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' 
                                        }}></div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563', whiteSpace: 'nowrap' }}>
                                        {val.members_joined || 0} / {val.team_members_required} Members Joined
                                    </div>
                                </div>

                                <div className="status-line">
                                    Status: <span className="status active">{val.status || 'Active'}</span>
                                </div>

                                <div className="project-actions">
                                    {(() => {
                                        const deadlinePassed = val.application_deadline && new Date() > new Date(new Date(val.application_deadline).setHours(23, 59, 59, 999));
                                        if (appliedProjects.includes(val.project_id)) {
                                            return (
                                                <button className="edit-btn" style={{ width: '100%', background: '#9ca3af', borderColor: '#9ca3af', cursor: 'not-allowed', color: 'white' }} disabled>
                                                    Already Applied
                                                </button>
                                            );
                                        } else if (deadlinePassed) {
                                            return (
                                                <button className="edit-btn" style={{ width: '100%', background: '#ef4444', borderColor: '#ef4444', cursor: 'not-allowed', color: 'white' }} disabled>
                                                    🔒 Applications Closed
                                                </button>
                                            );
                                        } else {
                                            return (
                                                <button className="edit-btn" style={{ width: '100%' }} onClick={() => handleApply(val.project_id)}>
                                                    Apply Now
                                                </button>
                                            );
                                        }
                                    })()}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
                    </div>
        </DashboardLayout>
    );
};

export default BrowseProjects;