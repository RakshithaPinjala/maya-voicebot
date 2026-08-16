# Kapture Finance Collections Voicebot ("Maya")

## Overview
This repository contains the configuration, high-level design, mock backend, and test cases for "Maya," an outbound Voice AI Collections Agent for Kapture Finance built on the Vapi.ai platform.

## Setup Instructions

### Mock Server
The mock server implements the tool endpoints required by the Vapi assistant, including customer verification, payment link dispatch, logging promises to pay, and escalation.

1. Navigate to the `mock-server` directory:
   ```bash
   cd mock-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
4. Start the server:
   ```bash
   npm start
   ```
   The server runs on `http://localhost:3000`.

### ngrok Tunnel
Vapi needs a publicly accessible URL to send webhook events.
1. Run ngrok to tunnel port 3000:
   ```bash
   ngrok http 3000
   ```
2. Copy the resulting Forwarding URL (e.g., `https://abcdef123.ngrok-free.app`).

### Vapi Configuration
1. Import `vapi/tool_definitions.json` into Vapi under the Assistant's **Tools** section.
2. Set the webhook URL for each tool to your ngrok URL + `/webhook` (e.g., `https://abcdef123.ngrok-free.app/webhook`).
3. Paste the contents of `vapi/system_prompt.txt` into the Assistant's System Prompt.

## Design Choices

- **Transcriber**: Deepgram Nova-2 (multi-language). We chose `multi` over `en-US` to natively support seamless code-switching between English, Hindi, and Hinglish, which is crucial for the target demographic.
- **Model**: OpenAI `gpt-4o-mini` with a temperature of `0.1`. A low temperature is critical for compliance and strict adherence to the state machine, minimizing hallucinations and ensuring the agent does not bypass the authentication lock.
- **Voice**: Cartesia (calm, professional female voice). Collections calls can be stressful; a calm, non-aggressive tone de-escalates tension and improves the likelihood of a constructive conversation.
- **State Machine**: The strict STATE 0 to 4 structure guarantees that the conversational flow is predictable and that debt disclosure is structurally blocked before the `verify_customer` tool returns success.

## Debugging and Findings

*Template for actual Vapi build notes:*

- **Issue**: Latency spikes during tool calls.
  **Resolution**: [Fill in after build, e.g., optimized mock server response time and reduced prompt context size]
- **Issue**: STT misrecognition of Hindi digits for Verification Code.
  **Resolution**: [Fill in after build, e.g., updated system prompt to ask user to say digits slowly, or enabled Deepgram numeric formatting]
- **Issue**: Tool-call race conditions.
  **Resolution**: [Fill in after build, e.g., enforced strict transition rules in system prompt]

## Future Improvements
- **CRM Integration**: Replace the mock server with real API calls to Kapture Finance's system of record.
- **PII Protection**: Implement redaction/encryption of PII before logging transcripts to standard logging sinks.
- **Live Language Detection**: Use dedicated endpoints to switch STT models on the fly instead of relying entirely on a multi-language generic model, if accuracy drops.
- **Human-in-the-Loop**: Send escalations to a live agent queue via SIP transfer.
- **Automated Evals**: Scale testing by running `tests/test_cases.json` as simulated conversations against the Vapi API, using an LLM-as-a-judge to score the transcripts automatically.

## Demo
- **Loom Recording**: https://drive.google.com/file/d/14E_6JQg7KbxXbq-5fPAIXyMNVvTsGnhn/view?usp=sharing, https://drive.google.com/file/d/15Gu-EWBAJ5KkGUyyREg4VL8i8WuuqO9O/view?usp=sharing
- **Vapi Call Link**: [Insert Vapi Link Here]
