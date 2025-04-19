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
    name: 'mcp-deep-research-server',
    version: '1.0.0',
    description: 'Deep Research MCP Server',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Server configuration
const config = {
  baseUrl: process.env.DEEP_RESEARCH_BASE_URL || 'http://127.0.0.1:8082/v1',
  apiKey: process.env.DEEP_RESEARCH_API_KEY || 'lm-studio',
  modelName: process.env.DEEP_RESEARCH_MODEL || 'deepseek-r1-distill-llama-8b',
  maxTokens: parseInt(process.env.DEEP_RESEARCH_MAX_TOKENS || '61440', 10),
  secondaryBaseUrl:
    process.env.REASONING_BASE_URL || 'http://127.0.0.1:8082/v1',
  secondaryApiKey: process.env.REASONING_API_KEY || 'lm-studio',
  secondaryModelName:
    process.env.REASONING_MODEL || 'deepseek-r1-distill-llama-8b',
  secondaryMaxTokens: parseInt(process.env.REASONING_MAX_TOKENS || '65536', 10),
};

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: config.baseUrl,
  apiKey: config.apiKey,
  timeout: 1800000, // 30 minutes in milliseconds
});

const secondaryClient = new OpenAI({
  baseURL: config.secondaryBaseUrl,
  apiKey: config.secondaryApiKey,
  timeout: 1800000, // 30 minutes in milliseconds
});

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'deep-research',
        description:
          'Use this tool to conduct thorough, comprehensive research on any topic.\n' +
          'This tool helps in:\n' +
          '- Performing in-depth investigation on complex topics\n' +
          '- Retrieving detailed, nuanced information from multiple sources\n' +
          '- Accessing specialized knowledge and the latest developments\n' +
          '- Analyzing information with academic-level depth and rigor',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'The research question or topic to investigate thoroughly',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'reasoning',
        description:
          'Use this tool to access an advanced LLM with enhanced reasoning capabilities.\n' +
          'This tool excels at:\n' +
          '- Solving complex logical problems and puzzles\n' +
          '- Providing step-by-step analysis of multi-stage problems\n' +
          '- Evaluating complex scenarios with nuanced decision-making\n' +
          '- Generating well-structured arguments with formal reasoning\n' +
          '- Breaking down complex concepts into coherent explanatory chains',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'The question, problem, or scenario requiring detailed logical analysis and reasoning',
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
    if (!['deep-research', 'reasoning'].includes(request.params.name)) {
      throw new Error('Unknown tool');
    }

    const toolParamsSchema = z.object({
      query: z.string(),
    });

    const { query } = toolParamsSchema.parse(request.params.arguments);
    console.error(`Processing query: ${query}`);

    let response;
    if (request.params.name === 'deep-research') {
      response = await client.chat.completions.create({
        model: config.modelName,
        messages: [{ role: 'user', content: query }],
        max_completion_tokens: config.maxTokens,
        stream: true,
        frequency_penalty: 1.2,
        temperature: 0.6,
        top_p: 0.95,
      });
    } else {
      response = await secondaryClient.chat.completions.create({
        model: config.secondaryModelName,
        messages: [{ role: 'user', content: query }],
        max_completion_tokens: config.secondaryMaxTokens,
        stream: true,
        temperature: 0.6,
      });
    }

    let accumulatedText = '';

    // for-await-of loop to read streaming chunks
    for await (const chunk of response) {
      const partialContent = chunk.choices?.[0]?.delta?.content;
      if (partialContent) {
        accumulatedText += partialContent;
      }
    }

    console.error(`Model response: ${accumulatedText}`);

    // const thinkMatch = /<think>([\s\S]*?)<\/think>/.exec(accumulatedText);
    // const finalResult = thinkMatch
    // ? thinkMatch[1].trim()
    // : accumulatedText.trim();

    return {
      content: [
        {
          type: 'text',
          text: accumulatedText,
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
    console.error('MCP Deep Research Server running on stdio');
  } catch (error) {
    console.error('Fatal error running server:', error);
    process.exit(1);
  }
}

runServer().catch(error => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
