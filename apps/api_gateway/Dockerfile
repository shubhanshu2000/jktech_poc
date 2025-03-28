FROM node:22.14.0-alpine

WORKDIR /usr/src/app

# ✅ Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# ✅ Install dependencies
RUN npm install

# ✅ Install Bash (Alpine does not have it by default)
RUN apk add --no-cache bash

# ✅ Copy entire project *after* installing dependencies
COPY . .

EXPOSE 3000

# ✅ Force execution with Bash
CMD ["bash", "./run.sh"]
