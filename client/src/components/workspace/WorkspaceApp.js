import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskBoard from './TaskBoard';
import ChatBox from './ChatBox';
import TeamMembers from './TeamMembers';
import FileVault from './FileVault';
import '../../styles/workspace.css';

const TABS = [
    { id: 'tasks',   label: 'Tasks',   icon: '⚡' },
    { id: 'chat',    label: 'Chat',    icon: '💬' },
    { id: 'members', label: 'Team',    icon: '👥' },
    { id: 'vault',   label: 'Vault',   icon: '🗄️' },
];

const WorkspaceApp = ({ role }) => {
    const userId = sessionStorage.getItem('user_id');
    const [workspaces, setWorkspaces]           = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [activeTab, setActiveTab]             = useState('tasks');
    const [taskCount, setTaskCount]             = useState(null);

    /* ── fetch workspace list ── */
    useEffect(() => {
        if (!userId) return;
        const fetchWorkspaces = async () => {
            try {
                if (role === 'founder') {
                    const projsRes = await axios.get(`/api/myProject/${userId}`);
                    const projs = projsRes.data.data || [];
                    let all = [];
                    for (let p of projs) {
                        const wRes = await axios.get(`/api/project/workspaces/${p.project_id}`);
                        const ws = wRes.data.data;
                        if (ws.length > 0) {
                            all.push({ ...ws[0], project_title: p.title });
                        }
                    }
                    setWorkspaces(all);
                } else {
                    const res = await axios.get(`/api/freelancer/workspaces/${userId}`);
                    setWorkspaces(res.data.data || []);
                }
            } catch (err) {
                console.error('Error fetching workspaces', err);
            }
        };
        fetchWorkspaces();
    }, [userId, role]);

    /* ── task badge count ── */
    useEffect(() => {
        if (!selectedWorkspace) { setTaskCount(null); return; }
        axios.get(`/api/tasks/${selectedWorkspace.workspace_id}`)
            .then(r => setTaskCount((r.data.data || []).length))
            .catch(() => {});
    }, [selectedWorkspace]);

    /* ─────── Empty State ─────── */
    if (!workspaces.length) {
        return (
            <div className="ws-empty-state">
                <div className="ws-empty-card">
                    <span className="ws-empty-icon">🚀</span>
                    <h2>No Active Workspaces</h2>
                    <p>
                        {role === 'founder'
                            ? 'Accept freelancers to automatically spin up collaborative workspaces.'
                            : 'Once you are hired for a project, your workspace will appear here.'}
                    </p>
                </div>
            </div>
        );
    }

    /* ─────── Project Selector ─────── */
    if (!selectedWorkspace) {
        return (
            <div className="ws-selector-wrap">
                <div className="ws-selector-header">
                    <h1>Your Workspaces</h1>
                    <p>{workspaces.length} active project{workspaces.length !== 1 ? 's' : ''}</p>
                </div>

                <div className="ws-project-grid">
                    {workspaces.map(w => (
                        <div
                            key={w.workspace_id}
                            className="ws-project-card"
                            onClick={() => setSelectedWorkspace(w)}
                        >
                            <div className="ws-project-badge">Active</div>

                            <h3>{w.project_title || w.name}</h3>
                            <p>{w.name}</p>

                            <div className="ws-project-meta">
                                <span>Created {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <button className="ws-enter-btn" onClick={() => setSelectedWorkspace(w)}>
                                    Open
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* ─────── Workspace Shell ─────── */
    return (
        <div className="ws-shell">

            {/* Top Chrome / Tab Bar */}
            <div className="ws-chrome">
                {/* Project pill */}
                <div className="ws-project-pill">
                    <div className="ws-project-dot" />
                    <div className="ws-project-label">
                        <strong title={selectedWorkspace.project_title || selectedWorkspace.name}>
                            {selectedWorkspace.project_title || selectedWorkspace.name}
                        </strong>
                        <span>{role === 'founder' ? 'Founder' : 'Collaborator'}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="ws-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`ws-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="ws-tab-icon">{tab.icon}</span>
                            {tab.label}
                            {tab.id === 'tasks' && taskCount !== null && taskCount > 0 && (
                                <span className="ws-tab-badge">{taskCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="ws-chrome-actions">
                    <button className="ws-back-btn" onClick={() => setSelectedWorkspace(null)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        All Projects
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="ws-canvas" key={activeTab}>
                {activeTab === 'tasks'   && <TaskBoard   workspaceId={selectedWorkspace.workspace_id} role={role} userId={userId} />}
                {activeTab === 'chat'    && <ChatBox     workspaceId={selectedWorkspace.workspace_id} userId={userId} />}
                {activeTab === 'members' && <TeamMembers workspaceId={selectedWorkspace.workspace_id} role={role} />}
                {activeTab === 'vault'   && <FileVault   workspaceId={selectedWorkspace.workspace_id} userId={userId} />}
            </div>
        </div>
    );
};

export default WorkspaceApp;
