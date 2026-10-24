# Staff activity history

Admins can open Activity Logs in the sidebar. Staff do not see that link, and the frontend route requires the Admin role. The API rejects requests without an Admin actor in the application's session header.

Successful staff sign-ins/sign-outs, record creation, editing, viewing, archiving/restoration, profile/document photo updates, ID card views and SMS submissions are stored in MongoDB's ActivityLog collection. Failures are not logged as successes. SMS submission means accepted by the provider, not delivered. Logs exclude message bodies, phone numbers, medical details and image data. Automated archive expiry is not attributed to a staff user.

Entries begin when the updated backend and frontend are running. Historical actions cannot be reconstructed. Drafts and other browser-only changes are not included. Refresh loads current logs; filters and pagination run on the backend. Dates use Philippine time.

The current application uses browser-managed accounts and sessions. Staff names and roles in these logs are client-reported, not independently verified on the server. This is an operational history for the existing local application, not a tamper-proof audit trail. Implement server authentication and authorization before exposing these APIs publicly. Database writes made outside the app are not captured. Database logging failures are reported in backend error output.
