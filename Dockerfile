# Build stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 3004
EXPOSE 3004

# Start the application
CMD ["npm", "run", "dev"] 