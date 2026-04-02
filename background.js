// Set FROM: from TO: - Sets the From address to match the address the original
// email was sent to, as long as it matches a configured identity's domain.
// Perfect for catch-all mailboxes.

// Track tabs where we changed the From, storing the original identityId
const changedTabs = new Map();

function extractEmail(mailboxString) {
  const match = mailboxString.match(/<([^>]+)>/);
  if (match) {
    return match[1].toLowerCase().trim();
  }
  return mailboxString.toLowerCase().trim();
}

function getDomain(email) {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : null;
}

async function getIdentityDomainMap() {
  const { disabledAccounts = [] } = await browser.storage.local.get("disabledAccounts");
  const accounts = await browser.accounts.list();
  const domainMap = {};
  for (const account of accounts) {
    if (disabledAccounts.includes(account.id)) continue;
    for (const identity of account.identities) {
      const domain = getDomain(identity.email.toLowerCase());
      if (domain && !domainMap[domain]) {
        domainMap[domain] = identity;
      }
    }
  }
  return domainMap;
}

function findMatchingRecipient(allRecipients, domainMap) {
  for (const recipientRaw of allRecipients) {
    const email = extractEmail(recipientRaw);
    const domain = getDomain(email);
    if (domain && domainMap[domain]) {
      return { address: email, identity: domainMap[domain] };
    }
  }
  return null;
}

function isReply(type) {
  return type === "reply" || type === "replyAll";
}

async function determineFromAddress(details) {
  if (!details.relatedMessageId) {
    return null;
  }

  const originalMsg = await browser.messages.get(details.relatedMessageId);

  const allRecipients = [
    ...(originalMsg.recipients || []),
    ...(originalMsg.ccList || []),
    ...(originalMsg.bccList || [])
  ];

  const domainMap = await getIdentityDomainMap();
  const match = findMatchingRecipient(allRecipients, domainMap);

  if (!match) {
    return null;
  }

  if (match.address === match.identity.email.toLowerCase()) {
    return null;
  }

  const currentFrom = details.from || "";
  const currentNameMatch = currentFrom.match(/^(.*?)\s*<[^>]+>$/);
  const displayName = currentNameMatch ? currentNameMatch[1].trim() : match.identity.name;
  const fromAddress = displayName
    ? `${displayName} <${match.address}>`
    : match.address;

  return { fromAddress, identity: match.identity };
}

// Compose action button: disabled by default, enabled when we change From
browser.composeAction.disable();

browser.composeAction.onClicked.addListener(async (tab) => {
  const original = changedTabs.get(tab.id);
  if (!original) {
    return;
  }

  await browser.compose.setComposeDetails(tab.id, {
    identityId: original.identityId
  });

  changedTabs.delete(tab.id);
  browser.composeAction.disable(tab.id);
});

browser.tabs.onRemoved.addListener((tabId) => {
  changedTabs.delete(tabId);
});

// Set From when compose window opens
async function handleComposeTab(tabId, retries = 5) {
  try {
    const details = await browser.compose.getComposeDetails(tabId);

    if (!details.type && retries > 0) {
      setTimeout(() => handleComposeTab(tabId, retries - 1), 200);
      return;
    }

    if (!isReply(details.type)) {
      return;
    }

    const result = await determineFromAddress(details);
    if (result) {
      changedTabs.set(tabId, { identityId: details.identityId });
      await browser.compose.setComposeDetails(tabId, { from: result.fromAddress });
      browser.composeAction.enable(tabId);
    }
  } catch (err) {
    console.error("Set FROM: from TO:", err);
  }
}

browser.windows.onCreated.addListener(async (window) => {
  if (window.type !== "messageCompose") {
    return;
  }
  const tabs = await browser.tabs.query({ windowId: window.id });
  for (const tab of tabs) {
    setTimeout(() => handleComposeTab(tab.id), 500);
  }
});

// Set From at send time (fallback)
browser.compose.onBeforeSend.addListener(async (tab, details) => {
  if (!isReply(details.type)) {
    return {};
  }

  if (!changedTabs.has(tab.id)) {
    return {};
  }

  try {
    const result = await determineFromAddress(details);
    if (result) {
      return { details: { from: result.fromAddress } };
    }
  } catch (err) {
    console.error("Set FROM: from TO:", err);
  }

  return {};
});
