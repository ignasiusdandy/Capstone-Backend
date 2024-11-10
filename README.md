## Table of Content
- [Desain ERD](#desain-erd-database)
- [Format Database](#create-database)
- [developer localhost]($developer)

## Desain ERD database
![alt text](https://github.com/ignasiusdandy/Capstone-Backend/blob/master/src/petshop.png?raw=true)


## Endpoint Routes
| Route                  | HTTP Method | Description                 | Auth         |
| ---------------------- | ----------- | --------------------------- | ------------ |
| /login                 | POST        | Log in a user               | Not Required |
| /register              | POST        | Register a new user         | Not Required |
| /logout                | POST        | Log out a user              | Not Required |

## Create Database
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
    Role VARCHAR(50),
    Pic_Profile VARCHAR(100),
    Location VARCHAR(100)
);

# -- Tabel T_article
CREATE TABLE T_article (
    id_article INT PRIMARY KEY,
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
    id_user CHAR(10),
    date_end DATE,
    pet_category VARCHAR(50),
    evidence_saved VARCHAR(100),
    PRIMARY KEY (em_id, id_user),
    FOREIGN KEY (em_id) REFERENCES T_emergency(em_id) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES T_user(id_user) ON DELETE CASCADE
);
```

## penginstalan
```
npm install dotenv
npm install mysql
npm install jsonwebtoken
```

## penginstalan localhost
```

```

## penginstalan with docker
```
-- menginstall docker
sudo apt update
sudo apt install docker-compose -y
docker-compose --version
docker-compose up -d

--Cek id
docker ps

-- masuk ke mysql
docker exec -it <container_id_or_name> mysql -u root -p

-- mematikkan docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

# port
vm instance =
sql = 3000

## developer
pastikan port sql anda 3307! atau jika ingin ganti port silahkan ganti di .env <br>
Buat database dengan nama = **db-petpoint** <br>
lakukan pembuatan database seperti langkah diatas! <br>
lakukan penginstalan npm dengan versi v18.13.0 <br>
```
nvm install 18.13.0
```