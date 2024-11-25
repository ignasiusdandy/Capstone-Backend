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

const updateEmergencyUser = async (request, h) => {
  console.log('terhubung ke emergency update');

  const { pic_pet, pet_category, pet_location, notes } = request.payload;
  const { userId } = request.auth;
  const { em_id } = request.params; // mengambil ID emergency yang ingin diperbarui
  console.log(userId);
  console.log(pic_pet, pet_category, pet_location);

  // Validasi untuk memastikan data yang wajib diisi tidak kosong
  if (!pic_pet || !pet_category || !pet_location) {
    return h.response({
      status: 'fail',
      message: 'all data must be filled',
    }).code(400);
  }

  const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const pet_status = 'Waiting'; 

  try {
    // Ambil URL foto yang lama dari database berdasarkan em_id
    const result = await db.query('SELECT pic_pet FROM T_emergency WHERE em_id = ?', [em_id]);
  
    if (result.length === 0) {
      return h.response({
        status: 'fail',
        message: 'Emergency record not found',
      }).code(404);
    }
  
    // Jika ada foto baru (pic_pet), unggah gambar ke GCS dan perbarui URL
    let publicUrl = result[0].pic_pet; // Gunakan URL foto yang lama
  
    if (pic_pet) {
      const gcsFileName = `pets/${em_id}`;
      const file = bucket.file(gcsFileName);
  
      // 3. Upload file ke Google Cloud Storage
      await new Promise((resolve, reject) => {
        const stream = file.createWriteStream({
          metadata: {
            contentType: pic_pet.hapi.headers['content-type'],
          },
        });
  
        stream.on('error', (err) => reject(err));
        stream.on('finish', () => resolve());
        stream.end(pic_pet._data);
      });
  
      publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
    }
    // Menyimpan data yang diperbarui ke database
    console.log('Mulai memperbarui data ke database');
    await db.query(
      'UPDATE T_emergency SET pic_pet = ?, pet_category = ?, pet_location = ?, created_at = ?, pet_status = ?, notes = ? WHERE em_id = ? AND id_user = ?',
      [
        publicUrl || null, // jika tidak ada gambar baru, gunakan null
        pet_category,
        pet_location,
        created_at,
        pet_status,
        notes,
        em_id, // ID emergency yang ingin diperbarui
        userId, // Pastikan user yang mengupdate adalah yang memiliki entri
      ]
    );
    console.log('Selesai memperbarui ke database');

    // Mengembalikan respons berhasil
    return h.response({
      status: 'success',
      message: 'Emergency successfully updated',
      data: {
        EmergencyId: em_id,
        idUser: userId,
        Category: pet_category,
        Picture: publicUrl || 'No change in picture', // jika gambar tidak diubah
        Location: pet_location,
        Status: pet_status,
        Updated_at: created_at,
        notes: notes,
      },
    }).code(200);
  } catch (error) {
    console.error('Error updating database or GCS upload:', error);
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
      `SELECT em_id, id_user, pic_pet, pet_category,  
       SUBSTRING_INDEX(pet_location, ',', 1) AS latitude, 
       SUBSTRING_INDEX(pet_location, ',', -1) AS longitude, 
       created_at, pet_status, notes 
       FROM T_emergency WHERE pet_status = ?`,
      ['Waiting']
    );
    
    // Jika tidak ada data yang ditemukan
    if (rows.length === 0) {
      return h.response({
        status: 'success',
        message: 'No emergency entries with status Waiting found.',
        data: [],
      }).code(200);
    }

    // Ambil data alamat untuk setiap entry
    const updatedRows = await Promise.all(rows.map(async (row) => {
      const { latitude, longitude } = row;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();

        if (data.address) {
          row.address = data.display_name; // Menambahkan alamat ke dalam row
        } else {
          row.address = "Alamat tidak ditemukan";
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        row.address = "Error fetching address";
      }

      return row;
    }));

    // Jika data ditemukan
    return h.response({
      status: 'success',
      message: 'Emergency entries with status Waiting retrieved successfully.',
      data: updatedRows,
    }).code(200);
  } catch (error) {
    console.error('Error fetching emergency data:', error);
    return h.response({
      status: 'fail',
      message: 'Error fetching emergency data.',
    }).code(500);
  }
};


  const getEmergenciesWithinRadius = async (request, h) => {
    console.log('Terhubung untuk mengambil data emergency dalam radius 1000 meter');

    // Mendapatkan koordinat lokasi pengguna dari request
    const { userLocation } = request.query; // asumsikan format { lat, lng }

    // Validasi untuk memastikan lokasi pengguna tersedia
    console.log(userLocation);
    if (!userLocation) {
      return h.response({
        status: 'fail',
        message: 'Lokasi pengguna harus disertakan dengan benar',
      }).code(400);
    }

    // Parsing JSON string yang diterima dari query parameter
    let location;
    try {
      location = JSON.parse(userLocation);
    } catch (error) {
      return h.response({
        status: 'fail',
        message: 'Format lokasi tidak valid. Pastikan formatnya adalah JSON',
      }).code(400);
    }

    // Validasi apakah lat dan lng ada dalam objek lokasi
    const { lat, lng } = location;
    if (typeof lat === 'undefined' || typeof lng === 'undefined') {
      return h.response({
        status: 'fail',
        message: 'Lokasi pengguna harus memiliki latitude dan longitude',
      }).code(400);
    }


    try {
  // Query untuk mengambil semua data emergency dalam radius 100 meter dari lokasi pengguna
  const [emergencies] = await db.query(
    `SELECT * FROM T_emergency 
    WHERE ST_Distance_Sphere(
      POINT(SUBSTRING_INDEX(pet_location, ',', -1), SUBSTRING_INDEX(pet_location, ',', 1)), 
      POINT(?, ?)
    ) <= 1000`,
    [lng, lat] // Urutan parameter sesuai dengan urutan dalam query POINT()
  );

  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
  .then(response => response.json())
  .then(data => {
      if (data.address) {
        emergency.address = data.display_name;
      } else {
        emergency.address = "Alamat tidak ditemukan";
      }
  })
  .catch(error => console.error("Error:", error));

      if (emergencies.length === 0) {
        return h.response({
          status: 'success',
          message: 'Tidak ada data emergency dalam radius 1000 meter.',
          data: [],
        }).code(200);
      }

      console.log('Data emergency dalam radius 1000 meter ditemukan:', emergencies);

      return h.response({
        status: 'success',
        message: 'Data emergency berhasil diambil ke menu community',
        data: emergencies,
      }).code(200);
    } catch (error) {
      console.error('Error dalam mengambil data emergency:', error);
      return h.response({
        status: 'fail',
        message: 'Terjadi kesalahan dalam memproses permintaan',
      }).code(500);
    }
  };


  const acceptEmergency = async (request, h) => {
    console.log('Terhubung ke endpoint accept');
  
    const { userId } = request.auth; // Mendapatkan ID user dari authentication
    const { em_id } = request.params; // mengambil ID emergency yang ingin diperbarui

    
    console.log('User ID:', userId);
    console.log('Emergency ID:', em_id);
    const pet_status = 'accept'; // mengambil ID emergency yang ingin diperbarui
    console.log('New Status:', pet_status);


  
    try {
      // Mengecek apakah emergency dengan ID tertentu milik user yang sesuai ada di database
      const [existingEmergency] = await db.query(
        'SELECT * FROM T_emergency WHERE em_id = ? AND id_user = ?',
        [em_id, userId]
      );
  
      if (!existingEmergency) {
        return h.response({
          status: 'fail',
          message: 'Emergency not found or you do not have permission to update it',
        }).code(404);
      }
  
      // Memperbarui status emergency di database
      await db.query(
        'UPDATE T_emergency SET pet_status = ? WHERE em_id = ? AND id_user = ?',
        [pet_status, em_id, userId]
      );
  
      console.log('Status berhasil diperbarui');
      return h.response({
        status: 'success',
        message: 'Emergency status successfully updated to accept',
        data: {
          EmergencyId: em_id,
          NewStatus: pet_status,
        },
      }).code(200);
    } catch (error) {
      console.error('Error updating emergency status:', error);
      return h.response({
        status: 'fail',
        message: 'Error processing request',
      }).code(500);
    }
  };

  const completeEmergency = async (request, h) => {
  
    try {
      // Memastikan emergency dengan ID ada
      const [existingEmergency] = await db.query(
        'SELECT * FROM T_emergency WHERE em_id = ?',
        [em_id]
      );
  
      if (existingEmergency.length === 0) {
        return h.response({
          status: 'fail',
          message: 'Emergency entry not found',
        }).code(404);
      }
  
      // Update status emergency menjadi Complete
      await db.query(
        'UPDATE T_emergency SET pet_status = ? WHERE em_id = ?',
        ['Complete', em_id]
      );
  
      // Masukkan data ke tabel T_ask
      await db.query(
        'INSERT INTO T_ask (em_id, id_user, date_end, pet_category, evidence_saved) VALUES (?, ?, ?, ?, ?)',
        [em_id, id_user, date_end, pet_category, evidence_saved]
      );
  
      console.log(`Emergency ID ${em_id} status updated to Complete and logged to T_ask`);
  
      return h.response({
        status: 'success',
        message: 'Emergency completed and logged successfully',
        data: {
          em_id,
          id_user,
          date_end,
          pet_category,
          evidence_saved,
        },
      }).code(200);
    } catch (error) {
      console.error('Error completing emergency:', error);
      return h.response({
        status: 'fail',
        message: 'Error processing request',
      }).code(500);
    }
  };  
  


module.exports = { createEmergency, dataEmergencyWaiting, getEmergenciesWithinRadius, updateEmergencyUser, acceptEmergency, completeEmergency };
