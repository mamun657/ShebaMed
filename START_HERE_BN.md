# ShebaMed চালানোর সহজ নিয়ম

এই ZIP-এ Next.js source code, MongoDB/GridFS backend, OCR worker, Groq integration, patient/doctor/admin UI এবং tests আছে। এটি synthetic-data MVP। Production build ও ৩৮টি local test পাস করেছে। তোমার Atlas/Groq account দিয়ে পুরো flow এখানে যাচাই করা যায়নি।

১. চ্যাটে দেওয়া MongoDB password ও Groq API key বদলে নাও। নতুন secrets চ্যাটে পাঠানোর দরকার নেই।
২. ZIP extract করে `shebamed` folder VS Code-এ খোলো। Node.js 22.13+ বা 24 LTS ব্যবহার করো।
৩. Terminal-এ `npm ci` চালাও।
৪. `.env.example`-এর copy বানিয়ে `.env.local` নাম দাও। নিজের নতুন MongoDB URI, Groq key এবং random AUTH_SECRET বসাও। Model তোমার Groq account-এ available হতে হবে।
৫. Atlas-এ তোমার development computer-এর IP allow করো।
৬. `npm run db:check` এবং `npm run db:setup` চালাও। সফল message না এলে আগে connection ঠিক করো।
৭. `npm run dev` চালিয়ে `http://localhost:3000` খোলো।
৮. আরেকটি terminal-এ `npm run worker` চালু রাখো। এটা ছাড়া uploaded report-এর OCR/AI processing হবে না।
৯. মোবাইল নম্বর ও password দিয়ে registration করো। Recovery codes একবার দেখাবে—সেভ করে রাখো। OTP বা email লাগে না; নম্বর verified হিসেবে দেখানো হয় না।
১০. `demo/` folder-এর কাল্পনিক report upload করে চেষ্টা করো। আসল রোগীর রিপোর্ট ব্যবহার কোরো না।

Admin তৈরি, demo accounts, Windows commands এবং বাকি tests চালানোর বিস্তারিত `README.md`-তে। কোন পরীক্ষা সত্যি চালানো হয়েছে আর কোনগুলো হয়নি—`docs/testing-results.md`-তে আছে।
