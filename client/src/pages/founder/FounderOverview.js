import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import DashboardLayout from '../../components/layout/DashboardLayout';
import axios from "axios";
import "../../styles/FounderOverview.css";

const FounderOverview = () => {

  const [projects, setProjects] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalApplications: 0,
    acceptedFreelancers: 0
  });

  // ✅ FIX 1: should be array (NOT {})
  const [recentData, setRecentData] = useState([]);

  const navigate = useNavigate();
  const founder_id = sessionStorage.getItem("user_id");

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    if (!founder_id) return;

    axios.get(`/api/founder/dashboard/${founder_id}`)
      .then(res => {
        setProjects(res.data.data || {});
      })
      .catch(err => console.log(err));

    axios.get(`/api/founder/dashboard/recent-freelancer/${founder_id}`)
      .then(res => {
        // ✅ FIX 2: always ensure array
        setRecentData(res.data.data || []);
      })
      .catch(err => console.log(err));

  }, [founder_id]);

  return (
    <DashboardLayout role="founder">
      <div className="founder-overview-container">

        {/* Header */}
        <div className="overview-header">
          <h2>👋 Welcome back, Meet</h2>
          <p>Here’s what’s happening with your projects</p>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-cards">

          <div className="card blue">
            <p>Total Projects</p>
            <h2>{projects.totalProjects || 0}</h2>
          </div>

          <div className="card green">
            <p>Active Projects</p>
            <h2>{projects.activeProjects || 0}</h2>
          </div>

          <div className="card purple">
            <p>Total Applications</p>
            <h2>{projects.totalApplications || 0}</h2>
          </div>

          <div className="card orange">
            <p>Hired Freelancers</p>
            <h2>{projects.acceptedFreelancers || 0}</h2>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>⚡ Quick Actions</h3>

          <div className="quick-grid">

            {/* ❗ KEEP primary if your CSS uses it */}
            <div
              className="quick-card primary"
              onClick={() => navigate('/founder/post-project')}
            >
              <h3>Post New Project</h3>
              <p>Start hiring freelancers in minutes</p>
            </div>

            <div
              className="quick-card primary"
              onClick={() => navigate('/founder/projects')}
            >
              <h3>Manage Projects</h3>
              <p>Edit, track and update your projects</p>
            </div>

            <div
              className="quick-card primary"
              onClick={() => navigate('/founder/applications')}
            >
              <h3>View Applications</h3>
              <p>Accept or reject freelancers</p>
            </div>

          </div>
        </div>

        {/* Recent Freelancers */}
        <div className="recentfreelancer">

          <div className="freelancerlist-card-header">
            <h3>Latest Member Joinings</h3>
          </div>

          <div className="freelancerlist-card">

            <div className="freelancerlist-activity-list">

              {/* ✅ FIX 3: safe check */}
              {Array.isArray(recentData) && recentData.length > 0 ? (
                recentData.map((user, i) => (
                  <div key={i} className="freelancerlist-activity-item">

                    <div className="freelancerlist-activity-main">
                      <div className="freelancerlist-activity-details">
                        <p>{user.full_name}</p>
                        <span>
                          Joined on {formatTime(user.applied_at)}
                        </span>
                      </div>
                    </div>

                    <span className={`freelancerlist-activity-tag ${user.role}`}>
                      {user.role}
                    </span>

                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#64748b' }}>
                  No recent users.
                </p>
              )}

            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default FounderOverview;