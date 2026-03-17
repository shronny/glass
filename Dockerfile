FROM node:20-alpine

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["npm", "run", "dev"]
