## Table of Content
- [Desain ERD](#desain-erd-database)
- [Endpoint Routes](#endpoint-routes)
- [Tech Architecture](#tech-architecture)
- [Format Database](#create-database)
- [Dependencies](#dependencies)
- [Installation Server](#installation-server)
    - [Migrate Database](#migrate-database)
    - [Run docker](#run-docker)
- [Port](#port)
- [Setup Google Cloud](#setup-google-cloud)
    - [Create Bucket](#create-bucket)
    - [Create Firewall](#create-firewall)
    - [IAM](#iam)
    - [Create Instance](#create-instance)
    - [Create VPC](#create-vpc)


## Desain ERD database
![alt text](https://github.com/ignasiusdandy/Capstone-Backend/blob/master/src/petshop.png?raw=true)


## Endpoint Routes
| Route                                 | HTTP Method | Description                    | Token        |
| ------------------------------------- | ----------- | ---------------------------    | ------------ |
| /login                                | POST        | Log in a user                  | Not Required |
| /register                             | POST        | Register a new user            | Not Required |
| /logout                               | POST        | Logout account                 | Required     |
| /emergency/create                     | POST        | Create a new emergency         | Required     |
| /emergency/update/{em_id}             | PUT         | Update emergency               | Required     |
| /emergency/userEmergency              | GET         | List emergency user            | Required     |
| /emergency/reportList/{emergencyId}   | GET         | Progress user emergency        | Required     |
| /community/emergency/dataList         | GET         | List emergency in community    | Required     |
| /emergency/acceptEmergency/{em_id}    | PUT         | accept emergency               | Required     |
| /emergency/acceptList                 | GET         | accept list menu community     | Required     |
| /emergency/completeEmergency/{em_id}  | PUT         | emergency with complete        | Required     |
| /emergency/completeList               | GET         | Complete list menu community   | Required     |
| /article/create                       | POST        | Create Article                 | Required     |
| /article/allArticle                   | GET         | Get List Article               | Required     |
| /article/updateArticle/{id}           | PUT         | Update Article                 | Required     |
| /article/deleteArticle/{id}           | DELETE      | Delete Article                 | Required     |


## Tech Architecture
- Node.js
- Mysql
- Docker Compose
- Cloud Storage

## Dependencies
- [**@google-cloud/storage**](https://www.npmjs.com/package/@google-cloud/storage) - Version: ^7.14.0
- [**@hapi/hapi**](https://www.npmjs.com/package/@hapi/hapi) - Version: ^21.3.12
- [**bcrypt**](https://www.npmjs.com/package/bcrypt) - Version: ^5.1.1
- [**dotenv**](https://www.npmjs.com/package/dotenv) - Version: ^16.4.5
- [**jsonwebtoken**](https://www.npmjs.com/package/jsonwebtoken) - Version: ^9.0.2
- [**knex**](https://www.npmjs.com/package/knex) - Version: ^3.1.0
- [**multer**](https://www.npmjs.com/package/multer) - Version: ^1.4.5-lts.1
- [**mysql2**](https://www.npmjs.com/package/mysql2) - Version: ^3.11.4
- [**nanoid**](https://www.npmjs.com/package/nanoid) - Version: ^3.3.7

## Installation Server
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


### Migrate Database
```
-- install database
node api/config/migrations/createDatabase.js

-- create tablee
npx knex migrate:down

npx knex migrate:up

-- seeds
npx seed knex:run
```

### Run docker
```
-- Install docker
sudo apt update
sudo apt install docker-compose -y
sudo systemctl start docker
sudo chmod 666 /var/run/docker.sock
docker-compose --version
docker-compose up -d

--Cek id
docker ps

-- login to mysql docker
docker exec -it <container_id_or_name> mysql -u root -p

-- login to node server
docker exec -it node_app /bin/sh
apt-get update && apt-get install -y nano   

-- Check log server
docker logs node_app
docker logs -f node_app

-- Shutdown and update docker
docker-compose down
docker system prune -a --volumes -f
docker-compose build --no-cache
docker-compose up -d

```

## Port
Backend server port   = 5000 <br>
Machine learning port = 3000

## Setup Google Cloud
### Create Bucket
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

### Create Firewall
1. Go to VPC NETWORK > firewall <br>
2. Klik "create firewall rule" <br>
3. Name the firewall to "server-petpoint" <br>
4. Filling target tags to "server-petpoint" <br>
5. source filter ipv4
6. Source ip4 range to "0.0.0.0/0" <br>
7. For protocols and ports centang CTP and fill port to "3000,4000,5000" <br>
8. Klik create

### IAM 
Compute Instance Admin 
1. Go to iam & admin > iam <br>
2. Klik Grant Access <br>
3. For new principals enter email user <br>
4. Select a role to
5. Klik save

### Create Instance
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

### Create VPC
1. Go to Vpc Network
2. Enter name to "vpc-capstone" <br>
3. For subnet name enter "subnet-capstone" <br>
4. For region select to "asia-southeast2" <br>
5. For ipv4 range enter "10.176.0.0/20" <br>
6. Klik done <br>
7. For firewall rule correct all checkbox <br>
8. Klik Create
