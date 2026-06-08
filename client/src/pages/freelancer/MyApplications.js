// Cleaned up redundant CSS file Import
import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import axios from "axios";
import Swal from "sweetalert2";
import "../../styles/Myapplication.css";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const freelancer_id = sessionStorage.getItem("user_id");

  useEffect(() => {
    if (!freelancer_id) return;

    axios
      .get(`/api/freelancer/myapplication/${freelancer_id}`)
      .then((res) => {
        setApplications(res.data.data || []);
      })
      .catch((err) => console.log(err));
  }, [freelancer_id]);

  const handleView = (app) => {
    Swal.fire({
      title: app.title,
      html: `
        <div style="text-align: left; padding: 10px; font-size: 0.95em;">
          <p style="margin-bottom: 8px;"><strong>Founder:</strong> ${app.full_name}</p>
          <p style="margin-bottom: 8px;"><strong>Email:</strong> <a href="mailto:${app.email}" style="color: #4f46e5; text-decoration: none;">${app.email}</a></p>
          <p style="margin-bottom: 8px;"><strong>Phone:</strong> <a href="tel:${app.phone}" style="color: #4f46e5; text-decoration: none;">${app.phone}</a></p>
          <p style="margin-bottom: 15px;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold; text-transform: uppercase;">${app.status || 'Pending'}</span></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
          <p style="margin-bottom: 8px;"><strong>Project Description:</strong></p>
          <p style="font-size: 0.9em; color: #555; line-height: 1.5;">${app.description || "No description provided."}</p>
        </div>
      `,
      confirmButtonColor: "#4f46e5",
    });
  };

  return (
    <DashboardLayout role="freelancer">
            <div className="MyApplications-scope">
      <div className="table-container">
        <h2 className="table-title">My Applications</h2>

        {applications.length === 0 ? (
          <p className="table-empty">No applications found.</p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Founder</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, index) => (
                  <tr key={index}>
                    <td className="fw-bold text-dark">{app.title}</td>
                    <td>{app.full_name}</td>
                    <td>
                      <div className="contact-info">
                        <a href={`mailto:${app.email}`} className="contact-link">{app.email}</a>
                        <span className="contact-separator">|</span>
                        <a href={`tel:${app.phone}`} className="contact-link">{app.phone}</a>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${app.status?.toLowerCase() || 'pending'}`}>
                        {app.status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button className="table-btn" onClick={() => handleView(app)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
                </div>
        </DashboardLayout>
  );
};

export default MyApplications;