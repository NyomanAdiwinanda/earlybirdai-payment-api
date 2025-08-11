# Use a more secure, minimal base image with specific version
FROM node:24.5.0-alpine3.22

# Create app directory first
WORKDIR /app

# Install security updates and minimal tools, then clean up thoroughly
RUN apk update && apk upgrade && \
    apk add --no-cache netcat-openbsd && \
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/* /usr/share/man /usr/share/doc

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Copy package files with proper ownership
COPY --chown=appuser:nodejs package.json yarn.lock ./

# Install dependencies and clean up
RUN yarn install --frozen-lockfile --production=false && \
    yarn cache clean && \
    rm -rf /tmp/* /var/tmp/*

# Copy source code with proper ownership
COPY --chown=appuser:nodejs . .

# Copy and set permissions for entrypoint script
COPY --chown=appuser:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Default command
CMD ["yarn", "start:dev"]
