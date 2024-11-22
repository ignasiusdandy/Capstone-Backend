exports.up = function(knex) {
  return knex.schema
    .createTable('T_user', function(table) {
      table.string('id_user', 10).primary();
      table.string('name_user', 80);
      table.string('email_user', 30);
      table.string('password_user', 70);
      table.date('created_at');
      table.string('role', 50);
      table.string('Pic_Profile', 100);
      table.string('Location', 100);
    })
    .createTable('T_article', function(table) {
      table.string('id_article', 10).primary();
      table.string('name_author', 100);
      table.string('title', 50);
      table.string('content', 256);
      table.datetime('create_at');
    })
    .createTable('T_emergency', function(table) {
      table.string('em_id', 10).primary();
      table.string('id_user', 10);
      table.string('pic_pet', 256);
      table.string('pet_category', 10);
      table.string('pet_location', 100);
      table.date('created_at');
      table.string('pet_status', 10);
      table.string('notes', 256);
      table.primary('id_user');
      table.foreign('id_user').references('T_user.id_user').onDelete('CASCADE');
    })
    .createTable('T_ask', function(table) {
      table.string('em_id', 10);
      table.string('id_user', 10);
      table.date('date_end');
      table.string('pet_category', 50);
      table.string('evidence_saved', 100);
      table.primary(['em_id', 'id_user']);
      table.foreign('em_id').references('T_emergency.em_id').onDelete('CASCADE');
      table.foreign('id_user').references('T_user.id_user').onDelete('CASCADE');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('T_ask')
    .dropTableIfExists('T_emergency')
    .dropTableIfExists('T_article')
    .dropTableIfExists('T_user');
};
