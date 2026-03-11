FROM node:20-alpine

WORKDIR /app

# Install dependencies (including @hello-pangea/dnd)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the frontend source
COPY . .

EXPOSE 3000
ENV HOST=0.0.0.0

# Use development server so docker-compose hot-reload volumes keep working
CMD ["npm", "start"]
