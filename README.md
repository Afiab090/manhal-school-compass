# Manhal School Compass

# Role & Objective

You are an expert Full-Stack Developer and UI/UX Designer. I am a non-coder project manager. Do NOT ask me to write or edit code manually—you must create, write, and update all files directly in the workspace. 



Your task is to build a complete, mobile-first School Management & E-Learning Progressive Web Application (PWA) MVP for **"مدرسة المنهل الثانوية الخاصة" (Al-Manhal Private Secondary School)**. 



The app must combine the **exact visual identity** of the attached `موقع مدرسة المنهل الثانوية الخاصة.html` file with the **mobile app layout, icon-grid architecture, and features** of the "eSchool" (المدرسة الإلكترونية - `com.creative.eschool`) mobile application.



---



# 1. Visual Identity & Design System (Strictly from the attached HTML)

- **Language & Direction:** 100% Arabic interface, strictly Right-to-Left (`dir="rtl"`, `lang="ar"`).

- **Logo:** Extract and reuse the exact Base64 `data:image/png;base64,...` logo from the attached HTML file.

- **Typography:** Load and use Google Fonts `'Amiri'` for headings/titles and `'Tajawal'` for body text, buttons, and UI controls.

- **Color Palette (CSS Variables):**

  - **Light Mode:** `--bg: #f7f3ea`, `--surface: #fffdf8`, `--text: #14233f`, `--muted: #55607a`, `--navy: #14315e`, `--gold: #b8924a`, `--line: #e3d9c3`, `--hero-bg: #10284d`, `--hero-text: #f6efde`.

  - **Dark Mode Support:** Include a toggle in the top header using `--bg: #0b1730`, `--surface: #12254a`, `--text: #f2ecdd`, `--muted: #b4bdd0`, `--navy: #d9b26a`, `--gold: #d9b26a`, `--line: #26396a`, `--hero-bg: #0a1a38`.



---



# 2. UI/UX & Iconography (eSchool App Style)

- **Icon Library:** Integrate **Lucide Icons** or **FontAwesome 6** (via CDN) to provide clean, modern vector icons for every feature card, status badge, and navigation tab.

- **App-Like Mobile Layout:**

  - **Top App Bar:** Sticky header with school logo, user greeting/role badge, notification bell icon (with unread dot), and Dark/Light mode toggle.

  - **Quick-Action Icon Grid (eSchool Core UI):** On the dashboard, display a 2x3 or 3x3 responsive grid of interactive cards with Gold/Navy icons for quick access to:

    1. **الجداول الدراسية** (Timetable - Calendar/Clock icon)

    2. **الرسوم الدراسية** (Tuition Fees - Wallet/Receipt icon)

    3. **الإعلانات واللوائح** (Announcements & Rules - Megaphone/Shield icon)

    4. **الواجبات والدروس** (Homework & E-Learning - BookOpen/FileText icon)

    5. **الحضور والغياب** (Attendance - UserCheck icon)

    6. **التقويم والامتحانات** (Exams & Academic Calendar - Award/CalendarCheck icon)

  - **Bottom Navigation Bar (Mobile) / Sidebar (Desktop):** Fixed bottom navigation for mobile screens with 5 tabs: الرئيسية (Home), الجدول (Schedule), الرسوم (Fees), الإعلانات (Notices), حسابي (Profile).



---



# 3. Core MVP Modules & Role-Based Views



Build a unified Single-Page Application (SPA) with smooth view switching and pre-populated realistic Arabic mock data (and ready for Supabase integration) covering 4 views:



### A. Public Landing & Login Portal (البوابة العامة وتسجيل الدخول)

- Keep the public landing page sections from the attached HTML (Hero, عن المدرسة, المراحل التعليمية, آخر الأخبار, تواصل معنا) accessible for visitors.

- Enhance the **البوابة الإلكترونية (Login Box)** to support 3 roles via tabs: **طالب / ولي أمر (Student/Parent)**, **معلم (Teacher)**, and **الإدارة (Admin)**.

- Provide **"Quick Demo Login" buttons** (دخول سريع للتجربة كطالب / كمعلم / كمدير) so I can test all 3 dashboards immediately with one click.



### B. Student / Parent Dashboard (لوحة الطالب وولي الأمر)

1. **Student Profile Card:** Name, Academic ID (الرقم الأكاديمي), Grade/Class (مثلاً: المرحلة الثانوية - الصف الثالث أ), and Attendance rate badge (نسبة الحضور 96%).

2. **Tuition & Fees Module (الرسوم الدراسية):**

   - Financial summary cards: إجمالي الرسوم (Total Fees), المبلغ المدفوع (Paid), المبلغ المتبقي (Remaining Balance), وتاريخ القسط القادم (Next Due Date) with a visual progress bar.

   - Installment history table (سجل الأقساط والإيصالات).

   - **"إرفاق إشعار دفع" (Upload Payment Receipt):** A modal/form allowing the student/parent to input transaction reference and upload a receipt image for accounting review.

3. **Interactive Class Timetable (الجدول الدراسي):**

   - Day-by-day tabs (الأحد to الخميس) showing periods (الحصة الأولى to السابعة), Subject name, Teacher name, and Room/Time.

4. **Announcements & School Regulations (الإعلانات واللوائح المدرسية):**

   - Filterable feed: الكل (All), إعلانات هامة (Urgent), اللوائح والضوابط (School Rules & Bylaws), الأنشطة (Activities).

5. **Homework & E-Learning (الواجبات والمقررات):**

   - List of active assignments with due dates and downloadable study notes.



### C. Teacher Dashboard (لوحة المعلم)

1. **Teacher Schedule:** Today's classes and assigned sections.

2. **Attendance Recording (رصد الغياب):** Select a class/section and toggle student statuses (حاضر / غائب / متأخر).

3. **Post Homework / Notice (إرسال واجب أو تنبيه):** Form to publish a new assignment or class announcement to a specific grade.



### D. Admin Dashboard (لوحة الإدارة)

1. **Quick Stats:** Total students, teachers, fee collection percentage, and active notices.

2. **Manage Announcements & Rules:** Form to add/delete school announcements and update school regulations (اللوائح).

3. **Manage Student Fees:** Table of students where Admin can update paid amounts or approve uploaded payment receipts.

4. **Manage Timetables:** Simple interface to add or edit schedule slots.



---



# 4. Technical Architecture & Execution Rules

1. **Zero-Build / Instant Run:** Use clean, modular HTML5, CSS3, and Vanilla JavaScript (or a self-contained setup that runs immediately in the browser preview without complex terminal build errors).

2. **State Persistence:** Use `localStorage` initially pre-seeded with rich Arabic data for Al-Manhal School so that any announcement added by Admin, attendance marked by Teacher, or fee receipt uploaded by Student **immediately reflects across all dashboards**.

3. **Supabase Ready:** Create a clean `db-config.js` file with a documented SQL schema (`schema.sql`) so we can connect Supabase in the next step by just pasting the URL and API Key.



### Action Required Now:

Start immediately by creating/updating the project files to deliver this complete, functional MVP. Make sure all buttons, tabs, modals, and role switches work flawlessly without console errors. When finished, tell me how to preview and test the 3 roles.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://manhal-school-compass.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ffb5035f-8aa0-4eb2-93f9-7ee63f764c14).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
