FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/temp /app/dist && chown -R node:node /app

CMD ["npm", "run", "dev"]