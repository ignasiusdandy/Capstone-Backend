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

const dataUserEmergency = async (request, h) => {
  const { userId } = request.auth; // Mengambil userId dari token auth

  try {
    // Query untuk mengambil emergency berdasarkan userId
    const [rows] = await db.query(
      `SELECT em_id, 
              id_user, 
              pic_pet, 
              pet_category,  
              SUBSTRING_INDEX(pet_location, ',', 1) AS latitude, 
              SUBSTRING_INDEX(pet_location, ',', -1) AS longitude, 
              DATE_FORMAT(created_at, '%d/%m/%Y') AS date_created, 
              TIME(created_at) AS time_created,
              pet_status, 
              notes 
       FROM T_emergency 
       WHERE id_user = ?`, // Memfilter berdasarkan userId
      [userId] // Parameter untuk filter id_user
    );

    // Jika tidak ada data emergency
    if (rows.length === 0) {
      return h.response({
        status: 'success',
        message: 'Tidak ada data emergency untuk user ini',
        data: [],
      }).code(200);
    }

    // Menggunakan Promise.all untuk memanggil API OpenStreetMap dan mendapatkan alamat
    const updatedRows = await Promise.all(rows.map(async (emergency) => {
      const { latitude, longitude } = emergency;
      const petLat = parseFloat(latitude);
      const petLng = parseFloat(longitude);

      try {
        // Memanggil API OpenStreetMap untuk mendapatkan alamat berdasarkan latitude dan longitude
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${petLat}&lon=${petLng}`);
        const data = await response.json();

        if (data && data.address) {
          emergency.address = data.address.display_name; // Menambahkan alamat ke dalam row
        } else {
          emergency.address = "Alamat tidak ditemukan"; // Jika alamat tidak ditemukan
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        emergency.address = "Error fetching address"; // Jika ada error saat mengambil alamat
      }

      return emergency; // Kembalikan emergency dengan alamat yang sudah ditambahkan
    }));

    console.log('Data emergency dengan alamat berhasil ditemukan:', updatedRows);

    // Mengembalikan response dengan data emergency yang sudah dilengkapi alamat
    return h.response({
      status: 'success',
      message: 'Data emergency ditemukan dengan alamat',
      data: updatedRows, // Mengembalikan data dengan alamat yang sudah ditambahkan
    }).code(200);
  } catch (error) {
    console.error('Error fetching emergency data:', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan dalam mengambil data emergency',
    }).code(500);
  }
};


const reportList = async (request, h) => {
  console.log('Mengambil report list berdasarkan ID Emergency dan ID User');

  const { emergencyId } = request.params;
  const { userId } = request.auth;
  console.log('emergencyId:', emergencyId);
  console.log('userId:', userId);


  try {
    const [reportList] = await db.query(
      `SELECT 
          em.em_id, 
          em.pet_location, 
          em.pet_status, 
          em.created_at, 
          usr.name_user AS name_user, 
          CASE 
            WHEN em.pet_status = 'Waiting' THEN DATE_FORMAT(em.created_at, '%d/%m/%Y') 
            WHEN em.pet_status = 'accept' THEN DATE_FORMAT(ask.date_accept, '%d/%m/%Y')
            WHEN em.pet_status = 'Complete' THEN DATE_FORMAT(ask.date_end, '%d/%m/%Y')
            ELSE NULL
          END AS date_status,
          CASE 
            WHEN em.pet_status = 'Waiting' THEN TIME(em.created_at) 
            WHEN em.pet_status = 'accept' THEN TIME(ask.date_accept)
            WHEN em.pet_status = 'Complete' THEN TIME(ask.date_end)
            ELSE NULL
          END AS time_status,
          ask.date_end, 
          ask.id_user AS id_community, 
          ask.pet_category, 
          community_usr.name_user AS name_community,
          ask.evidence_saved
       FROM T_emergency em
       LEFT JOIN T_ask ask ON em.em_id = ask.em_id
       JOIN T_user usr ON em.id_user = usr.id_user
       LEFT JOIN T_user community_usr ON ask.id_user = community_usr.id_user
       WHERE em.em_id = ? AND em.id_user = ?`,
      [emergencyId, userId] // Filter berdasarkan emergencyId dan userId
    );

    console.log(reportList);
    


    if (reportList.length === 0) {
      return h.response({
        status: 'success',
        message: 'Tidak ada data untuk ID Emergency dan User yang diberikan.',
        data: [],
      }).code(200);
    }

    // Menambahkan alamat berdasarkan pet_location menggunakan OpenStreetMap API
    const updatedReportList = await Promise.all(reportList.map(async (report) => {
      const { pet_location } = report;
      const [lat, lng] = pet_location.split(',').map(coord => parseFloat(coord)); // Parsing pet_location (lat,lng)

      try {
        // Mendapatkan alamat menggunakan API OpenStreetMap
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await response.json();

        if (data.address) {
          report.address = data.display_name; // Menambahkan alamat ke dalam objek report
        } else {
          report.address = "Alamat tidak ditemukan"; // Jika alamat tidak ditemukan
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        report.address = "Error fetching address"; // Jika terjadi kesalahan dalam API
      }

      return report; // Mengembalikan report yang sudah diperbarui dengan alamat
    }));

    console.log('Data report list ditemukan:', updatedReportList);

    return h.response({
      status: 'success',
      message: 'Data report list berhasil diambil',
      data: updatedReportList, // Mengembalikan data dengan alamat sudah ditambahkan
    }).code(200);

  } catch (error) {
    console.error('Error mengambil data report list:', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan dalam memproses permintaan',
    }).code(500);
  }
};


const getEmergenciesWithinRadius = async (request, h) => {
  console.log('Terhubung untuk mengambil data emergency dalam radius 1000 meter');

  // Mendapatkan koordinat lokasi pengguna dari request
  const { userLocation } = request.query; // asumsikan format { lat, lng }

  // Validasi untuk memastikan lokasi pengguna tersedia
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
    // Query untuk mengambil semua data emergency dalam radius 1000 meter dari lokasi pengguna
    const [emergencies] = await db.query(
      `SELECT em.*, 
              usr.name_user AS name_user, 
              DATE_FORMAT(em.created_at, '%d/%m/%Y') AS date_created, 
              TIME(em.created_at) AS time_created
       FROM T_emergency em
       JOIN T_user usr ON em.id_user = usr.id_user
       WHERE ST_Distance_Sphere(
           POINT(SUBSTRING_INDEX(em.pet_location, ',', -1), SUBSTRING_INDEX(em.pet_location, ',', 1)), 
           POINT(?, ?)
       ) <= 1000
        AND em.pet_status = 'Waiting'`,
      [lng, lat] // Urutan parameter sesuai dengan urutan dalam query POINT()
    );

    // Jika tidak ada data emergency
    if (emergencies.length === 0) {
      return h.response({
        status: 'success',
        message: 'Tidak ada data emergency dalam radius 1000 meter.',
        data: [],
      }).code(200);
    }

    // Menggunakan Promise.all untuk memanggil API OpenStreetMap untuk setiap baris data
    const updatedEmergencies = await Promise.all(emergencies.map(async (emergency) => {
      const { pet_location } = emergency;
      const [petLat, petLng] = pet_location.split(',').map(coord => parseFloat(coord)); // Asumsi pet_location dalam format 'lat,lng'

      try {
        // Mengambil alamat dari API OpenStreetMap berdasarkan pet location
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${petLat}&lon=${petLng}`);
        const data = await response.json();

        if (data.address) {
          emergency.address = data.display_name; // Menambahkan alamat ke dalam row
        } else {
          emergency.address = "Alamat tidak ditemukan";
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        emergency.address = "Error fetching address";
      }

      return emergency; // Kembalikan emergency yang sudah diperbarui dengan alamat
    }));

    console.log('Data emergency dalam radius 1000 meter ditemukan:', updatedEmergencies);

    // Mengembalikan response dengan data emergency yang sudah dilengkapi alamat
    return h.response({
      status: 'success',
      message: 'Data emergency berhasil diambil ke menu community',
      data: updatedEmergencies, // Mengembalikan data dengan alamat sudah ditambahkan
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
  console.log('Terhubung ke endpoint acceptEmergency');

  const { em_id } = request.params; // Mengambil ID emergency dari parameter
  const { userId } = request.auth; // Mendapatkan ID user dari auth token

  try {
    // Memastikan emergency dengan ID tertentu ada di database
    const [existingEmergency] = await db.query(
      'SELECT * FROM T_emergency WHERE em_id = ?',
      [em_id]
    );

    if (existingEmergency.length === 0) {
      return h.response({
        status: 'fail',
        message: 'Emergency entry not found or not accessible',
      }).code(404);
    }

    const emergency = existingEmergency[0];
    const pet_status = 'accept'; // Status yang akan diupdate menjadi 'accept'
    const { pet_category, pic_pet } = emergency; // Menyimpan data yang dibutuhkan untuk T_ask
    const accept_at = new Date().toISOString().slice(0, 19).replace('T', ' ');


    // Memeriksa apakah entri duplikat sudah ada di tabel T_ask
    const [duplicateEntry] = await db.query(
      'SELECT * FROM T_ask WHERE em_id = ? AND id_user = ?',
      [em_id, userId]
    );

    if (duplicateEntry.length > 0) {
      return h.response({
        status: 'fail',
        message: 'Duplicate entry detected for this emergency and user',
      }).code(400); // Bad Request
    }

    // Update status emergency menjadi 'accept'
    await db.query(
      'UPDATE T_emergency SET pet_status = ? WHERE em_id = ?',
      [pet_status, em_id]
    );

    // Masukkan data ke tabel T_ask
    await db.query(
      'INSERT INTO T_ask (em_id, id_user, pet_category, evidence_saved, date_accept) VALUES (?, ?, ?, ?, ?)',
      [em_id, userId, pet_category, pic_pet, accept_at]
    );

    console.log(`Emergency ID ${em_id} status updated to 'accept' and logged to T_ask`);

    return h.response({
      status: 'success',
      message: 'Emergency accepted and logged successfully',
      data: {
        em_id: em_id,
        id_user: userId,
        pet_category: pet_category,
        evidence_saved: pic_pet,
        date_accept : accept_at
      },
    }).code(200);

  } catch (error) {
    console.error('Error accepting emergency:', error);
    return h.response({
      status: 'fail',
      message: 'Error processing request',
    }).code(500);
  }
};


const acceptEmergencyList = async (request, h) => {
  console.log('Terhubung untuk mengambil data emergency berdasarkan user dan status Accept');

  const { userId } = request.auth;

  try {
    // Query untuk mengambil data emergency berdasarkan userId dan status 'Accept' dari tabel T_ask
    const [emergencies] = await db.query(
      `SELECT 
          em.em_id,
          em.pet_location, 
          em.pet_category,
          em.pic_pet,
          em.pet_status, 
          usr.name_user AS name_user, 
          DATE_FORMAT(ask.date_accept, '%d/%m/%Y') AS date_created, 
          TIME(ask.date_accept) AS time_created,
          community_usr.name_user AS name_community,
          em.notes
       FROM T_ask ask
       JOIN T_emergency em ON ask.em_id = em.em_id
       JOIN T_user usr ON em.id_user = usr.id_user
       JOIN T_user community_usr ON ask.id_user = community_usr.id_user
       WHERE ask.id_user = ? AND em.pet_status = 'Accept'`,
      [userId] // Parameter untuk filter id_user
    );

    // Jika tidak ada data emergency
    if (emergencies.length === 0) {
      return h.response({
        status: 'success',
        message: 'No have data!',
        data: [],
      }).code(200);
    }

    // Menggunakan Promise.all untuk memanggil API OpenStreetMap untuk setiap baris data
    const updatedEmergencies = await Promise.all(emergencies.map(async (emergency) => {
      const { pet_location } = emergency;
      const [petLat, petLng] = pet_location.split(',').map(coord => parseFloat(coord)); // Asumsi pet_location dalam format 'lat,lng'

      try {
        // Mengambil alamat dari API OpenStreetMap berdasarkan pet location
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${petLat}&lon=${petLng}`);
        const data = await response.json();

        if (data.address) {
          emergency.address = data.display_name; // Menambahkan alamat ke dalam row
        } else {
          emergency.address = "Alamat tidak ditemukan";
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        emergency.address = "Error fetching address";
      }

      return emergency; // Kembalikan emergency yang sudah diperbarui dengan alamat
    }));

    console.log('Data emergency ditemukan:', updatedEmergencies);

    // Mengembalikan response dengan data emergency yang sudah dilengkapi alamat
    return h.response({
      status: 'success',
      message: 'Data emergency berhasil diambil',
      data: updatedEmergencies, // Mengembalikan data dengan alamat sudah ditambahkan
    }).code(200);
  } catch (error) {
    console.error('Error dalam mengambil data emergency:', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan dalam memproses permintaan',
    }).code(500);
  }
};


const completeEmergency = async (request, h) => {
  console.log('Terhubung ke endpoint completeEmergency');

  const { em_id } = request.params; // Mengambil ID emergency dari parameter
  const { userId } = request.auth; // Mendapatkan ID user dari auth token

  try {
    // Memastikan emergency dengan ID tertentu ada di database
    const [existingEmergency] = await db.query(
      'SELECT * FROM T_emergency WHERE em_id = ?',
      [em_id]
    );

    if (existingEmergency.length === 0) {
      return h.response({
        status: 'fail',
        message: 'Emergency entry not found or not accessible',
      }).code(404);
    }

    const emergency = existingEmergency[0];
    const date_end = new Date().toISOString().slice(0, 19).replace('T', ' '); // Menyusun tanggal akhir
    const { pet_category, pic_pet } = emergency;

    // Memeriksa apakah entri sudah ada di tabel T_ask untuk user ini
    const [existingAsk] = await db.query(
      'SELECT * FROM T_ask WHERE em_id = ? AND id_user = ?',
      [em_id, userId]
    );

    if (existingAsk.length === 0) {
      return h.response({
        status: 'fail',
        message: 'No existing record found in T_ask for this emergency and user',
      }).code(404); // Tidak ada data di T_ask untuk emergency dan user tersebut
    }

    // Update status emergency menjadi 'Complete'
    await db.query(
      'UPDATE T_emergency SET pet_status = ? WHERE em_id = ?',
      ['Complete', em_id]
    );

    // Update data di T_ask
    await db.query(
      'UPDATE T_ask SET date_end = ?, pet_category = ?, evidence_saved = ? WHERE em_id = ? AND id_user = ?',
      [date_end, pet_category, pic_pet, em_id, userId]
    );

    console.log(`Emergency ID ${em_id} status updated to 'Complete' and T_ask updated`);

    return h.response({
      status: 'success',
      message: 'Emergency completed and T_ask updated successfully',
      data: {
        em_id: em_id,
        id_user: userId,
        date_end: date_end,
        pet_category: pet_category,
        evidence_saved: pic_pet,
        pet_status : pet_status
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

const completeEmergencyList = async (request, h) => {
  console.log('Terhubung untuk mengambil data emergency berdasarkan user dan status Accept');

  const { userId } = request.auth;

  try {
    // Query untuk mengambil data emergency berdasarkan userId dan status 'Accept' dari tabel T_ask
    const [emergencies] = await db.query(
      `SELECT 
            em.em_id,
            em.pet_location, 
            em.pet_category,
            em.pic_pet,
            em.pet_status, 
            usr.name_user AS name_user, 
            DATE_FORMAT(ask.date_end, '%d/%m/%Y') AS date_created, 
            TIME(ask.date_end) AS time_created,
            community_usr.name_user AS name_community,
            em.notes
         FROM T_ask ask
         JOIN T_emergency em ON ask.em_id = em.em_id
         JOIN T_user usr ON em.id_user = usr.id_user
         JOIN T_user community_usr ON ask.id_user = community_usr.id_user
         WHERE ask.id_user = ? AND em.pet_status = 'Complete'`,
      [userId] // Parameter untuk filter id_user
    );


    // Jika tidak ada data emergency
    if (emergencies.length === 0) {
      return h.response({
        status: 'success',
        message: 'No have data!',
        data: [],
      }).code(200);
    }

    // Menggunakan Promise.all untuk memanggil API OpenStreetMap untuk setiap baris data
    const updatedEmergencies = await Promise.all(emergencies.map(async (emergency) => {
      const { pet_location } = emergency;
      const [petLat, petLng] = pet_location.split(',').map(coord => parseFloat(coord)); // Asumsi pet_location dalam format 'lat,lng'

      try {
        // Mengambil alamat dari API OpenStreetMap berdasarkan pet location
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${petLat}&lon=${petLng}`);
        const data = await response.json();

        if (data.address) {
          emergency.address = data.display_name; // Menambahkan alamat ke dalam row
        } else {
          emergency.address = "Alamat tidak ditemukan";
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        emergency.address = "Error fetching address";
      }

      return emergency; // Kembalikan emergency yang sudah diperbarui dengan alamat
    }));

    console.log('Data emergency ditemukan:', updatedEmergencies);

    // Mengembalikan response dengan data emergency yang sudah dilengkapi alamat
    return h.response({
      status: 'success',
      message: 'Data emergency berhasil diambil',
      data: updatedEmergencies, // Mengembalikan data dengan alamat sudah ditambahkan
    }).code(200);
  } catch (error) {
    console.error('Error dalam mengambil data emergency:', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan dalam memproses permintaan',
    }).code(500);
  }
};


module.exports = { createEmergency, dataUserEmergency, getEmergenciesWithinRadius, updateEmergencyUser, acceptEmergency, acceptEmergencyList, completeEmergency, completeEmergencyList, reportList };
