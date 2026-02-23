---
name: sudo-auth
description: Handle sudo authentication via NFC Keystone hardware key. Use when running commands that require root/sudo privileges, when sudo password is needed, or when a command fails with permission denied. Trigger phrases include "sudo", "root", "permission denied", "need password", "run as root", "install package", "systemctl".
---

# Sudo Authentication via NFC Keystone

When you need to run a command with `sudo`, follow this flow:

## Step 1: Get the password

Call the MCP tool `nfc_get_sudo_password`. It checks if the physical NFC Keystone is inserted and returns the decrypted sudo password.

## Step 2: Use the password

Pick whichever pattern fits the command:

- **Standard**: `echo '<password>' | sudo -S <command>`
- **Write to file**: `echo '<password>' | sudo -S tee /path/to/file > /dev/null`
- **Pipe chain**: `<command> | echo '<password>' | sudo -S tee /path`
- **Multiple commands**: `echo '<password>' | sudo -S bash -c '<cmd1> && <cmd2>'`
- **Suppress sudo stderr**: `echo '<password>' | sudo -S <command> 2>&1`

Always use `sudo -S` (read password from stdin) — never bare `sudo`.

## Step 3: If Keystone is not inserted

The MCP tool will return `"error": "keystone_not_present"`. When this happens, use AskUserQuestion to let the user choose:

- **Option A**: "Insert Keystone and retry" — user plugs in the physical key, you retry the MCP call
- **Option B**: "Enter password manually" — user types the password, you use it
- **Option C**: "Run it yourself" — you show the command, user runs it manually

## Rules

- **Never** store the password in files, CLAUDE.md, or memory
- **Never** use bare `sudo` without `-S` — it will hang waiting for TTY input
- **Always** call the MCP tool fresh each time — don't cache the password across commands
- The password is session-ephemeral: it exists only in your context and disappears when the session ends
