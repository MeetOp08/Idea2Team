import '../../styles/Applications.css';
import React, { useEffect, useState } from "react";
import {useParams} from "react-router-dom";
import {useNavigate} from "react-router-dom"
import DashboardLayout from "../../components/layout/DashboardLayout";
import axios from "axios";
import Swal from "sweetalert2";

const Applications = () => {
 
    const founder_id = sessionStorage.getItem("user_id");
    
    console.log("founder_id:",founder_id);
    
 const[application,setApplication]=useState([]);

  const handleAccept = (id) => {
    axios.put(`/api/application/accept/${id}`)
      .then(res => {
        Swal.fire("Success", "Application accepted", "success");
        setApplication(prev => prev.map(app => 
          app.application_id === id ? { ...app, status: 'accepted' } : app
        ));
      })
      .catch(err => {
        console.log(err);
        Swal.fire("Error", "Failed to accept application", "error");
      });
  };

  const handleReject = (id) => {
    axios.put(`/api/application/reject/${id}`)
      .then(res => {
        Swal.fire("Success", "Application rejected", "success");
        setApplication(prev => prev.map(val => 
          val.application_id === id ? { ...val, status: 'rejected' } : val
        ));
      })
      .catch(err => {
        console.log(err);
        Swal.fire("Error", "Failed to reject application", "error");
      });
  };


useEffect(()=>{
    axios.get(`/api/info-application/${founder_id}`)
      .then(res=>{
        console.log(res.data)
        setApplication(res.data.data)})
    .catch(err=>console.log(err))  
},[founder_id])

    return (
      <DashboardLayout role="founder">
            <div className="Applications-scope">
           <div className="page-header">
                <div>
                    <h1>Applications</h1>
                    <p>Manage the applications</p>
                </div>

            </div>
        <div className="Grid-Conatiner">
           <table className="table">
            <thead>
                 <tr>
                    <th>#</th>
                    <th>Applicant name</th>
                    <th>Project title</th>
                    <th>Proposal message</th>
                    <th>Expected salary</th>
                    <th>Actions</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {application.map((val,index)=>{
                    return(
                        <tr key={val.application_id || index}>
                            <td>{index+1}</td>
                            <td>{val.full_name}</td>
                            <td>{val.title}</td>
                            <td>{val.proposal_message}</td>
                            <td>{val.expected_salary}</td>
                           <td>
                              <div className="action-group">
                                {val.status !== "rejected" && (
                                  <button
                                    className={`btn btn-accept ${val.status === "accepted" ? "active" : ""}`}
                                    disabled={val.status !== "pending"}
                                    onClick={() => handleAccept(val.application_id)}
                                  >
                                    {val.status === "accepted" ? "Accepted" : "Accept"}
                                  </button>
                                )}

                                {val.status !== "accepted" && (
                                  <button
                                    className={`btn btn-reject ${val.status === "rejected" ? "active" : ""}`}
                                    disabled={val.status !== "pending"}
                                    onClick={() => handleReject(val.application_id)}
                                  >
                                    {val.status === "rejected" ? "Rejected" : "Reject"}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`status ${val.status}`}>
                                {val.status}
                              </span>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
           </table>
        </div>
                  </div>
        </DashboardLayout>
    );
};

export default Applications;