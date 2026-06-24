require("dotenv").config(); // Load environment variables from .env
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────────────────────
// Allowed origins: local dev + Vercel deployments + Render self
const allowedOrigins = [
  "http://localhost:3000",          // client dev
  "http://localhost:3001",          // admin dev
  "https://idea2team.onrender.com", // Render (same-origin calls)
  "https://idea2team-git-main-meetop08s-projects.vercel.app", // Vercel main
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app preview deployment
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.endsWith(".vercel.app") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Socket CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST"]
  }
});

app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use("/public", express.static("public"));
// ================== UTILS ==================

function cleanSkills(skills) {
  return skills
    .toLowerCase()
    .replace(/\.js/g, "")
    .replace(/\s+/g, "")
    .replace(/\[|\]|"/g, "")
    .split(",")
    .map((s) => s.trim())
    .join(",");
}

const mysql = require("mysql2");
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "idea2team",
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : null,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const WORKSPACE_ROLES = ["owner", "admin", "member", "viewer"];

const dbQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const getMembershipRole = async (workspaceId, userId) => {
  const rows = await dbQuery(
    "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1",
    [workspaceId, userId],
  );
  return rows.length ? rows[0].role : null;
};

const isWorkspaceManager = (role) => role === "owner" || role === "admin";

db.getConnection((err, connection) => {
  if (err) {
    console.error("Connection Failed❌ and error is:", err);
  } else {
    console.log("Connected to the database successfully!✅");
    connection.release();
  }
});
//admin login
app.post("/api/admin-login", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  const query = "SELECT * FROM admin WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, results) => {
    // Allow env-based fallback admin (for dev/staging use)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      return res.json({
        message: "Admin Login Successful",
        email: email,
        admin_id: 1,
      });
    } else if (results && results.length > 0) {
      return res.json({
        message: "Admin Login Successful",
        email: email,
        admin_id: results[0].admin_id,
      });
    } else {
      return res.json({
        message: "Invalid Admin Credentials",
      });
    }
  });
});

app.post("/api/register", (req, res) => {
  const { full_name, email, password, role, phone } = req.body;

  // Validate required fields
  if (!full_name || !email || !password || !role || !phone) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  const checkQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkQuery, [email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
    if (result.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const insertQuery =
      "INSERT INTO users ( full_name, email, password,role , phone, status) VALUES (?, ?, ?, ?, ?, 'active')";
    db.query(
      insertQuery,
      [full_name, email, password, role, phone],
      (err, result) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ message: "Server error during registration" });
        }
        res.status(201).json({ message: "User registered successfully!" });
      },
    );
  });
});

app.post("/api/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  const email = req.body.email.trim();
  const password = req.body.password.trim();

  const query = "SELECT * FROM users WHERE email=? AND password=?";

  db.query(query, [email, password], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result[0];

    if (user.status === "blocked") {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    // ✅ SEND ONLY REQUIRED DATA
    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        fullname: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  });
});
// OAuth Login/Register Handler
app.post("/api/oauth", (req, res) => {
  const { email, full_name, role, provider } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({ message: "Invalid OAuth data from " + provider });
  }

  const query = "SELECT * FROM users WHERE email=?";
  db.query(query, [email], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.length > 0) {
      // User exists, log them in
      const user = result[0];
      if (user.status === "blocked") {
        return res.status(403).json({ message: "Your account is blocked" });
      }
      return res.json({
        success: true,
        isNew: false,
        user: {
          user_id: user.user_id,
          fullname: user.full_name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // User does not exist, register them!
      const userRole = role || 'freelancer'; // default to freelancer if not specified
      const insertQuery = "INSERT INTO users (full_name, email, password, role, phone, status) VALUES (?, ?, ?, ?, ?, 'active')";
      // We use a dummy password and phone for OAuth users
      const dummyPassword = "OAUTH_" + Math.random().toString(36).slice(-8);

      db.query(insertQuery, [full_name, email, dummyPassword, userRole, "0000000000"], (err, insertResult) => {
        if (err) return res.status(500).json({ message: "Error auto-registering user" });

        // Return logged in user
        return res.json({
          success: true,
          isNew: true,
          user: {
            user_id: insertResult.insertId,
            fullname: full_name,
            email: email,
            role: userRole,
          },
        });
      });
    }
  });
});

// Forgot Password Endpoint
const otpStore = new Map();

// 1. Send OTP
app.post('/api/forgot-password/send-otp', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // Ensure user exists
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "User with this email not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email, { otp, expiresAt });

    // Fake sending mail for dev purposes if we don't have real credentials
    console.log(`[DEV OTP] For ${email}: ${otp}`);

    // Uncomment below to send real emails if transporter is configured
    /*
    transporter.sendMail({
        from: 'testidea2team@gmail.com',
        to: email,
        subject: 'Idea2Team - Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`
    }).catch(e => console.log("Mail send generic error", e));
    */

    return res.status(200).json({ message: "OTP sent successfully" });
  });
});

// 2. Verify OTP
app.post('/api/forgot-password/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ message: "No OTP found for this email" });
  if (Date.now() > record.expiresAt) return res.status(400).json({ message: "OTP has expired" });
  if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

  return res.status(200).json({ message: "OTP verified successfully" });
});

