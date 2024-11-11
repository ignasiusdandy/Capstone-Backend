const { nanoid } = require('nanoid');
const db = require('../config/db');

const createEmergency = async (request, h) =>{
  
  console.log('terhubung ke emergency entry');

  const { userId, role } = request.auth; 
  const { pic_pet, pet_category, pet_community, pet_location } = request.payload;

  if (!pic_pet || !pet_category || !pet_community || !pet_location){
    // memeriksa semua data harus di isi
    const response = h.response({
      status : 'fail',
      message : 'all data must be filled',
    });
    response.code(400);
    return response;
  }


  const id = nanoid(10);
  const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const pet_status = 'Waiting';

  try {

    const [userCheck] = await db.query('SELECT role FROM T_user WHERE id_user = ?', [userId]);

    if (userCheck.length === 0) {
      // Jika userId tidak ditemukan
      return h.response({
        status: 'fail',
        message: 'User tidak ditemukan atau token tidak valid',
      }).code(401);
    }

    const [newEmergency] = await db.query(
      'INSERT INTO T_emergency (em_id, pic_pet,	pet_category,	pet_community, pet_location, created_at, pet_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, pic_pet, pet_category, pet_community, pet_location, created_at, pet_status]
    );
    console.log('Query berhasil, user terdaftar dengan ID:', id);
    const response = h.response({
      status: 'success',
      message: 'emergency successfully added',
      data: {
        EmergencyId: id,
        Category: pet_category,
        Picture : pic_pet,
        Location : pet_location,
        Filter : pet_community,
        Status : pet_status,
        Created_at : created_at,
      },
    });
    response.code(201);
    return response;}
  catch (error) {
    console.error('Error input database', error);
    return h.response({
      status: 'Fail',
      message: 'Error input database',
    }).code(500);
  }};

module.exports = { createEmergency };