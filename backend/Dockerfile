# Gunakan image Node.jss
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh proyek ke dalam container
COPY . .

# Expose port aplikasi
EXPOSE 4000

# Jalankan aplikasi
CMD ["npm", "run", "start-prod"]
