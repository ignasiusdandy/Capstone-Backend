const { nanoid } = require('nanoid');
const { Storage } = require('@google-cloud/storage');
const db = require('../config/db');

// Inisialisasi Google Cloud Storage
const storage = new Storage({
  // keyFilename: './service-439214-e8-8f183fd0d35f.json', 
  keyFilename: './capstone-cred.json', 
});
const bucketName = 'bucket-petpoint-capstone'; 
const bucket = storage.bucket(bucketName);

const createEmergency = async (request, h) => {
  console.log('terhubung ke emergency entry');

  const { pic_pet, pet_category, pet_location, notes } = request.payload;
  const { userId } = request.auth;
  console.log(userId);
  console.log(pic_pet, pet_category, pet_location);

  console.log('pic_pet:', request.payload.pic_pet);


  // Validasi untuk memastikan semua data harus diisi
  if (!pic_pet || !pet_category || !pet_location) {
    return h.response({
      status: 'fail',
      message: 'all data must be filled',
    }).code(400);
  }

  const id = nanoid(10);
  const bucketFormat = nanoid(5);
  const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const pet_status = 'Waiting';

  try {
    // Buat nama unik untuk file di Google Cloud Storage
    const gcsFileName = `pets/${id}`;
    const file = bucket.file(gcsFileName);

    // Upload file ke Google Cloud Storage
    await new Promise((resolve, reject) => {
      const stream = file.createWriteStream({
        metadata: {
          contentType: pic_pet.hapi.headers['content-type'],
        },
      });
      console.log('Uploading selesai');

      stream.on('error', (err) => {
        console.error('GCS upload error:', err);
        reject(err);
      });
      
      stream.on('finish', () => {
        console.log('File berhasil diunggah ke GCS');
        resolve();
      });
    
      stream.end(pic_pet._data);
    });

    // URL publik untuk file yang diunggah
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;

    // Simpan data emergency dan URL gambar ke database
    console.log('Mulai menyimpan ke database');
    await db.query(
      'INSERT INTO T_emergency (em_id, id_user, pic_pet, pet_category,  pet_location, created_at, pet_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, publicUrl, pet_category, pet_location, created_at, pet_status, notes]
    );
    console.log('Selesai ke database');

    console.log('Query berhasil, emergency entry ditambahkan dengan ID:', id);
    return h.response({
      status: 'success',
      message: 'Emergency successfully added',
      data: {
        EmergencyId: id,
        idUser: userId,
        Category: pet_category,
        Picture: publicUrl,
        Location: pet_location,
        Status: pet_status,
        Created_at: created_at,
        notes: notes,
      },
    }).code(201);
  } catch (error) {
    console.error('Error input database or GCS upload:', error);
    return h.response({
      status: 'fail',
      message: 'Error processing request',
    }).code(500);
  }
};

const dataEmergencyWaiting = async (request, h) => {
  console.log('Get data status Waiting');

  try {
    // Ambil data dari database
    const [rows] = await db.query(
      `SELECT em_id, id_user, pic_pet, pet_category, pet_community, 
       SUBSTRING_INDEX(pet_location, ',', 1) AS latitude, 
       SUBSTRING_INDEX(pet_location, ',', -1) AS longitude, 
       created_at, pet_status, notes 
       FROM T_emergency WHERE pet_status = ?`,
      ['Waiting']
    );
    
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
  .then(response => response.json())
  .then(data => {
      if (data.address) {
          console.log("Nama Jalan:", data.display_name);
      } else {
          console.error("Tidak ditemukan alamat untuk koordinat tersebut.");
      }
  })
  .catch(error => console.error("Error:", error));

    // Jika tidak ada data yang ditemukan
    if (rows.length === 0) {
      return h.response({
        status: 'success',
        message: 'No emergency entries with status Waiting found.',
        data: [],
      }).code(200);
    }

    // Jika data ditemukan
    return h.response({
      status: 'success',
      message: 'Emergency entries with status Waiting retrieved successfully.',
      data: rows,
    }).code(200);
  } catch (error) {
    console.error('Error fetching emergency data:', error);
    return h.response({
      status: 'fail',
      message: 'Error fetching emergency data.',
    }).code(500);
  }
};


module.exports = { createEmergency, dataEmergencyWaiting };
