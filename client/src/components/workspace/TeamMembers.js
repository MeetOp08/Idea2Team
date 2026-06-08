import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/workspace.css';

const TeamMembers = ({ workspaceId, role }) => {
  const [members, setMembers]                     = useState([]);
  const [showForm, setShowForm]                   = useState(false);
  const [newMemberId, setNewMemberId]             = useState('');
  const [availableFreelancers, setFreelancers]    = useState([]);

  const fetchMembers = async () => {
    try {
      const r = await axios.get(`/api/workspace/members/${workspaceId}`);
      setMembers(r.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchFreelancers = async () => {
    try {
      const r = await axios.get('/api/freelancers/list');
      setFreelancers(r.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (workspaceId) fetchMembers(); }, [workspaceId]);
  useEffect(() => { if (showForm) fetchFreelancers(); }, [showForm]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newMemberId) return alert('Please select a freelancer first.');
    if (members.some(m => m.user_id === parseInt(newMemberId)))
      return alert('This member is already in the workspace.');
    try {
      const r = await axios.post('/api/workspace/add-member', {
        workspace_id: workspaceId,
        user_id: newMemberId,
      });
      if (r.data.success) { setNewMemberId(''); setShowForm(false); fetchMembers(); }
    } catch (err) { alert(err.response?.data?.message || 'Error adding member.'); }
  };

  return (
    <div>
      <div className="ws-section-header">
        <div>
          <div className="ws-section-title">Team Directory</div>
          <div className="ws-section-subtitle">{members.length} member{members.length !== 1 ? 's' : ''} in this workspace</div>
        </div>
        {role === 'founder' && (
          <button
            className={`ws-btn ${showForm ? 'ws-btn-ghost' : 'ws-btn-primary'}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '＋ Add Member'}
          </button>
        )}
      </div>

      {/* Add Member Form */}
      {showForm && role === 'founder' && (
        <form className="ws-add-member-form" onSubmit={handleAdd}>
          <div className="ws-form-group" style={{ flex: 1 }}>
            <label>Select Freelancer</label>
            <select
              required
              value={newMemberId}
              onChange={e => setNewMemberId(e.target.value)}
            >
              <option value="">Select a member from the platform…</option>
              {availableFreelancers.map(f => {
                const already = members.some(m => m.user_id === f.user_id);
                return (
                  <option key={f.user_id} value={f.user_id} disabled={already}>
                    {f.full_name} ({f.email}){already ? ' ✅ Already added' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <button type="submit" className="ws-btn ws-btn-primary" style={{ flexShrink: 0 }}>
            Add to Workspace
          </button>
        </form>
      )}

      {/* Member cards */}
      {members.length === 0 ? (
        <div className="ws-inner-empty">
          <span className="ws-inner-empty-icon">👥</span>
          <h4>No members yet</h4>
          <p>Add team members to start collaborating in this workspace.</p>
        </div>
      ) : (
        <div className="ws-team-grid">
          {members.map(m => (
            <div key={m.workspace_member_id} className="ws-member-card">
              <div className="ws-member-avatar-lg">
                {m.full_name ? m.full_name.substring(0, 2).toUpperCase() : '??'}
              </div>

              <div className="ws-member-card-name">{m.full_name}</div>
              <div className="ws-member-card-email">{m.email}</div>

              <span className={`ws-member-card-badge ${m.role === 'admin' ? 'admin' : 'member'}`}>
                {m.role === 'admin' ? '👑 Founder' : '⚡ Member'}
              </span>

              <div className="ws-member-joined">
                Joined {new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
