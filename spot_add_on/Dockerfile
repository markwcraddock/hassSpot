FROM node:lts

# Set working directory
WORKDIR /app

# Copy Node.js app
COPY ./node_app /app
COPY package.json .

# Install dependencies
RUN npm install

# Expose the port
EXPOSE 3001

# Run the application
CMD ["node", "server.js"]