// 3. Reset Password
app.post('/api/forgot-password/reset', (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = otpStore.get(email);

  if (!record || record.otp !== otp) return res.status(400).json({ message: "Invalid session or OTP" });
  if (Date.now() > record.expiresAt) return res.status(400).json({ message: "OTP has expired" });

  db.query("UPDATE users SET password = ? WHERE email = ?", [newPassword, email], (err) => {
    if (err) return res.status(500).json({ message: "Failed to reset password" });

    otpStore.delete(email); // clear OTP
    return res.status(200).json({ message: "Password reset successfully" });
  });
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
app.post("/api/post-project", upload.single("upload_file"), (req, res) => {
  const {
    founder_id,
    title,
    description,
    category,
    required_skills,
    project_stage,
    collaboration_type,
    experience_level,
    budget_min,
    budget_max,
    duration_weeks,
    team_members_required,
    application_deadline,
    completion_deadline,
  } = req.body;
  const upload_file = req.file ? req.file.filename : null;
  const sql = `
        INSERT INTO projects
        (founder_id,title,description,category,required_skills,
        project_stage,collaboration_type,experience_level,
        budget_min,budget_max,duration_weeks,team_members_required,upload_file,
        application_deadline,completion_deadline)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

  db.query(
    sql,
    [
      founder_id,
      title,
      description,
      category,
      required_skills,
      project_stage,
      collaboration_type,
      experience_level,
      budget_min,
      budget_max,
      duration_weeks,
      team_members_required,
      upload_file,
      application_deadline || null,
      completion_deadline || null,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Insert Failed" });
      }

      res.json({ success: true });
    },
  );
});
// Check if freelancer has already applied to a project
app.get("/api/check-application/:project_id/:freelancer_id", (req, res) => {
  const { project_id, freelancer_id } = req.params;

  const query = `
    SELECT application_id, status FROM applications 
    WHERE project_id = ? AND freelancer_id = ?
  `;

  db.query(query, [project_id, freelancer_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error checking application status",
        exists: false,
      });
    }

    const applicationExists = result.length > 0;
    res.json({
      exists: applicationExists,
      application: applicationExists ? result[0] : null,
    });
  });
});

app.post("/api/apply-project", (req, res) => {
  const { project_id, freelancer_id, proposal_message, expected_salary } =
    req.body;

  console.log(req.body);

  // First check if the application deadline has passed
  const deadlineQuery = `SELECT application_deadline FROM projects WHERE project_id = ?`;
  db.query(deadlineQuery, [project_id], (err, projectResult) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error checking project deadline" });
    }
    if (projectResult.length > 0 && projectResult[0].application_deadline) {
      const deadline = new Date(projectResult[0].application_deadline);
      deadline.setHours(23, 59, 59, 999); // end of deadline day
      if (new Date() > deadline) {
        return res.status(403).json({
          message: "Applications for this project are closed. The deadline was " + deadline.toLocaleDateString(),
        });
      }
    }

    // Check if application already exists
    const checkQuery = `
      SELECT application_id FROM applications 
      WHERE project_id = ? AND freelancer_id = ?
    `;

    db.query(checkQuery, [project_id, freelancer_id], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Error checking existing application",
        });
      }

      // If application already exists, reject
      if (result.length > 0) {
        return res.status(409).json({
          message: "You have already applied to this project",
          exists: true,
        });
      }

      // Insert new application
      const query = `
        INSERT INTO applications
        (project_id, freelancer_id, proposal_message, expected_salary)
        VALUES (?,?,?,?)
        `;

      db.query(
        query,
        [project_id, freelancer_id, proposal_message, expected_salary],
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              message: "Error inserting application",
            });
          }

          res.json({
            success: true,
            message: "Application submitted successfully",
          });
        },
      );
    });
  });
});

// Skill normalization helper
const cleanSkillString = (skillsStr) => {
  if (!skillsStr) return "";
  let processedStr = skillsStr;

  // If it's a JSON array string like '["react","node"]', parse it safely
  try {
    if (processedStr.trim().startsWith('[') && processedStr.trim().endsWith(']')) {
      const parsed = JSON.parse(processedStr);
      if (Array.isArray(parsed)) {
        processedStr = parsed.join(',');
      }
    }
  } catch (e) {
    // Ignored, proceed as normal comma separated string
  }

  return processedStr
    .toLowerCase()
    .replace(/\.js/g, "")
    .replace(/\s+/g, "")
    .split(',')
    .filter(s => s.length > 0)
    .join(',');
};

// 23-03-2026 enter, update, and edit profile data 
app.post("/api/profile", upload.any(), (req, res) => {
  const {
    user_id, title, location, bio,
    contact_info, experience,
    github, linkedin, portfolio
  } = req.body;

  let skills = req.body.skills || "";
  skills = cleanSkillString(skills); // enforce strictly lowercase, no .js, no space

  let image = req.body.image || "";
  let resume = req.body.resume || "";

  if (req.files && req.files.length > 0) {
    const imgFile = req.files.find(f => f.fieldname === 'image');
    if (imgFile) image = imgFile.filename;

    const resFile = req.files.find(f => f.fieldname === 'resume');
    if (resFile) resume = resFile.filename;
  }

  const query = `
        INSERT INTO profiles (
            user_id, title, location, bio, 
            contact_info, skills, experience, 
            github, linkedin, portfolio, image, resume
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            location = VALUES(location),
            bio = VALUES(bio),
            contact_info = VALUES(contact_info),
            skills = VALUES(skills),
            experience = VALUES(experience),
            github = VALUES(github),
            linkedin = VALUES(linkedin),
            portfolio = VALUES(portfolio),
            image = VALUES(image),
            resume = VALUES(resume)
    `;

  db.query(query, [
    user_id, title, location, bio,
    contact_info, skills, experience,
    github, linkedin, portfolio, image, resume
  ], (err) => {
    if (err) {
      console.error("SQL Error in Profile POST:", err);
      return res.status(500).json({ message: "Error saving profile" });
    }
    res.json({ success: true, message: "Profile saved successfully" });
  });
});
// Removed buggy duplicate GET /api/profile/:user_id

app.put("/api/profile/:user_id", (req, res) => {
  const { user_id } = req.params;
  const {
    title, location, bio,
    contact_info, skills, experience,
    github, linkedin, portfolio, image, resume
  } = req.body;

  const query = `
        UPDATE profiles
        SET title = ?, location = ?, bio = ?, 
            contact_info = ?, skills = ?, experience = ?, 
            github = ?, linkedin = ?, portfolio = ?, image = ? ,resume = ?
        WHERE user_id = ?`;

  db.query(query, [
    title, location, bio,
    contact_info, skills, experience,
    github, linkedin, portfolio, image, resume,
    user_id
  ], (err, result) => {
    if (err) {
      console.error("SQL Error in Profile PUT:", err);
      return res.status(500).json({ message: "Error updating profile" });
    }
    res.status(200).json({ success: true, message: "Profile updated successfully" });
  });
});

app.get("/api/profile/:user_id", (req, res) => {
  const { user_id } = req.params;

  const query = `
        SELECT users.full_name, users.email, profiles.*
        FROM users
        LEFT JOIN profiles ON users.user_id = profiles.user_id
        WHERE users.user_id = ?
    `;

  db.query(query, [user_id], (err, result) => {
    if (err) {
      console.error("SQL Error in Profile GET:", err);
      return res.status(500).json({ message: "Error fetching profile" });
    }
    res.status(200).json(result[0] || {});
  });
});
app.get("/api/Manage-Users", (req, res) => {
  const query = `SELECT *FROM users`;
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "An error occurred while fetching users. Please try again.",
      });
    } else {
      res.status(200).json({
        message: "Users data fetched successfully!",
        data: result,
      });
    }
  });
});
app.get("/api/userinfo/:id", (req, res) => {
  const userId = req.params.id;
  const query = `SELECT * FROM users WHERE user_id = ?`;
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message:
          "An error occurred while fetching user info. Please try again.",
      });
    } else {
      res.status(200).json({
        message: "User info fetched successfully!",
        data: result[0],
      });
    }
  });
});
app.get("/api/admininfo/:id", (req, res) => {
  const userId = req.params.id;
  const query = `SELECT * FROM admin WHERE admin_id = ?`;
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message:
          "An error occurred while fetching user info. Please try again.",
      });
    } else {
      res.status(200).json({
        message: "User info fetched successfully!",
        data: result[0],
      });
    }
  });
});
app.get("/api/myProject/:id", (req, res) => {
  const founder_id = req.params.id;

  console.log("Founder ID:", founder_id);

  const query = `
    SELECT p.*, 
    (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.project_id AND a.status = 'accepted') AS members_joined 
    FROM projects p 
    WHERE p.founder_id=?
  `;

  db.query(query, [founder_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error fetching projects",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  });
});

app.get("/api/manage-project", (req, res) => {
  const query = `SELECT * FROM projects`;

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "An error occurred while fetching users. Please try again.",
      });
    } else {
      res.status(200).json({
        message: "Project fetched successfully!",
        data: result,
      });
    }
  });
});
app.get("/api/editproject/:id", (req, res) => {
  const projectId = req.params.id;

  const query = "SELECT * FROM projects WHERE project_id=?";

  db.query(query, [projectId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching project" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({
      success: true,
      data: result[0],
    });
  });
});
app.get("/api/projects", (req, res) => {
  const query = `
        SELECT p.*, users.full_name AS founder_name,
        (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.project_id AND a.status = 'accepted') AS members_joined
        FROM projects p
        JOIN users ON p.founder_id = users.user_id WHERE p.status = 'active'
    `;

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);

      return res.status(500).json({
        message: "Error during fetching data.",
      });
    }

    res.json({
      message: "Successfully data fetched.",
      data: result,
    });
  });
});
app.get("/api/info-projects/:id", (req, res) => {
  const project_id = req.params.id;
  console.log("Project_Id:", project_id);
  const query = `SELECT * FROM projects WHERE project_id=?`;
  db.query(query, [project_id], (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Error Occoure in fatching data" });
    }
    res.json({
      success: true,
      data: result[0],
    });
  });
});
app.get("/api/info-application/:id", (req, res) => {
  const founder_id = req.params.id;
  console.log("founder_id:", founder_id);

  const query = `SELECT c.application_id, a.full_name,b.title,c.proposal_message,expected_salary,c.status 
  FROM users as a,projects as b,applications as c where a.user_id = c.freelancer_id  and
   b.project_id = c.project_id and b.founder_id=?`;
  db.query(query, [founder_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error fetching applications",
      });
    }
    res.json({
      success: true,
      data: result,
    });
  });
});
app.get("/api/freelancer/myapplication/:id", (req, res) => {
  const id = req.params.id;
  console.log("freelancer_id:", id);

  const query = `SELECT p.project_id, u.full_name, u.email as email, u.phone as phone, p.title, p.description, a.status FROM users as u,projects as p,applications as a 
    WHERE u.user_id = p.founder_id AND p.project_id = a.project_id AND freelancer_id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({
        message: "Error fatching data",
      });
    }
    res.json({
      success: true,
      data: result,
    });
  });
});

