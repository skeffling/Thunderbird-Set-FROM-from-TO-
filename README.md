# Set FROM: from TO:

A Thunderbird addon for catch-all mailbox users.

When you reply to an email, this addon automatically sets the From address to the address the email was originally sent to, instead of your default account address.

For example, if someone sends an email to `sales@yourdomain.com` and you have a catch-all mailbox, normally your reply would come from `you@yourdomain.com`. This addon changes the From to `sales@yourdomain.com` so the reply comes from the same address.

It only does this when the recipient address matches the domain of one of your configured Thunderbird identities.

## Install
https://addons.thunderbird.net/en-US/thunderbird/addon/set-from-from-to/

## Features

- Automatically sets the From address when replying
- Only changes the email address, keeps your display name
- Revert button in the compose toolbar to switch back to your default address (only appears when the From was changed)

## Permissions

- **compose** - to read and modify the From address in the compose window
- **messagesRead** - to read the original email's recipients
- **accountsRead** - to look up your configured identities and domains

## Requirements

Thunderbird 128 or later.
