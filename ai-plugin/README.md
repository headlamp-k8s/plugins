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

## Troubleshooting

If you see the "No valid API configuration found" error:

1. Go to the plugin settings page
2. Make sure you have saved at least one provider configuration
3. Ensure all required fields are filled out for your provider
4. Click "Save Configuration" or "Save as Default"
