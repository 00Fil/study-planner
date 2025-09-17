# Use Node 20 with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:21.0.0

# Set environment to avoid Puppeteer issues
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for build)
RUN npm ci

# Copy application files
COPY . .

# Build Next.js application
RUN npm run build

# Clean dev dependencies
RUN npm prune --production

# Expose port (Render sets PORT env variable)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
