# Reasoning MCP Server

A Model Context Protocol (MCP) server that provides analytical thinking capabilities through integration with local or hosted LLM APIs. This server helps break down complex problems, consider different angles, and provide step-by-step reasoning.

## Features

- Integration with any OpenAI-compatible API endpoint
- Flexible model selection
- Support for both local and hosted LLM deployments

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Access to an OpenAI-compatible API (e.g., local LM Studio, hosted models)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/aadimish/mcp-servers.git
cd reasoning-server
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

## Configuration

The server can be configured using environment variables:

| Variable          | Description                | Default Value                |
| ----------------- | -------------------------- | ---------------------------- |
| THINKING_BASE_URL | Base URL for the LLM API   | http://127.0.0.1:8082/v1     |
| THINKING_API_KEY  | API key for authentication | lm-studio                    |
| THINKING_MODEL    | Model name to use          | deepseek-r1-distill-llama-8b |

## Usage with Claude Desktop

1. Open your Claude Desktop configuration file:

   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server configuration:

```json
{
  "mcpServers": {
    "reasoning": {
      "command": "npx",
      "args": ["-y", "server-reasoning"],
      "env": {
        "REASONING_BASE_URL": "http://127.0.0.1:8082/v1",
        "REASONING_API_KEY": "lm-studio",
        "REASONING_MODEL": "deepseek-r1-distill-llama-8b"
      }
    }
  }
}
```

### Example Configurations

1. Using with Local LM Studio:

```json
{
  "env": {
    "REASONING_BASE_URL": "http://localhost:8082/v1",
    "REASONING_API_KEY": "lm-studio",
    "REASONING_MODEL": "deepseek-r1-distill-llama-8b"
  }
}
```

2. Using with OpenAI API:

```json
{
  "env": {
    "REASONING_BASE_URL": "https://api.openai.com/v1",
    "REASONING_API_KEY": "your-openai-api-key",
    "REASONING_MODEL": "your-model-deployment-name"
  }
}
```

3. Using with Azure OpenAI:

```json
{
  "env": {
    "REASONING_BASE_URL": "https://your-resource.openai.azure.com/openai/deployments/your-deployment",
    "REASONING_API_KEY": "your-azure-api-key",
    "REASONING_MODEL": "your-model-deployment-name"
  }
}
```

## Development

To run the server in development mode:

```bash
npm run dev
```

To build the server:

```bash
npm run build
```

## Available Tools

The server exposes a single tool:

### `think`

Used to get analytical perspectives on complex problems. This tool helps with:

- Breaking down complex problems
- Considering different angles and approaches
- Getting step-by-step reasoning
- Obtaining alternative viewpoints

## Troubleshooting

1. Check the logs for detailed error messages
2. Verify the API endpoint is accessible
3. Ensure the model name is correct for your chosen API
4. Confirm the API key has proper permissions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
