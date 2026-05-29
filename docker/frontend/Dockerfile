FROM node:22-alpine

WORKDIR /app

RUN npm install -g @angular/cli

EXPOSE 4200

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200"]
