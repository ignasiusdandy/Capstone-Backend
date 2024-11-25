/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('T_user').del()
  await knex('T_user').insert([
    {id_user: 'xcxzxcxz01', name_user: 'Cat Community', email_user: 'catlovers@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz02', name_user: 'Dog Lovers', email_user: 'doglovers@gmail.com', password_user:'dog123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz03', name_user: 'Dog Rescue Network', email_user: 'dog12@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz04', name_user: 'Cats of the World', email_user: 'catlovers12@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz05', name_user: 'Pet Fashionistas', email_user: 'pet12@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz06', name_user: 'Pet Photography Society', email_user: 'mypet12@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz07', name_user: 'Adoptive Pet Families', email_user: 'catlovers123@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz08', name_user: 'Pet Supporters', email_user: 'supp@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz09', name_user: 'Animal Rights Defenders', email_user: 'animal@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz10', name_user: 'Pet Lovers Society', email_user: 'catloverssoci@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'},
    {id_user: 'xcxzxcxz11', name_user: 'Farm Animal Care Group', email_user: 'farms@gmail.com', password_user:'cataja123', created_at: knex.fn.now(), role: 'community', Pic_Profile: 'https://storage.googleapis.com/bucket-petpoint-capstone/pets/4wPKlcVMWp', Location:'-6.386904095903895, 106.86943470855117'}
  ]);
};
