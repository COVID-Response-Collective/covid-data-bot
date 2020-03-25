# Use the official image as a parent image
FROM node:current-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy the file from your host to your current location
COPY package.json .

# Inform Docker of the port being exposed.
EXPOSE 8080

# Run the command inside your image filesystem
RUN npm install

# Run the specified command within the container.
CMD [ "npm", "start" ]

# Copy the rest of your app's source code frmo your host to your image filesystem.
COPY . .
