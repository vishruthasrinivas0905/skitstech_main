FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY public ./public
COPY server ./server
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server/index.js"]
