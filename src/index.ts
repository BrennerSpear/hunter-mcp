#!/usr/bin/env npx tsx
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { config as loadEnv } from "dotenv"
import os from "node:os"
import path from "node:path"
import { z } from "zod"

// Load API key from ~/.claude/secrets/hunter/.env
const envPath = path.join(os.homedir(), ".claude", "secrets", "hunter", ".env")
loadEnv({ path: envPath })

const apiKey = process.env.HUNTER_API_KEY || ""

if (!apiKey) {
	console.error(`Missing Hunter API key. Create ${envPath} with:`)
	console.error("HUNTER_API_KEY=your_api_key")
	process.exit(1)
}

const BASE_URL = "https://api.hunter.io/v2"

interface EmailFinderResponse {
	data: {
		first_name: string
		last_name: string
		email: string
		score: number
		position?: string
		company?: string
		verification?: {
			status: string
		}
	}
	meta: {
		params: Record<string, string>
	}
}

interface EmailVerifierResponse {
	data: {
		email: string
		status: string
		score: number
		result: string
	}
	meta: {
		params: Record<string, string>
	}
}

const server = new McpServer({
	name: "hunter-mcp",
	version: "1.0.0",
})

server.tool(
	"find_email_by_name",
	"Find the most likely email address for a person at a company domain",
	{
		domain: z.string().describe("The company domain (e.g., 'stripe.com')"),
		first_name: z.string().describe("The person's first name"),
		last_name: z.string().describe("The person's last name"),
	},
	async ({ domain, first_name, last_name }) => {
		try {
			const params = new URLSearchParams({
				domain,
				first_name,
				last_name,
				api_key: apiKey,
			})

			const response = await fetch(`${BASE_URL}/email-finder?${params}`)
			const json = (await response.json()) as EmailFinderResponse

			if (!response.ok) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error: ${JSON.stringify(json)}`,
						},
					],
					isError: true,
				}
			}

			const { email, score, verification } = json.data
			const result = {
				email,
				score,
				status: verification?.status || "unknown",
			}

			return {
				content: [{ type: "text" as const, text: JSON.stringify(result) }],
			}
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			}
		}
	},
)

server.tool(
	"verify_email",
	"Verify if an email address is valid and deliverable",
	{
		email: z.string().email().describe("The email address to verify"),
	},
	async ({ email }) => {
		try {
			const params = new URLSearchParams({
				email,
				api_key: apiKey,
			})

			const response = await fetch(`${BASE_URL}/email-verifier?${params}`)
			const json = (await response.json()) as EmailVerifierResponse

			if (!response.ok) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error: ${JSON.stringify(json)}`,
						},
					],
					isError: true,
				}
			}

			const { email: verifiedEmail, status, score } = json.data
			const result = {
				email: verifiedEmail,
				status,
				score,
			}

			return {
				content: [{ type: "text" as const, text: JSON.stringify(result) }],
			}
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Error: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			}
		}
	},
)

async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
}

main().catch(console.error)
