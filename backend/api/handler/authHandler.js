const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const registerHandler = async (request, h) => {
  console.log('terhubung ke auth');
  const { name_user, email_user, password_user, role } = request.payload;
  const id_user = nanoid(10);
  const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (!email_user || !password_user) {
    console.log('Validasi gagal: Email atau password tidak ada');
    const response = h.response({
      status: 'fail',
      message: 'Gagal mendaftarkan. Email dan password harus diisi.',
    });
    response.code(400);
    return response;
  }

  if (!name_user || !role) {
    console.log('Validasi gagal semua data');
    const response = h.response({
      status: 'fail',
      message: 'Gagal mendaftarkan. Semua data harus di isi!',
    });
    response.code(400);
    return response;
  }

  if (!role || !['user', 'community'].includes(role)) {
    console.log('role bukan diminta');
    return h.response({
      status: 'fail',
      message: 'Gagal mendaftarkan. ROLE harus user atau community!',
    }).code(400);
  }

  try {
    const [existingUser] = await db.query('SELECT * FROM T_user WHERE email_user = ?', [email_user]);
    if (existingUser.length > 0) {
      console.log('Registrasi gagal: Email sudah digunakan');
      return h.response({
        status: 'fail',
        message: 'Gagal mendaftarkan. Email sudah digunakan.',
      }).code(400);
    }
    const hashedPassword = await bcrypt.hash(password_user, 10);

    const [result] = await db.query(
      'INSERT INTO T_user (id_user, name_user, email_user, password_user, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id_user, name_user, email_user, hashedPassword, role, created_at]
    );
    console.log('Query berhasil, user terdaftar dengan ID:', id_user);

    const response = h.response({
      status: 'success',
      message: 'User berhasil didaftarkan',
      data: {
        userId: id_user,
      },
    });
    response.code(201);
    return response;

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const response = h.response({
        status: 'fail',
        message: 'Gagal mendaftarkan user. Email sudah digunakan.',
      });
      response.code(400);
      return response;
    }

    const response = h.response({
      status: 'error',
      message: 'Terjadi kesalahan pada server.',
    });
    response.code(500);
    return response;
  }
};

const loginHandler = async (request, h) => {
  console.log('Login handler diakses');
  const { email_user, password_user } = request.payload;

  if (!email_user || !password_user) {
    console.log('Validasi gagal: Email atau password tidak ada');
    return h.response({
      status: 'fail',
      message: 'Email dan password harus diisi.',
    }).code(400);
  }

  try {
    const [rows] = await db.query('SELECT * FROM T_user WHERE email_user = ?', [email_user]);

    if (rows.length === 0) {
      console.log('Login gagal: Email tidak ditemukan');
      return h.response({
        status: 'fail',
        message: 'Email atau password salah.',
      }).code(401);
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password_user, user.password_user);
    if (!isMatch) {
      console.log('Login gagal: Password tidak cocok');
      return h.response({
        status: 'fail',
        message: 'Email atau password salah.',
      }).code(401);
    }



    const token = jwt.sign(
      { userId: user.id_user, role: user.role },
      process.env.JWT_SECRET ,
      { expiresIn: '1h' }
    );

    console.log('Login berhasil, token dibuat:', token);

    let dashboard;
    if (user.role === 'user') {
      dashboard = 'dashboardUser';
      console.log('User dengan role "user" diarahkan ke dashboardUser');
    } else if (user.role === 'community') {
      dashboard = 'dashboardCommunity';
      console.log('User dengan role "community" diarahkan ke dashboardCommunity');
    } else {
      console.log('Role tidak diketahui:', user.role);
      dashboard = 'dashboardUser';
    }
    return h.response({
      status: 'success',
      message: 'Login berhasil',
      data: {
        token,
        dashboard,
      },
    }).code(200);


  } catch (error) {
    console.error('Error pada login:', error);
    return h.response({
      status: 'error',
      message: 'Terjadi kesalahan pada server.',
    }).code(500);
  }
};

const revokedTokens = new Set();
const logoutHandler = async (request, h) => {
  try {
    console.log('Logout handler diakses');

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return h.response({
        status: 'fail',
        message: 'Token tidak ditemukan.',
      }).code(401);
    }

    const token = authHeader.split(' ')[1]; 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    revokedTokens.add(token);
    console.log('Token dicabut untuk user:', decoded.userId);

    return h.response({
      status: 'success',
      message: 'Logout berhasil',
    }).code(200);

  } catch (error) {
    console.error('Error pada logout:', error);
    return h.response({
      status: 'error',
      message: 'Terjadi kesalahan saat logout.',
    }).code(500);
  }
};


module.exports = { registerHandler, loginHandler, logoutHandler };
