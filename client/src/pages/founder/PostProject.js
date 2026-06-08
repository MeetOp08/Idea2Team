import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';

import axios from 'axios';
import Swal from 'sweetalert2';
import '../../styles/PostProject.css';
import {useState} from "react";



const PostProject = () => {
    const[fileName,setFile] = useState("");
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState("");

    const handleAddSkill = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                setSkills([...skills, skillInput.trim()]);
            }
            setSkillInput("");
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };


    const handleFile = (e)=>{
         const file = e.target.files[0];

        if(!file){
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "image/png",
            "image/jpeg"
        ]

        if(!allowedTypes.includes(file.type)){
            alert("please add in pdf or image formet");
            return;
        }

        if(file.size > 2 * 1024 * 1024){
            alert("file size not more than 2mb");
            return;
        }

        setFile(file.name);
    };
function cleanSkills(skills) {
  return skills
    .toLowerCase()
    .replace(/\.js/g, "")
    .replace(/\s+/g, "")
    .split(",")
    .map(s => s.trim())
    .join(",");
}
    function handlePublish() {

    const founder_id = sessionStorage.getItem("user_id");
    const title = document.querySelector("#title").value;
    const description = document.querySelector("#description").value;
    const category = document.querySelector("#category").value;
    const rawSkills = skills.join(",");
    const required_skills = cleanSkills(rawSkills);
    const project_stage = document.querySelector("#project_stage").value;
    const collaboration_type = document.querySelector("#collaboration_type").value;
    const experience_level = document.querySelector("#experience_level").value;
    const budget_min = document.querySelector("#budget_min").value;
    const budget_max = document.querySelector("#budget_max").value;
    const duration_weeks = document.querySelector("#duration_weeks").value;
    const team_members_required = document.querySelector("#team_members_required").value;
    const upload_file = document.querySelector("#upload_file").files[0];

    // Default application deadline = 7 days from today
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 7);
    const application_deadline = defaultDeadline.toISOString().split('T')[0];

    // ✅ Validation
    if (!founder_id || !title || !description || !category || !required_skills || !project_stage || !budget_min || !budget_max || !duration_weeks) {
        Swal.fire("Error", "Please fill all required fields", "error");
        return;
    }

    if (Number(budget_min) > Number(budget_max)) {
    Swal.fire("Error", "Min budget cannot be greater than max budget", "error");
    return;
}

    const formData = new FormData();

    formData.append("founder_id", founder_id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("required_skills", required_skills);
    formData.append("project_stage", project_stage);
    formData.append("collaboration_type", collaboration_type);
    formData.append("experience_level", experience_level);
    formData.append("budget_min", budget_min);
    formData.append("budget_max", budget_max);
    formData.append("duration_weeks", duration_weeks);
    formData.append("team_members_required", team_members_required);
    formData.append("application_deadline", application_deadline);

    if (upload_file) {
        formData.append("upload_file", upload_file);
    }

    axios.post("/api/post-project", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
    .then(() => {
        Swal.fire("Success", "Project posted successfully!", "success");
    })
    .catch((err) => {
        console.log(err);
        Swal.fire("Error", "Upload failed", "error");
    });
}


    return (
        <DashboardLayout role="founder"     >
            <div className="PostProject-scope">
            <div className="page-header">
                <div className="h1">
                    <h1>Post a New Project</h1>
                </div>
                
            </div>

            <div className="pp-container">

                <div className="pp-card">

                    {/* BASIC DETAILS */}

                    <div className="pp-section">

                        <h3 className="pp-section-title">📋 Basic Details</h3>

                        <div className="pp-grid-2">

                            <div className="pp-field">
                                <label className="pp-label">Project Title</label>
                                <input id="title" type="text" className="pp-input" placeholder="Enter project title" />
                            </div>

                            <div className="pp-field">
                                <label className="pp-label">Category</label>
                                <select id="category" className="pp-input">
                                    <option>Web Development</option>
                                    <option>Mobile App Development</option>
                                    <option>UI/UX Design</option>
                                    <option>Graphic Design</option>
                                </select>
                            </div>

                        </div>

                        <div className="pp-field">
                            <label className="pp-label">Description</label>
                            <textarea id="description" className="pp-textarea"></textarea>
                        </div>

                    </div>


                    {/* PROJECT DETAILS */}

                    <div className="pp-section">

                        <h3 className="pp-section-title">⚙ Project Details</h3>

                        <div className="pp-grid-3">

                            <div className="pp-field">
                                <label className="pp-label">Project Stage</label>
                                <select id="project_stage" className="pp-input">
                                    <option>Idea</option>
                                    <option>Prototype</option>
                                    <option>Launch</option>
                                </select>
                            </div>

                            <div className="pp-field">
                                <label className="pp-label">Collaboration</label>
                                <select id="collaboration_type" className="pp-input">
                                    <option>Paid</option>
                                    <option>Equity</option>
                                    <option>Learning</option>
                                </select>
                            </div>

                            <div className="pp-field">
                                <label className="pp-label">Experience</label>
                                <select id="experience_level" className="pp-input">
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Expert</option>
                                </select>
                            </div>

                        </div>

                    </div>


                    {/* BUDGET & DEADLINES */}

                    <div className="pp-section">

                        <h3 className="pp-section-title">💰 Budget & Timeline</h3>

                        <div className="pp-grid-3">

                            <div className="pp-field">
                                <label className="pp-label">Min Budget</label>
                                <input id="budget_min" type="number" className="pp-input" />
                            </div>

                            <div className="pp-field">
                                <label className="pp-label">Max Budget</label>
                                <input id="budget_max" type="number" className="pp-input" />
                            </div>

                            <div className="pp-field">
                                <label className="pp-label">Duration (weeks)</label>
                                <input id="duration_weeks" type="number" className="pp-input" />
                            </div>

                            <div className="pp-field">
                                <label className="pp-label">Team Members</label>
                                <input id="team_members_required" type="number" className="pp-input" defaultValue="1" />
                            </div>

                        </div>

                    </div>


                    {/* SKILLS */}

                    <div className="pp-section pp-skills-section">

                        <h3 className="pp-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                            <span className="icon-box" style={{ 
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                                width: '32px', height: '32px', background: '#f4f5f8', borderRadius: '8px', fontSize: '14px' 
                            }}>⚡</span> 
                            Skills & Expertise
                        </h3>

                        <div className="pp-field">
                            <input
                                id="required_skills_input"
                                type="text"
                                className="pp-input skills-input-field"
                                placeholder="react,node,mongodb (comma separated)"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={handleAddSkill}
                            />
                            
                            {skills.length > 0 && (
                                <div className="skills-tags-container">
                                    {skills.map((skill, index) => (
                                        <span key={index} className="skill-tag">
                                            {skill}
                                            <button type="button" className="remove-skill-btn" onClick={() => handleRemoveSkill(skill)}>
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>


                    {/* ACTION BUTTONS */}
                    <label htmlFor="upload_file" className="upload-label">
                        .pdf/jpeg
                    </label>
                    <div className="Addfile" >
                            <input onChange={handleFile} type="file" accept=".pdf , image/*" id="upload_file" hidden required/>
                            <p style={{color:"black" , margin:"4px 0px 0px 4px " }}>
                                {fileName || "No file select" }
                            </p>
                    </div>

                    <div className="pp-actions">
                    
                        <button className="btn btn-secondary" onClick={() => handlePublish()}>
                            Save Draft
                        </button>

                        <button className="btn btn-primary" onClick={() => handlePublish()}>
                            Publish
                        </button>

                    </div>

                </div>

            </div>
                    </div>
        </DashboardLayout>
    );
};

export default PostProject;