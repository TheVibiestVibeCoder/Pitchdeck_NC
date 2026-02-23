# Pitchdeck NC (PHP)

PHP-based viewer/admin pitchdeck app for deployment on a standard web host.

- Viewer: `/` (`index.php`)
- Admin: `/admin.php`
- API: `/api/deck.php`, `/api/auth.php`

## Setup

1. Copy `.env.example` to `.env`
2. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`
3. Upload/deploy the repository to your PHP server
4. Ensure `data/deck.json` is writable by your PHP process

## Structure

- `index.php`: read-only viewer page
- `admin.php`: admin login + editor page
- `api/deck.php`: read/write deck JSON
- `api/auth.php`: auth status/login/logout
- `includes/bootstrap.php`: env/session/json helpers
- `includes/deck.php`: deck load/save/normalize logic
- `assets/css/*`: design tokens + shared/page styles
- `assets/js/*`: shared API/utils + viewer/admin scripts
- `data/deck.json`: persisted deck data
- `.htaccess`: Apache defaults (`index.php` priority + `.env` protection)
