import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import axios from 'axios';
import '../../styles/reports.css';

const Reports = () => {
    const [period, setPeriod] = useState('daily');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, [period]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/reports-data?period=${period}`);
            if (res.data.success) {
                setReportData(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching report data", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get max value for scaling the bar chart
    const getMaxValue = () => {
        if (!reportData) return 1;
        const allVals = [
            ...reportData.published,
            ...reportData.closed,
            ...reportData.applications,
            ...reportData.users
        ];
        const max = Math.max(...allVals);
        return max > 0 ? max : 1;
    };

    const maxVal = getMaxValue();

    const sumVal = (arr) => arr ? arr.reduce((a,b) => a+b, 0) : 0;

    return (
        <DashboardLayout role="admin">
            <div className="reports-container">
                <div className="reports-header">
                    <h1>Platform Reports & Analytics</h1>
                    <p>Track project publishing, application rates, and user growth over time.</p>
                </div>

                <div className="tab-navigation">
                    <button 
                        className={`tab-btn ${period === 'daily' ? 'active' : ''}`}
                        onClick={() => setPeriod('daily')}
                    >
                        Daily Analytics
                    </button>
                    <button 
                        className={`tab-btn ${period === 'weekly' ? 'active' : ''}`}
                        onClick={() => setPeriod('weekly')}
                    >
                        Weekly Trends
                    </button>
                    <button 
                        className={`tab-btn ${period === 'monthly' ? 'active' : ''}`}
                        onClick={() => setPeriod('monthly')}
                    >
                        Monthly Overview
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Gathering insights...</div>
                ) : reportData ? (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-icon" style={{color: '#4f46e5'}}>🚀</span>
                                <div className="stat-content">
                                    <h3>Projects Published</h3>
                                    <p className="stat-value">{sumVal(reportData.published)}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon" style={{color: '#10b981'}}>✅</span>
                                <div className="stat-content">
                                    <h3>Projects Closed</h3>
                                    <p className="stat-value">{sumVal(reportData.closed)}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon" style={{color: '#f59e0b'}}>📄</span>
                                <div className="stat-content">
                                    <h3>Applications</h3>
                                    <p className="stat-value">{sumVal(reportData.applications)}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon" style={{color: '#ec4899'}}>👥</span>
                                <div className="stat-content">
                                    <h3>New Users</h3>
                                    <p className="stat-value">{sumVal(reportData.users)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="report-section">
                            <h2>Trend Visualization</h2>
                            <p style={{color: '#718096', marginBottom: '30px'}}>
                                Overview of key platform interactions over the {period} period.
                            </p>
                            
                            <div className="custom-chart-container" style={{ 
                                display: 'flex', 
                                alignItems: 'flex-end', 
                                gap: '20px', 
                                height: '300px',
                                borderBottom: '2px solid #e2e8f0',
                                paddingBottom: '10px',
                                overflowX: 'auto',
                                paddingTop: '20px'
                            }}>
                                {reportData.labels.map((label, i) => (
                                    <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', width: '100%', height: '240px', justifyContent: 'center' }}>
                                            {/* Projects Published Bar */}
                                            <div className="bar-wrapper" style={{ position: 'relative', width: '15px', height: '100%', display: 'flex', alignItems: 'flex-end', groupHover: 'show' }}>
                                                <div style={{
                                                    width: '100%',
                                                    height: `${(reportData.published[i] / maxVal) * 100}%`,
                                                    background: '#4f46e5',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.5s ease-out'
                                                }}></div>
                                            </div>
                                            {/* Projects Closed Bar */}
                                            <div className="bar-wrapper" style={{ position: 'relative', width: '15px', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                                                <div style={{
                                                    width: '100%',
                                                    height: `${(reportData.closed[i] / maxVal) * 100}%`,
                                                    background: '#10b981',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.5s ease-out'
                                                }}></div>
                                            </div>
                                            {/* Applications Bar */}
                                            <div className="bar-wrapper" style={{ position: 'relative', width: '15px', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                                                <div style={{
                                                    width: '100%',
                                                    height: `${(reportData.applications[i] / maxVal) * 100}%`,
                                                    background: '#f59e0b',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.5s ease-out'
                                                }}></div>
                                            </div>
                                            {/* Users Bar */}
                                            <div className="bar-wrapper" style={{ position: 'relative', width: '15px', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                                                <div style={{
                                                    width: '100%',
                                                    height: `${(reportData.users[i] / maxVal) * 100}%`,
                                                    background: '#ec4899',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.5s ease-out'
                                                }}></div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#4a5568', marginTop: '10px', textAlign: 'center', fontWeight: '500' }}>
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Legend */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '30px 0 10px 0', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#4f46e5', borderRadius: '3px' }}></div>
                                    <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: '500' }}>Published</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></div>
                                    <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: '500' }}>Closed</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '3px' }}></div>
                                    <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: '500' }}>Applications</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#ec4899', borderRadius: '3px' }}></div>
                                    <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: '500' }}>Users</span>
                                </div>
                            </div>
                        </div>

                    </>
                ) : (
                    <div className="report-section" style={{ textAlign: 'center', color: '#64748b' }}>
                        No data available for the selected period.
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Reports;
