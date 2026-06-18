FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# VITE_* precisa estar disponível em tempo de build (vite build embute no bundle)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview"]
