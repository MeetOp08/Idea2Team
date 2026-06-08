-- PostgreSQL Schema for Idea2Team Project

-- 1. admin
CREATE TABLE admin (
  admin_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Seed admin user (equivalent to the default mysql admin)
INSERT INTO admin (email, password) VALUES ('patelmeet52271@gmail.com', 'Meet@0811P_') ON CONFLICT DO NOTHING;

-- 2. users
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'freelancer' CHECK (role IN ('founder', 'freelancer')),
  phone VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked'))
);

-- 3. projects
CREATE TABLE projects (
  project_id SERIAL PRIMARY KEY,
  founder_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN (
    'Web Development', 'Mobile App Development', 'UI/UX Design', 'Graphic Design',
    'Digital Marketing', 'Content Writing', 'Data Science', 'AI / Machine Learning',
    'Cyber Security', 'Cloud Computing', 'DevOps', 'Game Development'
  )),
  required_skills VARCHAR(255) DEFAULT NULL,
  project_stage VARCHAR(50) NOT NULL CHECK (project_stage IN ('idea', 'prototype', 'launch')),
  collaboration_type VARCHAR(50) NOT NULL CHECK (collaboration_type IN ('paid', 'equity', 'learning')),
  experience_level VARCHAR(50) DEFAULT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  budget_min DECIMAL(10,2) DEFAULT NULL,
  budget_max DECIMAL(10,2) DEFAULT NULL,
  duration_weeks INT DEFAULT NULL,
  team_members_required INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  upload_file VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  application_deadline DATE DEFAULT NULL,
  completion_deadline DATE DEFAULT NULL
);

-- 4. applications
CREATE TABLE applications (
  application_id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  freelancer_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  proposal_message TEXT DEFAULT NULL,
  expected_salary DECIMAL(10,2) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. founder_profiles
CREATE TABLE founder_profiles (
  user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  phone VARCHAR(20) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  company_name VARCHAR(255) DEFAULT NULL,
  company_website VARCHAR(255) DEFAULT NULL,
  industry VARCHAR(100) DEFAULT NULL,
  company_size VARCHAR(50) DEFAULT NULL,
  company_description TEXT DEFAULT NULL,
  image TEXT DEFAULT NULL
);

-- 6. invitations
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL,
  freelancer_id INT NOT NULL,
  founder_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_invite UNIQUE (project_id, freelancer_id)
);

-- 7. notes
CREATE TABLE notes (
  note_id SERIAL PRIMARY KEY,
  project_id INT DEFAULT NULL,
  title VARCHAR(255) DEFAULT NULL,
  content TEXT DEFAULT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. profiles
CREATE TABLE profiles (
  profile_id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contact_info TEXT DEFAULT NULL,
  skills TEXT DEFAULT NULL,
  experience TEXT DEFAULT NULL,
  github TEXT DEFAULT NULL,
  linkedin TEXT DEFAULT NULL,
  portfolio TEXT DEFAULT NULL,
  image TEXT DEFAULT NULL,
  resume TEXT DEFAULT NULL
);

-- 9. workspaces
CREATE TABLE workspaces (
  workspace_id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  name VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  owner_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. workspace_members
CREATE TABLE workspace_members (
  id SERIAL PRIMARY KEY,
  workspace_id INT REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_workspace_member UNIQUE (workspace_id, user_id)
);

-- 11. workspace_invitations
CREATE TABLE workspace_invitations (
  invitation_id SERIAL PRIMARY KEY,
  workspace_id INT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  receiver_email VARCHAR(255) NOT NULL,
  sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  invite_code VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

-- 12. workspace_messages
CREATE TABLE workspace_messages (
  id SERIAL PRIMARY KEY,
  workspace_id INT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. workspace_files
CREATE TABLE workspace_files (
  id SERIAL PRIMARY KEY,
  workspace_id INT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  uploader_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. tasks
CREATE TABLE tasks (
  task_id SERIAL PRIMARY KEY,
  project_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo','inProgress','done')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date DATE DEFAULT NULL,
  assignee_id INT DEFAULT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  workspace_id INT DEFAULT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE
);

-- Triggers for auto-updating updated_at columns
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
