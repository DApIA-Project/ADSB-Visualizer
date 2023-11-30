FROM node:16-alpine
WORKDIR /usr/src/app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3032
CMD ["npm", "run", "start"]