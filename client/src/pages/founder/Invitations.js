import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import '../../styles/match.css';

const FounderInvitations = () => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const founderId = sessionStorage.getItem('user_id') || currentUser.user_id;

    useEffect(() => {
        if (!founderId) {
            setLoading(false); return;
        }
        
        axios.get(`/api/founder/invitations/${founderId}`)
            .then(res => {
                setInvitations(res.data.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [founderId]);

    return (
        <DashboardLayout role="founder">
            <div className="match-page-wrapper">
                <div className="match-page-header">
                    <div>
                        <h1 className="match-title">
                            <Mail className="title-icon" /> Sent Invitations
                        </h1>
                        <p className="match-subtitle">Track the status of invitations you have sent to freelancers.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="match-loading">
                        <div className="spinner"></div>
                        <p>Loading sent invitations...</p>
                    </div>
                ) : invitations.length === 0 ? (
                    <div className="match-empty">
                        <Mail size={48} className="empty-icon" />
                        <h3>No Invitations Sent</h3>
                        <p>You haven't sent any invitations to freelancers yet. Visit Smart Matching to find perfect candidates!</p>
                    </div>
                ) : (
                    <div className="invitation-list">
                        {invitations.map(inv => (
                            <div key={inv.id} className="invitation-card">
                                <div className="invitation-info">
                                    <h3>
                                        {inv.freelancer_name}
                                        {inv.status === 'pending' ? <Clock size={16} color="var(--warning-color)"/> : 
                                         inv.status === 'accepted' ? <CheckCircle size={16} color="var(--success-color)"/> :
                                         <XCircle size={16} color="var(--danger-color)"/>}
                                    </h3>
                                    <p className="invitation-subtitle">Project: {inv.project_title}</p>
                                    <p className="invitation-date">
                                        Sent: {new Date(inv.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <span className={`status-badge ${inv.status}`}>
                                        {inv.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default FounderInvitations;
