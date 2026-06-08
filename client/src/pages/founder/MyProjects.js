import '../../styles/MyProjects.css';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SearchBar from '../../components/common/SearchBar';

import axios from "axios";

import { useNavigate } from 'react-router-dom';

const MyProjects = () => {

    const [projects, setProjects] = useState([]);
    const [expanded, setExpanded] = useState({});
    const navigate = useNavigate();

    // Load Projects
    useEffect(() => {

        const userId = sessionStorage.getItem("user_id");

        axios.get(`/api/myProject/${userId}`)
            .then(res => setProjects(res.data.data))
            .catch(err => console.log(err));

    }, []);

    // Toggle description
    const toggleDescription = (id) => {
        setExpanded(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Edit
    const handleEdit = (id) => {
        navigate(`/founder/edit-project/${id}`);
    };

    // Delete
    const handleDelete = (id) => {

        if (!window.confirm("Delete this project?")) return;

        axios.delete(`/api/project/${id}`)
            .then(() => {

                setProjects(prev =>
                    prev.filter(project => project.project_id !== id)
                );

                alert("Project deleted successfully");

            })
            .catch(err => console.log(err));
    };
    const [search,setSearch] = useState("");

    const filter = projects.filter((val)=>{
        return val.title.toLowerCase().includes(search.toLowerCase()) || val.required_skills.toLowerCase().includes(search.toLowerCase())
    })
    return (
        <DashboardLayout role="founder">
            <div className="MyProjects-scope">

            <div className="page-header">
                <div>
                    <h1>My Projects</h1>
                    <p>Manage and track all your posted projects.</p>
                </div>

                <button className="btn btn-primary" onClick={() => navigate('/founder/post-project')}
                >
                    + New Project
                </button>
            </div>

            <div className="table-container">
                <SearchBar placeholder="Search projects..." value={search} onChange={(e)=>setSearch(e.target.value)} />
            </div>

            {/* PROJECT CARDS */}

            <div className="projects-grid">

                {filter.map((val) => {

                    const isExpanded = expanded[val.project_id];
                    const description = isExpanded
                        ? val.description
                        : val.description.slice(0, 120) + "...";

                    return (

                        <div className="project-card" key={val.project_id}>

                            <h2 className="project-title">
                                {val.title}
                            </h2>

                            <p className="project-description">

                                {description}

                                <span
                                    className="show-more"
                                    onClick={() => toggleDescription(val.project_id)}
                                >
                                    {isExpanded ? " Show Less" : " Show More"}
                                </span>

                            </p>


                            {/* Skills */}

                            <div className="skills">
                                {val.required_skills.split(",").map((skill, index) => (
                                    <span key={index} className="skill-tag">
                                        {skill}
                                    </span>
                                ))}

                            </div>

                            <p className="project-budget">
                                <strong>Budget:</strong> ₹{val.budget_min} - ₹{val.budget_max}
                            </p>

                            <p className="project-duration">
                                <strong>Duration:</strong> {val.duration_weeks} weeks
                            </p>

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

                            <p className="status-line">
                               <strong>Status:</strong>  <span className="status active">Active</span>
                            </p>

                            <div className="uploadFile">
                                File: {val.upload_file ? (
                                    <a href={`/public/${val.upload_file}`} target="_blank" rel="noopener noreferrer">
                                        {val.upload_file}
                                    </a>
                                ) : (
                                    <span>No file uploaded</span>
                                )}
                            </div>
                          
                            <div className="project-actions">

                                <button
                                    onClick={() => navigate(`/founder/smart-matching/${val.project_id}`)}
                                    style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    ✨ Smart Match
                                </button>

                                <button
                                    className="edit-btn"
                                    onClick={() => handleEdit(val.project_id)}
                                >
                                    Edit
                                </button>

                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(val.project_id)}
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    );
                })}

            </div>

                    </div>
        </DashboardLayout>
    );
};

export default MyProjects;