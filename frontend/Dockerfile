# Production Nginx container serving pre-compiled React bundle
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default nginx files
RUN rm -rf ./*

# Copy pre-compiled production Vite bundle
COPY dist .

# Copy nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
