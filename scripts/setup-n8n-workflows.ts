/**
 * Setup script for n8n workflows on Render.
 * Creates and activates all content pipeline workflows.
 *
 * Usage: npx tsx scripts/setup-n8n-workflows.ts
 *
 * Environment variables:
 *   N8N_BASE_URL - Your n8n instance URL (e.g. https://unearth-n8n.onrender.com)
 *   N8N_API_KEY  - n8n API key
 *   APP_BASE_URL - Your app URL (e.g. https://unearth.app)
 *   PIPELINE_API_KEY - API key for pipeline routes
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL!;
const N8N_API_KEY = process.env.N8N_API_KEY!;
const APP_BASE_URL = process.env.APP_BASE_URL!;
const PIPELINE_API_KEY = process.env.PIPELINE_API_KEY!;

interface WorkflowDefinition {
  name: string;
  nodes: object[];
  connections: object;
  settings: object;
}

async function n8nRequest(
  path: string,
  method: string = "GET",
  body?: object
) {
  const res = await fetch(`${N8N_BASE_URL}/api/v1${path}`, {
    method,
    headers: {
      "X-N8N-API-KEY": N8N_API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n API error ${res.status}: ${text}`);
  }

  return res.json();
}

function createFetcherWorkflow(
  source: string,
  cronExpression: string
): WorkflowDefinition {
  return {
    name: `unearth-fetch-${source}`,
    nodes: [
      {
        parameters: {
          rule: { interval: [{ field: "cronExpression", expression: cronExpression }] },
        },
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1.2,
        position: [250, 300],
      },
      {
        parameters: {
          method: "POST",
          url: `${APP_BASE_URL}/api/pipeline/fetch`,
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: "x-pipeline-api-key", value: PIPELINE_API_KEY },
            ],
          },
          sendBody: true,
          bodyParameters: {
            parameters: [{ name: "source", value: source }],
          },
          options: { timeout: 60000 },
        },
        name: `Fetch ${source}`,
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [500, 300],
      },
    ],
    connections: {
      "Schedule Trigger": {
        main: [[{ node: `Fetch ${source}`, type: "main", index: 0 }]],
      },
    },
    settings: { executionOrder: "v1" },
  };
}

function createScoringWorkflow(): WorkflowDefinition {
  return {
    name: "unearth-scoring-pipeline",
    nodes: [
      {
        parameters: {
          rule: { interval: [{ field: "cronExpression", expression: "*/30 * * * *" }] },
        },
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1.2,
        position: [250, 300],
      },
      {
        parameters: {
          method: "POST",
          url: `${APP_BASE_URL}/api/pipeline/score`,
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: "x-pipeline-api-key", value: PIPELINE_API_KEY },
            ],
          },
          sendBody: true,
          bodyParameters: {
            parameters: [{ name: "batch", value: "true" }],
          },
          options: { timeout: 120000 },
        },
        name: "Score Sites",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [500, 300],
      },
    ],
    connections: {
      "Schedule Trigger": {
        main: [[{ node: "Score Sites", type: "main", index: 0 }]],
      },
    },
    settings: { executionOrder: "v1" },
  };
}

async function main() {
  console.log("Setting up n8n workflows for Unearth...\n");

  const workflows: WorkflowDefinition[] = [
    // Content fetchers
    createFetcherWorkflow("hacker_news", "0 */6 * * *"), // Every 6 hours
    createFetcherWorkflow("product_hunt", "0 9 * * *"), // Daily at 9am
    createFetcherWorkflow("github_trending", "0 10 * * *"), // Daily at 10am
    createFetcherWorkflow("rss_feed", "0 */12 * * *"), // Every 12 hours
    createFetcherWorkflow("reddit", "0 */6 * * *"), // Every 6 hours
    createFetcherWorkflow("lobsters", "0 */6 * * *"), // Every 6 hours
    createFetcherWorkflow("arena", "0 8 * * *"), // Daily at 8am
    createFetcherWorkflow("directory", "0 3 * * 1"), // Weekly Monday 3am

    // Scoring pipeline
    createScoringWorkflow(),
  ];

  for (const workflow of workflows) {
    try {
      // Check if workflow already exists
      const existing = await n8nRequest("/workflows");
      const found = existing.data?.find(
        (w: { name: string }) => w.name === workflow.name
      );

      if (found) {
        console.log(`  Updating existing workflow: ${workflow.name}`);
        await n8nRequest(`/workflows/${found.id}`, "PATCH", workflow);
        // Activate it
        await n8nRequest(`/workflows/${found.id}/activate`, "POST");
      } else {
        console.log(`  Creating workflow: ${workflow.name}`);
        const created = await n8nRequest("/workflows", "POST", workflow);
        // Activate it
        await n8nRequest(`/workflows/${created.id}/activate`, "POST");
      }

      console.log(`  ✓ ${workflow.name} active\n`);
    } catch (err) {
      console.error(`  ✗ Failed: ${workflow.name}`, err);
    }
  }

  console.log("Done! All workflows configured.");
}

main().catch(console.error);
