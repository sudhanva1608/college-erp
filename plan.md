# Public Internet Deployment Plan

This document outlines the architectural plan and technical steps to deploy the **EduPortal College ERP** to the public internet so it is accessible from anywhere (not just the college Wi-Fi) using a standard domain name (e.g., `erp.college.edu` or a custom domain) and secure HTTPS.

---

## 1. Architecture Overview
To make the application publicly accessible, we can either configure the local lab computer to expose itself to the internet, or deploy the Docker setup to a cloud-hosted Virtual Private Server (VPS). 

```mermaid
graph TD
    subgraph Public Internet
        User[Student / Faculty / Admin Device] -->|HTTPS: Port 443| Domain[erp.mycollege.com]
    end

    subgraph Host Server (Local Lab PC OR Cloud VPS)
        Domain -->|Routes Requests| Nginx[Nginx Reverse Proxy]
        Nginx -->|SSL Termination via Certbot| Nginx
        Nginx -->|Serves Static Files| Frontend[Vite Production Build]
        Nginx -->|Proxies /api| Backend[Express Production Server]
        Backend -->|Queries| Postgres[(PostgreSQL Database)]
    end
```

---

## 2. Choosing a Hosting Strategy

There are two primary methods to make the app accessible over the internet:

### Option A: Local Lab Server with Port Forwarding (Self-Hosted)
This keeps the host machine inside your college lab but exposes it to the public internet.

1. **Public Static IP vs. Dynamic DNS (DDNS):**
   * **Public Static IP (Recommended):** Ask the college's Internet Service Provider (ISP) for a static public IP address.
   * **Dynamic DNS (DDNS):** If the ISP only offers dynamic public IPs (which change on router reboot), configure a DDNS client (like No-IP or DuckDNS) on the server to automatically bind a domain to the current public IP.
2. **Port Forwarding on the Router:**
   * Log in to the college gateway router.
   * Configure **Port Forwarding / NAT** rules:
     * Route incoming public port `80` (HTTP) $\rightarrow$ local server IP port `80`.
     * Route incoming public port `443` (HTTPS) $\rightarrow$ local server IP port `443`.
3. **Pros:** Zero monthly hosting costs.
4. **Cons:** Lab computers suffer from power outages, local network congestion, and security risks (exposing local networks to internet-wide port scanners).

---

### Option B: Cloud Virtual Private Server (VPS) — *Highly Recommended*
Deploy the Docker containers to a secure virtual machine hosted by a cloud provider (e.g., DigitalOcean, AWS, Hetzner, Linode) for $5 to $10 per month.

1. **Infrastructure:** Buy a basic VPS with 2 vCPUs, 2GB–4GB RAM, and 50GB SSD running Ubuntu Server.
2. **DNS Mapping:** Point your custom domain directly to the VPS public IP.
3. **Pros:**
   * **99.9% Uptime:** Unaffected by college power outages or internet disruptions.
   * **Security:** Keep the college's local network isolated.
   * **Performance:** High network bandwidth to support hundreds of students checking results simultaneously.
4. **Cons:** Minor recurring hosting fee ($5-$10/month).

---

## 3. Step-by-Step Public Domain & SSL (HTTPS) Setup

Regardless of whether you choose Option A or Option B, securing student data (including passwords) requires **HTTPS (SSL/TLS)**.

### Step 1: Point Your Domain
1. Purchase a domain name (e.g., `mycollege-erp.com`) or ask your college IT department to create a subdomain (e.g., `erp.college.edu.in`).
2. Add an **A Record** in the DNS provider settings pointing to the server's public IP address:
   ```text
   Type: A  |  Name: erp  |  Value: <your-public-ip>  |  TTL: Automatic
   ```

### Step 2: Nginx with Let's Encrypt SSL
We will configure **Certbot** (by Electronic Frontier Foundation) to automatically provision and renew a free Let's Encrypt SSL certificate.

On the server, we run:
```bash
# Install Certbot and the Nginx plugin
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain and configure the SSL certificate
sudo certbot --nginx -d erp.mycollege.com
```

Certbot will automatically verify ownership of your domain, download the certificates, configure Nginx to listen on port `443` with SSL, and redirect all HTTP traffic to secure HTTPS.

---

## 4. Production configuration changes

To deploy, we will create three production files in the root folder:

### 1. `Dockerfile.prod` (Backend)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 5001
CMD ["node", "dist/server.js"]
```

### 2. `nginx.conf`
```nginx
events { worker_connections 1024; }

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name erp.mycollege.com;
        return 301 https://$host$request_uri; # Redirect HTTP to HTTPS
    }

    server {
        listen 443 ssl;
        server_name erp.mycollege.com;

        ssl_certificate /etc/letsencrypt/live/erp.mycollege.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/erp.mycollege.com/privkey.pem;

        # Serve Frontend
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # Proxy Backend API
        location /api {
            proxy_pass http://backend:5001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 5. User Review Required

> [!CAUTION]
> Exposing the server to the internet introduces significant security responsibilities.

* **Intranet/Extranet Firewall:** Install and enable a firewall (`ufw` on Ubuntu) to block all incoming traffic except ports `22` (SSH), `80` (HTTP), and `443` (HTTPS).
* **Database Access:** Under no circumstances should the PostgreSQL port `5432` be forwarded/exposed to the public internet. Ensure it communicates only through the internal Docker network.

---

## 6. Open Questions

1. **College DNS Access:** Does the college IT admin have access to update the college subdomain DNS records?
2. **Hosting Budget:** Is a $5–$10/month budget acceptable to the college to choose the far more reliable Cloud VPS deployment option (Option B)?
