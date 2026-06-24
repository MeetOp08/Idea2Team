import '../../styles/FreelancerOverview.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import axios from "axios"
import "../../styles/FreelancerOverview.css"

const FreelancerOverview = () => {
  const [projects, setProjects] = useState({
    appliedProjects: 0,
    acceptedProjects: 0,
    rejected: 0,
    pending: 0,
    activeProjects: 0
  })
  const [recentproject,setRecentProject]= useState([]);
  const formatTime = (dateString) =>{
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US',{month:'short',day:'numeric'})
  }
  const navigate = useNavigate();
  const freelancer_id = sessionStorage.getItem("user_id");
  console.log(freelancer_id)

  useEffect(() => {
    if (!freelancer_id) return;

    axios.get(`/api/freelancer/dashboard/${freelancer_id}`)
      .then(res => {
        if (res.data?.data) setProjects(res.data.data);
      })
      .catch(err => console.error("Dashboard stats error:", err));

    axios.get(`/api/freelancer/dashboard/recent-project/${freelancer_id}`)
      .then(res => {
        if (res.data?.data) setRecentProject(res.data.data);
      })
      .catch(err => console.error("Recent projects error:", err));
  }, [freelancer_id])

  return (
    <DashboardLayout role="freelancer">

      <div className="freelancer-overview-container">

        {/* HEADER */}
        <div className="overview-header">
          <h2>👋 Welcome back, Freelancer</h2>
          <p>Track your applications and projects</p>
        </div>

        {/* STATS */}
        <div className="dashboard-cards">

          <div className="card blue">
            <div className="icon">📂</div>
            <p className="card-title">Applied Projects</p>
            <span className="card-value">{projects.appliedProjects}</span>
          </div>

          <div className="card green">
            <div className="icon">✅</div>
            <p className="card-title">Accepted</p>
            <span className="card-value">{projects.acceptedProjects}</span>
          </div>

          <div className="card red">
            <div className="icon">❌</div>
            <p className="card-title">Rejected</p>
            <span className="card-value">{projects.rejected}</span>
          </div>

          <div className="card yellow">
            <div className="icon">⏳</div>
            <p className="card-title">Pending</p>
            <span className="card-value">{projects.pending}</span>
          </div>

          <div className="card purple">
            <div className="icon">🚀</div>
            <p className="card-title">Active Projects</p>
            <span className="card-value">{projects.activeProjects}</span>
          </div>

        </div>

        {/* QUICK ACTIONS */}
        <div className="quick-actions">
          <h3>⚡ Quick Actions</h3>

          <div className="quick-grid">

            <div className="quick-card" onClick={() => navigate('/freelancer/browse')}>
              <div className="q-icon">🔍</div>
              <h3>Browse Projects</h3>
              <p>Find new opportunities to apply</p>
            </div>

            <div className="quick-card" onClick={() => navigate('/freelancer/applications')}>
              <div className="q-icon">📨</div>
              <h3>My Applications</h3>
              <p>Track your application status</p>
            </div>

          </div>
          
        </div>


      

        {/* {recent project} */}
      <div className="recentproject-list">
        <div className="projectlist-card-header">
          <div className="icon">📂</div>
          <h3>Recent Projects</h3>
   
  </div>
<div className="projectlist-card">
  
  <div className="projectlist-activity-list">
    
    {recentproject && recentproject.length > 0 ? (
      recentproject.map((val, i) => (
        <div key={i} className="projectlist-activity-items" >
          
          <div className="projectlist-activity-main" >
            
            <div className="project-activity-details">
              <p>{val.title}</p>
              <span>
                Post On: {formatTime(val.created_at)}
              </span>
            </div>

            <div className="founder_name">
              <strong><p>Founder</p></strong>
              <span>{val.full_name}</span>
            </div>

          </div>

          <span
            className={`req_skills ${
              val.required_skills
                ? val.required_skills.toLowerCase().replace(/\s+/g, "")
                : ""
            }`}
          >
            {val.required_skills || "No Skills"}
          </span>

        </div>
      ))
    ) : (
      <p style={{ textAlign: "center", color: "#888" }}>
        No recent projects found
      </p>
    )}

  </div>
</div>
      </div>
      </div>
      
    </DashboardLayout>
  );
};

export default FreelancerOverview;
           
              
          
               
               
  