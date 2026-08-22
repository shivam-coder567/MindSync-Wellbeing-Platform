/**
 * Browser-side boundary for account deletion.
 *
 * Removing a Supabase Auth user needs an elevated server credential, so this
 * module deliberately does not contain deletion logic or an admin key. The
 * configured endpoint must authenticate the supplied user token and perform
 * the deletion on a trusted server or Supabase Edge Function.
 */

export class AccountDeletionUnavailableError extends Error {
  constructor() {
    super(
      "Secure account deletion has not been configured for this app yet. Please contact MindSync support.",
    );
    this.name = "AccountDeletionUnavailableError";
  }
}

type AccountDeletionResponse = {
  deleted?: boolean;
  error?: string;
};

function getErrorMessage(response: AccountDeletionResponse | null) {
  return response?.error || "Your account could not be deleted. Please try again.";
}

/**
 * Calls a trusted deletion endpoint. A successful HTTP response is accepted
 * only when it explicitly confirms that the deletion completed.
 */
export async function deleteAuthenticatedAccount(accessToken: string) {
  const endpoint = import.meta.env.VITE_ACCOUNT_DELETION_ENDPOINT;

  if (!endpoint) {
    throw new AccountDeletionUnavailableError();
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  let result: AccountDeletionResponse | null = null;

  try {
    result = (await response.json()) as AccountDeletionResponse;
  } catch {
    // A non-JSON response is not a valid success acknowledgement.
  }

  if (!response.ok || result?.deleted !== true) {
    throw new Error(getErrorMessage(result));
  }
}
