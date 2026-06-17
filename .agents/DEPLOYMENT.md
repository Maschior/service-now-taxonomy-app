# Production Deployment Guide

## Environment Variables

### Server (.env)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: development or production
- `CORS_ORIGIN`: Frontend URL for CORS

### Example MongoDB URIs
- Local: `mongodb://localhost:27017/taxonomy-app`
- MongoDB Atlas: `mongodb+srv://user:password@cluster.mongodb.net/taxonomy-app`

## Deployment Options

### Option 1: Railway (Recommended for quick setup)
1. Push code to GitHub
2. Connect Repository on Railway.app
3. Set environment variables
4. Deploy

### Option 2: Render.com
1. Create new Web Service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Option 3: Docker on your own server
```bash
docker-compose up -d
```

### Option 4: Vercel (Frontend) + Railway/Render (Backend)
1. Deploy frontend to Vercel
2. Deploy backend to Railway/Render
3. Update CORS_ORIGIN in backend
4. Update API URL in frontend .env

## Database Backup

### MongoDB Atlas (Recommended for production)
- Automatic backups included
- Free tier available

### Manual Backup
```bash
mongodump --uri="mongodb://localhost:27017/taxonomy-app" --out=./backup
```

## Performance Optimization

- Enable MongoDB indexing (already configured in Mongoose schemas)
- Use CDN for frontend assets
- Enable GZIP compression on server
- Consider caching for frequently accessed data

## Security Checklist

- [ ] Use strong MongoDB credentials
- [ ] Enable HTTPS in production
- [ ] Restrict CORS origins
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Set up rate limiting (optional)
