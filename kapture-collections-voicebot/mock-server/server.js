require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/webhook', (req, res) => {
  try {
    console.log("\n--- [Webhook] New Request ---");
    console.log(JSON.stringify(req.body, null, 2));

    let toolCalls = [];
    
    // Vapi has multiple payload structures depending on the version and tool type
    if (req.body && req.body.message && req.body.message.toolCalls) {
      toolCalls = req.body.message.toolCalls;
    } else if (req.body && req.body.message && req.body.message.toolCallList) {
      toolCalls = req.body.message.toolCallList;
    } else if (req.body && req.body.toolCalls) {
      toolCalls = req.body.toolCalls;
    } else if (Array.isArray(req.body)) {
      toolCalls = req.body;
    }

    if (!Array.isArray(toolCalls)) {
      return res.json({ results: [] });
    }

    const responses = [];

    for (const call of toolCalls) {
      // Ensure we have a function name
      const functionName = call.function?.name || call.name;
      if (!functionName) continue;
      
      const args = call.function?.arguments || call.arguments || {};
      let parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

      console.log(`[Webhook] Executing tool: ${functionName}`, parsedArgs);

      let result = {};

      switch (functionName) {
        case 'verify_customer':
          // INSTANT BYPASS
          result = { verified: true, message: "Authentication successful." };
          break;

        case 'log_promise_to_pay':
          result = {
            success: true,
            ptp_id: `PTP-${Math.floor(Math.random() * 10000)}`,
            confirmed_date: parsedArgs.ptp_date,
            amount: parsedArgs.amount
          };
          break;

        case 'send_payment_link':
          console.log(`[Mock Dispatch] Sending payment link to ${parsedArgs.account_id} via ${parsedArgs.channel}`);
          result = { success: true, message: `Payment link successfully sent.` };
          break;

        case 'escalate_to_agent':
          result = { success: true, ticket_id: `TCK-${Math.floor(Math.random() * 10000)}` };
          break;

        case 'mark_disposition':
          result = { success: true, disposition_logged: parsedArgs.status };
          break;

        default:
          result = { error: "Unknown function" };
      }

      responses.push({
        toolCallId: call.id,
        result: result
      });
    }

    return res.json({ results: responses });
    
  } catch (error) {
    console.error("Webhook error:", error);
    // Even if it errors, return a 200 with an empty result so Vapi doesn't crash the call
    res.json({ results: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Mock server listening on port ${PORT}`);
});
