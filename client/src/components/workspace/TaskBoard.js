import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/workspace.css';

const TaskBoard = ({ workspaceId, role, userId }) => {
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [members, setMembers]       = useState([]);
  const [newTask, setNewTask]       = useState({ title: '', description: '', assignee_id: '', due_date: '' });

  const fetchTasks = async () => {
    try {
      const r = await axios.get(`/api/tasks/${workspaceId}`);
      setTasks(r.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMembers = async () => {
    try {
      const r = await axios.get(`/api/workspace/members/${workspaceId}`);
      setMembers(r.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchTasks();
      if (role === 'founder') fetchMembers();
    }
  }, [workspaceId, role]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put('/api/tasks/update-status', { task_id: taskId, status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks/create', { ...newTask, workspace_id: workspaceId });
      setShowForm(false);
      setNewTask({ title: '', description: '', assignee_id: '', due_date: '' });
      fetchTasks();
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="ws-loading">
      <div className="ws-spinner" />
      Syncing tasks…
    </div>
  );

  const COLS = [
    { key: 'todo',       label: 'To Do',       dot: 'todo' },
    { key: 'inProgress', label: 'In Progress',  dot: 'inProgress' },
    { key: 'done',       label: 'Done',         dot: 'done' },
  ];

  return (
    <div>
      {/* Section Header */}
      <div className="ws-section-header">
        <div>
          <div className="ws-section-title">Task Board</div>
          <div className="ws-section-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} in this workspace</div>
        </div>
        {role === 'founder' && (
          <button
            className={`ws-btn ${showForm ? 'ws-btn-ghost' : 'ws-btn-primary'}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '＋ New Task'}
          </button>
        )}
      </div>

      {/* Create Task Form */}
      {showForm && role === 'founder' && (
        <form className="ws-form-card" onSubmit={handleCreate}>
          <h4>Create New Task</h4>
          <div className="ws-form-grid">
            <div className="ws-form-group">
              <label>Task Title</label>
              <input
                type="text"
                placeholder="e.g. Build login page"
                required
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="ws-form-group">
              <label>Assign To</label>
              <select
                required
                value={newTask.assignee_id}
                onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })}
              >
                <option value="">Select member…</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ws-form-group" style={{ marginBottom: 16 }}>
            <label>Description</label>
            <textarea
              rows="3"
              placeholder="Describe the task in detail…"
              required
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>

          <div className="ws-form-grid" style={{ gridTemplateColumns: '200px 1fr' }}>
            <div className="ws-form-group">
              <label>Deadline</label>
              <input
                type="date"
                required
                value={newTask.due_date}
                onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="ws-btn ws-btn-primary">Assign Task</button>
            </div>
          </div>
        </form>
      )}

      {/* Kanban Board */}
      <div className="ws-kanban">
        {COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="ws-kanban-col">
              <div className="ws-kanban-head">
                <div className="ws-kanban-head-left">
                  <span className={`ws-col-dot ${col.dot}`} />
                  <span>{col.label}</span>
                </div>
                <span className="ws-col-count">{colTasks.length}</span>
              </div>

              <div className="ws-kanban-body">
                {colTasks.length === 0 ? (
                  <div className="ws-empty-col">
                    <span className="ws-empty-col-icon">📭</span>
                    No tasks here
                  </div>
                ) : colTasks.map(task => (
                  <div key={task.id} className="ws-task-card">
                    <div className="ws-task-card-top">
                      <div className="ws-task-title">{task.title}</div>
                    </div>
                    {task.description && (
                      <div className="ws-task-desc">{task.description}</div>
                    )}
                    <div className="ws-task-footer">
                      <div className="ws-assignee-chip">
                        <div className="ws-avatar-xs" title={task.assignee_name}>
                          {task.assignee_name ? task.assignee_name.substring(0, 2).toUpperCase() : '??'}
                        </div>
                        <span className="ws-task-date">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No deadline'}
                        </span>
                      </div>

                      {(role === 'founder' || String(task.assignee_id) === String(userId)) ? (
                        <select
                          className="ws-status-select"
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                        >
                          <option value="todo">To Do</option>
                          <option value="inProgress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      ) : (
                        <span className={`ws-status-badge ${col.key}`}>{col.label}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;
