FROM node:8-alpine

RUN npm install express

RUN npm install request

RUN npm install dotenv

RUN npm install uuid

COPY .env.docker .env

COPY xendit-comment-app.js .

CMD KUBE_LOGGER_SERVICE_HOST=localhost KUBE_LOGGER_SERVICE_PORT=3001 KUBE_DB_SERVICE_HOST=localhost KUBE_DB_SERVICE_PORT=3002 node xendit-comment-app.js >> xendit-comment-app.out

EXPOSE 3000
