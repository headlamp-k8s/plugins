# AI Plugin

This plugin adds an AI prompt to Headlamp. It works by including some of the context of what happens around the
Kubernetes cluster as part of the prompt history, in a transparent way.

## Supported Providers

The plugin supports multiple AI providers:

- OpenAI (GPT models)
- Azure OpenAI Service
- Anthropic Claude
- Mistral AI
- Google Gemini
- Local models (via Ollama)

You'll need to provide your own API keys for the provider you choose to use.

**IMPORTANT:** This plugin is in early development and is not yet ready for production use. Using it may incur
in costs from the AI provider! Use at your own risk.

## Test Mode

The plugin includes a **Test Mode** feature that allows you to test how different AI responses render in the chat interface without actually calling AI providers. This is useful for:

- Testing markdown rendering
- Verifying YAML code block detection and parsing
- Testing error message display
- Developing and debugging the chat interface

### Enabling Test Mode

1. Go to the plugin settings page (gear icon in the AI Assistant panel)
2. Toggle on "Test Mode"
3. Return to the AI Assistant

### Using Test Mode

When test mode is active, you'll see:
- A "TEST MODE" chip in the header
- Test response input buttons and a manual input dialog
- The ability to add both user messages and AI responses
- Sample responses for quick testing

### Available Test Samples

- **Simple Markdown Text**: Basic markdown formatting
- **YAML Response with Code Block**: Single YAML resource with apply button
- **Multiple YAML Resources**: Multiple YAML blocks in one response
- **Resource List Result**: Table-formatted cluster resource listings
- **Error Response**: Simulated error messages
- **User Question**: Sample user messages

## Troubleshooting

If you see the "No valid API configuration found" error:

1. Go to the plugin settings page
2. Make sure you have saved at least one provider configuration
3. Ensure all required fields are filled out for your provider
4. Click "Save Configuration" or "Save as Default"