app.get("/api/founder/dashboard/:id", (req, res) => {
  const id = req.params.id;
  console.log(id);
  const query = `SELECT 
  (SELECT COUNT(*) FROM projects WHERE founder_id=?) AS totalProjects ,
  (SELECT COUNT(*) FROM projects WHERE founder_id=? AND status = 'active') AS activeProjects,
  (SELECT COUNT(*) FROM applications a JOIN projects p ON a.project_id = p.project_id WHERE founder_id=? ) AS totalApplications,
  (SELECT COUNT(*) FROM applications a JOIN projects p ON a.project_id = p.project_id AND a.status='accepted' WHERE founder_id=?) AS acceptedFreelancers`;

  db.query(query, [id, id, id, id], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).json({
        message: "Error in Data fatching"
      })
    }
    console.log(result)
    res.json({
      success: true,
      message: "Successfully fatched",
      data: result[0]
    })
  })
})

app.get("/api/freelancer/dashboard/:id", (req, res) => {
  const freelancer_id = req.params.id;

  // Uses only the applications table (guaranteed to exist in all environments)
  const query = `SELECT 
    (SELECT COUNT(*) FROM applications WHERE freelancer_id=?) AS appliedProjects,
    (SELECT COUNT(*) FROM applications WHERE status='accepted' AND freelancer_id=?) AS acceptedProjects,
    (SELECT COUNT(*) FROM applications WHERE status='rejected' AND freelancer_id=?) AS rejected,
    (SELECT COUNT(*) FROM applications WHERE status='pending'  AND freelancer_id=?) AS pending,
    (SELECT COUNT(*) FROM applications a
       JOIN projects p ON a.project_id = p.project_id
       WHERE p.status='active' AND a.status='accepted' AND a.freelancer_id=?) AS activeProjects`;

  db.query(query, Array(5).fill(freelancer_id), (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error occurred during fetching data" });
    }
    return res.json({
      success: true,
      message: "Successfully fetched",
      data: result[0]
    });
  });
})
app.get("/api/admin/stats", (req, res) => {
  const query = `SELECT 
        (SELECT COUNT(*) FROM users) AS totalUsers,
        (SELECT COUNT(*) FROM projects) AS totalProjects,
        (SELECT COUNT(*) FROM projects WHERE status = 'active') AS activeProjects,
        (SELECT COUNT(*) FROM applications) AS totalApplications,
        (SELECT COUNT(*) FROM users WHERE role = 'freelancer') as totalFreelancers,
        (SELECT COUNT(*) FROM users WHERE role = 'founder') as totalFounders,
        (SELECT COUNT(*) FROM users WHERE status = 'blocked') as blockedUsers`;

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error fetching admin stats" });
    }
    res.json(result[0]);
  });
});

app.get("/api/admin/recent-activity", (req, res) => {
  const recentProjectsQuery = "SELECT title, created_at FROM projects ORDER BY created_at DESC LIMIT 5";
  const recentUsersQuery = "SELECT full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5";

  db.query(recentProjectsQuery, (err, projectResults) => {
    if (err) return res.status(500).json({ message: "Error fetching recent projects" });

    db.query(recentUsersQuery, (err, userResults) => {
      if (err) return res.status(500).json({ message: "Error fetching recent users" });

      res.json({
        recentProjects: projectResults,
        recentUsers: userResults
      });
    });
  });
});

