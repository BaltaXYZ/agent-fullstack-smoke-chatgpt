FROM node:20

# Create app directory
WORKDIR /app

# Copy package.json
COPY package.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
