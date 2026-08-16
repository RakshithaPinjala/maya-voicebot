# High-Level Design (HLD): Maya Voicebot for Kapture Finance

## 1. Architecture & Pipeline

### Pipeline Overview
Telephony (SIP/PSTN) → STT (Deepgram Nova-2) → Orchestrator/LLM (GPT-4o-mini) → TTS (Cartesia) → Telephony out.

- **Vapi** acts as the orchestrator.
- **Mock Server** handles webhook/tool calls from Vapi.
- **Datastore** is simulated in the Mock Server (in-memory).

### Latency Budget (Target < 1.2s E2E)
| Component | Estimated Latency |
| :--- | :--- |
| Telephony / Network | ~200ms |
| Speech-to-Text (STT) | ~200ms |
| LLM (First Byte) | ~400ms |
| Text-to-Speech (TTS)| ~300ms |
| **Total** | **~1100ms** |

### Architecture Diagram
*(See System_Architecture.mermaid)*

## 2. Conversation Flow / State Machine

**States:**
1. **INIT**: Call connects. Mandatory disclosure.
2. **AUTH_PENDING**: Asking for verification (DOB/PIN). **LOCK**: Transition to AUTHENTICATED *requires* a successful `verify_customer` tool return. The model cannot bypass this.
3. **AUTHENTICATED**: Debt disclosed. Asking for payment.
4. **NEGOTIATION**: Handling objections, setting PTP.
5. **PTP_COLLECTED**: PTP logged, payment link sent.
6. **ESCALATED**: Handing off to human agent or logging dispute.
7. **CALL_ENDED**: Wrapping up and logging disposition.

## 3. Intents & Entities Table

| Intent | Description | Entities Extracted |
| :--- | :--- | :--- |
| `Confirm_Identity` | User provides code | `Verification_Code` (string) |
| `Promise_To_Pay` | Agrees to pay debt | `PTP_Date` (ISO-8601), `PTP_Amount` (number) |
| `Hardship_Claim` | Cannot pay due to hardship | `Hardship_Reason` (string) |
| `Dispute_Debt` | Claims amount is wrong or not theirs | N/A |
| `Already_Paid` | Claims payment made already | `Payment_Reference` (string), `Date` |
| `Request_DNC` | Do Not Call | N/A |
| `Wrong_Person` | Not the intended customer | N/A |

## 4. Tools / API Specifications

Schemas are detailed in `vapi/tool_definitions.json`.
- `verify_customer`
- `log_promise_to_pay`
- `send_payment_link`
- `escalate_to_agent`
- `mark_disposition`

## 5. Auth & Data Safety Protocols

- **Zero-Disclosure Before Auth**: The LLM prompt explicitly bans words like "overdue", "loan", "EMI", "amount", or "Kapture Finance debt" until the `verify_customer` tool returns `verified: true`.
- **Third-Party Handling**: If an unauthorized person answers, the bot asks for the target customer. If unavailable, it logs disposition and hangs up.
- **PII Masking**: In standard logs (not implemented in this mock but required in production), names and codes are masked (e.g., "Rahul S****").

## 6. Guardrails & Compliance

- **Mandatory Disclosure**: "Hello, this is Maya calling on behalf of Kapture Finance for a personal matter."
- **Calling Window**: Assuming system dialer restricts to 08:00–19:00 local time.
- **No Threats/Harassment**: Low temperature and strict prompt instructions prevent aggressive tone.
- **DNC/Opt-Out**: Instant termination and `mark_disposition` tool call on DNC request.
- **Hallucination/Waiver Limit**: Prompt forbids offering any discount or waiver >10% without escalation.
- **Off-Topic**: Prompt instructs bot to politely redirect back to the debt or hang up after 2 attempts.

## 7. Edge Cases Matrix

| Scenario | Bot Action | End State / Disposition |
| :--- | :--- | :--- |
| Already paid | Acknowledge, ask for date/ref, log | `ALREADY_PAID` |
| Disputes amount | Acknowledge, escalate via tool | `ESCALATED_DISPUTE` |
| Requests DNC | Apologize, log DNC, hang up | `DO_NOT_CALL` |
| Wrong number | Apologize, log wrong number, hang up | `WRONG_PERSON` |
| Voicemail / Silence | Re-prompt 2 times. If no input, hang up. | `NO_INPUT` |
| Abusive caller | Give 1 warning. If repeated, soft hang up. | `ABUSIVE_CALLER` |
| English↔Hindi | Switch language naturally, maintain state. | Variable |

## 8. Observability

**Metrics to Track:**
- Containment Rate (calls concluded without human escalation)
- PTP Rate (promises to pay logged)
- First Call Resolution
- Average Latency per Hop (STT, LLM, TTS)
- Auth-Failure Rate (failed verification)
- Drop Rate (hang up before completion)

**Logging:**
Per-call structured event logs will capture dispositions, tool call success/failure, and timestamps (omitting raw transcript PII).
