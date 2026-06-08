import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import '../../styles/workspace.css';

const socket = io();

const ChatBox = ({ workspaceId, userId }) => {
  const [messages, setMessages]     = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers]       = useState([]);
  const messagesEndRef              = useRef(null);

  const fetchMessages = async () => {
    try {
      const r = await axios.get(`/api/chat/${workspaceId}`);
      setMessages(r.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchMembers = async () => {
    try {
      const r = await axios.get(`/api/workspace/members/${workspaceId}`);
      setMembers(r.data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!workspaceId) return;
    fetchMessages();
    fetchMembers();

    socket.emit('join_workspace', String(workspaceId));
    const onReceive = (msg) => setMessages(prev => [...prev, msg]);
    socket.on('receive_message', onReceive);
    return () => socket.off('receive_message', onReceive);
  }, [workspaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await axios.post('/api/chat/send', {
        workspace_id: workspaceId,
        sender_id: userId,
        message: newMessage.trim(),
      });
      setNewMessage('');
      fetchMessages();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="ws-section-header">
        <div>
          <div className="ws-section-title">Team Chat</div>
          <div className="ws-section-subtitle">Real-time workspace communications</div>
        </div>
      </div>

      <div className="ws-chat-shell">
        {/* Chat main */}
        <div className="ws-chat-main">
          {/* Chat topbar */}
          <div className="ws-chat-topbar">
            <span className="ws-chat-channel-icon">💬</span>
            <div className="ws-chat-channel-info">
              <strong># general</strong>
              <span>Workspace team channel</span>
            </div>
            <div className="ws-online-badge">
              <span className="ws-online-dot" />
              Live
            </div>
          </div>

          {/* Messages */}
          <div className="ws-messages">
            {messages.length === 0 ? (
              <div className="ws-msg-empty">
                <span>💬</span>
                <p>No messages yet — say hello to your team!</p>
              </div>
            ) : messages.map((msg, i) => {
              const isMe = String(msg.sender_id) === String(userId);
              return (
                <div key={i} className={`ws-msg-row ${isMe ? 'me' : ''}`}>
                  {!isMe && (
                    <div className="ws-msg-avatar">
                      {msg.sender_name ? msg.sender_name.substring(0, 2).toUpperCase() : '??'}
                    </div>
                  )}
                  <div className="ws-msg-body">
                    {!isMe && <div className="ws-msg-name">{msg.sender_name}</div>}
                    <div className="ws-bubble">{msg.message}</div>
                    <div className="ws-msg-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ws-chat-input-bar">
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
              <input
                className="ws-chat-input"
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message…"
              />
              <button type="submit" className="ws-send-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Members sidebar */}
        <div className="ws-chat-sidebar">
          <h4>Team Members — {members.length}</h4>
          {members.map(m => (
            <div key={m.workspace_member_id} className="ws-member-row">
              <div className="ws-member-avatar">
                <span>{m.full_name ? m.full_name.substring(0, 2).toUpperCase() : '??'}</span>
                <span className="ws-member-status" />
              </div>
              <div>
                <div className="ws-member-name">{m.full_name}</div>
                <div className="ws-member-sub">{m.role === 'admin' ? 'Founder' : 'Member'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
