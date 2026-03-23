# FalconHacks 2026 App

This project is now configured to run as a single production Node.js service.

## Stack

- Frontend: Vite app built into `dist/`
- Backend: Express server in `server/index.js`
- Production mode: Express serves API routes and static frontend on one port

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_MAGIC_HOUR_API_KEY=your_magic_hour_key
APIFY_TOKEN=your_apify_token
PORT=3000
```

Notes:

- `VITE_MAGIC_HOUR_API_KEY` is used by the frontend bundle.
- `APIFY_TOKEN` is used by the backend `/api/scrape/:handle` endpoint.

## Local Development

```bash
npm install
npm run dev
```

This starts:

- Backend on `http://localhost:3000`
- Vite frontend on `http://localhost:5173`

Vite proxies `/api/*` to the backend in development.

## Production (Single Process)

```bash
npm install
npm run build
npm start
```

Visit `http://<server-ip>:3000`.

## Deploy to AWS EC2 (Ubuntu)

1. Launch EC2 instance
- Ubuntu 22.04+ recommended
- Security Group inbound:
	- `22` (SSH) from your IP
	- `80` (HTTP) from anywhere
	- `443` (HTTPS) from anywhere

2. SSH to EC2

```bash
ssh -i /path/to/key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

3. Install Node.js 20 + Nginx + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
```

4. Upload app and install deps

```bash
git clone <your-repo-url>
cd FalconHacks_2026
npm install
```

5. Add production env

```bash
cat > .env << 'EOF'
VITE_MAGIC_HOUR_API_KEY=your_magic_hour_key
APIFY_TOKEN=your_apify_token
PORT=3000
EOF
```

6. Build + run with PM2

```bash
npm run build
pm2 start npm --name falconhacks -- start
pm2 save
pm2 startup
```

7. Configure Nginx reverse proxy

```bash
sudo tee /etc/nginx/sites-available/falconhacks > /dev/null << 'EOF'
server {
		listen 80;
		server_name YOUR_DOMAIN_OR_IP;

		location / {
				proxy_pass http://127.0.0.1:3000;
				proxy_http_version 1.1;
				proxy_set_header Upgrade $http_upgrade;
				proxy_set_header Connection 'upgrade';
				proxy_set_header Host $host;
				proxy_set_header X-Real-IP $remote_addr;
				proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
				proxy_set_header X-Forwarded-Proto $scheme;
				proxy_cache_bypass $http_upgrade;
		}
}
EOF

sudo ln -s /etc/nginx/sites-available/falconhacks /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

8. Add HTTPS (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Health Check

- `GET /api/health` should return `{ "status": "ok" }`

## Important Security Note

If any API keys were committed to source history, rotate them immediately in provider dashboards before going live.