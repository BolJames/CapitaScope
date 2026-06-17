# GlobalVest Subscription System - Deployment Checklist

## ✅ Pre-Deployment Verification

### Database
- [ ] Backup existing database
- [ ] Run migration scripts (schema.sql updates)
- [ ] Verify subscriptions table created with all columns
- [ ] Verify indexes created (idx_subscriptions_*)
- [ ] Run test query: `SELECT * FROM subscriptions LIMIT 1;`

### Backend Setup
- [ ] Verify all files exist:
  - [ ] `backend/models/Subscription.js`
  - [ ] `backend/controllers/subscriptionController.js`
  - [ ] `backend/routes/subscriptions.js`
  - [ ] `backend/server.js` (check for import and route registration)
- [ ] Test backend server starts: `npm start`
- [ ] Test health endpoint: `curl http://localhost:5000/api/health`
- [ ] Test subscription routes accessible (with auth token)

### Frontend Setup
- [ ] Verify files exist:
  - [ ] `frontend/startup-dashboard.html`
  - [ ] `frontend/admin-dashboard.html`
  - [ ] `frontend/css/styles.css`
  - [ ] `frontend/js/startup-subscriptions.js`
  - [ ] `frontend/js/admin-subscriptions.js`
- [ ] Verify HTML files properly load subscription section
- [ ] Verify CSS properly renders subscription cards
- [ ] Verify JS files load without console errors

### Configuration
- [ ] Update `API_BASE` in frontend JS files if needed
- [ ] Verify JWT_SECRET set in backend
- [ ] Configure CORS origins for production URLs
- [ ] Update currency prices if needed (SUBSCRIPTION_PRICES)
- [ ] Verify country-to-currency mapping complete

---

## 🚀 Deployment Steps

### Step 1: Database Migration
```bash
# Connect to PostgreSQL
psql -U postgres -d globalvest

# Run migrations
\i backend/schema.sql

# Verify
SELECT COUNT(*) FROM subscriptions;
```

### Step 2: Backend Deployment
```bash
cd backend

# Install any missing dependencies (if needed)
npm install

# Start server
npm start

# In another terminal, test:
curl -X GET http://localhost:5000/api/health
# Should return: {"status":"OK","time":"..."}
```

### Step 3: Frontend Deployment
```bash
# Ensure frontend is served on your HTTP server
# Update API_BASE in frontend/js/startup-subscriptions.js
# Update API_BASE in frontend/js/admin-subscriptions.js

# Test in browser:
# 1. Navigate to startup-dashboard.html
# 2. Check subscriptions section loads
# 3. Verify plans display with correct pricing
```

### Step 4: Test Full Flow
```bash
1. Create test startup user (or use existing)
2. Login to startup dashboard
3. Navigate to Subscriptions section
4. View plans in different currencies
5. Test subscribe to monthly plan
6. Verify subscription in database:
   SELECT * FROM subscriptions WHERE user_id = YOUR_USER_ID;
7. Login as admin
8. View admin subscriptions dashboard
9. Verify statistics calculated correctly
10. Test filtering and sorting
```

---

## 🔧 Production Checklist

### Security
- [ ] JWT tokens configured
- [ ] CORS properly restricted to production domains
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] Environment variables set (.env file)
- [ ] Database credentials secured
- [ ] API keys (if any) secured in environment

### Performance
- [ ] Database indexes verified
- [ ] Connection pooling configured
- [ ] Caching implemented (if needed)
- [ ] Load testing completed
- [ ] Monitor error logs

### Monitoring
- [ ] Error logging configured
- [ ] Request logging enabled
- [ ] Database monitoring set up
- [ ] Uptime monitoring configured
- [ ] Alert system for failed subscriptions

### Documentation
- [ ] SUBSCRIPTION_SYSTEM.md available to team
- [ ] ARCHITECTURE.md documented
- [ ] API endpoints documented
- [ ] Deployment procedure documented
- [ ] Troubleshooting guide available

---

## 📊 Post-Deployment Verification

### API Endpoints Test
```bash
# Get plans
curl -X GET "http://localhost:5000/api/subscriptions/plans?country=US" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create subscription
curl -X POST "http://localhost:5000/api/subscriptions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"monthly","currency":"USD"}'

# Get current subscription
curl -X GET "http://localhost:5000/api/subscriptions" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin stats
curl -X GET "http://localhost:5000/api/subscriptions/admin/stats" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Database Verification
```sql
-- Check table created
\d subscriptions

-- Verify sample data
SELECT COUNT(*) as total_subscriptions FROM subscriptions;
SELECT plan, COUNT(*) as count FROM subscriptions GROUP BY plan;
SELECT SUM(price) as total_revenue FROM subscriptions WHERE is_active=TRUE;
```

### Frontend Verification
```javascript
// In browser console:

// 1. Check token exists
localStorage.getItem('token')

// 2. Test API call
fetch('http://localhost:5000/api/subscriptions/plans?country=US')
  .then(r => r.json())
  .then(d => console.log(d))

// 3. Check subscription section visible
document.getElementById('subscriptions')
```

---

## 🐛 Troubleshooting Deployment Issues

### Issue: 404 on subscription endpoints
**Solution**:
- [ ] Verify routes registered in server.js
- [ ] Check backend server restarted after code changes
- [ ] Verify correct port (5000)
- [ ] Check CORS not blocking requests

### Issue: Plans not loading
**Solution**:
- [ ] Check network tab for API errors
- [ ] Verify authentication token valid
- [ ] Check backend logs for errors
- [ ] Verify database connection working

### Issue: Subscribe button not working
**Solution**:
- [ ] Check browser console for JS errors
- [ ] Verify token in localStorage
- [ ] Check API response in network tab
- [ ] Verify user role is 'startup'

### Issue: Admin stats showing 0
**Solution**:
- [ ] Verify subscriptions exist in database
- [ ] Check query: `SELECT COUNT(*) FROM subscriptions;`
- [ ] Verify logged in as admin (role='admin')
- [ ] Check backend logs for SQL errors

---

## 📋 Rollback Plan

If issues occur:

```bash
# 1. Stop backend server
Ctrl+C

# 2. Revert database (if major changes)
# Restore from backup or:
DROP TABLE subscriptions CASCADE;

# 3. Revert code changes
# Use git to revert to previous version
git revert HEAD

# 4. Restart backend
npm start
```

---

## 📞 Support & Documentation

- **Full Guide**: See `SUBSCRIPTION_SYSTEM.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Implementation**: See `SUBSCRIPTION_IMPLEMENTATION.md`
- **API Docs**: In `SUBSCRIPTION_SYSTEM.md` under "API Endpoints"

---

## ✨ Success Indicators

✅ Plans load in under 1 second
✅ Subscribe action completes in under 2 seconds
✅ Admin dashboard loads all data in under 3 seconds
✅ No console errors in browser
✅ No server errors in logs
✅ Database queries execute efficiently
✅ All subscription states reflected correctly
✅ Currency conversions accurate

---

## 🎯 Next Steps

1. Test thoroughly in staging environment
2. Get stakeholder approval
3. Schedule deployment window
4. Backup production database
5. Deploy in off-peak hours
6. Monitor for 24 hours
7. Collect user feedback
8. Plan enhancements

---

**Deployment Status**: Ready for Production ✅
**Last Updated**: April 23, 2026
**Version**: 1.0