app.get("/api/admin/reports-data", (req, res) => {
  const period = req.query.period || 'daily';

  let interval;
  let dateFormat;
  if (period === 'daily') {
    interval = '7 DAY';
  } else if (period === 'weekly') {
    interval = '4 WEEK';
  } else if (period === 'monthly') {
    interval = '6 MONTH';
  }

  const pQuery = `SELECT created_at, status FROM projects WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval})`;
  const aQuery = `SELECT applied_at FROM applications WHERE applied_at >= DATE_SUB(NOW(), INTERVAL ${interval})`;
  const uQuery = `SELECT created_at FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval})`;

  db.query(pQuery, (err, pResults) => {
    if (err) return res.status(500).json({ message: "Error fetching project data" });
    db.query(aQuery, (err, aResults) => {
      if (err) return res.status(500).json({ message: "Error fetching applications" });
      db.query(uQuery, (err, uResults) => {
        if (err) return res.status(500).json({ message: "Error fetching users" });

        const grouped = {};

        const formatLabel = (dateStr) => {
          const d = new Date(dateStr);
          if (period === 'daily') {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else if (period === 'weekly') {
            const weekNum = Math.ceil(d.getDate() / 7);
            return `${d.toLocaleDateString('en-US', { month: 'short' })} W${weekNum}`;
          } else {
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
        };

        const initializeLabels = () => {
          const labels = [];
          const now = new Date();
          if (period === 'daily') {
            for (let i = 6; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(d.getDate() - i);
              labels.push(formatLabel(d));
            }
          } else if (period === 'weekly') {
            for (let i = 3; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(d.getDate() - (i * 7));
              const label = formatLabel(d);
              if (!labels.includes(label)) labels.push(label);
            }
          } else if (period === 'monthly') {
            for (let i = 5; i >= 0; i--) {
              const d = new Date(now);
              d.setMonth(d.getMonth() - i);
              labels.push(formatLabel(d));
            }
          }
          return labels;
        };

        const labels = initializeLabels();
        labels.forEach(l => {
          grouped[l] = { published: 0, closed: 0, applications: 0, users: 0 };
        });

        pResults.forEach(p => {
          const l = formatLabel(p.created_at);
          if (grouped[l]) {
            grouped[l].published += 1;
            if (p.status === 'closed') {
              grouped[l].closed += 1;
            }
          }
        });

        aResults.forEach(a => {
          const l = formatLabel(a.applied_at);
          if (grouped[l]) grouped[l].applications += 1;
        });

        uResults.forEach(u => {
          const l = formatLabel(u.created_at);
          if (grouped[l]) grouped[l].users += 1;
        });

        const finalData = {
          labels: Object.keys(grouped),
          published: Object.keys(grouped).map(k => grouped[k].published),
          closed: Object.keys(grouped).map(k => grouped[k].closed),
          applications: Object.keys(grouped).map(k => grouped[k].applications),
          users: Object.keys(grouped).map(k => grouped[k].users),
        };

        res.json({
          success: true,
          data: finalData
        });
      });
    });
  });
});

app.get("/api/founder/dashboard/recent-freelancer/:id", (req, res) => {
  const id = req.params.id;

  const Query = `SELECT u.full_name,u.role,p.title,a.applied_at 
  FROM users as u,projects as p ,applications as a 
  WHERE u.user_id = a.freelancer_id 
  AND p.project_id = a.project_id 
  AND p.founder_id = ?
  ORDER BY a.applied_at DESC LIMIT 4`;

  db.query(Query, [id], (err, Results) => {
    if (err) {
      return res.status(500).json({
        message: "Error fetching recent users"
      });
    }

    return res.json({
      data: Results
    });
  });
});
app.get("/api/freelancer/dashboard/recent-project/:id", (req, res) => {
  const id = req.params.id;

  const query = `SELECT p.title,p.created_at,p.required_skills,u.full_name 
  FROM projects as p,users as u 
  WHERE u.user_id = p.founder_id 
  ORDER BY p.project_id DESC LIMIT 3;`;

  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Error fetching recent projects"
      });
    }

    return res.json({
      success: true,
      data: result
    });
  });
});
app.put("/api/block-user/:id", (req, res) => {
  const userId = req.params.id;

  const query = ` UPDATE users SET status = IF(status = 'active', 'closed', 'active') WHERE user_id = ?;`;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error updating user status" });
    }
    res.json({ message: "User status updated successfully" });
  });
});
app.put("/api/status-project/:id", (req, res) => {
  const projectId = req.params.id;

  const query = `
                    UPDATE projects SET status = IF(status = 'active', 'closed', 'active') WHERE project_id = ?;   
`;

  db.query(query, [projectId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error updating project status" });
    }
    res.json({ message: "Project status updated successfully" });
  });
});

app.put("/api/founder/edit-project/:id", (req, res) => {
  const projectId = req.params.id;

  const {
    title,
    description,
    required_skills,
    budget_min,
    budget_max,
    duration_weeks,
    team_members_required,
    application_deadline,
    completion_deadline,
  } = req.body;

  const query = `
        UPDATE projects SET 
            title = ?,
            description = ?,
            required_skills = ?,
            budget_min = ?,
            budget_max = ?,
            duration_weeks = ?,
            team_members_required = ?,
            application_deadline = ?,
            completion_deadline = ?
        WHERE project_id = ?
    `;

  db.query(
    query,
    [
      title,
      description,
      required_skills,
      budget_min,
      budget_max,
      duration_weeks,
      team_members_required,
      application_deadline || null,
      completion_deadline || null,
      projectId,
    ],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Error updating project" });
      }

      res.json({ message: "Project updated successfully" });
    },
  );
});

app.put("/api/application/accept/:id", (req, res) => {
  const applicationId = req.params.id;
  const query = "UPDATE applications SET status = 'accepted' WHERE application_id = ?";

  db.query(query, [applicationId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error updating application status" });

    // Auto-Workspace logic
    db.query("SELECT a.project_id, a.freelancer_id, p.founder_id, p.title FROM applications a JOIN projects p ON a.project_id = p.project_id WHERE a.application_id = ?", [applicationId], (err, appData) => {
      if (err || appData.length === 0) return res.json({ success: true, message: "Application accepted successfully" });
      const { project_id, freelancer_id, founder_id, title } = appData[0];

      // Check if workspace exists
      db.query("SELECT workspace_id FROM workspaces WHERE project_id = ?", [project_id], (err, wsData) => {
        if (wsData && wsData.length > 0) {
          // Workspace exists => add freelancer
          const workspace_id = wsData[0].workspace_id;
          db.query("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'member') ON DUPLICATE KEY UPDATE role='member'", [workspace_id, freelancer_id], () => { });
        } else {
          // Workspace doesn't exist => create it
          db.query("INSERT INTO workspaces (project_id, owner_id, name, description) VALUES (?, ?, ?, ?)", [project_id, founder_id, `Workspace for ${title}`, `Auto-generated workspace for ${title}`], (err, insertRes) => {
            if (!err) {
              const newWorkspaceId = insertRes.insertId;
              // Add founder as admin
              db.query("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'admin')", [newWorkspaceId, founder_id], () => { });
              // Add freelancer as member
              db.query("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'member')", [newWorkspaceId, freelancer_id], () => { });
            }
          });
        }
      });
    });

    res.json({ success: true, message: "Application accepted successfully!" });
  });
});

app.put("/api/application/reject/:id", (req, res) => {
  const applicationId = req.params.id;
  const query =
    "UPDATE applications SET status = 'rejected' WHERE application_id = ?";
  db.query(query, [applicationId], (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Error updating application status" });
    }
    res.json({ success: true, message: "Application rejected successfully" });
  });
});

