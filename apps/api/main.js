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
  dateStrings: ['DATETIME', 'TIMESTAMP']
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

// LIST BANS (Read - Selected columns)
app.get('/api/bans',
    authenticate, 
    requireRole(['Administrator', 'Senior Moderator', 'Moderator']),
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
        whereClause = ' WHERE player_name LIKE ? OR player_steamid LIKE ?';
        queryParams.push(`%${search}%`, `%${search}%`);
        }

        // 1. Get total count for the frontend to calculate total pages
        const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM sa_bans${whereClause}`, 
        queryParams
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Get the specific page of data
        // Note: LIMIT and OFFSET parameters must be numbers, not strings
        const dataQuery = `
        SELECT id, player_name, player_steamid, player_ip, admin_name, reason, duration, created, ends, status 
        FROM sa_bans 
        ${whereClause}
        ORDER BY created DESC 
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
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE BAN
app.put('/api/bans/:id', authenticate, requireRole(['Administrator', 'Senior Moderator', 'Moderator']), async (req, res) => {
  const { player_name, player_steamid, player_ip, reason, duration, status } = req.body;
  try {
    

    let ends = null;
    const [rows] = await pool.query('SELECT created FROM sa_bans WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Ban not found" });
    }
    if (duration > 0) {
      const createdTime = new Date(rows[0].created + ' UTC');
      ends = new Date(createdTime.getTime() + duration * 60000).toISOString().slice(0, 19).replace('T', ' ');
    }
    await pool.query(
      `UPDATE sa_bans SET player_name = ?, player_steamid = ?, player_ip = ?, reason = ?, duration = ?, ends = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [player_name, player_steamid, player_ip, reason, duration, ends, status, req.params.id]
    );
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

// DELETE BAN
app.delete('/api/bans/:id', authenticate, requireRole(['Administrator', 'Senior Moderator']), async (req, res) => {
  try {
    await pool.query('DELETE FROM sa_bans WHERE id = ?', [req.params.id]);
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
            SELECT id, username, email, role, created_at 
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
      'INSERT INTO panel_users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
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
  const { role, email } = req.body;
  const userId = req.params.id;

  // RESTRICTION: Prevent promoting someone to Administrator
  if (role === 'Administrator') {
    return res.status(403).json({ error: "Cannot promote a user to Administrator." });
  }

  try {
    // Check if target is an Admin (to prevent demoting existing Admins via this API)
    const [target] = await pool.query('SELECT role FROM panel_users WHERE id = ?', [userId]);
    if (target.length > 0 && target[0].role === 'Administrator') {
      return res.status(403).json({ error: "Cannot modify an Administrator account." });
    }

    await pool.query(
      'UPDATE panel_users SET role = ?, email = ? WHERE id = ?',
      [role, email, userId]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER (Admin Only)
app.delete('/api/users/:id', authenticate, requireRole(['Administrator']), async (req, res) => {
  const userId = req.params.id;
  try {
    // Prevent deleting self or other Admins
    const [target] = await pool.query('SELECT role FROM panel_users WHERE id = ?', [userId]);
    if (target.length > 0 && target[0].role === 'Administrator') {
      return res.status(403).json({ error: "Administrator accounts cannot be deleted via API." });
    }

    await pool.query('DELETE FROM panel_users WHERE id = ?', [userId]);
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
    res.status(201).json({ id: result.insertId, message: 'VIP record created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'This SteamID is already assigned a group' });
    }
    res.status(500).json({ error: err.message });
  }
});

// LIST ALL VIPS (Admin Only)
app.get('/api/vips', authenticate, requireRole(['Administrator']), async (req, res) => {
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
        // Sorting by 'expires' DESC so newest/soonest-to-expire are visible
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
    const [result] = await pool.query(
      'UPDATE player_groups SET group_name = ?, name = ?, steamid64 = ?, expires = ? WHERE id = ?',
      [group_name, name, steamid64, expires, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "VIP record not found" });
    }
    res.json({ message: 'VIP updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE VIP (Admin Only)
app.delete('/api/vips/:id', authenticate, requireRole(['Administrator']), async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM player_groups WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "VIP record not found" });
    }
    res.json({ message: 'VIP removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//LIST ALL SERVERS (Admin and Super Moderator only)
app.get('/api/servers', authenticate, requireRole(['Senior Moderator', 'Administrator']), async (req, res) => {
    try {
        const response = await axios.get(`${process.env.PTERO_BASE_URL}/api/client`, {
            headers: {
                'Authorization': `Bearer ${process.env.PTERO_API_KEY}`,
                'Accept': 'application/vnd.pterodactyl.v1+json'
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
        const response = await axios.post(
            `${process.env.PTERO_BASE_URL}/api/client/servers/${id}/power`,
            { signal }, // Pterodactyl expects JSON body: { "signal": "restart" }
            {
                headers: {
                    'Authorization': `Bearer ${process.env.PTERO_API_KEY}`,
                    'Accept': 'application/vnd.pterodactyl.v1+json',
                    'Content-Type': 'application/json'
                }
            }
        );

        // Pterodactyl usually returns 204 No Content on success
        res.status(response.status).json({ message: `Server ${signal} signal sent successfully` });

    } catch (error) {
        console.error(`Power Action Error (${signal}):`, error.response?.data || error.message);
        const status = error.response?.status || 500;
        const details = error.response?.data?.errors?.[0]?.detail || 'Failed to send signal';
        
        res.status(status).json({ error: details });
    }
});

// GET STATS
app.get('/api/stats', authenticate, async (req, res) => {
  const userRole = req.user.role;
  try {
    // Define the parallel tasks
    const [pteroResponse, [adminsCount], [bansCount], [vipsCount]] = await Promise.all([
      // 1. Get Servers from Pterodactyl
      axios.get(`${process.env.PTERO_BASE_URL}/api/client`, {
        headers: {
          'Authorization': `Bearer ${process.env.PTERO_API_KEY}`,
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
      totalServers: ["Administrator", "Senior Moderator"].includes(userRole)? pteroResponse.data.meta.pagination.total:0,
      activeAdmins: ["Administrator"].includes(userRole)? adminsCount[0].count:0,
      activeVips: ["Administrator"].includes(userRole)? vipsCount[0].count:0,
      activeBans: bansCount[0].count
    });

  } catch (error) {
    console.error('Stats Wrapper Error:', error.message);
    res.status(500).json({ error: 'Failed to aggregate dashboard stats' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));