import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/workspace.css';

const getFileIcon = (name = '') => {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📋', pptx: '📋', zip: '🗜️', rar: '🗜️',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
    mp4: '🎬', mov: '🎬', avi: '🎬',
    js: '⚡', ts: '⚡', jsx: '⚡', tsx: '⚡',
    css: '🎨', html: '🌐', json: '📦', md: '📓',
  };
  return map[ext] || '📁';
};

const formatBytes = (bytes, d = 1) => {
  if (!+bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${sizes[i]}`;
};

const FileVault = ({ workspaceId, userId }) => {
  const [files, setFiles]           = useState([]);
  const [isUploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const r = await axios.get(`/api/workspace/files/${workspaceId}`);
      if (r.data.success) setFiles(r.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (workspaceId) fetchFiles(); }, [workspaceId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('workspace_id', workspaceId);
    fd.append('uploader_id', userId);
    try {
      await axios.post('/api/workspace/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchFiles();
    } catch (err) {
      console.error(err);
      alert('Upload failed. Make sure the file is under 50 MB.');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Remove this file for the entire team?')) return;
    try {
      await axios.delete(`/api/workspace/file/${fileId}`);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (e) { console.error(e); }
  };

  const totalSize = files.reduce((acc, f) => acc + (f.file_size || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="ws-section-header">
        <div>
          <div className="ws-section-title">Project Vault</div>
          <div className="ws-section-subtitle">Shared files for your team</div>
        </div>
      </div>

      {/* Stats */}
      <div className="ws-vault-stats">
        <div className="ws-vault-stat">
          <span className="ws-vault-stat-icon">🗄️</span>
          <div className="ws-vault-stat-info">
            <strong>{files.length}</strong>
            <span>Total Files</span>
          </div>
        </div>
        <div className="ws-vault-stat">
          <span className="ws-vault-stat-icon">💾</span>
          <div className="ws-vault-stat-info">
            <strong>{formatBytes(totalSize)}</strong>
            <span>Storage Used</span>
          </div>
        </div>
        <div className="ws-vault-stat">
          <span className="ws-vault-stat-icon">☁️</span>
          <div className="ws-vault-stat-info">
            <strong>50 MB</strong>
            <span>Max File Size</span>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="ws-upload-zone">
        <input
          type="file"
          onChange={handleUpload}
          disabled={isUploading}
          title=""
        />
        <div className="ws-upload-icon">
          {isUploading ? '⏳' : '☁️'}
        </div>
        <p>
          {isUploading
            ? 'Uploading your file…'
            : <><span className="ws-upload-accent">Click to upload</span> or drag &amp; drop</>}
        </p>
        <small>PDF, Images, ZIP, Code files · Max 50 MB</small>
      </div>

      {/* File Grid */}
      {files.length === 0 ? (
        <div className="ws-inner-empty">
          <span className="ws-inner-empty-icon">📁</span>
          <h4>Vault is empty</h4>
          <p>Upload documents, assets, or code archives to share with your entire team.</p>
        </div>
      ) : (
        <div className="ws-file-grid">
          {files.map(f => (
            <div key={f.id} className="ws-file-card">
              <div className="ws-file-type-icon">{getFileIcon(f.file_name)}</div>

              <div className="ws-file-info">
                <div className="ws-file-name" title={f.file_name}>{f.file_name}</div>
                <div className="ws-file-meta">
                  <span>{formatBytes(f.file_size)}</span>
                  <span>·</span>
                  <span>by {f.uploader_name}</span>
                  <span>·</span>
                  <span>{new Date(f.uploaded_at || f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              <div className="ws-file-actions">
                <a
                  href={`${f.file_path}`}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="ws-icon-btn"
                  title="Download"
                >
                  ⬇
                </a>
                {String(f.uploader_id) === String(userId) && (
                  <button
                    className="ws-icon-btn danger"
                    onClick={() => handleDelete(f.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileVault;