app.delete("/api/project/:id", (req, res) => {
  const projectId = req.params.id;
  const query = "DELETE FROM projects WHERE project_id=?";

  db.query(query, [projectId], (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "delete failed" });
    }
    res.json({ message: "Project deleted successfully" });
  });
});
app.post("/api/founder-profile", upload.single("image"), (req, res) => {
  const {
    user_id, phone, location, bio,
    company_name, company_website,
    industry, company_size, company_description
  } = req.body;

  // Use uploaded file filename if exists, otherwise keep existing image value
  const image = req.file ? req.file.filename : req.body.image;

  const query = `
        INSERT INTO founder_profiles (
            user_id, phone, location, bio, 
            company_name, company_website, 
            industry, company_size, company_description, image
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            phone = VALUES(phone),
            location = VALUES(location),
            bio = VALUES(bio),
            company_name = VALUES(company_name),
            company_website = VALUES(company_website),
            industry = VALUES(industry),
            company_size = VALUES(company_size),
            company_description = VALUES(company_description),
            image = VALUES(image)
    `;

  db.query(query, [
    user_id, phone, location, bio,
    company_name, company_website,
    industry, company_size, company_description, image
  ], (err) => {
    if (err) {
      console.error("SQL Error in Founder Profile POST:", err);
      return res.status(500).json({ message: "Error saving founder profile" });
    }
    res.json({
      success: true,
      message: "Founder Profile saved successfully",
      image: image
    });
  });
});

app.get("/api/founder-profile/:user_id", (req, res) => {
  const { user_id } = req.params;

  const query = `
        SELECT users.full_name, users.email, founder_profiles.*
        FROM users
        LEFT JOIN founder_profiles ON users.user_id = founder_profiles.user_id
        WHERE users.user_id = ?
    `;

  db.query(query, [user_id], (err, result) => {
    if (err) {
      console.error("SQL Error in Founder Profile GET:", err);
      return res.status(500).json({ message: "Error fetching founder profile" });
    }
    res.status(200).json(result[0] || {});
  });
});
// ================== SMART MATCHING & INVITES ==================

app.get("/api/match/:project_id", (req, res) => {
  const projectId = req.params.project_id;

  // 1. Get project details
  const projectQuery = "SELECT required_skills, experience_level FROM projects WHERE project_id = ?";

  db.query(projectQuery, [projectId], (err, projectResult) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error fetching project" });
    }

    if (projectResult.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { required_skills, experience_level } = projectResult[0];
    const projectSkillsStr = cleanSkillString(required_skills || "");
    const projectSkills = projectSkillsStr.length > 0 ? projectSkillsStr.split(',') : [];

    // 2. Get all active freelancers
    const freelancerQuery = `
      SELECT p.user_id, p.skills, p.experience, p.title, p.image, u.full_name
      FROM profiles p 
      JOIN users u ON p.user_id = u.user_id 
      WHERE u.role = 'freelancer' AND u.status = 'active'
    `;

    db.query(freelancerQuery, (err, freelancers) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Error fetching freelancers" });
      }

      // 3. Match logic
      const results = freelancers.map((f) => {
        const fSkillsStr = cleanSkillString(f.skills || "");
        const fSkills = fSkillsStr.length > 0 ? fSkillsStr.split(',') : [];

        // original formatting for display if needed, but the algorithm needs clean ones
        // The prompt says "store as: react,node,html", so we will just use the clean strings for both 
        // display and logic since it's cleaner.

        let matched = [];
        let missing = [];

        projectSkills.forEach(reqSkill => {
          if (fSkills.includes(reqSkill)) {
            matched.push(reqSkill);
          } else {
            missing.push(reqSkill);
          }
        });

        // Skills Score
        const skillScore = projectSkills.length > 0
          ? (matched.length / projectSkills.length) * 100
          : 0;

        // Experience Score
        let expScore = 0;
        const expLower = (f.experience || "").toLowerCase();

        if (expLower.includes('expert') || expLower.includes('senior') || expLower.includes('advanced')) {
          expScore = 100;
        } else if (expLower.includes('intermediate') || expLower.includes('mid')) {
          expScore = 70;
        } else if (expLower.includes('beginner') || expLower.includes('junior') || expLower.includes('entry')) {
          expScore = 40;
        } else if (expLower.length > 0) {
          // Default middle ground if they wrote something else
          expScore = 50;
        }

        // Final Score (70% Skill, 30% Experience)
        let finalScore = 0;
        if (matched.length > 0) {
          finalScore = Math.round((skillScore * 0.7) + (expScore * 0.3));
        }

        return {
          user_id: f.user_id,
          full_name: f.full_name,
          title: f.title,
          image: f.image,
          score: finalScore,
          matchedSkills: matched,
          missingSkills: missing,
          experience: f.experience
        };
      });

      // 4. Sort by best match (highest score first) and DO NOT filter out low skill matches, but exclude 0 scores
      const sortedFreelancers = results
        .filter(f => f.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      res.json({
        success: true,
        data: sortedFreelancers
      });
    });
  });
});

app.post("/api/invite", (req, res) => {
  const { project_id, freelancer_id, founder_id } = req.body;

  if (!project_id || !freelancer_id || !founder_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const query = `
        INSERT INTO invitations (project_id, freelancer_id, founder_id, status) 
        VALUES (?, ?, ?, 'pending')
    `;

  db.query(query, [project_id, freelancer_id, founder_id], (err, result) => {
    if (err) {
      // Check for duplicate entry error (ER_DUP_ENTRY)
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "Freelancer already invited to this project" });
      }
      console.log(err);
      return res.status(500).json({ message: "Error sending invitation" });
    }
    res.status(201).json({ success: true, message: "Invitation sent successfully" });
  });
});

app.get("/api/founder/invitations/:founder_id", (req, res) => {
  const { founder_id } = req.params;

  const query = `
        SELECT i.id, i.project_id, i.status, i.created_at, p.title as project_title, u.full_name as freelancer_name 
        FROM invitations i
        JOIN projects p ON i.project_id = p.project_id
        JOIN users u ON i.freelancer_id = u.user_id
        WHERE i.founder_id = ?
        ORDER BY i.created_at DESC
    `;

  db.query(query, [founder_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching founder invitations" });
    }
    res.json({ success: true, data: results });
  });
});

app.get("/api/invitations/:freelancer_id", (req, res) => {
  const { freelancer_id } = req.params;

  const query = `
        SELECT i.id, i.project_id, i.status, i.created_at, p.title as project_title, u.full_name as founder_name
        FROM invitations i
        JOIN projects p ON i.project_id = p.project_id
        JOIN users u ON i.founder_id = u.user_id
        WHERE i.freelancer_id = ?
        ORDER BY i.created_at DESC
    `;

  db.query(query, [freelancer_id], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error fetching invitations" });
    }
    res.json({ success: true, data: results });
  });
});

app.put("/api/invitations/:id/:action", (req, res) => {
  const { id, action } = req.params;

  // Only allow 'accept' or 'reject'
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  // Map URL action to DB enum status
  const newStatus = action === 'accept' ? 'accepted' : 'rejected';

  const query = `UPDATE invitations SET status = ? WHERE id = ?`;

  db.query(query, [newStatus, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating invitation" });
    }
    res.json({ success: true, message: `Invitation ${newStatus}` });
  });
});

