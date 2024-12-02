const { nanoid } = require('nanoid');
const db = require('../config/db');
const { Storage } = require('@google-cloud/storage');

// Inisialisasi Google Cloud Storage
const storage = new Storage({
  keyFilename: './capstone-cred.json',
});
const bucketName = 'bucket-petpoint-capstone';
const bucket = storage.bucket(bucketName);

// Helper function to delete image from GCS
const deleteImageFromGCS = async (filePath) => {
  try {
    await bucket.file(filePath).delete();
    console.log(`Image ${filePath} deleted from GCS`);
  } catch (error) {
    console.error(`Failed to delete image ${filePath}:`, error);
  }
};

// Create Article
const createArticle = async (request, h) => {
  const { name_author, title, content, pic_article } = request.payload;
  const { userId } = request.auth;

  if (!name_author || !title || !content || !pic_article) {
    return h.response({
      status: 'fail',
      message: 'All fields must be filled',
    }).code(400);
  }

  const id_article = nanoid(10);
  const create_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const gcsFileName = `article/${id_article}`;

  try {
    // Upload gambar ke GCS
    const file = bucket.file(gcsFileName);
    await new Promise((resolve, reject) => {
      const stream = file.createWriteStream({
        metadata: { contentType: pic_article.hapi.headers['content-type'] },
      });
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(pic_article._data);
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;

    // Simpan artikel ke database
    await db.query(
      'INSERT INTO T_article (id_article, id_user, name_author, title, content, pic_article, create_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_article, userId, name_author, title, content, publicUrl, create_at]
    );

    return h.response({
      status: 'success',
      message: 'Article successfully created',
      data: { id_article, userId, name_author, title, content, pic_article: publicUrl, create_at },
    }).code(201);
  } catch (error) {
    console.error('Error creating article:', error);
    return h.response({ status: 'fail', message: 'Error creating article' }).code(500);
  }
};

// Get All Articles
const getAllArticles = async (request, h) => {
  try {
    const [articles] = await db.query('SELECT * FROM T_article ORDER BY create_at DESC');
    return h.response({ status: 'success', data: articles }).code(200);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return h.response({ status: 'fail', message: 'Error fetching articles' }).code(500);
  }
};

// Get Article by ID
const getArticleById = async (request, h) => {
  const { id } = request.params;

  try {
    const [article] = await db.query('SELECT * FROM T_article WHERE id_article = ?', [id]);
    if (article.length === 0) {
      return h.response({ status: 'fail', message: 'Article not found' }).code(404);
    }
    return h.response({ status: 'success', data: article[0] }).code(200);
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    return h.response({ status: 'fail', message: 'Error fetching article' }).code(500);
  }
};

// Update Article
const updateArticle = async (request, h) => {
  const { id } = request.params;
  const { name_author, title, content, pic_article } = request.payload;

  if (!name_author || !title || !content) {
    return h.response({ status: 'fail', message: 'All fields must be filled' }).code(400);
  }

  const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

  try {
    // Ambil artikel lama
    const [oldArticle] = await db.query('SELECT * FROM T_article WHERE id_article = ?', [id]);
    if (oldArticle.length === 0) {
      return h.response({ status: 'fail', message: 'Article not found' }).code(404);
    }

    let publicUrl = oldArticle[0].pic_article;

    // Upload gambar baru jika disediakan
    if (pic_article) {
      const gcsFileName = `article/${id}`;
      const file = bucket.file(gcsFileName);
      await new Promise((resolve, reject) => {
        const stream = file.createWriteStream({
          metadata: { contentType: pic_article.hapi.headers['content-type'] },
        });
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(pic_article._data);
      });

      publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
    }

    await db.query(
      'UPDATE T_article SET name_author = ?, title = ?, content = ?, pic_article = ?, create_at = ? WHERE id_article = ?',
      [name_author, title, content, publicUrl, updated_at, id]
    );

    return h.response({ status: 'success', message: 'Article successfully updated' }).code(200);
  } catch (error) {
    console.error('Error updating article:', error);
    return h.response({ status: 'fail', message: 'Error updating article' }).code(500);
  }
};

// Delete Article
const deleteArticle = async (request, h) => {
  const { id } = request.params;

  try {
    const [article] = await db.query('SELECT pic_article FROM T_article WHERE id_article = ?', [id]);
    if (article.length === 0) {
      return h.response({ status: 'fail', message: 'Article not found' }).code(404);
    }

    const gcsFileName = article[0].pic_article.split('/').pop();
    await deleteImageFromGCS(gcsFileName);

    await db.query('DELETE FROM T_article WHERE id_article = ?', [id]);

    return h.response({ status: 'success', message: 'Article successfully deleted' }).code(200);
  } catch (error) {
    console.error('Error deleting article:', error);
    return h.response({ status: 'fail', message: 'Error deleting article' }).code(500);
  }
};

module.exports = { createArticle, getAllArticles, getArticleById, updateArticle, deleteArticle };
