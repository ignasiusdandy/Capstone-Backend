const { nanoid } = require('nanoid');
const db = require('../config/db');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Inisialisasi Google Cloud Storage
const storage = new Storage();
const bucketName = 'dicoding-project-capstone-danz';

// Konfigurasi Multer untuk menangani unggahan file ke memori
const upload = multer({ storage: multer.memoryStorage() });

const createEmergency = async (request, h) => {
  console.log('terhubung ke emergency entry');

  const { userId } = request.auth;
  const { pet_category, pet_community, pet_location } = request.payload;
  const pic_pet = request.file;

  if (!pic_pet || !pet_category || !pet_community || !pet_location) {
    // Memeriksa semua data harus diisi
    const response = h.response({
      status: 'fail',
      message: 'all data must be filled',
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

    // Upload file ke Google Cloud Storage
    const blob = storage.bucket(bucketName).file(`emergency_pictures/${id}-${pic_pet.originalname}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: pic_pet.mimetype,
      },
    });

    // Menangani event error saat unggah file
    blobStream.on('error', (err) => {
      console.error('Gagal mengunggah file ke Google Cloud Storage:', err);
      return h.response({
        status: 'fail',
        message: 'Gagal mengunggah gambar ke cloud storage.',
      }).code(500);
    });

    // Menangani event selesai unggah file
    blobStream.on('finish', async () => {
      // URL file di GCS
      const picPetUrl = `https://storage.googleapis.com/${bucketName}/emergency_pictures/${id}-${pic_pet.originalname}`;

      // Menyimpan informasi ke database setelah file berhasil diunggah
      const [newEmergency] = await db.query(
        'INSERT INTO T_emergency (em_id, pic_pet, pet_category, pet_community, pet_location, created_at, pet_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, picPetUrl, pet_category, pet_community, pet_location, created_at, pet_status]
      );
      console.log('Query berhasil, emergency terdaftar dengan ID:', id);

      const response = h.response({
        status: 'success',
        message: 'emergency successfully added',
        data: {
          EmergencyId: id,
          Category: pet_category,
          Picture: picPetUrl,
          Location: pet_location,
          Filter: pet_community,
          Status: pet_status,
          Created_at: created_at,
        },
      });
      response.code(201);
      return response;
    });

    // Mulai proses unggah file
    blobStream.end(pic_pet.buffer);
  } catch (error) {
    console.error('Error input database:', error);
    return h.response({
      status: 'Fail',
      message: 'Error input database',
    }).code(500);
  }
};

module.exports = { createEmergency };