// Freelancer Smart Suggestions
app.get("/api/recommended-projects/:freelancer_id", (req, res) => {
  const { freelancer_id } = req.params;

  // 1. Get freelancer skills and experience
  const profileQuery = "SELECT skills, experience FROM profiles WHERE user_id = ?";

  db.query(profileQuery, [freelancer_id], (err, profileResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching profile" });
    }

    if (profileResult.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const fProfile = profileResult[0];
    const fSkillsStr = cleanSkillString(fProfile.skills || "");
    const fSkills = fSkillsStr.length > 0 ? fSkillsStr.split(',') : [];

    // Setup freelancer experience score
    let expScore = 0;
    const expLower = (fProfile.experience || "").toLowerCase();

    if (expLower.includes('expert') || expLower.includes('senior') || expLower.includes('advanced')) {
      expScore = 100;
    } else if (expLower.includes('intermediate') || expLower.includes('mid')) {
      expScore = 70;
    } else if (expLower.includes('beginner') || expLower.includes('junior') || expLower.includes('entry')) {
      expScore = 40;
    } else if (expLower.length > 0) {
      expScore = 50;
    }

    // 2. Get past projects applied by freelancer
    const pastProjectsQuery = `
            SELECT p.required_skills 
            FROM applications a
            JOIN projects p ON a.project_id = p.project_id
            WHERE a.freelancer_id = ?
        `;

    db.query(pastProjectsQuery, [freelancer_id], (err, pastProjectsResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error fetching past projects" });
      }

      // Extract all skills from past projects
      let pastSkillsSet = new Set();
      pastProjectsResult.forEach(row => {
        const pSkillsStr = cleanSkillString(row.required_skills || "");
        if (pSkillsStr) {
          pSkillsStr.split(',').forEach(s => pastSkillsSet.add(s));
        }
      });
      const pastSkills = Array.from(pastSkillsSet);

      // 3. Get active projects
      const projectsQuery = `
                SELECT project_id, title, required_skills, experience_level, budget_min, budget_max 
                FROM projects 
                WHERE status = 'active'
            `;

      db.query(projectsQuery, (err, projects) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error fetching projects" });
        }

        // 4. Match logic
        const recommended = projects.map(p => {
          const projectSkillsStr = cleanSkillString(p.required_skills || "");
          const reqSkills = projectSkillsStr.length > 0 ? projectSkillsStr.split(',') : [];

          let matched = [];
          let missing = [];
          let pastMatchedCount = 0;

          reqSkills.forEach(reqSkill => {
            if (fSkills.includes(reqSkill)) {
              matched.push(reqSkill);
            } else {
              missing.push(reqSkill);
            }

            // Analyze if this skill is in their past projects history
            if (pastSkills.includes(reqSkill)) {
              pastMatchedCount++;
            }
          });

          const skillScore = reqSkills.length > 0
            ? (matched.length / reqSkills.length) * 100
            : 0;

          const pastProjectScore = reqSkills.length > 0
            ? (pastMatchedCount / reqSkills.length) * 100
            : 0;

          // Add weight: skills = 70%, experience = 20%, past projects = 10%
          const finalScore = matched.length > 0
            ? Math.round((skillScore * 0.70) + (expScore * 0.20) + (pastProjectScore * 0.10))
            : 0;

          return {
            project_id: p.project_id,
            title: p.title,
            score: finalScore,
            matchedSkills: matched,
            missingSkills: missing,
            required_skills: reqSkills,
            budget: `${p.budget_min || 0} - ${p.budget_max || 0}`,
            experience_level: p.experience_level
          };
        });

        // Filter and return...
        const topProjects = recommended
          .filter(p => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5); // return top 5 projects 

        res.json({ success: true, data: topProjects });
      });
    });
  });
});


// ================== WORKSPACE APIs ==================
app.post("/api/workspace/create", (req, res) => {
  const { project_id, owner_id, name, description, selected_users } = req.body;
  db.query(
    "INSERT INTO workspaces (project_id, owner_id, name, description) VALUES (?, ?, ?, ?)",
    [project_id, owner_id, name, description],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error creating workspace", error: err });
      const workspace_id = result.insertId;

      db.query("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'admin')", [workspace_id, owner_id], (err) => {
        if (err) return res.status(500).json({ message: "Error adding admin" });

        if (selected_users && selected_users.length > 0) {
          const memberValues = selected_users.map(userId => [workspace_id, userId, 'member']);
          db.query("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ?", [memberValues], (err) => {
            if (err) return res.status(500).json({ message: "Error adding members" });
            res.status(201).json({ success: true, workspace_id });
          });
        } else {
          res.status(201).json({ success: true, workspace_id });
        }
      });
    }
  );
});

app.get("/api/workspace/:id", (req, res) => {
  db.query("SELECT * FROM workspaces WHERE workspace_id = ?", [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "Workspace not found" });
    res.json({ success: true, data: results[0] });
  });
});

app.get("/api/workspace/members/:id", (req, res) => {
  // Clean up duplicates first: keep only the earliest joined_at for each user
  const cleanupQuery = `
        DELETE FROM workspace_members 
        WHERE id NOT IN (
            SELECT MIN(id) FROM (
                SELECT MIN(id) FROM workspace_members 
                WHERE workspace_id = ? 
                GROUP BY user_id
            ) AS keep_ids
        ) AND workspace_id = ?
    `;

  db.query(cleanupQuery, [req.params.id, req.params.id], (err) => {
    if (err) console.log("Cleanup error:", err);

    // Now fetch unique members - group by user_id to ensure no duplicates
    const query = `
            SELECT wm.id as workspace_member_id, wm.user_id, wm.role, wm.joined_at, u.full_name, u.email 
            FROM workspace_members wm 
            JOIN users u ON wm.user_id = u.user_id 
            WHERE wm.workspace_id = ?
            GROUP BY wm.user_id
            ORDER BY MIN(wm.joined_at) DESC
        `;
    db.query(query, [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ message: "Error fetching members" });
      res.json({ success: true, data: results });
    });
  });
});

