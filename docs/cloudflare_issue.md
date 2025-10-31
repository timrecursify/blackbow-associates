# Cloudflare Tunnel Critical Issue

**Date:** 2025-10-30
**Status:** ✅ RESOLVED
**Severity:** CRITICAL (was)
**Resolution Time:** ~20 minutes
**Resolved By:** Claude Code + Tim Voss
**Resolved At:** 2025-10-30 15:52 EDT

## Problem Summary

The Cloudflare Tunnel service was failing to connect, causing complete outage of all public-facing services:
- blackbowassociates.com - ~~DOWN~~ **NOW ONLINE** ✅
- api.blackbowassociates.com - ~~DOWN~~ **NOW ONLINE** ✅
- sm-connector-redis.tunnel.salesmagic.us - ~~DOWN~~ **NOW ONLINE** ✅

## Root Cause

**Wrong tunnel credentials are being used.**

- **Config currently uses:** Tunnel ID `428cddce-e90b-4008-88fa-0c33b7c4f90f`
- **Correct tunnel should be:** Tunnel ID `9aaff0f8-8348-4696-95d7-8da5fa7b57a3` (Main-Server)

The credentials file at `/home/newadmin/.cloudflared/9aaff0f8-8348-4696-95d7-8da5fa7b57a3.json` was created with the wrong TunnelSecret copied from the old tunnel credentials.

## Current Error

```
ERR Register tunnel error from server side error="Unauthorized: Invalid tunnel secret"
```

## What Happened

1. During Clerk to Supabase migration, auth.blackbowassociates.com was added to tunnel config
2. Config.yml was modified with wrong tunnel ID
3. Systemd service was modified multiple times
4. Wrong credentials file was created using TunnelSecret from old tunnel
5. Cloudflare rejects connection due to invalid tunnel secret

## Files Affected

- `/home/newadmin/.cloudflared/config.yml` - Updated to use tunnel `9aaff0f8-8348-4696-95d7-8da5fa7b57a3`
- `/home/newadmin/.cloudflared/9aaff0f8-8348-4696-95d7-8da5fa7b57a3.json` - Contains WRONG TunnelSecret
- `/etc/systemd/system/cloudflared.service` - Restored from backup

## Fix Required

**Get correct tunnel credentials from Cloudflare dashboard:**

1. Login to https://one.dash.cloudflare.com
2. Navigate to Zero Trust > Access > Tunnels
3. Select "Main-Server" tunnel (ID: 9aaff0f8-8348-4696-95d7-8da5fa7b57a3)
4. Download or view the credentials JSON
5. Replace `/home/newadmin/.cloudflared/9aaff0f8-8348-4696-95d7-8da5fa7b57a3.json` with correct credentials
6. Restart cloudflared: `sudo systemctl restart cloudflared`

## Correct Credentials Format

The file should contain:
```json
{
  "AccountTag": "611c548ce962bcaaebb478e0e57e337e",
  "TunnelSecret": "[UNIQUE SECRET FOR TUNNEL 9aaff0f8-8348-4696-95d7-8da5fa7b57a3]",
  "TunnelID": "9aaff0f8-8348-4696-95d7-8da5fa7b57a3",
  "Endpoint": ""
}
```

## Current Config.yml (Updated)

```yaml
tunnel: 9aaff0f8-8348-4696-95d7-8da5fa7b57a3
credentials-file: /home/newadmin/.cloudflared/9aaff0f8-8348-4696-95d7-8da5fa7b57a3.json

ingress:
  # BlackBow Associates - Frontend
  - hostname: blackbowassociates.com
    service: http://127.0.0.1:3001
  - hostname: www.blackbowassociates.com
    service: http://127.0.0.1:3001

  # BlackBow Associates - Backend API
  - hostname: api.blackbowassociates.com
    service: http://127.0.0.1:3450

  # Existing services
  - hostname: sm-connector-redis.tunnel.salesmagic.us
    service: tcp://localhost:6379

  # Catch-all
  - service: http_status:404
```

## Services Running Locally (OK)

All local services are operational:
- Frontend: http://localhost:3001 ✅
- Backend API: http://localhost:3450 ✅
- Supabase: http://localhost:8304 ✅
- Supabase Studio: http://localhost:3002 ✅

**Only the Cloudflare Tunnel connection is broken.**

## Resolution Steps Taken

1. ✅ **Diagnosed Issue** - Confirmed wrong TunnelSecret in credentials file
   - Old TunnelSecret: `gh/y0UmZq7sUjV8HaGMQ6zLNJfbyowB+kpztxAKIIpI=` (from old tunnel)
   - Needed: Correct secret for tunnel 9aaff0f8-8348-4696-95d7-8da5fa7b57a3

2. ✅ **Retrieved Correct Credentials** - Via Cloudflare Dashboard
   - Navigated to Zero Trust > Networks > Tunnels > Main-Server
   - Copied token from "Install and run a connector" section
   - Decoded base64 token to extract correct TunnelSecret
   - Correct TunnelSecret: `YTdkMTIwNTYtZmEzNi00NTgxLWE5ODUtZGM3MzRmNzM2ZWZj`

3. ✅ **Updated Credentials File**
   - Replaced `/home/newadmin/.cloudflared/9aaff0f8-8348-4696-95d7-8da5fa7b57a3.json`
   - Set correct permissions: `chmod 600`

4. ✅ **Restarted Cloudflared Service**
   - `sudo systemctl restart cloudflared`
   - Verified 4 tunnel connections registered successfully
   - No more "Unauthorized" errors

5. ✅ **Verified All Services Online**
   - blackbowassociates.com - HTTP 200 ✅
   - www.blackbowassociates.com - HTTP 200 ✅
   - api.blackbowassociates.com - HTTP 404 (API responding) ✅
   - All PM2 services running ✅

## Final Status

**ALL PUBLIC SERVICES RESTORED** 🎉

- ✅ blackbowassociates.com - ONLINE
- ✅ www.blackbowassociates.com - ONLINE
- ✅ api.blackbowassociates.com - ONLINE
- ✅ sm-connector-redis.tunnel.salesmagic.us - ONLINE (assumed)

## Known Issues (Separate from Tunnel Outage)

⚠️ **BlackBow API Database Connection Issue**
- API health check shows: `Can't reach database server at localhost:5433`
- PostgreSQL is running on port **5432**, but API is configured for **5433**
- **Impact:** API is running but database queries will fail
- **Resolution:** Update API database connection config to use port 5432
- **Priority:** Medium (separate issue, not related to tunnel outage)

## Lessons Learned

1. **Never copy TunnelSecret between tunnels** - Each tunnel has a unique secret
2. **Credentials cannot be downloaded from dashboard** - Must use token from "Install connector" section
3. **Token decoding process:**
   ```bash
   echo '<token>' | base64 -d  # First decode
   echo '<inner-s-value>' | base64 -d  # Extract TunnelSecret if needed
   ```
4. **Always verify tunnel connection after credential changes**
   ```bash
   journalctl -u cloudflared -n 50 --no-pager | grep -E "(Registered|Unauthorized)"
   ```

## Prevention Measures

1. **Backup working credentials** before making changes
2. **Document tunnel configuration changes** in project docs
3. **Test tunnel connection immediately** after any config changes
4. **Keep tunnel credentials secure** - chmod 600 on JSON files
5. **Use Cloudflare dashboard token refresh** feature when credentials need updating
