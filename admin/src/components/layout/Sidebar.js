import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import "../../styles/Sidebar.css";

/* ✅ CORRECT ICONS */
import {
  HiBars3,
  HiXMark,
  HiChartBar,
  HiUsers,
  HiFolder,
  HiClipboardDocumentList
} from "react-icons/hi2";

const sidebarMenus = {
  admin: {
    sections: [
      {
        label: "Dashboard",
        items: [
          { icon: <HiChartBar />, text: "Overview", path: "/dashboard" }
        ]
      },
      {
        label: "Management",
        items: [
          { icon: <HiUsers />, text: "Manage Users", path: "/users" },
          { icon: <HiFolder />, text: "Manage Projects", path: "/projects" },
          { icon: <HiClipboardDocumentList />, text: "Reports", path: "/reports" }
        ]
      }
    ]
  }
};

const Sidebar = ({ role = "admin", collapsed = false, onToggle }) => {

  const location = useLocation();
  const menu = sidebarMenus[role];

  const [user, setUser] = useState({});

  useEffect(() => {
    const adminId = sessionStorage.getItem("admin_id");

    axios.get(`/api/admininfo/${adminId}`)
      .then(res => setUser(res.data.data || {}))
      .catch(err => console.log(err));
  }, []);

  const getInitials = (name) => {
    if (!name) return "A";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* ✅ FIXED TOGGLE */}
      <button className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? <HiBars3 /> : <HiBars3 />}
      </button>

      <nav className="sidebar-nav">
        {menu.sections.map((section, si) => (
          <div className="sidebar-section" key={si}>

            <p className="sidebar-section-title">{section.label}</p>

            {section.items.map((item, ii) => (
              <Link
                key={ii}
                to={item.path}
                className={`sidebar-link ${
                  location.pathname === item.path ? "active" : ""
                }`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-text">{item.text}</span>
              </Link>
            ))}

          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">

          <div className="sidebar-avatar">
            {getInitials(user.name)}
          </div>

          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.name || "Admin"}</p>
            <p className="sidebar-user-role">{user.role || "Administrator"}</p>
          </div>

        </div>
      </div>

    </aside>
  );
};

export default Sidebar;