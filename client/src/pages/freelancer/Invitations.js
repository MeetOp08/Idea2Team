import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Mail, CheckCircle, Clock, Check, X, Eye } from "lucide-react";
import Swal from "sweetalert2";
import "../../styles/invitations.css";

const Invitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // ✅ FIX

  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const freelancerId = sessionStorage.getItem("user_id") || currentUser.user_id;

  useEffect(() => {
    if (!freelancerId) {
      setLoading(false);
      return;
    }

    axios
      .get(`/api/invitations/${freelancerId}`)
      .then((res) => {
        setInvitations(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        Swal.fire("Error", "Failed to fetch invitations", "error");
      });
  }, [freelancerId]);

  const handleAction = async (inviteId, action) => {
    try {
      setProcessingId(inviteId);

      await axios.put(
        `/api/invitations/${inviteId}/${action}`
      );

      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === inviteId
            ? {
                ...inv,
                status: action === "accept" ? "accepted" : "rejected",
              }
            : inv
        )
      );

      Swal.fire({
        icon: "success",
        title: action === "accept" ? "Accepted" : "Rejected",
        toast: true,
        timer: 2000,
        position: "top-end",
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewProject = async (projectId) => {
    try {
      Swal.fire({
        title: 'Loading Details...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await axios.get(`/api/info-projects/${projectId}`);
      const project = res.data.data;
      
      Swal.fire({
        title: project.title,
        html: `
          <div style="text-align: left; font-family: 'Inter', sans-serif;">
            <p><strong>Category:</strong> ${project.category}</p>
            <p><strong>Experience Required:</strong> ${project.experience_level}</p>
            <p><strong>Budget:</strong> ₹${project.budget_min} - ₹${project.budget_max}</p>
            <p><strong>Duration:</strong> ${project.duration_weeks} weeks</p>
            <hr style="border-top: 1px solid #e5e7eb; border-bottom: none; border-left: none; border-right: none; margin: 15px 0;" />
            <h4 style="margin: 0 0 10px 0; font-size: 15px; color: #334155;">Description:</h4>
            <p style="white-space: pre-wrap; color: #475569; font-size: 14px; margin-bottom: 20px;">${project.description}</p>
            
            <h4 style="margin: 0 0 10px 0; font-size: 15px; color: #334155;">Required Skills:</h4>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${(project.required_skills || '')
                .split(',')
                .filter(skill => skill.trim() !== '')
                .map(skill => `<span style="background: #eef2ff; color: #4f46e5; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;">${skill.trim()}</span>`)
                .join('')}
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Apply to Project',
        cancelButtonText: 'Close',
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#94a3b8',
        width: '600px',
        customClass: {
          title: 'swal2-title-custom'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/apply-project/" + projectId);
        }
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Unable to fetch project details', 'error');
    }
  };

  return (
    <DashboardLayout role="freelancer">
      <div className="inv-page">
        <div className="inv-header">
          <h1>
            <Mail /> Invitations
          </h1>
          <p>Manage your project invitations</p>
        </div>

        {loading ? (
          <div className="inv-loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="inv-empty">
            <Mail size={50} />
            <h3>No Invitations</h3>
          </div>
        ) : (
          <div className="inv-list">
            {invitations.map((inv) => (
              <div key={inv.id} className="inv-card">
                <div className="inv-info">
                  <h3>
                    {inv.project_title}
                    {inv.status === "pending" ? (
                      <Clock />
                    ) : (
                      <CheckCircle />
                    )}
                  </h3>

                  <p>
                    Invited by <strong>{inv.founder_name}</strong>
                  </p>

                  <span className="inv-date">
                    {new Date(inv.created_at).toDateString()}
                  </span>
                </div>

                <div className="inv-actions">
                  {inv.status === "pending" ? (
                    <div className="inv-btn-group" style={{ display: 'flex', gap: '10px' }}>
                      <button
                        disabled={processingId === inv.id}
                        className="btn accept"
                        onClick={() => handleAction(inv.id, "accept")}
                      >
                        <Check size={16} strokeWidth={2.5} /> Accept
                      </button>

                      <button
                        disabled={processingId === inv.id}
                        className="btn reject"
                        onClick={() => handleAction(inv.id, "reject")}
                      >
                        <X size={16} strokeWidth={2.5} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`inv-status ${inv.status}`}>
                      {inv.status}
                    </span>
                  )}

                  <button
                    className="btn outline"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleViewProject(inv.project_id)}
                  >
                    <Eye size={16} strokeWidth={2.5} /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Invitations;