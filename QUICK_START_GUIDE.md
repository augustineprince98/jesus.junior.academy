# Jesus Junior Academy - Quick Start Guide

## 🌐 YOUR WEBSITE IS LIVE!

**Open your browser and visit:** http://localhost:3000

---

## 🔑 LOGIN CREDENTIALS

### ADMIN (Try this first!)
```
Phone: 9999999999
Password: admin123
```
**Access:** Admin Panel + Full System

### TEACHER
```
Phone: 8888888888
Password: teacher123
```
**Access:** Staff Room, Attendance, Homework

### PARENT
```
Phone: 7777777777
Password: parent123
```
**Access:** Child's Fees, Homework, Results

### STUDENT
```
Phone: 6666666666
Password: student123
```
**Access:** Homework, Results, Attendance

---

## 📱 HOW TO TEST

### 1. PUBLIC HOMEPAGE (No Login)
**URL:** http://localhost:3000

**What to check:**
- Hero section with school name & tagline
- About the School section
- Achievers Club (will be empty until you add data)
- Activities & Celebrations (will be empty until you add data)
- Admission Enquiry Form - **Try submitting!**
- Footer with contact info

### 2. LOGIN
**URL:** http://localhost:3000/login

**Test flow:**
1. Enter phone: 9999999999
2. Enter password: admin123
3. Click "Enter"
4. You'll be redirected to the 3D Digital Campus!

### 3. DIGITAL CAMPUS
**URL:** http://localhost:3000/campus (auto-redirect after login)

**What you'll see:**
- 3D campus scene with buildings
- Click on buildings to explore
- Header with user name and role
- Navigation system

**Try different roles:**
- Logout and login as Teacher, Parent, or Student
- Each role sees different buildings/features

### 4. ADMIN PANEL
**URL:** http://localhost:3000/admin

**Requirements:** Must be logged in as admin

**What you'll see:**
- Dashboard with statistics
- Sidebar navigation:
  - Dashboard
  - Achievements
  - Events & Activities
  - Admission Enquiries
  - User Management
  - Settings

**Current Status:**
- ✅ Layout & Navigation working
- ✅ Backend APIs ready
- ⏳ Content management UI pending

---

## 📊 API DOCUMENTATION

### Interactive API Docs
**URL:** http://localhost:8000/docs

**Features:**
- Try all API endpoints
- See request/response schemas
- Test authentication

### Health Check
**URL:** http://localhost:8000/health

Should show:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "database": "connected"
}
```

---

## 🎨 SEE DIFFERENT USER VIEWS

### Test Flow Example:

**1. As a Visitor (No Login):**
- Go to http://localhost:3000
- See public homepage
- Try admission enquiry form

**2. As Admin:**
- Login: 9999999999 / admin123
- Go to /admin
- See admin dashboard
- Navigate admin sections

**3. As Parent:**
- Logout (click user menu → Logout)
- Login: 7777777777 / parent123
- See campus from parent perspective
- Access Accounts Office, Library

**4. As Student:**
- Logout
- Login: 6666666666 / student123
- See campus from student perspective
- Access Classroom, Library, Notice Board

---

## 🚀 SERVERS INFO

**Both servers are running in background:**

**Frontend (Next.js):**
- Port: 3000
- URL: http://localhost:3000

**Backend (FastAPI):**
- Port: 8000
- URL: http://localhost:8000
- Docs: http://localhost:8000/docs

**To Stop Servers:**
Press Ctrl+C in the terminal windows

**To Restart:**
```bash
# Backend
cd C:\projects\school-website\backend
python -m uvicorn app.main:app --reload

# Frontend
cd C:\projects\school-website\frontend
npm run dev
```

---

## 📝 WHAT TO TRY

1. **Submit Admission Enquiry**
   - Go to homepage
   - Scroll to Admission section
   - Fill form and submit
   - Check success message

2. **Explore as Different Users**
   - Login as each role
   - See different views
   - Check role-based access

3. **Check Admin Panel**
   - Login as admin
   - Go to /admin
   - Explore navigation

4. **Test Mobile View**
   - Resize browser window
   - Check responsiveness

---

## 📁 PROJECT FILES

**Full Summary:** `C:\projects\school-website\PROJECT_SUMMARY.md`

**Key Locations:**
- Frontend: `C:\projects\school-website\frontend`
- Backend: `C:\projects\school-website\backend`
- Database Scripts: `backend\create_test_users.py`

---

## ⚠️ KNOWN ISSUES

1. **Bambi Font:**
   - Custom font not loading (technical issue)
   - Using Georgia serif as fallback
   - School name still looks good!

2. **Empty Sections:**
   - Achievers Club - No data yet
   - Activities - No events yet
   - Add data via admin panel (once UI is built)

---

## ✅ NEXT STEPS

After testing, you can:

1. **Build Admin UI Pages**
   - Achievements management
   - Events management
   - Admissions management
   - User management

2. **Add Content**
   - Create sample achievements
   - Create sample events
   - Update About section text

3. **Customize**
   - Change colors in `tailwind.config.js`
   - Update content in component files
   - Add more features

---

## 🆘 NEED HELP?

**Check API Docs:** http://localhost:8000/docs

**Read Full Summary:** PROJECT_SUMMARY.md

**Common Issues:**

**Can't connect to localhost:3000**
- Check if frontend server is running
- Try: `cd frontend && npm run dev`

**Can't login**
- Check if backend server is running
- Verify credentials (see above)
- Check http://localhost:8000/health

**Database errors**
- Run: `cd backend && alembic upgrade head`
- Run: `cd backend && python create_test_users.py`

---

**Happy Testing! 🎉**

Your school website is ready to explore!
