import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/adminDashboard.css";

const AdminOverview = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProjects: 0,
        activeProjects: 0,
        totalFreelancers: 0,
        totalFounders: 0,
        blockedUsers: 0
    });

        const [recentData, setRecentData] = useState({
            recentProjects: [],
            recentUsers: []
        });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000); // 1 minute interval
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, activityRes] = await Promise.all([
                axios.get("/api/admin/stats"),
                axios.get("/api/admin/recent-activity")
            ]);

            setStats(statsRes.data);
            setRecentData(activityRes.data);
        } catch (error) {
            console.error("Error loading admin overview data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const statCards = [
        { title: "Total Users", value: stats.totalUsers, icon: "👥", color: "#4f46e5" },
        { title: "Active Projects", value: stats.activeProjects, icon: "🚀", color: "#10b981" },
        { title: "Blocked", value: stats.blockedUsers, icon: "🚫", color: "#ef4444" }
    ];

    return (
        <DashboardLayout role="admin">
            <div className="admin-dashboard-wrapper">
                <div className="dashboard-header">
                    <h1>Platform Control Center</h1>
                    <p>Comprehensive overview of user activity and project status across the system.</p>
                </div>

                {loading ? (
                    <div className="dashboard-loader">
                        <div className="spinner"></div>
                        <p>Syncing dashboard with platform data...</p>
                    </div>
                ) : (
                    <>
                        <div className="dashboard-stats-grid">
                            {statCards.map((stat, i) => (
                                <div key={i} className="admin-stat-card">
                                    <div className="stat-info">
                                        <h3>{stat.title}</h3>
                                        <p>{stat.value}</p>
                                    </div>
                                    <div className="stat-icon-wrapper" style={{ color: stat.color }}>
                                        {stat.icon}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="dashboard-content-grid">
                            {/* Left Side: Activity Lists */}
                            <div className="activity-lists-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                
                                {/* Recent Users Card */}
                                <div className="admin-card">
                                    <div className="admin-card-header">
                                        <h2>Latest Member Joinings</h2>
                                        <Link to="/users" style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>MANAGE ALL →</Link>
                                    </div>
                                    <div className="activity-list">
                                        {recentData.recentUsers.length > 0 ? recentData.recentUsers.map((user, i) => (
                                            <div key={i} className="activity-item">
                                                <div className="activity-main">
                                                    <div className="activity-avatar" style={{ background: user.role === 'founder' ? '#f59e0b' : '#3b82f6' }}>
                                                        {user.full_name.charAt(0)}
                                                    </div>
                                                    <div className="activity-details">
                                                        <p>{user.full_name}</p>
                                                        <span>Joined on {formatTime(user.created_at)}</span>
                                                    </div>
                                                </div>
                                                <span className={`activity-tag ${user.role}`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                        )) : <p style={{ textAlign: 'center', color: '#64748b' }}>No recent users.</p>}
                                    </div>
                                </div>

                                {/* Recent Projects Card */}
                                <div className="admin-card">
                                    <div className="admin-card-header">
                                        <h2>Recent Project Postings</h2>
                                        <Link to="/projects" style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>REVIEW ALL →</Link>
                                    </div>
                                    <div className="activity-list">
                                        {recentData.recentProjects.length > 0 ? recentData.recentProjects.map((project, i) => (
                                            <div key={i} className="activity-item">
                                                <div className="activity-main">
                                                    <div className="activity-avatar" style={{ background: '#10b981' }}>P</div>
                                                    <div className="activity-details">
                                                        <p>{project.title}</p>
                                                        <span>Posted {formatTime(project.created_at)}</span>
                                                    </div>
                                                </div>
                                                <button className="action-btn-small" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4f46e5', fontWeight: '600' }}>
                                                    DETAILS
                                                </button>
                                            </div>
                                        )) : <p style={{ textAlign: 'center', color: '#64748b' }}>No recent projects.</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Quick Actions & Role Distribution */}
                            <div className="sidebar-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                
                                <div className="admin-card">
                                    <div className="admin-card-header">
                                        <h2>Fast Operations</h2>
                                    </div>
                                    <div className="quick-actions-grid">
                                        <button className="action-btn" onClick={() => navigate('/admin/users')}>
                                            <span className="action-icon">👥</span> Manage Platform Users
                                        </button>
                                        <button className="action-btn" onClick={() => navigate('/admin/projects')}>
                                            <span className="action-icon">🏗️</span> Project Moderation
                                        </button>
                                        <button className="action-btn">
                                            <span className="action-icon">📊</span> Export Site Reports
                                        </button>
                                        <button className="action-btn">
                                            <span className="action-icon">⚖️</span> Review Dispute Cases
                                        </button>
                                    </div>
                                </div>

                                <div className="admin-card">
                                    <div className="admin-card-header">
                                        <h2>User Distribution</h2>
                                    </div>
                                    <div className="role-bars" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                                        <div className="role-stat">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: '600', color: '#4b5563' }}>Freelancers</span>
                                                <span style={{ fontWeight: '700', color: '#3b82f6' }}>{stats.totalFreelancers}</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    width: `${(stats.totalFreelancers / stats.totalUsers) * 100}%`, 
                                                    background: '#3b82f6', 
                                                    borderRadius: '4px' 
                                                }}></div>
                                            </div>
                                        </div>
                                        <div className="role-stat">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: '600', color: '#4b5563' }}>Founders</span>
                                                <span style={{ fontWeight: '700', color: '#f59e0b' }}>{stats.totalFounders}</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    width: `${(stats.totalFounders / stats.totalUsers) * 100}%`, 
                                                    background: '#f59e0b', 
                                                    borderRadius: '4px' 
                                                }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminOverview;