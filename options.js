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
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const disabledAccounts = [];
  for (const cb of checkboxes) {
    if (!cb.checked) {
      disabledAccounts.push(cb.dataset.accountId);
    }
  }
  await browser.storage.local.set({ disabledAccounts });

  const saved = document.getElementById("saved");
  saved.classList.add("show");
  setTimeout(() => saved.classList.remove("show"), 1500);
}

loadOptions();
