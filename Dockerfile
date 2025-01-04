FROM node:18

# Set working directory
WORKDIR /app

# Copy Node.js app
COPY ./node_app /app

# Install dependencies
RUN npm install

# Expose the port
EXPOSE 3000

# Run the application
CMD ["node", "server.js"]
