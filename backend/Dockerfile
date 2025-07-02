FROM node:18

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install all deps (sharp will install native binaries for Linux)
RUN npm install

# Copy the rest of the source
COPY backend/. .

# Also copy frontend for EJS/static
COPY frontend/ /frontend

# Expose the app port
EXPOSE 2000

# Start with nodemon
CMD ["npx", "nodemon", "src/server.js"]
