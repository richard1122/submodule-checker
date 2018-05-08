FROM node:8-alpine
EXPOSE 3000
WORKDIR /app
COPY . /app
VOLUME [ "/app/keys" ]
RUN npm install

CMD [ "npm", "start" ]
