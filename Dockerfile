# Use a specific version of the node image
FROM node:18-slim

# Set the working directory
WORKDIR /usr/src/app

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to run the bundled chromium browser
RUN apt-get update && apt-get install -y wget --no-install-recommends &&     wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - &&     sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' &&     apt-get update &&     apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends &&     rm -rf /var/lib/apt/lists/*

# Set the Puppeteer executable path
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/google-chrome-stable

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Add a non-root user to run the application
RUN useradd -ms /bin/bash pptruser
USER pptruser

# Run the application
CMD [ "node", "index.js" ]

