FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start the dev server and expose host
CMD ["npm", "run", "dev", "--", "--host"]
