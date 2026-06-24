import '../../styles/Sidebar.css';
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "../../styles/Sidebar.css";

const sidebarMenus = {

  founder: {
    sections: [
      {
        label: "Main",
        items: [
          { icon: "📊", text: "Overview", path: "/founder/dashboard" },
          { icon: "📝", text: "Post Project", path: "/founder/post-project" },
          { icon: "📁", text: "My Projects", path: "/founder/projects" },
          { icon: "📨", text: "Applications", path: "/founder/applications" },
          { icon: "✉️", text: "Invitations", path: "/founder/invitations" },
        ],
      },
      {
        label: "Workspace",
        items: [
          { icon: "🛠️", text: "Workspace", path: "/founder/workspace" },
        ],
      },
      {
        label: "Account",
        items: [
          { icon: "👤", text: "Profile", path: "/founder/profile" },
        ],
      },
    ],
  },

  freelancer: {
    sections: [
      {
        label: "Main",
        items: [
          { icon: "📊", text: "Overview", path: "/freelancer/dashboard" },
          { icon: "✨", text: "Smart Suggestions", path: "/freelancer/suggestions" },
          { icon: "🔍", text: "Browse Projects", path: "/freelancer/browse" },
          { icon: "✉️", text: "Invitations", path: "/freelancer/invitations" },
          { icon: "📤", text: "My Applications", path: "/freelancer/applications" },
        ],
      },
      {
        label: "Workspace",
        items: [
          { icon: "🛠️", text: "Workspace", path: "/freelancer/workspace" },
        ],
      },
      {
        label: "Account",
        items: [
          { icon: "👤", text: "Profile", path: "/freelancer/profile" },
        ],
      },
    ],
  },

  admin: {
    sections: [
      {
        label: "Dashboard",
        items: [
          { icon: "📊", text: "Overview", path: "/admin/dashboard" },
        ],
      },
      {
        label: "Management",
        items: [
          { icon: "👥", text: "Manage Users", path: "/admin/users" },
          { icon: "📁", text: "Manage Projects", path: "/admin/projects" },
          { icon: "📋", text: "Reports", path: "/admin/reports" },
        ],
      },
    ],
  }

};

const Sidebar = ({ collapsed = false, onToggle }) => {

  const location = useLocation();

  const [user, setUser] = useState({});
  // ✅ FIX: Read role from sessionStorage immediately (set at login)
  //    Never default to "founder" — that caused freelancers to see founder sidebar
  const [role, setRole] = useState(
    sessionStorage.getItem("role") || "freelancer"
  );

  useEffect(() => {

    const userId = sessionStorage.getItem("user_id");
    const savedRole = sessionStorage.getItem("role");

    // Set role immediately from session — no waiting for API
    if (savedRole) setRole(savedRole);

    // API call only to get the display name/initials for the sidebar footer
    if (userId) {
      axios.get(`/api/userinfo/${userId}`)
        .then(res => {
          setUser(res.data.data);
          // Also sync role from DB in case session is stale
          if (res.data.data?.role) setRole(res.data.data.role);
        })
        .catch(err => console.log(err));
    }

  }, []);

  const menu = sidebarMenus[role] || sidebarMenus["freelancer"];

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (

    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      <button className="sidebar-toggle" onClick={onToggle}>
        ☰
      </button>

      <br />

      <nav className="sidebar-nav">

        {menu.sections.map((section, si) => (
          <div className="sidebar-section" key={si}>

            <p className="sidebar-section-title">
              {section.label}
            </p>

            {section.items.map((item, ii) => (

              <Link
                key={ii}
                to={item.path}
                className={`sidebar-link ${location.pathname === item.path ? "active" : ""
                  }`}
              >

                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-text">{item.text}</span>

              </Link>

            ))}

          </div>
        ))}

      </nav>

      <div className="sidebar-footer">

        <div className="sidebar-user">

          <div className="sidebar-avatar">
            {getInitials(user.full_name)}
          </div>

          <div className="sidebar-user-info">

            <p className="sidebar-user-name">
              {user.full_name || "User"}
            </p>

            <p className="sidebar-user-role">
              {role}
            </p>

          </div>

        </div>

      </div>

    </aside>

  );

};

export default Sidebar;