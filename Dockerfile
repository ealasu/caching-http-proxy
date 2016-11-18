FROM node:6-alpine

ADD app.js /app/
ADD node_modules /app/node_modules
ADD config /etc/docker-proxy
WORKDIR /app
CMD ["node", "app.js"]
