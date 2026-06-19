# Pinning the Extension Key (stable ID for OAuth)

Unpacked / self-hosted extensions get a **new extension ID every reinstall**, and
Google OAuth is bound to the extension ID. To keep a **stable ID from day 1**, we
pin a public `key` in `manifest.json`.

## 1. Generate a private key + public key

```bash
# Generate a 2048-bit private key (keep this secret, NEVER commit it)
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem

# Derive the base64 public key string for manifest.json
openssl rsa -in key.pem -pubout -outform DER 2>/dev/null | openssl base64 -A
```

## 2. Paste into the manifest

Replace the placeholder in `src/manifest.json`:

```json
"key": "<paste-the-base64-output-here>"
```

## 3. Notes

- `key.pem` is already in `.gitignore` — keep it private. It's used to pack a
  `.crx` whose ID matches the pinned `key`.
- With a fixed ID you can register the Google OAuth client once and it keeps
  working across reinstalls.
- Self-hosted `.crx` auto-updates via `update_url` also rely on this stable ID.
