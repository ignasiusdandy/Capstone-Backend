# Desain ERD database
![alt text](https://github.com/ignasiusdandy/Capstone-Backend/blob/master/src/petshop.png?raw=true)


Buat Database
```
CREATE DATABASE petpoint;
USE petpoint;


# -- Tabel T_user
CREATE TABLE T_user (
    id_user CHAR(10) PRIMARY KEY,
    name_user VARCHAR(80),
    email_user VARCHAR(30),
    password_user CHAR(70),
    created_at DATE,
    Role_as VARCHAR(50),
    Pic_Profile VARCHAR(100),
    Location VARCHAR(100)
);

# -- Tabel T_article
CREATE TABLE T_article (
    id_article CHAR(10) PRIMARY KEY,
    name_author VARCHAR(100),
    title VARCHAR(50),
    content VARCHAR(256),
    create_at DATETIME
);

# -- Tabel T_emergency
CREATE TABLE T_emergency (
    em_id INT PRIMARY KEY AUTO_INCREMENT,
    pic_pet VARCHAR(100),
    pet_category VARCHAR(10),
    pet_community VARCHAR(100),
    pet_location VARCHAR(100),
    pet_status VARCHAR(10)
);

# -- Tabel ask (untuk relasi antara T_user dan T_emergency)
CREATE TABLE ask (
    em_id INT,
    id_user INT,
    date_end DATE,
    pet_category VARCHAR(50),
    evidence_saved VARCHAR(100),
    PRIMARY KEY (em_id, id_user),
    FOREIGN KEY (em_id) REFERENCES T_emergency(em_id) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES T_user(id_user) ON DELETE CASCADE
);
```
