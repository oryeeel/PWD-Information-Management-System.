# IPROG SMS demo

This integration sends a real SMS from the local backend to the contact number on one selected PWD record. It requires internet access, approved IPROG verification and available SMS credits. No Android gateway or paid web hosting is needed.

1. Register at https://www.iprogsms.com/ and complete student verification. Check your dashboard for free credits and approved message requirements. Free credits and network support are controlled by IPROG.
2. Obtain your API token from IPROG. Keep it private; do not put it in React code or send it in chat.
3. Add these settings to the existing `backend/.env`, preserving `MONGODB_URI`:

   ```dotenv
   IPROG_API_TOKEN=your_private_token
   ```

   Use a Philippine mobile format such as `09XXXXXXXXX` or `639XXXXXXXXX`. Confirm your number's network is supported by your sender setup; Globe/TM and DITO are documented shared-sender options. Smart/TNT may need additional approval.
4. Enter your real demo phone number as one demo record's contact number in the system. No SMS_DEMO_PHONE setting is required. Use fictional personal details for the demo record.
5. From `backend`, run `node server.js`. From `pwd-information-frontend`, run `npm.cmd run dev`. Open the frontend on localhost and sign in as Staff.
6. Open Send a Message, choose only the demo record, enter a short approved reminder, and click Send Now. This consumes real credits. Long messages and provider-added headers can consume more than one credit.
7. An accepted submission appears in the Queued tab with a provider message ID saved in browser history. Queued is not proof of delivery. Confirm receipt on the phone and check the IPROG dashboard. Status is not automatically synchronized to this application.

The backend allows only local requests and one selected recipient per send, and limits submissions to one per minute. It never retries automatically. If a request times out or fails ambiguously, check IPROG history before retrying; it may already have accepted the message. Drafts do not send SMS. Restarting the backend resets the cooldown.

This is a local demonstration integration. The application's login is browser-based, so the local restriction and recipient limit are not a replacement for production server authentication. Keep the backend off public hosting until server authentication is implemented.

Verification, dashboard signup and the first live send are manual steps. Automated tests mock the provider and do not use credits or deliver messages.

API reference: https://www.iprogsms.com/api/v1/documentation
