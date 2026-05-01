import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
app.use(express.json());

const PTERO_BASE_URL = process.env.PTERO_BASE_URL || 'https://your-panel.com';
const PTERO_API_KEY = process.env.PTERO_API_KEY || 'ptlc_YOUR_API_KEY';

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'your_database_name',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
  dateStrings: ['DATETIME', 'TIMESTAMP'],
  supportBigNumbers: true, 
  bigNumberStrings: true

});

const LOCATION_MAPPER = {
    'CS2-EMEA': 'Europe',
    'CS2-APAC': 'Asia',
    'CS2-NA': 'America'
};

// --- AUTH MIDDLEWARE ---
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        // If expired, let the frontend know so it can try to refresh
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        // For any other error (invalid signature, malformed), force a logout
        res.status(401).json({ error: 'Invalid session', code: 'INVALID_TOKEN' });
    }
};

// Middleware to check specific roles
const requireRole = (roles) => {
  return (req, res, next) => {
    // req.user was populated by the previous 'authenticate' middleware
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

async function executeCommandOnAllServers(command) {
  try {
      const headers = {
          'Authorization': `Bearer ${PTERO_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
      };

      // 1. Get all server identifiers
      const listResponse = await axios.get(`${PTERO_BASE_URL}/api/client`, { headers });
      const serverIds = listResponse.data.data.map(server => server.attributes.identifier);

      console.log(`Broadcasting to ${serverIds.length} servers...`);

      // 2. Execute command on all servers in parallel
      const requests = serverIds.map(id => 
          axios.post(`${PTERO_BASE_URL}/api/client/servers/${id}/command`, 
          { command: command }, 
          { headers })
          .catch(err => console.error(`Failed for server ${id}: ${err.message}`))
      );
      await Promise.all(requests);
      console.log("Reload signal sent to all servers successfully.");
  } catch (error) {
      console.error("Critical API error:", error.response?.data || error.message);
  }
}

// Helper function to add logs to panel_logs table
async function addLog(userId, username, ipAddress, actionType, details) {
    try {
        await pool.query(
            'INSERT INTO panel_logs (panel_user_id, username, ip_address, action_type, details) VALUES (?, ?, ?, ?, ?)',
            [userId, username, ipAddress, actionType, details]
        );
    } catch (err) {
        console.error('Failed to add log:', err);
    }
}

// Helper function to format timestamp to readable date format
function formatTimestamp(timestamp) {
    if (!timestamp || timestamp === 0) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Helper function to convert role name from database format to readable format
function formatRoleName(role) {
    const roleMap = {
        '#admin': 'Administrator',
        '#moderator': 'Moderator',
        '#officer': 'Officer'
    };
    return roleMap[role] || role;
}

// Login (Username based)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM panel_users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id,  username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        // Don't send password back to client
        const { password: _, ...userWithoutPass } = user;
        res.json({ token, user: userWithoutPass });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/logout', (req, res) => {
    // Optional: Add token to a blacklist in Redis here
    res.status(200).json({ message: 'Logged out successfully' });
});

// UPDATE OWN PROFILE (Username, Email, Password)
app.put('/api/profile', authenticate, async (req, res) => {
    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        // Get current user data
        const [users] = await pool.query('SELECT * FROM panel_users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        const updates = [];
        const params = [];
        const changes = [];

        // Update username if provided
        if (username && username !== user.username) {
            updates.push('username = ?');
            params.push(username);
            changes.push(`Username changed from <b>${user.username}</b> to <b>${username}</b>`);
        }

        // Update email if provided
        if (email && email !== user.email) {
            updates.push('email = ?');
            params.push(email);
            changes.push(`Email changed from <b>${user.email}</b> to <b>${email}</b>`);
        }

        // Update password if both current and new password are provided
        if (currentPassword && newPassword) {
            const validPass = await bcrypt.compare(currentPassword, user.password);
            if (!validPass) return res.status(400).json({ error: 'Current password is incorrect' });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updates.push('password = ?');
            params.push(hashedPassword);
            changes.push('Password changed');
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No changes provided' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);
        await pool.query(`UPDATE panel_users SET ${updates.join(', ')} WHERE id = ?`, params);

        // Add log
        const details = `ID: <b>#${userId}</b>\n${changes.join('\n')}`;
        await addLog(userId, user.username, req.ip, 'Profile Updated', details);

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// LIST BANS (Read - Selected columns) - Public access
app.get('/api/bans',
    async (req, res) => {
    try {
        // Get parameters from query string, set defaults if missing
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        // Calculate how many records to skip
        const offset = (page - 1) * limit;

        let queryParams = [];
        let whereClause = '';

        // Simple search filter if search term exists
        if (search) {
        whereClause = ' WHERE b.player_name LIKE ? OR b.player_steamid LIKE ?';
        queryParams.push(`%${search}%`, `%${search}%`);
        }

        // 1. Get total count for the frontend to calculate total pages
        const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM sa_bans b${whereClause}`, 
        queryParams
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Get the specific page of data
        // Note: LIMIT and OFFSET parameters must be numbers, not strings
        const dataQuery = `
        SELECT b.id, b.player_name, b.player_steamid, b.player_ip, b.admin_name, b.reason, b.duration, b.created, b.ends, b.status, s.hostname as server_name
        FROM sa_bans b
        LEFT JOIN sa_servers s ON b.server_id = s.id
        ${whereClause}
        ORDER BY b.created DESC 
        LIMIT ? OFFSET ?`;
        
        const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);

        // Send structured response
        res.json({
        items: rows,
        totalPages: totalPages,
        currentPage: page,
        totalItems: totalItems
        });

    } catch (err) {
        console.error('Database Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// CREATE BAN
app.post('/api/bans', authenticate, requireRole(['Administrator', 'Senior Moderator', 'Moderator']), async (req, res) => {
  const { player_name, player_steamid, player_ip, reason, duration, status } = req.body;

  try {
    // Calculate ends timestamp if duration > 0 (duration in minutes)
    let ends = null;
    if (duration > 0) {
      ends = new Date(Date.now() + duration * 60000).toISOString().slice(0, 19).replace('T', ' ');
    }

    const [result] = await pool.query(
      `INSERT INTO sa_bans 
      (player_name, player_steamid, player_ip, admin_name, admin_steamid, reason, duration, ends, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        player_name, 
        player_steamid, 
        player_ip, 
        req.user.username, // From JWT
        req.user.id,       // From JWT
        reason, 
        duration, 
        ends, 
        status
      ]
    );
    await executeCommandOnAllServers();

    // Add log
    const durationDisplay = parseInt(duration) === 0 ? 'Permanent' : `${duration} minutes`;
    const details = `Player Name: <b>${player_name}</b>\nSteamID: <b>${player_steamid}</b>\nIP: <b>${player_ip}</b>\nReason: <b>${reason}</b>\nDuration: <b>${durationDisplay}</b>\nStatus: <b>${status}</b>`;
    await addLog(req.user.id, req.user.username, req.ip, 'Ban Created', details);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE BAN
app.put('/api/bans/:id', authenticate, requireRole(['Administrator', 'Senior Moderator', 'Moderator']), async (req, res) => {
  const { player_name, player_steamid, player_ip, reason, duration, status } = req.body;
  try {
    // Get old ban data for logging
    const [oldBan] = await pool.query('SELECT * FROM sa_bans WHERE id = ?', [req.params.id]);
    if (!oldBan || oldBan.length === 0) {
        return res.status(404).json({ error: "Ban not found" });
    }

    let ends = null;
    if (duration > 0) {
      const createdTime = new Date(oldBan[0].created + ' UTC');
      ends = new Date(createdTime.getTime() + duration * 60000).toISOString().slice(0, 19).replace('T', ' ');
    }
    await pool.query(
      `UPDATE sa_bans SET player_name = ?, player_steamid = ?, player_ip = ?, reason = ?, duration = ?, ends = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [player_name, player_steamid, player_ip, reason, duration, ends, status, req.params.id]
    );
    await executeCommandOnAllServers();

    // Add log
    const changes = [];
    if (player_name !== oldBan[0].player_name) changes.push(`Player Name changed from <b>${oldBan[0].player_name}</b> to <b>${player_name}</b>`);
    if (player_steamid !== oldBan[0].player_steamid) changes.push(`SteamID changed from <b>${oldBan[0].player_steamid}</b> to <b>${player_steamid}</b>`);
    if (player_ip !== oldBan[0].player_ip) changes.push(`IP changed from <b>${oldBan[0].player_ip}</b> to <b>${player_ip}</b>`);
    if (reason !== oldBan[0].reason) changes.push(`Reason changed from <b>${oldBan[0].reason}</b> to <b>${reason}</b>`);
    if (parseInt(duration) !== oldBan[0].duration) {
      const oldDurationDisplay = oldBan[0].duration === 0 ? 'Permanent' : `${oldBan[0].duration} minutes`;
      const newDurationDisplay = parseInt(duration) === 0 ? 'Permanent' : `${duration} minutes`;
      changes.push(`Duration changed from <b>${oldDurationDisplay}</b> to <b>${newDurationDisplay}</b>`);
    }
    if (status !== oldBan[0].status) changes.push(`Status changed from <b>${oldBan[0].status}</b> to <b>${status}</b>`);

    const details = `ID: <b>#${req.params.id}</b>\nPlayer Name: <b>${player_name}</b>\n${changes.join('\n')}`;
    await addLog(req.user.id, req.user.username, req.ip, 'Ban Updated', details);

    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SINGLE BAN
app.get('/api/bans/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sa_bans WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Ban not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bans/:id', authenticate, requireRole(['Administrator', 'Senior Moderator']), async (req, res) => {
  try {
    // Get ban data for logging before deletion
    const [ban] = await pool.query('SELECT * FROM sa_bans WHERE id = ?', [req.params.id]);
    if (!ban || ban.length === 0) {
        return res.status(404).json({ error: "Ban not found" });
    }

    await pool.query('DELETE FROM sa_bans WHERE id = ?', [req.params.id]);
    await executeCommandOnAllServers();

    // Add log
    const durationDisplay = ban[0].duration === 0 ? 'Permanent' : `${ban[0].duration} minutes`;
    const details = `ID: <b>#${req.params.id}</b>\nPlayer Name: <b>${ban[0].player_name}</b>\nSteamID: <b>${ban[0].player_steamid}</b>\nIP: <b>${ban[0].player_ip}</b>\nReason: <b>${ban[0].reason}</b>\nDuration: <b>${durationDisplay}</b>\nStatus: <b>${ban[0].status}</b>`;
    await addLog(req.user.id, req.user.username, req.ip, 'Ban Deleted', details);

    res.json({ message: 'Ban deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIST ALL USERS (Admin Only)
app.get('/api/users', authenticate, requireRole(['Administrator']), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let queryParams = [];
        let whereClause = '';

        // Search by username or email
        if (search) {
            whereClause = ' WHERE username LIKE ? OR email LIKE ?';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // 1. Get total count for pagination
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM panel_users${whereClause}`, 
            queryParams
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Get paginated user data (excluding passwords for security)
        const dataQuery = `
            SELECT id, username, email, role, created_at, updated_at
            FROM panel_users 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?`;
        
        const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);

        res.json({
            items: rows,
            totalPages: totalPages,
            currentPage: page,
            totalItems: totalItems
        });

    } catch (err) {
        console.error('User List Database Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// CREATE NEW USER (Admin Only + Restriction)
app.post('/api/users', authenticate, requireRole(['Administrator']), async (req, res) => {
  const { username, email, password, role } = req.body;

  // RESTRICTION: Prevent creating another Administrator
  if (role === 'Administrator') {
    return res.status(403).json({ error: "Cannot create another Administrator account." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO panel_users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [username, email, hashedPassword, role]
    );

    // Add log
    const details = `ID: <b>#${result.insertId}</b>\nUsername: <b>${username}</b>\nEmail: <b>${email}</b>\nRole: <b>${role}</b>`;
    await addLog(req.user.id, req.user.username, req.ip, 'User Created', details);

    res.status(201).json({ id: result.insertId, message: 'User created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// UPDATE USER ROLE/INFO (Admin Only + Restriction)
app.put('/api/users/:id', authenticate, requireRole(['Administrator']), async (req, res) => {
  const { role, email, username, password } = req.body;
  const userId = req.params.id;

  // RESTRICTION: Prevent promoting someone to Administrator
  if (role === 'Administrator') {
    return res.status(403).json({ error: "Cannot promote a user to Administrator." });
  }

  try {
    // Get old user data for logging
    const [oldUser] = await pool.query('SELECT * FROM panel_users WHERE id = ?', [userId]);
    if (!oldUser || oldUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }

    // Check if target is an Admin (to prevent demoting existing Admins via this API)
    if (oldUser[0].role === 'Administrator') {
        return res.status(403).json({ error: "Cannot modify an Administrator account." });
    }

    // Build update query dynamically based on what's provided
    const updateFields = [];
    const updateValues = [];
    
    if (username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    await pool.query(
      `UPDATE panel_users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Add log
    const changes = [];
    if (username !== undefined && username !== oldUser[0].username) changes.push(`Username changed from <b>${oldUser[0].username}</b> to <b>${username}</b>`);
    if (email !== undefined && email !== oldUser[0].email) changes.push(`Email changed from <b>${oldUser[0].email}</b> to <b>${email}</b>`);
    if (role !== undefined && role !== oldUser[0].role) changes.push(`Role changed from <b>${oldUser[0].role}</b> to <b>${role}</b>`);
    if (password !== undefined && password !== '') changes.push(`Password changed`);

    const details = `ID: <b>#${userId}</b>\nUsername: <b>${username || oldUser[0].username}</b>\n${changes.join('\n')}`;
    await addLog(req.user.id, req.user.username, req.ip, 'User Updated', details);

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER (Admin Only)
app.delete('/api/users/:id', authenticate, requireRole(['Administrator']), async (req, res) => {
  const userId = req.params.id;
  try {
    // Get user data for logging before deletion
    const [user] = await pool.query('SELECT * FROM panel_users WHERE id = ?', [userId]);
    if (!user || user.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }

    // Prevent deleting self or other Admins
    if (user[0].role === 'Administrator') {
      return res.status(403).json({ error: "Administrator accounts cannot be deleted via API." });
    }

    await pool.query('DELETE FROM panel_users WHERE id = ?', [userId]);

    // Add log
    const details = `ID: <b>#${userId}</b>\nUsername: <b>${user[0].username}</b>\nEmail: <b>${user[0].email}</b>\nRole: <b>${user[0].role}</b>`;
    await addLog(req.user.id, req.user.username, req.ip, 'User Deleted', details);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE NEW VIP (Admin Only)
app.post('/api/vips', authenticate, requireRole(['Administrator']), async (req, res) => {
  const { steamid64, group_name, name, expires } = req.body;

  // Validation: Only allow specific groups
  const allowedGroups = ['VIP', 'SVIP'];
  if (!allowedGroups.includes(group_name)) {
    return res.status(400).json({ error: "Invalid group. Must be VIP or SVIP." });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO player_groups (steamid64, group_name, name, expires) VALUES (?, ?, ?, ?)',
      [steamid64, group_name, name, expires]
    );

    // Add log
    const expiresDisplay = parseInt(expires) === 0 ? 'Never' : formatTimestamp(parseInt(expires));
    const details = `Player Name: <b>${name}</b>\nSteamID: <b>${steamid64}</b>\nGroup: <b>${group_name}</b>\nExpires: <b>${expiresDisplay}</b>`;
    await addLog(req.user.id, req.user.username, req.ip, 'VIP Created', details);

    res.status(201).json({ id: result.insertId, message: 'VIP record created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'This SteamID is already assigned a group' });
    }
    res.status(500).json({ error: err.message });
  }
});

// LIST ALL VIPS - Public access
app.get('/api/vips', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let queryParams = [];
        let whereClause = '';

        // Search by name or steamid64
        if (search) {
            whereClause = ' WHERE name LIKE ? OR CAST(steamid64 AS CHAR) LIKE ? OR group_name LIKE ? ';
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // 1. Get total count for pagination
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM player_groups${whereClause}`,
            queryParams
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Get paginated VIP data
        const dataQuery = `
            SELECT id, steamid64, group_name, name, expires
            FROM player_groups
            ${whereClause}
            ORDER BY id DESC
            LIMIT ? OFFSET ?`;

        const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);

        res.json({
            items: rows,
            totalPages: totalPages,
            currentPage: page,
            totalItems: totalItems
        });

    } catch (err) {
        console.error('VIP List Database Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// UPDATE VIP (Admin Only)
app.put('/api/vips/:id', authenticate, requireRole(['Administrator']), async (req, res) => {
  const { name, steamid64, group_name, expires } = req.body;
  const { id } = req.params;

  try {
    // Get old VIP data for logging
    const [oldVip] = await pool.query('SELECT * FROM player_groups WHERE id = ?', [id]);
    if (!oldVip || oldVip.length === 0) {
        return res.status(404).json({ error: "VIP record not found" });
    }

    const [result] = await pool.query(
      'UPDATE player_groups SET group_name = ?, name = ?, steamid64 = ?, expires = ? WHERE id = ?',
      [group_name, name, steamid64, expires, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "VIP record not found" });
    }

    // Add log
    const changes = [];
    if (name !== oldVip[0].name) changes.push(`Player Name changed from <b>${oldVip[0].name}</b> to <b>${name}</b>`);
    if (steamid64 !== oldVip[0].steamid64) changes.push(`SteamID changed from <b>${oldVip[0].steamid64}</b> to <b>${steamid64}</b>`);
    if (group_name !== oldVip[0].group_name) changes.push(`Group changed from <b>${oldVip[0].group_name}</b> to <b>${group_name}</b>`);
    if (parseInt(expires) !== parseInt(oldVip[0].expires)) {
      const oldExpiresDisplay = parseInt(oldVip[0].expires) === 0 ? 'Never' : formatTimestamp(parseInt(oldVip[0].expires));
      const newExpiresDisplay = parseInt(expires) === 0 ? 'Never' : formatTimestamp(parseInt(expires));
      changes.push(`Expiry Date changed from <b>${oldExpiresDisplay}</b> to <b>${newExpiresDisplay}</b>`);
    }

    const details = `ID: <b>#${id}</b>\nPlayer Name: <b>${name}</b>\n${changes.join('\n')}`;
    await addLog(req.user.id, req.user.username, req.ip, 'VIP Updated', details);

    res.json({ message: 'VIP updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE VIP (Admin Only)
app.delete('/api/vips/:id', authenticate, requireRole(['Administrator']), async (req, res) => {
  const { id } = req.params;

  try {
    // Get VIP data for logging before deletion
    const [vip] = await pool.query('SELECT * FROM player_groups WHERE id = ?', [id]);
    if (!vip || vip.length === 0) {
        return res.status(404).json({ error: "VIP record not found" });
    }

    const [result] = await pool.query('DELETE FROM player_groups WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "VIP record not found" });
    }

    // Add log
    const expiresDisplay = parseInt(vip[0].expires) === 0 ? 'Never' : formatTimestamp(parseInt(vip[0].expires));
    const details = `ID: <b>#${id}</b>\nPlayer Name: <b>${vip[0].name}</b>\nSteamID: <b>${vip[0].steamid64}</b>\nGroup: <b>${vip[0].group_name}</b>\nExpires: <b>${expiresDisplay}</b>`;
    await addLog(req.user.id, req.user.username, req.ip, 'VIP Deleted', details);

    res.json({ message: 'VIP removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//LIST ALL SERVERS - Public access
app.get('/api/servers', async (req, res) => {
    try {
        const response = await axios.get(`${PTERO_BASE_URL}/api/client`, {
            headers: {
                'Authorization': `Bearer ${PTERO_API_KEY}`,
                'Accept': 'application/vnd.pterodactyl.v1+json',
                'Content-Type': 'application/json'
            }
        });

        const pteroData = response.data.data;
        const meta = response.data.meta.pagination;

        const rows = pteroData.map(server => {
            const attr = server.attributes;
            
            // Get the first allocation safely
            const allocation = attr.relationships?.allocations?.data?.[0]?.attributes;

            return {
                id: attr.identifier,
                name: attr.name,
                // MAPPER LOGIC: Look up the location or fallback to the node name
                location: LOCATION_MAPPER[attr.node] || 'Global', 
                ip: allocation?.ip || '0.0.0.0',
                port: allocation?.port || 0
            };
        });

        res.json({
            items: rows,
            totalPages: 1,
            currentPage: 1,
            totalItems: rows.length
        });

    } catch (error) {
        console.error('Wrapper Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch server data' });
    }
});

//POWER SERVERS (Admin and Super Moderator only)
app.post('/api/servers/:id/power', 
  authenticate, 
  requireRole(['Senior Moderator', 'Administrator']), 
  async (req, res) => {
    const { id } = req.params;
    const { signal } = req.body;
    const userRole = req.user.role;

    // Validate the signal to prevent invalid API calls
    const validSignals = ['start', 'stop', 'restart'];
    if (!validSignals.includes(signal)) {
        return res.status(400).json({ error: 'Invalid power signal' });
    }

    if (userRole === 'Senior Moderator' && signal !== 'restart') {
        return res.status(403).json({ 
            error: 'Senior Moderators can only use the Restart command.' 
        });
    }

    try {
        // Get server info for logging
        const serverResponse = await axios.get(`${PTERO_BASE_URL}/api/client/servers/${id}`, {
            headers: {
                'Authorization': `Bearer ${PTERO_API_KEY}`,
                'Accept': 'application/vnd.pterodactyl.v1+json'
            }
        });
        const serverName = serverResponse.data.attributes.name;

        const response = await axios.post(
            `${PTERO_BASE_URL}/api/client/servers/${id}/power`,
            { signal }, // Pterodactyl expects JSON body: { "signal": "restart" }
            {
                headers: {
                    'Authorization': `Bearer ${PTERO_API_KEY}`,
                    'Accept': 'application/vnd.pterodactyl.v1+json',
                    'Content-Type': 'application/json'
                }
            }
        );

        // Add log
        const actionTypeMap = {
            'start': 'Server Started',
            'stop': 'Server Stopped',
            'restart': 'Server Restarted'
        };
        const actionType = actionTypeMap[signal] || `Server ${signal.charAt(0).toUpperCase() + signal.slice(1)}`;
        const details = `Server ID: <b>${id}</b>\nServer Name: <b>${serverName}</b>`;
        await addLog(req.user.id, req.user.username, req.ip, actionType, details);

        res.status(response.status).json({ message: `Server ${signal} signal sent successfully` });

    } catch (error) {
        console.error(`Power Action Error (${signal}):`, error.response?.data || error.message);
        const status = error.response?.status || 500;
        const details = error.response?.data?.errors?.[0]?.detail || 'Failed to send signal';

        res.status(status).json({ error: details });
    }
});

//GET ADMINS - Public access
app.get('/api/admins',
    async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let queryParams = [];
        let whereClause = '';

        if (search) {
            whereClause = ' WHERE a.player_name LIKE ? OR a.player_steamid LIKE ?';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM sa_admins a ${whereClause}`, queryParams);
        const totalItems = countResult[0].total;

        const dataQuery = `
            SELECT 
                a.id, 
                a.player_name, 
                a.player_steamid, 
                UNIX_TIMESTAMP(a.ends) as ends,
                f.flag as role
            FROM sa_admins a
            LEFT JOIN sa_admins_flags f ON a.id = f.admin_id
            ${whereClause}
            ORDER BY a.created DESC 
            LIMIT ? OFFSET ?`;
        
        const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);

        res.json({
            items: rows,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            totalItems: totalItems
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//ADD ADMIN
app.post('/api/admins', authenticate, requireRole(['Administrator']), async (req, res) => {
  const { player_name, player_steamid, role, ends} = req.body;

  // For ends = 0, set ends_value = null (DB takes ends = null as permanent access)
  const ends_value = ends != 0? ends:null

  try {
    // Fetch immunity from sa_groups matching the provided role (e.g., '#admin')
    if (!role)
      return res.status(400).json({ error: 'No admin type provided' });
    const [groupRows] = await pool.query('SELECT immunity FROM sa_groups WHERE name = ? LIMIT 1', [role] );
    const immunity = groupRows.length > 0 ? groupRows[0].immunity : 0;

    // Insert into sa_admins
    const [adminResult] = await pool.query(
      'INSERT INTO sa_admins (player_name, player_steamid, immunity, server_id, ends) VALUES (?, ?, ?, ?, FROM_UNIXTIME(?))',
      [player_name, player_steamid, immunity || 0, null, ends_value]
    );

    const adminId = adminResult.insertId;

    await pool.query('INSERT INTO sa_admins_flags (admin_id, flag) VALUES (?, ?)', [adminId, role]);

    // Add log
    const endsDisplay = parseInt(ends) === 0 ? 'Never' : formatTimestamp(parseInt(ends));
    const roleDisplay = formatRoleName(role);
    const details = `Player Name: <b>${player_name}</b>\nSteamID: <b>${player_steamid}</b>\nRole: <b>${roleDisplay}</b>\nExpires: <b>${endsDisplay}</b>`;
    await addLog(req.user.id, req.user.username, req.ip, 'Admin Created', details);

    res.status(201).json({ id: adminId, message: 'Admin created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'This SteamID is already an admin' });
    }
    res.status(500).json({ error: err.message });
  }
});

//EDIT ADMIN
app.put('/api/admins/:id', authenticate, requireRole(['Administrator']), async (req, res) => {
  const { player_name, player_steamid, role, ends } = req.body;
  const { id } = req.params;

  // For ends = 0, set ends_value = null (DB takes ends = null as permanent access)
  const ends_value = ends != 0? ends:null

  try {
    // Get old admin data for logging
    const [oldAdmin] = await pool.query(
      'SELECT a.*, UNIX_TIMESTAMP(a.ends) as ends_timestamp, f.flag as role FROM sa_admins a LEFT JOIN sa_admins_flags f ON a.id = f.admin_id WHERE a.id = ?',
      [id]
    );
    if (!oldAdmin || oldAdmin.length === 0) {
        return res.status(404).json({ error: "Admin not found" });
    }

    // Fetch immunity from sa_groups matching the provided role (e.g., '#admin')
    if (!role)
      return res.status(400).json({ error: 'No admin type provided' });
    const [groupRows] = await pool.query('SELECT immunity FROM sa_groups WHERE name = ? LIMIT 1', [role] );
    const immunity = groupRows.length > 0 ? groupRows[0].immunity : 0;

    // Update main record
    const [result] = await pool.query(
      'UPDATE sa_admins SET player_name = ?, player_steamid = ?, immunity = ?, ends = FROM_UNIXTIME(?) WHERE id = ?',
      [player_name, player_steamid, immunity || 0, ends_value, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    await pool.query('UPDATE sa_admins_flags SET flag = ? WHERE admin_id = ?', [role, id]);

    // Add log
    const changes = [];
    if (player_name !== oldAdmin[0].player_name) changes.push(`Player Name changed from <b>${oldAdmin[0].player_name}</b> to <b>${player_name}</b>`);
    if (player_steamid !== oldAdmin[0].player_steamid) changes.push(`SteamID changed from <b>${oldAdmin[0].player_steamid}</b> to <b>${player_steamid}</b>`);
    if (role !== oldAdmin[0].role) {
      const oldRoleDisplay = formatRoleName(oldAdmin[0].role);
      const newRoleDisplay = formatRoleName(role);
      changes.push(`Role changed from <b>${oldRoleDisplay}</b> to <b>${newRoleDisplay}</b>`);
    }
    if (parseInt(ends) !== (oldAdmin[0].ends_timestamp ? parseInt(oldAdmin[0].ends_timestamp) : 0)) {
      const oldEndsDisplay = !oldAdmin[0].ends_timestamp || parseInt(oldAdmin[0].ends_timestamp) === 0 ? 'Never' : formatTimestamp(parseInt(oldAdmin[0].ends_timestamp));
      const newEndsDisplay = parseInt(ends) === 0 ? 'Never' : formatTimestamp(parseInt(ends));
      changes.push(`Expiry Date changed from <b>${oldEndsDisplay}</b> to <b>${newEndsDisplay}</b>`);
    }

    const details = `ID: <b>#${id}</b>\nPlayer Name: <b>${player_name}</b>\n${changes.join('\n')}`;
    await addLog(req.user.id, req.user.username, req.ip, 'Admin Updated', details);

    res.json({ message: 'Admin updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ADMIN
app.delete('/api/admins/:id', authenticate, requireRole(['Administrator']), async (req, res) => {
  const { id } = req.params;

  try {
    // Get admin data for logging before deletion
    const [admin] = await pool.query(
      'SELECT a.*, f.flag as role FROM sa_admins a LEFT JOIN sa_admins_flags f ON a.id = f.admin_id WHERE a.id = ?',
      [id]
    );
    if (!admin || admin.length === 0) {
        return res.status(404).json({ error: "Admin record not found" });
    }

    // Delete from sa_admins_flags
    await pool.query('DELETE FROM sa_admins_flags WHERE admin_id = ?', [id]);

    const [result] = await pool.query('DELETE FROM sa_admins WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Admin record not found" });
    }

    // Add log
    const endsDisplay = admin[0].ends === null ? 'Never' : formatTimestamp(Math.floor(new Date(admin[0].ends).getTime() / 1000));
    const roleDisplay = formatRoleName(admin[0].role);
    const details = `ID: <b>#${id}</b>\nPlayer Name: <b>${admin[0].player_name}</b>\nSteamID: <b>${admin[0].player_steamid}</b>\nRole: <b>${roleDisplay}</b>\nExpires: <b>${endsDisplay}</b>`;
    await addLog(req.user.id, req.user.username, req.ip, 'Admin Deleted', details);

    res.json({ message: 'Admin removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIST ALL LOGS (Admin Only)
app.get('/api/logs', authenticate, requireRole(['Administrator']), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let queryParams = [];
        let whereClause = '';

        // Search by username, action_type, or details
        if (search) {
            whereClause = ' WHERE (pl.username LIKE ? OR pl.action_type LIKE ? OR pl.details LIKE ? OR pu.username LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        // 1. Get total count for pagination
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM panel_logs pl
             LEFT JOIN panel_users pu ON pl.panel_user_id = pu.id${whereClause}`,
            queryParams
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Get paginated log data with username from panel_users if available
        const dataQuery = `
            SELECT pl.id, pl.panel_user_id, 
                   COALESCE(pu.username, pl.username) as username,
                   pl.ip_address, pl.action_type, pl.details, pl.created_at
            FROM panel_logs pl
            LEFT JOIN panel_users pu ON pl.panel_user_id = pu.id
            ${whereClause}
            ORDER BY pl.created_at DESC
            LIMIT ? OFFSET ?`;

        const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);

        res.json({
            items: rows,
            totalPages: totalPages,
            currentPage: page,
            totalItems: totalItems
        });

    } catch (err) {
        console.error('Logs List Database Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET STATS - Public access
app.get('/api/stats', async (req, res) => {
  try {
    const userRole = req.user?.role || null;
    // Define the parallel tasks
    const [pteroResponse, [adminsCount], [bansCount], [vipsCount]] = await Promise.all([
      // 1. Get Servers from Pterodactyl
      axios.get(`${PTERO_BASE_URL}/api/client`, {
        headers: {
          'Authorization': `Bearer ${PTERO_API_KEY}`,
          'Accept': 'application/vnd.pterodactyl.v1+json'
        }
      }),
      // 2. Get Active Admins count from MySQL
      pool.query('SELECT COUNT(*) as count FROM sa_admins WHERE ends IS NULL OR ends > NOW()'),
      // 3. Get Active Bans count from MySQL
      pool.query('SELECT COUNT(*) as count FROM sa_bans WHERE status = "ACTIVE"'),
      // 3. Get Active VIPs count from MySQL
      pool.query('SELECT COUNT(*) as count FROM player_groups WHERE expires = 0 OR expires > UNIX_TIMESTAMP()')
    ]);

    // Format the combined response
    res.json({
      totalServers: pteroResponse.data.meta.pagination.total,
      activeAdmins: adminsCount[0].count,
      activeVips: vipsCount[0].count,
      activeBans: bansCount[0].count
    });

  } catch (error) {
    console.error('Stats Wrapper Error:', error.message);
    res.status(500).json({ error: 'Failed to aggregate dashboard stats' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));