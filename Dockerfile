ARG BASE_IMAGE_VERSION=18
ARG FINAL_IMAGE_VERSION=3.20.3
FROM node:${BASE_IMAGE_VERSION} AS builder

# Set the working directory inside the container
WORKDIR /headlamp-plugins

# Add a build argument for the desired plugin to be built
ARG PLUGIN

# Check if the PLUGIN argument is provided
RUN if [ -z "$PLUGIN" ]; then \
      echo "Error: PLUGIN argument is required"; \
      exit 1; \
    fi

# Create a directory for the plugin build
RUN mkdir -p /headlamp-plugins/build/${PLUGIN}

# Copy the plugin source code into the container
COPY ${PLUGIN} /headlamp-plugins/${PLUGIN}

# Install dependencies for the specified plugin
RUN echo "Installing deps for plugin $PLUGIN..."; \
    cd /headlamp-plugins/$PLUGIN; \
    npm ci --omit=dev

# Build the specified plugin
RUN echo "Building plugin $PLUGIN..."; \
    cd /headlamp-plugins/$PLUGIN; \
    npm run build

# Extract the built plugin to the build directory
RUN echo "Extracting plugin $PLUGIN..."; \
    cd /headlamp-plugins/$PLUGIN; \
    npx --no-install headlamp-plugin extract . /headlamp-plugins/build/${PLUGIN}

FROM alpine:${FINAL_IMAGE_VERSION} AS final

# Create a non-root user and group
RUN addgroup -S headlamp && adduser -S headlamp -G headlamp

# Copy the built plugin files from the builder stage to the /plugins directory in the final image
COPY --from=builder /headlamp-plugins/build/ /plugins/

# Set appropriate permissions for the plugins directory
RUN chown -R headlamp:headlamp /plugins && \
    chmod -R 755 /plugins

LABEL org.opencontainers.image.source=https://github.com/headlamp-k8s/plugins
LABEL org.opencontainers.image.licenses=MIT

# Switch to non-root user
USER headlamp

# Set the default command to list the installed plugins
CMD ["sh", "-c", "echo Plugins installed at /plugins/:; ls /plugins/"]