app.post("/api/workspace/:id/invite", async (req, res) => {
  const workspaceId = Number(req.params.id);
  const { email, role = "member", inviter_id } = req.body;
  const normalizedRole = String(role).toLowerCase();

  if (!workspaceId || !email || !inviter_id) {
    return res.status(400).json({ message: "workspace id, email and inviter_id are required" });
  }
  if (!WORKSPACE_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ message: "Invalid role provided" });
  }

  try {
    const inviterRole = await getMembershipRole(workspaceId, inviter_id);
    if (!isWorkspaceManager(inviterRole)) {
      return res.status(403).json({ message: "Only owner/admin can invite members" });
    }

    const users = await dbQuery("SELECT user_id, full_name, email FROM users WHERE email = ? LIMIT 1", [email.trim()]);
    if (!users.length) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    const user = users[0];
    const duplicateCheck = await dbQuery(
      "SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1",
      [workspaceId, user.user_id],
    );
    if (duplicateCheck.length) {
      return res.status(409).json({ message: "User is already a member of this workspace" });
    }

    const workspaces = await dbQuery(
      `SELECT w.workspace_id, COALESCE(p.team_members_required, 10) AS team_capacity
       FROM workspaces w
       LEFT JOIN projects p ON p.project_id = w.project_id
       WHERE w.workspace_id = ? LIMIT 1`,
      [workspaceId],
    );
    if (!workspaces.length) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const teamCapacity = Number(workspaces[0].team_capacity) || 10;
    const joined = await dbQuery(
      "SELECT COUNT(*) AS joined_count FROM workspace_members WHERE workspace_id = ?",
      [workspaceId],
    );
    if (joined[0].joined_count >= teamCapacity) {
      return res.status(400).json({ message: `Workspace capacity reached (${teamCapacity})` });
    }

    await dbQuery(
      `INSERT INTO workspace_members (workspace_id, user_id, role, last_active)
       VALUES (?, ?, ?, NOW())`,
      [workspaceId, user.user_id, normalizedRole],
    );

    io.to(String(workspaceId)).emit("workspace_members_updated", {
      workspace_id: workspaceId,
      action: "invited",
      user_id: user.user_id,
    });

    return res.status(201).json({
      success: true,
      message: "Member invited successfully",
      email_invite: {
        status: "mock_sent",
        recipient: user.email,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "User is already a member of this workspace" });
    }
    console.error("Workspace invite error:", error);
    return res.status(500).json({ message: "Failed to invite member" });
  }
});

app.get("/api/workspace/:id/members", async (req, res) => {
  const workspaceId = Number(req.params.id);
  const { search = "", role = "", page = 1, limit = 10, requester_id } = req.query;

  if (!workspaceId) {
    return res.status(400).json({ message: "Invalid workspace id" });
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const offset = (pageNumber - 1) * limitNumber;

  try {
    const requesterRole = requester_id ? await getMembershipRole(workspaceId, requester_id) : null;
    const canManage = isWorkspaceManager(requesterRole);

    const filterValues = [workspaceId];
    let whereClause = " WHERE wm.workspace_id = ?";

    if (search.trim()) {
      whereClause += " AND (u.full_name LIKE ? OR u.email LIKE ?)";
      filterValues.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    if (role && WORKSPACE_ROLES.includes(String(role).toLowerCase())) {
      whereClause += " AND wm.role = ?";
      filterValues.push(String(role).toLowerCase());
    }

    const members = await dbQuery(
      `SELECT
          wm.id,
          wm.workspace_id,
          wm.user_id,
          wm.role,
          wm.joined_at,
          wm.last_active,
          u.full_name,
          u.email,
          CASE
            WHEN wm.last_active >= (NOW() - INTERVAL 2 MINUTE) THEN 'Online'
            ELSE 'Offline'
          END AS status
       FROM workspace_members wm
       JOIN users u ON u.user_id = wm.user_id
       ${whereClause}
       ORDER BY wm.joined_at DESC
       LIMIT ? OFFSET ?`,
      [...filterValues, limitNumber, offset],
    );

    const totalResult = await dbQuery(
      `SELECT COUNT(*) AS total FROM workspace_members wm
       JOIN users u ON u.user_id = wm.user_id
       ${whereClause}`,
      filterValues,
    );

    const capacityRows = await dbQuery(
      `SELECT COALESCE(p.team_members_required, 10) AS team_capacity
       FROM workspaces w
       LEFT JOIN projects p ON p.project_id = w.project_id
       WHERE w.workspace_id = ?
       LIMIT 1`,
      [workspaceId],
    );
    const totalJoinedRows = await dbQuery(
      "SELECT COUNT(*) AS joined_count FROM workspace_members WHERE workspace_id = ?",
      [workspaceId],
    );

    return res.json({
      success: true,
      data: members,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalResult[0].total,
        totalPages: Math.ceil(totalResult[0].total / limitNumber),
      },
      summary: {
        joined: totalJoinedRows[0].joined_count,
        capacity: Number(capacityRows[0]?.team_capacity) || 10,
      },
      permissions: {
        requester_role: requesterRole,
        can_manage: canManage,
      },
    });
  } catch (error) {
    console.error("Get workspace members error:", error);
    return res.status(500).json({ message: "Failed to fetch workspace members" });
  }
});

app.put("/api/workspace/member/:id/role", async (req, res) => {
  const membershipId = Number(req.params.id);
  const { role, requester_id } = req.body;
  const normalizedRole = String(role || "").toLowerCase();

  if (!membershipId || !requester_id || !WORKSPACE_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ message: "membership id, requester_id and valid role are required" });
  }

  try {
    const memberRows = await dbQuery(
      "SELECT id, workspace_id, user_id, role FROM workspace_members WHERE id = ? LIMIT 1",
      [membershipId],
    );
    if (!memberRows.length) {
      return res.status(404).json({ message: "Workspace member not found" });
    }

    const member = memberRows[0];
    const requesterRole = await getMembershipRole(member.workspace_id, requester_id);
    if (!isWorkspaceManager(requesterRole)) {
      return res.status(403).json({ message: "Only owner/admin can change member roles" });
    }

    await dbQuery("UPDATE workspace_members SET role = ? WHERE id = ?", [normalizedRole, membershipId]);

    io.to(String(member.workspace_id)).emit("workspace_members_updated", {
      workspace_id: member.workspace_id,
      action: "role_changed",
      member_id: membershipId,
      role: normalizedRole,
    });

    return res.json({ success: true, message: "Member role updated" });
  } catch (error) {
    console.error("Update member role error:", error);
    return res.status(500).json({ message: "Failed to update role" });
  }
});

app.delete("/api/workspace/member/:id", async (req, res) => {
  const membershipId = Number(req.params.id);
  const requesterId = req.body.requester_id || req.query.requester_id;

  if (!membershipId || !requesterId) {
    return res.status(400).json({ message: "membership id and requester_id are required" });
  }

  try {
    const memberRows = await dbQuery(
      "SELECT id, workspace_id, user_id, role FROM workspace_members WHERE id = ? LIMIT 1",
      [membershipId],
    );
    if (!memberRows.length) {
      return res.status(404).json({ message: "Workspace member not found" });
    }
    const member = memberRows[0];
    const requesterRole = await getMembershipRole(member.workspace_id, requesterId);
    if (!isWorkspaceManager(requesterRole)) {
      return res.status(403).json({ message: "Only owner/admin can remove members" });
    }
    if (member.role === "owner") {
      return res.status(400).json({ message: "Owner cannot be removed from workspace" });
    }

    await dbQuery("DELETE FROM workspace_members WHERE id = ?", [membershipId]);

    io.to(String(member.workspace_id)).emit("workspace_members_updated", {
      workspace_id: member.workspace_id,
      action: "removed",
      member_id: membershipId,
      user_id: member.user_id,
    });

    return res.json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({ message: "Failed to remove member" });
  }
});

