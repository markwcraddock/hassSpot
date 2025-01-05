FROM node:lts

# Set working directory
WORKDIR /app

#maintain volume across restarts
VOLUME ["/app"]

# Copy Node.js app
COPY ./node_app /app

# Install dependencies
RUN npm install

# Expose the port
EXPOSE 3001

# Pass configuration options as environment variables
ENV CLIENT_ID=${CLIENT_ID}
ENV CLIENT_SECRET=${CLIENT_SECRET}

# Run the application
CMD ["node", "server.js"]
