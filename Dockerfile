FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .
ENV CAC_TARGET=node
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]