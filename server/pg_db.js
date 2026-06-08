const { Pool } = require("pg");
require("dotenv").config();

// Create a connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const db = {
  // Mock connection checking
  connect: (callback) => {
    pool.connect((err, client, release) => {
      if (err) {
        console.error("PostgreSQL Connection Failed❌ and error is:", err);
        if (callback) callback(err);
      } else {
        console.log("Connected to the PostgreSQL database successfully!✅");
        release();
        if (callback) callback(null);
      }
    });
  },

  // Main query method wrapper
  query: (queryStr, params, callback) => {
    // Handle optional params argument
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    let pgQueryStr = queryStr;

    // 1. Convert MySQL-style ON DUPLICATE KEY UPDATE to Postgres-compatible ON CONFLICT
    if (pgQueryStr.toLowerCase().includes("on duplicate key update")) {
      if (pgQueryStr.includes("profiles")) {
        pgQueryStr = pgQueryStr.replace(
          /ON DUPLICATE KEY UPDATE[\s\S]+/i,
          `ON CONFLICT (user_id) DO UPDATE SET 
           title = EXCLUDED.title, location = EXCLUDED.location, bio = EXCLUDED.bio, 
           contact_info = EXCLUDED.contact_info, skills = EXCLUDED.skills, experience = EXCLUDED.experience, 
           github = EXCLUDED.github, linkedin = EXCLUDED.linkedin, portfolio = EXCLUDED.portfolio, 
           image = EXCLUDED.image, resume = EXCLUDED.resume`
        );
      } else if (pgQueryStr.includes("founder_profiles")) {
        pgQueryStr = pgQueryStr.replace(
          /ON DUPLICATE KEY UPDATE[\s\S]+/i,
          `ON CONFLICT (user_id) DO UPDATE SET 
           phone = EXCLUDED.phone, location = EXCLUDED.location, bio = EXCLUDED.bio, 
           company_name = EXCLUDED.company_name, company_website = EXCLUDED.company_website, 
           industry = EXCLUDED.industry, company_size = EXCLUDED.company_size, 
           company_description = EXCLUDED.company_description, image = EXCLUDED.image`
        );
      } else if (pgQueryStr.includes("workspace_members")) {
        pgQueryStr = pgQueryStr.replace(
          /ON DUPLICATE KEY UPDATE[\s\S]+/i,
          `ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role`
        );
      }
    }

    // 2. MySQL IF() -> Postgres CASE WHEN
    pgQueryStr = pgQueryStr.replace(
      /IF\(status\s*=\s*'active',\s*'closed',\s*'active'\)/gi,
      "CASE WHEN status = 'active' THEN 'closed' ELSE 'active' END"
    );

    // 3. PostgreSQL does not use backticks for identifiers; replace backticks with empty string (or double quotes)
    pgQueryStr = pgQueryStr.replace(/`/g, "");

    // 4. Convert MySQL "?" placeholders to Postgres "$1, $2, ..." placeholders
    let paramIndex = 1;
    pgQueryStr = pgQueryStr.replace(/\?/g, () => `$${paramIndex++}`);

    // 5. Append RETURNING * to INSERT queries to mimic MySQL's returning of insertId
    const trimmedQuery = pgQueryStr.trim().toUpperCase();
    const isInsert = trimmedQuery.startsWith("INSERT");
    if (isInsert && !trimmedQuery.includes("RETURNING")) {
      pgQueryStr += " RETURNING *";
    }

    // Run the query on PostgreSQL pool
    pool.query(pgQueryStr, params, (err, res) => {
      if (err) {
        console.error("Database query error:", err);
        console.error("Failed query:", pgQueryStr);
        if (callback) callback(err);
        return;
      }

      if (!callback) return;

      // Map pg response to MySQL driver format
      if (isInsert) {
        const insertedRow = res.rows[0] || {};
        // Map the correct ID field for insertId
        const insertId = insertedRow.user_id 
                      || insertedRow.project_id 
                      || insertedRow.application_id 
                      || insertedRow.profile_id 
                      || insertedRow.workspace_id 
                      || insertedRow.task_id 
                      || insertedRow.invitation_id
                      || insertedRow.id 
                      || null;

        callback(null, {
          insertId: insertId,
          affectedRows: res.rowCount,
        });
      } else {
        // Return rows for SELECT, UPDATE, DELETE etc.
        callback(null, res.rows);
      }
    });
  }
};

module.exports = db;
