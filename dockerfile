# Menggunakan Node.js versi LTS
FROM node:20-alpine

# Membuat working directory
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy semua source code
COPY . .

# Expose port Express
EXPOSE 3000

# Menjalankan aplikasi
CMD ["npm", "start"]