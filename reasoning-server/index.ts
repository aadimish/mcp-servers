#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import OpenAI from 'openai';

// Create server instance
const server = new Server(
  {
    name: 'mcp-reasoning-server',
    version: '1.0.0',
    description: 'Reasoning MCP Server',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Server configuration
const config = {
  baseUrl: process.env.REASONING_BASE_URL || 'http://127.0.0.1:8082/v1',
  apiKey: process.env.REASONING_API_KEY || 'lm-studio',
  modelName: process.env.REASONING_MODEL || 'deepseek-r1-distill-llama-8b',
};

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: config.baseUrl,
  apiKey: config.apiKey,
  timeout: 1800000, // 30 minutes in milliseconds
});

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'think',
        description:
          'Use this tool to get another analytical perspective on complex problems.\n' +
          'This tool helps in:\n' +
          '- Breaking down complex problems\n' +
          '- Considering different angles and approaches\n' +
          '- Getting step-by-step reasoning\n' +
          '- Obtaining alternative viewpoints',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The problem or question to analyze',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    if (request.params.name !== 'think') {
      throw new Error('Unknown tool');
    }

    const toolParamsSchema = z.object({
      query: z.string(),
    });

    const validatedParams = toolParamsSchema.parse(request.params.arguments);
    const query = validatedParams.query;

    console.error(`Processing query: ${query}`);

    const response = await client.chat.completions.create({
      model: config.modelName,
      messages: [{ role: 'user', content: query }],
      max_tokens: 8192,
      stream: true,
    });

    let accumulatedText = '';

    // for-await-of loop to read streaming chunks
    for await (const chunk of response) {
      const partialContent = chunk.choices?.[0]?.delta?.content;
      if (partialContent) {
        accumulatedText += partialContent;
      }
    }

    console.error(`Model response: ${accumulatedText}`);

    const thinkMatch = /([\s\S]*?)<\/think>/.exec(accumulatedText);
    const finalResult = thinkMatch ? thinkMatch[1].trim() : accumulatedText;

    return {
      content: [
        {
          type: 'text',
          text: finalResult,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server with stdio transport
async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Reasoning Server running on stdio');
  } catch (error) {
    console.error('Fatal error running server:', error);
    process.exit(1);
  }
}

runServer().catch(error => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
