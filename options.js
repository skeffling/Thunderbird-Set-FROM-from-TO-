async function loadOptions() {
  const accounts = await browser.accounts.list();
  const { disabledAccounts = [] } = await browser.storage.local.get("disabledAccounts");
  const container = document.getElementById("accounts");

  for (const account of accounts) {
    if (account.type === "none") continue; // skip Local Folders

    const emails = account.identities.map(i => i.email).join(", ");
    const div = document.createElement("div");
    div.className = "account";

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !disabledAccounts.includes(account.id);
    checkbox.dataset.accountId = account.id;
    checkbox.addEventListener("change", saveOptions);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + account.name));

    if (emails) {
      const span = document.createElement("span");
      span.className = "email";
      span.textContent = "(" + emails + ")";
      label.appendChild(span);
    }

    div.appendChild(label);
    container.appendChild(div);
  }
}

async function saveOptions() {
  const checkboxes = document.querySelectorAll('input[data-account-id]');
  const disabledAccounts = [];
  for (const cb of checkboxes) {
    if (!cb.checked) {
      disabledAccounts.push(cb.dataset.accountId);
    }
  }
  await browser.storage.local.set({ disabledAccounts });
  showSaved();
}

function showSaved() {
  const saved = document.getElementById("saved");
  saved.classList.add("show");
  setTimeout(() => saved.classList.remove("show"), 1500);
}

// --- Additional reply domains ---

function normalizeDomain(input) {
  let d = input.trim().toLowerCase();
  if (d.includes("@")) d = d.split("@").pop(); // accept a pasted email address
  d = d.replace(/^\*\./, ""); // strip a wildcard prefix
  d = d.replace(/\.$/, ""); // strip a trailing dot
  return d;
}

function isValidDomain(d) {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d);
}

async function getExtraDomains() {
  const { extraDomains = [] } = await browser.storage.local.get("extraDomains");
  return extraDomains;
}

async function renderDomains() {
  const domains = await getExtraDomains();
  const container = document.getElementById("domains");
  container.textContent = "";

  for (const domain of domains) {
    const row = document.createElement("div");
    row.className = "domain";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = domain;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.textContent = "×";
    remove.title = "Remove " + domain;
    remove.addEventListener("click", () => removeDomain(domain));

    row.appendChild(name);
    row.appendChild(remove);
    container.appendChild(row);
  }
}

async function addDomain(event) {
  event.preventDefault();
  const input = document.getElementById("domain-input");
  const error = document.getElementById("domain-error");
  error.textContent = "";

  const domain = normalizeDomain(input.value);
  if (!domain) return;

  if (!isValidDomain(domain)) {
    error.textContent = "Not a valid domain";
    return;
  }

  const domains = await getExtraDomains();
  if (domains.includes(domain)) {
    error.textContent = "Already added";
    return;
  }

  domains.push(domain);
  await browser.storage.local.set({ extraDomains: domains });
  input.value = "";
  await renderDomains();
  showSaved();
}

async function removeDomain(domain) {
  const domains = await getExtraDomains();
  const next = domains.filter((d) => d !== domain);
  await browser.storage.local.set({ extraDomains: next });
  await renderDomains();
  showSaved();
}

document.getElementById("add-domain").addEventListener("submit", addDomain);

loadOptions();
renderDomains();