app.post("/api/tasks/create", (req, res) => {
  const { workspace_id, title, description, assignee_id, due_date } = req.body;
  db.query(
    "INSERT INTO tasks (workspace_id, title, description, assignee_id, due_date) VALUES (?, ?, ?, ?, ?)",
    [workspace_id, title, description, assignee_id, due_date],
    (err) => {
      if (err) return res.status(500).json({ message: "Error creating task" });
      res.status(201).json({ success: true, message: "Task created" });
    }
  );
});

app.get("/api/tasks/:workspace_id", (req, res) => {
  db.query(`
        SELECT t.task_id as id, t.*, u.full_name as assignee_name 
        FROM tasks t 
        LEFT JOIN users u ON t.assignee_id = u.user_id 
        WHERE t.workspace_id = ?
    `, [req.params.workspace_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching tasks" });
    res.json({ success: true, data: results });
  });
});

app.put("/api/tasks/update-status", (req, res) => {
  const { task_id, status } = req.body;
  db.query("UPDATE tasks SET status = ? WHERE task_id = ?", [status, task_id], (err) => {
    if (err) return res.status(500).json({ message: "Error updating task" });
    res.json({ success: true, message: "Status updated" });
  });
});

app.post("/api/chat/send", (req, res) => {
  const { workspace_id, sender_id, message } = req.body;
  db.query(
    "INSERT INTO workspace_messages (workspace_id, sender_id, message) VALUES (?, ?, ?)",
    [workspace_id, sender_id, message],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error sending message" });

      // Fetch the just-inserted message with user info to broadcast
      db.query(`
                SELECT wm.*, u.full_name as sender_name 
                FROM workspace_messages wm 
                JOIN users u ON wm.sender_id = u.user_id 
                WHERE wm.id = ?
            `, [result.insertId], (err, msgs) => {
        if (!err && msgs.length > 0) {
          io.to(String(workspace_id)).emit("receive_message", msgs[0]);
        }
      });

      res.status(201).json({ success: true, message: "Message sent" });
    }
  );
});

app.get("/api/chat/:workspace_id", (req, res) => {
  db.query(`
        SELECT wm.*, u.full_name as sender_name 
        FROM workspace_messages wm 
        JOIN users u ON wm.sender_id = u.user_id 
        WHERE wm.workspace_id = ? 
        ORDER BY wm.created_at ASC
    `, [req.params.workspace_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching messages" });
    res.json({ success: true, data: results });
  });
});

app.get("/api/project/workspaces/:project_id", (req, res) => {
  db.query("SELECT * FROM workspaces WHERE project_id = ?", [req.params.project_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching workspaces" });
    res.json({ success: true, data: results });
  });
});

app.get("/api/freelancer/workspaces/:freelancer_id", (req, res) => {
  const query = `
        SELECT w.*, p.title as project_title 
        FROM workspaces w
        JOIN workspace_members wm ON w.workspace_id = wm.workspace_id
        JOIN projects p ON w.project_id = p.project_id
        WHERE wm.user_id = ?
    `;
  db.query(query, [req.params.freelancer_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching user workspaces" });
    res.json({ success: true, data: results });
  });
});

// ==========================================
// WORKSPACE FILE VAULT ROUTES
// ==========================================

const fs = require('fs');

const workspaceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./public/workspace";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const workspaceUpload = multer({ storage: workspaceStorage });

app.post("/api/workspace/upload", workspaceUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const workspace_id = req.body.workspace_id;
  const uploader_id = req.body.uploader_id;
  const file_name = req.file.originalname;
  const file_path = "/public/workspace/" + req.file.filename;
  const file_size = req.file.size;

  const query = "INSERT INTO workspace_files (workspace_id, uploader_id, file_name, file_path, file_size) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [workspace_id, uploader_id, file_name, file_path, file_size], (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Database Error" });
    }
    res.json({ success: true, message: "File uploaded successfully" });
  });
});

app.get("/api/workspace/files/:workspace_id", (req, res) => {
  const query = `
    SELECT f.*, u.full_name as uploader_name 
    FROM workspace_files f
    JOIN users u ON f.uploader_id = u.user_id
    WHERE f.workspace_id = ?
    ORDER BY f.created_at DESC
  `;
  db.query(query, [req.params.workspace_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching files" });
    res.json({ success: true, data: results });
  });
});

app.delete("/api/workspace/file/:id", (req, res) => {
  db.query("DELETE FROM workspace_files WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Error deleting file" });
    res.json({ success: true, message: "File deleted successfully" });
  });
});

// Fetch all freelancers for dropdown selection
app.get("/api/freelancers/list", (req, res) => {
  db.query("SELECT user_id, full_name, email FROM users WHERE role = 'freelancer'", (err, users) => {
    if (err) return res.status(500).json({ message: "DB Error" });
    res.json({ success: true, data: users });
  });
});

// Manual Member Addition Route by ID
app.post("/api/workspace/add-member", (req, res) => {
  const { workspace_id, user_id } = req.body;

  // ✅ Check if member already exists in workspace
  db.query(
    "SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1",
    [workspace_id, user_id],
    (err, existing) => {
      if (err) return res.status(500).json({ success: false, message: "Error checking member" });

      if (existing && existing.length > 0) {
        return res.status(400).json({ success: false, message: "This user is already a member of this workspace!" });
      }

      // Add new member
      db.query(
        "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'member')",
        [workspace_id, user_id],
        (err) => {
          if (err) return res.status(500).json({ success: false, message: "Error adding member" });
          res.json({ success: true, message: "Member added successfully!" });
        }
      );
    }
  );
});

// Initialize WebSocket Connection Logic
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("join_workspace", (workspaceId) => {
    socket.join(String(workspaceId));
    console.log(`User ${socket.id} joined workspace: ${workspaceId}`);
  });

  socket.on("workspace_presence_ping", ({ workspace_id, user_id }) => {
    if (!workspace_id || !user_id) return;
    db.query(
      "UPDATE workspace_members SET last_active = NOW() WHERE workspace_id = ? AND user_id = ?",
      [workspace_id, user_id],
      (err) => {
        if (!err) {
          io.to(String(workspace_id)).emit("workspace_presence_updated", {
            workspace_id,
            user_id,
            status: "Online",

          });
        }
      },
    );
  });

});


// Serve client static build files
app.use(express.static(path.join(__dirname, "../client/build")));

// Serve admin static build files on /admin
app.use("/admin", express.static(path.join(__dirname, "../admin/build")));

// Fallback for Admin React SPA routes
app.get("/admin/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "../admin/build/index.html"));
});

// Fallback for Client React SPA routes
app.get("/*splat", (req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/public")) {
    return res.status(404).json({ message: "Not Found" });
  }
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});


const PORT = process.env.PORT || 1337;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
