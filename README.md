## Table of Content
- [Desain ERD](#desain-erd-database)
- [Format Database](#create-database)
- [developer localhost](#developer)
- [Create Bucket](#create-bucket)

## Desain ERD database
![alt text](https://github.com/ignasiusdandy/Capstone-Backend/blob/master/src/petshop.png?raw=true)


## Endpoint Routes
| Route                         | HTTP Method | Description                    | Token        |
| ----------------------------- | ----------- | ---------------------------    | ------------ |
| /login                        | POST        | Log in a user                  | Not Required |
| /register                     | POST        | Register a new user            | Not Required |
| /logout                       | POST        | Logout account                 | Required     |
| /emergency/create             | POST        | Create a new emergency         | Required     |
| /emergency/waitingList        | GET         | List emergency "waiting"       | Required     |
| /community/emergency/dataList | GET         | List emergency in community    | Required     |

## Tech Architecture

## Dependencies

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
    role VARCHAR(50),
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
    em_id CHAR(10) PRIMARY KEY,
    id_user CHAR(10),
    pic_pet VARCHAR(256),
    pet_category VARCHAR(10),
    pet_community VARCHAR(100),
    pet_location VARCHAR(100),
    created_at DATE,
    pet_status VARCHAR(10),
    FOREIGN KEY (id_user) REFERENCES T_user(id_user) ON DELETE CASCADE
);

# -- Tabel ask (untuk relasi antara T_user dan T_emergency)
CREATE TABLE T_ask (
    em_id CHAR(10),
    id_user CHAR(10),
    date_end DATE,
    pet_category VARCHAR(50),
    evidence_saved VARCHAR(100),
    PRIMARY KEY (em_id, id_user),
    FOREIGN KEY (em_id) REFERENCES T_emergency(em_id) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES T_user(id_user) ON DELETE CASCADE
);
```
## Create Bucket
1. Create a bucket with the name bucket-petpoint-capstone <br>
```
gsutil mb -l asia-southeast2 gs://bucket-petpoint-capstone
gsutil acl ch -u AllUsers:R gs://bucket-petpoint-capstone
gsutil iam ch allUsers:objectViewer gs://bucket-petpoint-capstone
```
2. Go to service account <br>
3. Klik Create Service Account <br>
4. For service account name input "petpoint-data-admin" and klik create&continue <br>
5. For Grant this service account access to project select a role to storage object admin <br>
6. Klik done <br>
7. Klik the service and klik menu keys <br>
8. Klik "ADD KEY" and klik "Create new key" <br>
9. Choose key type to JSON and klik create <br>
10. Save the file credentials and you can use to backend later
11. Go to bucket > permissions
12. Klik grand access 
13. For new principal input the service account
14. For role select "storage object admin"

## Installation
1. Clone the repository project
```
git clone -b master https://github.com/ignasiusdandy/Capstone-Backend 
```
3. Go to backend directory 
```
cd Capstone-Backend/backend
```
4. Install nvm source
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
```
5. Export nvm
```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  
```
6. Install nvm to 18.13.0 version
```
nvm install v18.13.0
npm install
```
7. Update instance
```
sudo apt update
```
8.  Install docker
```
sudo apt install docker-compose -y
sudo systemctl start docker
sudo chmod 666 /var/run/docker.sock
```
9. Cek docker version (opsional)
```
docker-compose --version
```
10. Running the docker
```
docker-compose build
docker-compose up -d
```
11. Check the running program docker
```
docker ps
```
12. Enter to node in docker system
```
docker exec -it node_app /bin/sh
```
13. Install nano (opsional)
```
apt-get update && apt-get install -y nano
```
14. Create database
```
node api/config/createDatabase.js
```
15. Create table database
```
npx knex migrate:up
```
16. Exit docker system
```
exit
```




## penginstalan localhost
```
-- install database
node api/config/migrations/createDatabase.js

-- create tablee
npx knex migrate:down

npx knex migrate:up

-- seeds
knex seed:make users
```

## penginstalan with docker
```
-- menginstall docker
sudo apt update
sudo apt install docker-compose -y
sudo systemctl start docker
sudo chmod 666 /var/run/docker.sock
docker-compose --version
docker-compose up -d

--Cek id
docker ps

-- masuk ke mysql
docker exec -it <container_id_or_name> mysql -u root -p
docker exec -it mysql_db mysql -u root -p'dandy' -h 127.0.0.1

-- masuk ke node
docker exec -it node_app /bin/sh
apt-get update && apt-get install -y nano   


-- periksa apakah berjalan
docker logs node_app
docker logs -f node_app



-- mematikkan docker
docker-compose down
docker system prune -a --volumes -f
docker-compose build --no-cache
docker-compose up -d

-- menghapus perubahan dan pull
git reset --hard HEAD
git pull origin master

```

# port
vm instance =
sql = 3000

## developer
lakukan git clone dan masuk ke folder backend
```
git clone https://github.com/ignasiusdandy/Capstone-Backend.git
cd Capstone-Backend
cd backend
``` 
pastikan port sql anda 3307 atau jika ingin ganti port silahkan ganti di .env <br>
Buat database dengan nama = **db-petpoint** <br>
lakukan pembuatan database seperti langkah diatas! <br>
lakukan penginstalan npm dengan versi v18.13.0 <br>
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  


nvm install 18.13.0
```
jalankan npmnya menggunakan
```
npm run start
```
upload file json ke vm langsung
gcloud compute scp capstone-cred.json server-petpoint:~/Capstone-Backend/backend --zone=asia-southeast2-a


gcloud storage buckets add-iam-policy-binding gs://dicoding-project-capstone-danz \
  --member="serviceAccount:storage-admin@capstone-petpoint.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"



## Create firewall
1. Go to VPC NETWORK > firewall <br>
2. Klik "create firewall rule" <br>
3. Name the firewall to "server-petpoint" <br>
4. Filling target tags to "server-petpoint" <br>
5. source filter ipv4
6. Source ip4 range to "0.0.0.0/0" <br>
7. For protocols and ports centang CTP and fill port to "3000,4000,5000" <br>
8. Klik create

## iam 
Compute Instance Admin 
1. Go to iam & admin > iam <br>
2. Klik Grant Access <br>
3. For new principals enter email user <br>
4. Select a role to
5. Klik save

# Create instance
1. Go to Compute Engine > Vm Instance <br>
2. Klik "Create Instance" <br>
3. Name the instance "petpoint-instance" <br>
4. For region select "asia-southeast2" <br>
5. For zone select "asia-southeast2-a" <br>
6. Select machine type to E2-medium <br>
7. For boot disk select to ubuntu and size to 50 GB <br>
8. correct the checkbox to allow http traffic <br>
9. For network tags enter "server-petpoint" <br>

10. Klik create

## Create VPC
1. Go to Vpc Network
2. Enter name to "vpc-capstone" <br>
3. For subnet name enter "subnet-capstone" <br>
4. For region select to "asia-southeast2" <br>
5. For ipv4 range enter "10.176.0.0/20" <br>
6. Klik done <br>
7. For firewall rule correct all checkbox <br>
8. Klik Create

## iam
Batas on off saja
```
gcloud iam roles create startStopVMRole --project project-capstone-441902 \
    --title="Start Stop VM Role" \
    --permissions="compute.instances.start,compute.instances.stop,compute.instances.get" \
    --stage="GA"
```
Tetapkan ke pengguna
```
gcloud projects add-iam-policy-binding project-capstone-441902 \
    --member="user:a@example" \
    --role="projects/project-capstone-441902/roles/startStopVMRole"
```

Hanya ssh saja
```
gcloud iam roles create sshAccessRole --project project-capstone-441902 \
    --title="SSH Access Role" \
    --permissions="compute.instances.get,compute.instances.list,compute.instances.osLogin,compute.projects.get" \
    --stage="GA"
```
Ke pengguna
```
gcloud projects add-iam-policy-binding project-capstone-441902 \
    --member="user:m704b4ky0875@bangkit.academy" \
    --role="projects/project-capstone-441902/roles/sshAccessRole"
```
