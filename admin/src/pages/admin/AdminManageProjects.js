import DashboardLayout from '../../components/layout/DashboardLayout';
import { useState, useEffect } from 'react';
import axios from "axios";
import '../../styles/ManageProjects.css';
import SearchBar from '../../components/common/SearchBar';

const AdminManageProjects = () => {

    const [projects, setProjects] = useState([]);

    // ✅ Fetch projects only once
    useEffect(() => {
        axios.get("/api/manage-project")
            .then(response => {
                setProjects(response.data.data);
            })
            .catch(error => {
                console.error("Error fetching projects:", error);
            });
    }, []); // ✅ IMPORTANT

    // ✅ View Project
    const handleView = (id) => {
        const project = projects.find(p => p.project_id === id);

        if (project) {
            alert(
`Project Details:

Project ID: ${project.project_id}
Title: ${project.title}
Description: ${project.description}
Category: ${project.category}
Required Skills: ${project.required_skills}
Budget: ${project.budget_min} - ${project.budget_max}
Duration: ${project.duration_weeks} weeks
`
            );
}

        console.log("Project Details:", "\nProject ID:", id,
            "\nTitle:", project.title,
            "\nDescription:", project.description,
            "\nCategory:", project.category,
            "\nRequired Skills:", project.required_skills,
            "\nBudget:", project.budget_min, "-", project.budget_max,
            "\nDuration:", project.duration_weeks, "weeks"
        );
    };


    // ✅ Send Warning
    const handleWarning = (id) => {
        const warningMessage = prompt("Enter warning message:");

        if (warningMessage) {
            alert(`Warning sent to project ID: ${id}\nMessage: ${warningMessage}`);
        }
        console.log(`Warning sent to project ID: ${id}\nMessage: ${warningMessage}`);
    };

    // ✅ Block Project
const handleStatus = (id) => {
    axios.put(`/api/status-project/${id}`)
        .then(() => {
            setProjects(prevProjects =>
                prevProjects.map(project =>
                    project.project_id === id
                        ? {     
                            ...project, 
                            status: project.status === "active" ? "closed" : "active" 
                          }
                        : project
                )
            );
        })
        .catch(err => console.log(err));
};
    return (
        <DashboardLayout role="admin">

            <div className="page-header">
                <div>
                    <h1>Manage Projects</h1>
                    <p>Review and moderate all projects on the platform.</p>
                </div>
            </div>

            <div className="filter-bar">
                <SearchBar placeholder="Search projects..." />
                <div className="filter-chips">
                    {['All', 'Active', 'Pending', 'Completed'].map(f => (
                        <button key={f} className="filter-chip active">{f}</button>
                    ))}
                </div>
            </div>

            <div className="table">
                <table className="project-table">
                    <thead>
                        <tr>
                            <th>Index</th>
                            <th>Project Title</th>
                            <th>description</th>
                            <th>Category</th>
                            <th>Required Skills</th>
                            <th>Budget</th>
                            <th>Actions</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
  {projects.length > 0 ? (
    projects.map((val, index) => (
      <tr key={val.project_id}>
        <td>{index + 1}</td>
        <td>{val.title}</td>
        <td>{val.description}</td>
        <td>{val.category}</td>
        <td>{val.required_skills}</td>
        <td>{val.budget_min} - {val.budget_max}</td>
        <td className="btns">
          <button className="action-btn view"
            onClick={() => handleView(val.project_id)}>
            View
          </button>
          
          <button className="action-btn status"
            onClick={()=>{handleStatus(val.project_id)}}>{
              val.status  === "active" ? "closed" : "active"
            }</button>
            </td>
            <td>{val.status}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
        No Projects Found
      </td>
    </tr>
  )}
</tbody>
                </table>
            </div>

        </DashboardLayout>
    );
};

export default AdminManageProjects;