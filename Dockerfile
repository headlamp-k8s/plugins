# node v20 bookworm based
ARG BASE_IMAGE_VERSION=20@sha256:6a4de97365bb291992222c4f27cafc338773989712259e809632a873ff45a6ff
ARG FINAL_IMAGE_VERSION=3.22.0@sha256:8a1f59ffb675680d47db6337b49d22281a139e9d709335b492be023728e11715
ARG ENVIRONMENT=production
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

# Remove any existing node_modules and package-lock.json to avoid arch-specific conflicts
RUN echo "Cleaning arch-dependent files for plugin $PLUGIN..."; \
    cd /headlamp-plugins/$PLUGIN; \
    rm -rf node_modules package-lock.json

# Install dependencies for the specified plugin
RUN echo "Installing deps for plugin $PLUGIN..."; \
    cd /headlamp-plugins/$PLUGIN; \
    echo "Installing $ENVIRONMENT dependencies..."; \
    if [ "$ENVIRONMENT" = "production" ]; then \
     npm install --omit=dev; \
    else \
      npm install; \
    fi

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
