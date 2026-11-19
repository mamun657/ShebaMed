"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { saveLocale } from "@/app/actions/locale";

export type Locale = "en" | "bn";

const translations = {
  "YOUR HEALTH, CONNECTED": "আপনার স্বাস্থ্য, সংযুক্ত",
  "Your medical history, always within reach.": "আপনার চিকিৎসার ইতিহাস, সবসময় হাতের কাছে।",
  "English": "ইংরেজি",
  "· Page": "· পৃষ্ঠা",
  "· Uploaded": "· আপলোড",
  "· confidence": "· নির্ভরযোগ্যতা",
  "Open original": "মূল নথি খুলুন",
  "Deterministic parsing was used for this report, so some fields may need review.":
    "এই রিপোর্টে নির্ধারিত নিয়মে তথ্য পার্স করা হয়েছে; কিছু তথ্য যাচাই করা প্রয়োজন হতে পারে।",
  "still processing, so this history may be incomplete.":
    "এখনও প্রক্রিয়াধীন, তাই এই ইতিহাস অসম্পূর্ণ হতে পারে।",
  "document": "নথি",
  "1 document is still processing, so this history may be incomplete.":
    "১টি নথি এখনও প্রক্রিয়াধীন, তাই এই ইতিহাস অসম্পূর্ণ হতে পারে।",
  "Private": "ব্যক্তিগত",
  "Secure": "সুরক্ষিত",
  "Connected": "সংযুক্ত",
  "Organized": "গোছানো",
  "Accessible": "সহজে ব্যবহারযোগ্য",
  "Patient-Controlled": "রোগীর নিয়ন্ত্রণে",
  "Private • Secure • Connected • Organized • Accessible • Patient-Controlled":
    "ব্যক্তিগত • সুরক্ষিত • সংযুক্ত • গোছানো • সহজে ব্যবহারযোগ্য • রোগীর নিয়ন্ত্রণে",
  "Doctor and patient connected through ShebaMed medical records": "ShebaMed চিকিৎসা-নথির মাধ্যমে যুক্ত চিকিৎসক ও রোগী",
  "Doctor and patient reviewing connected medical records": "সংযুক্ত চিকিৎসা-নথি পর্যালোচনা করছেন চিকিৎসক ও রোগী",
  "A patient and clinician sharing health information at a pharmacy":
    "একটি ফার্মেসিতে স্বাস্থ্যতথ্য ভাগ করছেন একজন রোগী ও চিকিৎসক",
  "Connected Healthcare": "সংযুক্ত স্বাস্থ্যসেবা",
  "About": "পরিচিতি",
  "How it works": "যেভাবে কাজ করে",
  "Features": "সুবিধাসমূহ",
  "For doctors": "চিকিৎসকদের জন্য",
  "For pharmacies": "ফার্মেসির জন্য",
  "Security": "নিরাপত্তা",
  "Sign in": "সাইন ইন",
  "Get started": "শুরু করুন",
  "Get started free": "বিনামূল্যে শুরু করুন",
  "Toggle navigation": "নেভিগেশন খুলুন বা বন্ধ করুন",
  "OUR PURPOSE, YOUR HEALTH": "আমাদের লক্ষ্য, আপনার স্বাস্থ্য",
  "One Mission. Better Connected": "একটি লক্ষ্য। আরও সংযুক্ত",
  "Healthcare.": "স্বাস্থ্যসেবা।",
  "Making medical histories easier to organize, understand, and securely share—so patients and doctors can make better-informed decisions together.":
    "চিকিৎসার ইতিহাস গুছিয়ে রাখা, বোঝা ও নিরাপদে ভাগ করা সহজ করা—যাতে রোগী ও চিকিৎসক একসঙ্গে আরও তথ্যভিত্তিক সিদ্ধান্ত নিতে পারেন।",
  "One Place": "এক জায়গায়",
  "All your medical records in one place.": "আপনার সব চিকিৎসা-নথি এক জায়গায়।",
  "Your Control": "আপনার নিয়ন্ত্রণ",
  "Permission-based doctor access.": "আপনার অনুমতিতে চিকিৎসকের প্রবেশাধিকার।",
  "AI Assistance": "এআই সহায়তা",
  "Source-linked answers from your health records.": "আপনার স্বাস্থ্য-নথির সূত্রসহ উত্তর।",
  "BUILT AROUND YOU": "আপনাকে কেন্দ্র করে তৈরি",
  "From scattered records": "বিচ্ছিন্ন নথি থেকে",
  "to connected care.": "সংযুক্ত সেবায়।",
  "Explore the platform": "প্ল্যাটফর্ম ঘুরে দেখুন",
  "A home for every report": "প্রতিটি রিপোর্টের জন্য এক জায়গা",
  "Upload PDFs and images. Keep original reports alongside extracted information.":
    "পিডিএফ ও ছবি আপলোড করুন। মূল রিপোর্টের সঙ্গে শনাক্ত করা তথ্যও রাখুন।",
  "Your history, in order": "সময়ক্রমে আপনার ইতিহাস",
  "See your records organized by report date, not the date you uploaded them.":
    "আপলোডের তারিখ নয়, রিপোর্টের তারিখ অনুযায়ী আপনার নথি দেখুন।",
  "Answers with evidence": "তথ্যসূত্রসহ উত্তর",
  "Ask about previous tests in English or Bangla. Follow every answer back to its source.":
    "আগের পরীক্ষা নিয়ে বাংলা বা ইংরেজিতে প্রশ্ন করুন। প্রতিটি উত্তরের মূল সূত্র দেখুন।",
  "Permission, on your terms": "আপনার শর্তে অনুমতি",
  "Share selected records for 30 or 60 minutes. Revoke access whenever you choose.":
    "নির্বাচিত নথি ৩০ বা ৬০ মিনিটের জন্য শেয়ার করুন। যেকোনো সময় প্রবেশাধিকার বাতিল করুন।",
  "SIMPLE FROM THE START": "শুরু থেকেই সহজ",
  "A little organization.": "সামান্য গুছিয়ে রাখা।",
  "A lot more clarity.": "অনেক বেশি স্বচ্ছতা।",
  "Start with your mobile number and a password.": "মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে শুরু করুন।",
  "No SMS, no email verification.": "এসএমএস বা ইমেইল যাচাইয়ের প্রয়োজন নেই।",
  "Create your account": "আপনার অ্যাকাউন্ট তৈরি করুন",
  "Get your permanent ShebaMed ID and save your recovery codes.":
    "আপনার স্থায়ী ShebaMed ID নিন এবং অ্যাকাউন্ট পুনরুদ্ধারের কোড সংরক্ষণ করুন।",
  "Bring your history": "আপনার নথি যোগ করুন",
  "Upload reports, review the extracted details, and build your timeline.":
    "রিপোর্ট আপলোড করুন, শনাক্ত করা তথ্য যাচাই করুন এবং সময়রেখা তৈরি করুন।",
  "Connect with your doctor": "চিকিৎসকের সঙ্গে যুক্ত হোন",
  "Approve a doctor’s request and choose exactly what they can access.":
    "চিকিৎসকের অনুরোধ অনুমোদন করে তিনি কোন তথ্য দেখতে পারবেন তা নির্ধারণ করুন।",
  "More context for every consultation": "প্রতিটি পরামর্শে আরও প্রাসঙ্গিক তথ্য",
  "Authorized history · Original sources · Clinical notes": "অনুমোদিত ইতিহাস · মূল সূত্র · চিকিৎসা-নোট",
  "FOR THE PEOPLE WHO CARE": "যাঁরা যত্ন নেন তাঁদের জন্য",
  "Start the visit": "সাক্ষাৎ শুরু হোক",
  "with the bigger picture.": "সম্পূর্ণ চিত্রটি নিয়ে।",
  "Review patient-authorized reports, look up historical findings, and add outpatient encounter notes with separate permission.":
    "রোগীর অনুমোদিত রিপোর্ট দেখুন, আগের ফলাফল খুঁজুন এবং পৃথক অনুমতিতে বহির্বিভাগের সাক্ষাতের নোট যোগ করুন।",
  "Patient-approved, time-limited access": "রোগীর অনুমোদনে নির্দিষ্ট সময়ের প্রবেশাধিকার",
  "Source-linked medical history search": "সূত্রসহ চিকিৎসার ইতিহাস অনুসন্ধান",
  "Professional profiles reviewed by an admin": "প্রশাসকের পর্যালোচনা করা পেশাগত প্রোফাইল",
  "Join as a doctor": "চিকিৎসক হিসেবে যোগ দিন",
  "CONTROL IS PART OF CARE": "নিয়ন্ত্রণও সেবার অংশ",
  "Your health information belongs to you.": "আপনার স্বাস্থ্য-তথ্যের মালিক আপনি।",
  "Private document storage. Separate doctor permissions. Access logs. No sharing through a phone number alone.":
    "ব্যক্তিগত নথি সংরক্ষণ। চিকিৎসকের জন্য পৃথক অনুমতি। প্রবেশ-লগ। শুধু ফোন নম্বর দিয়ে কোনো তথ্য শেয়ার হয় না।",
  "Our approach": "আমাদের পদ্ধতি",
  "A FEW THINGS TO KNOW": "কিছু প্রয়োজনীয় তথ্য",
  "Questions, answered.": "আপনার প্রশ্নের উত্তর।",
  "Do I need an OTP or email?": "ওটিপি বা ইমেইল কি প্রয়োজন?",
  "No. This controlled MVP uses a mobile number and password. Phone ownership is unverified. Save your one-time recovery codes to recover your account.":
    "না। এই নিয়ন্ত্রিত প্রাথমিক সংস্করণে মোবাইল নম্বর ও পাসওয়ার্ড ব্যবহার হয়। নম্বরের মালিকানা যাচাই করা হয় না। অ্যাকাউন্ট পুনরুদ্ধারের জন্য একবার-ব্যবহারযোগ্য কোড সংরক্ষণ করুন।",
  "Who can see my medical records?": "আমার চিকিৎসা-নথি কে দেখতে পারেন?",
  "You, and an admin-reviewed doctor only when you approve their requested access. Admins cannot browse patient medical records.":
    "আপনি এবং প্রশাসকের পর্যালোচনা করা চিকিৎসক—শুধু আপনার অনুমোদনের পর। প্রশাসকরা রোগীর চিকিৎসা-নথি দেখতে পারেন না।",
  "Does the AI provide a diagnosis?": "এআই কি রোগ নির্ণয় করে?",
  "No. It helps retrieve and explain documented history with source references. It does not replace your clinician or make treatment decisions.":
    "না। এটি নথিভুক্ত ইতিহাস খুঁজে পেতে ও সূত্রসহ ব্যাখ্যা করতে সহায়তা করে। এটি চিকিৎসকের বিকল্প নয় এবং চিকিৎসার সিদ্ধান্ত দেয় না।",
  "Is this ready for real patient care?": "এটি কি বাস্তব রোগীর সেবায় ব্যবহারের জন্য প্রস্তুত?",
  "This version is for controlled testing with synthetic records. Clinical, security, operational and legal validation are needed before real patient deployment.":
    "এই সংস্করণটি কৃত্রিম নথি দিয়ে নিয়ন্ত্রিত পরীক্ষার জন্য। বাস্তব রোগীর সেবায় ব্যবহারের আগে চিকিৎসা, নিরাপত্তা, পরিচালনা ও আইনগত যাচাই প্রয়োজন।",
  "YOUR NEXT VISIT STARTS HERE": "আপনার পরবর্তী সাক্ষাৎ শুরু হোক এখানে",
  "Give your health history": "আপনার স্বাস্থ্য-ইতিহাসকে দিন",
  "a place to come together.": "একত্র হওয়ার একটি জায়গা।",
  "Create your free account": "বিনামূল্যে অ্যাকাউন্ট তৈরি করুন",
  "Controlled MVP · Use fictional records only": "নিয়ন্ত্রিত প্রাথমিক সংস্করণ · শুধু কাল্পনিক নথি ব্যবহার করুন",
  "Patient-controlled medical memory.": "রোগীর নিয়ন্ত্রণে চিকিৎসার ইতিহাস।",
  "Privacy": "গোপনীয়তা",
  "Terms": "ব্যবহারের শর্ত",
  "©": "©",
  "Back to home": "মূল পাতায় ফিরুন",
  "Your health.": "আপনার স্বাস্থ্য।",
  "Connected.": "সংযুক্ত।",
  "Your medical history, all in one place.": "আপনার চিকিৎসার ইতিহাস, সব এক জায়গায়।",
  "Your records. Your control.": "আপনার নথি। আপনার নিয়ন্ত্রণ।",
  "YOUR HEALTH. YOUR STORY.": "আপনার স্বাস্থ্য। আপনার গল্প।",
  "A clearer history.": "আরও পরিষ্কার ইতিহাস।",
  "A better conversation.": "আরও ভালো আলোচনা।",
  "Keep your medical records together, understand your past, and choose who you share it with.":
    "আপনার চিকিৎসা-নথি একসঙ্গে রাখুন, অতীত বুঝুন এবং কার সঙ্গে শেয়ার করবেন তা নিজেই ঠিক করুন।",
  "Built around your permission": "আপনার অনুমতিকে গুরুত্ব দিয়ে তৈরি",
  "Doctors request access. You decide what to share and for how long.":
    "চিকিৎসক প্রবেশাধিকারের অনুরোধ করেন। কী শেয়ার করবেন এবং কতক্ষণ—সিদ্ধান্ত আপনার।",
  "Controlled MVP · Synthetic medical records only": "নিয়ন্ত্রিত প্রাথমিক সংস্করণ · শুধু কৃত্রিম চিকিৎসা-নথি",
  "ONE IMPORTANT STEP": "একটি গুরুত্বপূর্ণ ধাপ",
  "Save your recovery codes.": "অ্যাকাউন্ট পুনরুদ্ধারের কোড সংরক্ষণ করুন।",
  "These are shown only once. Each code can reset your password one time. Without a code or your password, we cannot recover your account.":
    "কোডগুলো শুধু একবারই দেখানো হবে। প্রতিটি কোড একবার পাসওয়ার্ড বদলাতে ব্যবহার করা যায়। কোড বা পাসওয়ার্ড ছাড়া অ্যাকাউন্ট পুনরুদ্ধার করা সম্ভব নয়।",
  "Download codes": "কোড ডাউনলোড করুন",
  "I have saved my recovery codes securely.": "আমি পুনরুদ্ধারের কোডগুলো নিরাপদে সংরক্ষণ করেছি।",
  "Go to my dashboard": "আমার ড্যাশবোর্ডে যান",
  "Password reset.": "পাসওয়ার্ড পরিবর্তন হয়েছে।",
  "Your existing sessions have been signed out. Sign in with your new password.":
    "আপনার আগের সব সেশন থেকে সাইন আউট করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।",
  "WELCOME BACK": "আবার স্বাগতম",
  "WELCOME TO SHEBAMED": "ShebaMed-এ স্বাগতম",
  "Your history is here.": "আপনার ইতিহাস এখন এখানে।",
  "Start your health story.": "আপনার স্বাস্থ্য-ইতিহাস শুরু করুন।",
  "Recover your account.": "আপনার অ্যাকাউন্ট পুনরুদ্ধার করুন।",
  "Sign in to your personal health workspace.": "আপনার ব্যক্তিগত স্বাস্থ্য-ওয়ার্কস্পেসে সাইন ইন করুন।",
  "One mobile number. One account. Your records in your hands.":
    "একটি মোবাইল নম্বর। একটি অ্যাকাউন্ট। আপনার নথি আপনার নিয়ন্ত্রণে।",
  "Use an unused recovery code saved during registration. No SMS or email required.":
    "নিবন্ধনের সময় সংরক্ষণ করা অব্যবহৃত পুনরুদ্ধার কোড ব্যবহার করুন। এসএমএস বা ইমেইল লাগবে না।",
  "I’m a patient": "আমি একজন রোগী",
  "I’m a doctor": "আমি একজন চিকিৎসক",
  "I’m a pharmacy": "আমি একটি ফার্মেসি",
  "Pharmacy name": "ফার্মেসির নাম",
  "Pharmacy license / registration number": "ফার্মেসির লাইসেন্স / নিবন্ধন নম্বর",
  "Pharmacy address": "ফার্মেসির ঠিকানা",
  "Registration details for manual review": "ম্যানুয়াল যাচাইয়ের জন্য নিবন্ধনের বিবরণ",
  "License authority and other verification details":
    "লাইসেন্স প্রদানকারী কর্তৃপক্ষ ও যাচাইয়ের অন্যান্য বিবরণ",
  "Pharmacy access is disabled until an administrator reviews and approves the registration.":
    "প্রশাসক নিবন্ধন পর্যালোচনা ও অনুমোদন না করা পর্যন্ত ফার্মেসির প্রবেশাধিকার বন্ধ থাকবে।",
  "Full name": "পূর্ণ নাম",
  "Your full name": "আপনার পূর্ণ নাম",
  "Mobile number": "মোবাইল নম্বর",
  "Bangladeshi mobile number · Ownership is unverified": "বাংলাদেশি মোবাইল নম্বর · মালিকানা যাচাই করা হয় না",
  "One-time recovery code": "একবার-ব্যবহারযোগ্য পুনরুদ্ধার কোড",
  "Enter one unused recovery code": "একটি অব্যবহৃত পুনরুদ্ধার কোড লিখুন",
  "New password": "নতুন পাসওয়ার্ড",
  "Password": "পাসওয়ার্ড",
  "Enter your password": "আপনার পাসওয়ার্ড লিখুন",
  "At least 12 characters": "কমপক্ষে ১২টি অক্ষর",
  "Confirm password": "পাসওয়ার্ড নিশ্চিত করুন",
  "Professional registration number": "পেশাগত নিবন্ধন নম্বর",
  "Specialization": "বিশেষজ্ঞতার ক্ষেত্র",
  "Workplace": "কর্মস্থল",
  "Credential details": "যোগ্যতার বিবরণ",
  "Qualifications and details for manual professional review": "পেশাগত পর্যালোচনার জন্য যোগ্যতা ও অন্যান্য বিবরণ",
  "Your doctor profile needs admin review before you can request patient access.":
    "রোগীর প্রবেশাধিকারের অনুরোধের আগে আপনার চিকিৎসক-প্রোফাইল প্রশাসকের পর্যালোচনা প্রয়োজন।",
  "I agree to the": "আমি সম্মত",
  "terms": "শর্তাবলিতে",
  "and": "এবং",
  "privacy policy": "গোপনীয়তা নীতিতে",
  ". I will use fictional records for this MVP.": "। এই প্রাথমিক সংস্করণে আমি কাল্পনিক নথি ব্যবহার করব।",
  "Please wait…": "অনুগ্রহ করে অপেক্ষা করুন…",
  "Create account": "অ্যাকাউন্ট তৈরি করুন",
  "Reset password": "পাসওয়ার্ড পরিবর্তন করুন",
  "Forgot your password?": "পাসওয়ার্ড ভুলে গেছেন?",
  "New here?": "এখানে নতুন?",
  "Create an account": "অ্যাকাউন্ট তৈরি করুন",
  "Already have an account?": "আগে থেকেই অ্যাকাউন্ট আছে?",
  "No OTP. No email. Save your recovery codes.": "ওটিপি নেই। ইমেইল নেই। পুনরুদ্ধারের কোড সংরক্ষণ করুন।",
  "A more connected medical history.": "আরও সংযুক্ত চিকিৎসা-ইতিহাস।",
  "ShebaMed is a patient-controlled outpatient electronic medical record MVP designed for Bangladesh.":
    "ShebaMed বাংলাদেশের জন্য তৈরি রোগী-নিয়ন্ত্রিত বহির্বিভাগীয় ইলেকট্রনিক মেডিকেল রেকর্ডের প্রাথমিক সংস্করণ।",
  "From your first report to your next visit.": "আপনার প্রথম রিপোর্ট থেকে পরবর্তী সাক্ষাৎ পর্যন্ত।",
  "Create an account, organize your history and share it on your terms.":
    "অ্যাকাউন্ট তৈরি করুন, ইতিহাস গুছিয়ে রাখুন এবং নিজের শর্তে শেয়ার করুন।",
  "Your records, with context.": "প্রাসঙ্গিক তথ্যসহ আপনার নথি।",
  "A focused workspace for medical history and outpatient collaboration.":
    "চিকিৎসার ইতিহাস ও বহির্বিভাগীয় সহযোগিতার জন্য একটি নির্দিষ্ট ওয়ার্কস্পেস।",
  "Permission is part of the product.": "অনুমতি এই সেবারই অংশ।",
  "Patient control is enforced on the server for every protected request.":
    "প্রতিটি সুরক্ষিত অনুরোধে সার্ভার রোগীর নিয়ন্ত্রণ নিশ্চিত করে।",
  "Your information, clearly explained.": "আপনার তথ্য, সহজ ভাষায়।",
  "This policy describes the controlled ShebaMed MVP, not a clinical production service.":
    "এই নীতিতে নিয়ন্ত্রিত ShebaMed প্রাথমিক সংস্করণের কথা বলা হয়েছে; এটি চিকিৎসা-সেবার উৎপাদন ব্যবস্থা নয়।",
  "Terms for the controlled MVP.": "নিয়ন্ত্রিত প্রাথমিক সংস্করণের ব্যবহারের শর্ত।",
  "Use fictional accounts and synthetic medical information only.":
    "শুধু কাল্পনিক অ্যাকাউন্ট ও কৃত্রিম চিকিৎসা-তথ্য ব্যবহার করুন।",
  "The problem": "সমস্যা",
  "Current scope": "বর্তমান পরিধি",
  "1. Register": "১. নিবন্ধন করুন",
  "2. Upload and review": "২. আপলোড ও যাচাই করুন",
  "3. Retrieve history": "৩. ইতিহাস খুঁজুন",
  "4. Share and revoke": "৪. শেয়ার ও বাতিল করুন",
  "Document library": "নথির সংগ্রহ",
  "Medical timeline": "চিকিৎসার সময়রেখা",
  "AI medical memory": "এআই চিকিৎসা-সহায়তা",
  "Doctor access": "চিকিৎসকের প্রবেশাধিকার",
  "Professional review": "পেশাগত পর্যালোচনা",
  "Authorized history": "অনুমোদিত ইতিহাস",
  "Contribute to care": "সেবায় অবদান রাখুন",
  "Account protection": "অ্যাকাউন্ট সুরক্ষা",
  "Document protection": "নথির সুরক্ষা",
  "Time-limited consent": "নির্দিষ্ট-মেয়াদি সম্মতি",
  "Known limits": "পরিচিত সীমাবদ্ধতা",
  "What is stored": "কী সংরক্ষণ করা হয়",
  "AI processing": "এআই প্রক্রিয়াকরণ",
  "Who can access it": "কারা প্রবেশ করতে পারেন",
  "Retention and control": "সংরক্ষণ ও নিয়ন্ত্রণ",
  "Not medical advice": "চিকিৎসা-পরামর্শ নয়",
  "Your responsibilities": "আপনার দায়িত্ব",
  "Service limitations": "সেবার সীমাবদ্ধতা",
  "SHEBAMED": "SHEBAMED",
  "Overview": "সারসংক্ষেপ",
  "My medical records": "আমার চিকিৎসা-নথি",
  "Upload document": "নথি আপলোড",
  "AI medical assistant": "এআই চিকিৎসা-সহকারী",
  "Doctor-added records": "চিকিৎসকের যোগ করা নথি",
  "Profile": "প্রোফাইল",
  "Settings": "সেটিংস",
  "Access requests": "প্রবেশাধিকারের অনুরোধ",
  "Access Requests": "প্রবেশাধিকারের অনুরোধ",
  "Authorized patients": "অনুমোদিত রোগী",
  "Authorized Patients": "অনুমোদিত রোগী",
  "Medical history": "চিকিৎসার ইতিহাস",
  "Medical History": "চিকিৎসার ইতিহাস",
  "AI clinical memory": "এআই চিকিৎসা-ইতিহাস",
  "AI Medical Assistant": "এআই চিকিৎসা-সহকারী",
  "Outpatient encounters": "বহির্বিভাগীয় সাক্ষাৎ",
  "Pharmacy Encounters": "ফার্মেসি সাক্ষাৎ",
  "Medicine Dispensing Records": "ওষুধ সরবরাহের নথি",
  "Pharmacy registrations": "ফার্মেসি নিবন্ধন",
  "Upload records": "নথি আপলোড",
  "Users": "ব্যবহারকারী",
  "Doctor registrations": "চিকিৎসক নিবন্ধন",
  "Organizations": "প্রতিষ্ঠান",
  "Audit logs": "নিরীক্ষা-লগ",
  "System health": "সিস্টেমের অবস্থা",
  "Medical record": "চিকিৎসা-নথি",
  "Patient workspace": "রোগীর ওয়ার্কস্পেস",
  "Your story starts with a record": "একটি নথি দিয়ে আপনার ইতিহাস শুরু হোক",
  "Upload a medical report to keep it organized and build your timeline.":
    "নথি গুছিয়ে রাখতে এবং সময়রেখা তৈরি করতে একটি চিকিৎসা-রিপোর্ট আপলোড করুন।",
  "Upload a report": "রিপোর্ট আপলোড",
  "Search records": "নথি খুঁজুন",
  "Search your records…": "আপনার নথি খুঁজুন…",
  "Filter by category": "ধরন অনুযায়ী ছাঁকুন",
  "Filter by year": "বছর অনুযায়ী ছাঁকুন",
  "All categories": "সব ধরন",
  "All years": "সব বছর",
  "WORKSPACE": "ওয়ার্কস্পেস",
  "Your history.": "আপনার ইতিহাস।",
  "Your permission.": "আপনার অনুমতি।",
  "Sign out": "সাইন আউট",
  "Controlled MVP · Synthetic data": "নিয়ন্ত্রিত প্রাথমিক সংস্করণ · কৃত্রিম তথ্য",
  "Workspace": "ওয়ার্কস্পেস",
  "Private workspace": "ব্যক্তিগত ওয়ার্কস্পেস",
  "Refresh": "রিফ্রেশ",
  "Loading your workspace…": "আপনার ওয়ার্কস্পেস লোড হচ্ছে…",
  "CARE WITH CONTEXT": "প্রাসঙ্গিক তথ্যসহ সেবা",
  "PLATFORM OPERATIONS": "প্ল্যাটফর্ম পরিচালনা",
  "A clearer picture of your medical history, all in one place.":
    "আপনার চিকিৎসা-ইতিহাসের আরও পরিষ্কার চিত্র, সব এক জায়গায়।",
  "Patient-authorized records and outpatient care.": "রোগীর অনুমোদিত নথি ও বহির্বিভাগীয় সেবা।",
  "Manage accounts and operations without accessing clinical records.":
    "চিকিৎসা-নথিতে প্রবেশ না করেই অ্যাকাউন্ট ও কার্যক্রম পরিচালনা করুন।",
  "This page could not be loaded.": "এই পৃষ্ঠা লোড করা যায়নি।",
  "Professional review:": "পেশাগত পর্যালোচনা:",
  ". Patient access is available only after admin approval.": "। প্রশাসকের অনুমোদনের পরই রোগীর নথিতে প্রবেশ করা যাবে।",
  "Choose an authorized patient": "অনুমোদিত রোগী নির্বাচন করুন",
  "Patient": "রোগী",
  "Only active grants are listed.": "শুধু কার্যকর অনুমতিগুলো দেখানো হচ্ছে।",
  "Account security": "অ্যাকাউন্ট সুরক্ষা",
  "Changing your password signs out all current sessions.":
    "পাসওয়ার্ড পরিবর্তন করলে বর্তমান সব সেশন থেকে সাইন আউট হবে।",
  "Current password": "বর্তমান পাসওয়ার্ড",
  "Change password": "পাসওয়ার্ড পরিবর্তন",
  "Phone ownership:": "ফোন নম্বরের মালিকানা:",
  "Unverified": "যাচাই করা হয়নি",
  ". Phone-number changes are not supported in this controlled MVP.":
    "। এই নিয়ন্ত্রিত প্রাথমিক সংস্করণে ফোন নম্বর পরিবর্তনের সুবিধা নেই।",
  "Your profile": "আপনার প্রোফাইল",
  "YOUR PERMANENT SHEBAMED ID": "আপনার স্থায়ী ShebaMed ID",
  "Copy ShebaMed ID": "ShebaMed ID কপি করুন",
  "Phone ownership unverified · Joined": "ফোন নম্বরের মালিকানা যাচাই করা হয়নি · যোগ দিয়েছেন",
  "Date of birth (optional)": "জন্মতারিখ (ঐচ্ছিক)",
  "Gender (optional)": "লিঙ্গ (ঐচ্ছিক)",
  "Save profile": "প্রোফাইল সংরক্ষণ",
  "Recent records": "সাম্প্রতিক নথি",
  "Your latest additions, with their original sources.": "মূল সূত্রসহ আপনার সাম্প্রতিক সংযোজন।",
  "View all": "সব দেখুন",
  "SHEBAMED ID": "SHEBAMED ID",
  "Copy ID": "ID কপি করুন",
  "ID copied": "ID কপি করা হয়েছে",
  "A question about your history?": "আপনার ইতিহাস নিয়ে কোনো প্রশ্ন আছে?",
  "Find a previous test or report, with evidence you can open.":
    "খুলে দেখা যায় এমন তথ্যসূত্রসহ আগের পরীক্ষা বা রিপোর্ট খুঁজুন।",
  "Ask your medical memory": "আপনার চিকিৎসা-ইতিহাসকে জিজ্ঞাসা করুন",
  "Bring your reports together": "আপনার রিপোর্টগুলো এক জায়গায় রাখুন",
  "Upload a PDF or image": "পিডিএফ বা ছবি আপলোড করুন",
  "Controlled, time-limited access": "নিয়ন্ত্রিত, নির্দিষ্ট-মেয়াদি প্রবেশাধিকার",
  "Total records": "মোট নথি",
  "Lab reports": "ল্যাব রিপোর্ট",
  "Prescriptions": "প্রেসক্রিপশন",
  "Clinical notes": "চিকিৎসা-নোট",
  "Pending requests": "অপেক্ষমাণ অনুরোধ",
  "Active permissions": "কার্যকর অনুমতি",
  "Selected patient records": "নির্বাচিত রোগীর নথি",
  "Create sharing code": "শেয়ারিং কোড তৈরি",
  "Sharing code created": "শেয়ারিং কোড তৈরি হয়েছে",
  "Expires in 10 minutes · Single use": "১০ মিনিট পর মেয়াদ শেষ · একবার ব্যবহারযোগ্য",
  "Copy sharing code": "শেয়ারিং কোড কপি করুন",
  "Request access": "প্রবেশাধিকারের অনুরোধ করুন",
  "Request sent. Waiting for the patient.": "অনুরোধ পাঠানো হয়েছে। রোগীর অনুমোদনের অপেক্ষায়।",
  "Patient’s sharing code": "রোগীর শেয়ারিং কোড",
  "No access requests yet.": "এখনও কোনো প্রবেশাধিকারের অনুরোধ নেই।",
  "Permissions": "অনুমতিসমূহ",
  "Access request updated": "প্রবেশাধিকারের অনুরোধ হালনাগাদ হয়েছে",
  "Revoked": "বাতিল",
  "Expired": "মেয়াদোত্তীর্ণ",
  "Active": "কার্যকর",
  "Revoked ": "বাতিল ",
  "Expired ": "মেয়াদোত্তীর্ণ ",
  "Expires ": "মেয়াদ শেষ হবে ",
  "Access revoked": "প্রবেশাধিকার বাতিল হয়েছে",
  "Revoke access": "প্রবেশাধিকার বাতিল করুন",
  "Open history": "ইতিহাস খুলুন",
  "No permissions granted yet.": "এখনও কোনো অনুমতি দেওয়া হয়নি।",
  "Record an outpatient encounter": "বহির্বিভাগীয় সাক্ষাতের তথ্য লিখুন",
  "Requires separate encounter permission from the patient.":
    "রোগীর কাছ থেকে সাক্ষাতের তথ্যের জন্য পৃথক অনুমতি প্রয়োজন।",
  "Save encounter": "সাক্ষাতের তথ্য সংরক্ষণ",
  "A timeline takes shape here": "এখানে সময়রেখা তৈরি হবে",
  "Your medical report dates will connect your history over time.":
    "চিকিৎসা-রিপোর্টের তারিখগুলো সময়ের সঙ্গে আপনার ইতিহাসকে যুক্ত করবে।",
  "Medical records": "চিকিৎসা-নথি",
  "Upload": "আপলোড",
  "Medical record details": "চিকিৎসা-নথির বিবরণ",
  "Close": "বন্ধ করুন",
  "Source:": "সূত্র:",
  "Download original": "মূল নথি ডাউনলোড",
  "Patient-controlled medical memory": "রোগীর নিয়ন্ত্রণে চিকিৎসার ইতিহাস",
  "Controlled MVP · Fictional records only": "নিয়ন্ত্রিত প্রাথমিক সংস্করণ · শুধু কাল্পনিক নথি",
  "Bring your medical history together.": "আপনার চিকিৎসার ইতিহাস এক জায়গায় রাখুন।",
  "Upload original reports and review the details after processing.":
    "মূল রিপোর্ট আপলোড করুন এবং প্রক্রিয়াকরণের পর তথ্য যাচাই করুন।",
  "Drop your reports here": "আপনার রিপোর্ট এখানে ছেড়ে দিন",
  "or click to browse files": "অথবা ফাইল বাছতে ক্লিক করুন",
  "PDF, JPG, PNG, WEBP · Default limit 5 MB per file · 10 pages":
    "PDF, JPG, PNG, WEBP · প্রতি ফাইলে সর্বোচ্চ ৫ MB · ১০ পৃষ্ঠা",
  "Select medical reports": "চিকিৎসা-রিপোর্ট নির্বাচন করুন",
  "Remove ": "সরান ",
  "By uploading, you consent to local OCR and Groq processing of extracted text. Use synthetic medical reports only.":
    "আপলোড করলে শনাক্ত করা লেখা স্থানীয় OCR ও Groq দিয়ে প্রক্রিয়াকরণের সম্মতি দিচ্ছেন। শুধু কৃত্রিম চিকিৎসা-রিপোর্ট ব্যবহার করুন।",
  "Uploading…": "আপলোড হচ্ছে…",
  "Upload & process": "আপলোড ও প্রক্রিয়াকরণ",
  "01 · Private storage": "০১ · ব্যক্তিগত সংরক্ষণ",
  "02 · OCR & extraction": "০২ · OCR ও তথ্য শনাক্তকরণ",
  "03 · Your review": "০৩ · আপনার যাচাই",
  "30 minutes": "৩০ মিনিট",
  "1 hour": "১ ঘণ্টা",
  "Duration": "সময়কাল",
  "Records": "নথি",
  "Open the original reports": "মূল রিপোর্ট খুলুন",
  "Use AI clinical memory over those reports": "ওই রিপোর্টে এআই দিয়ে চিকিৎসার ইতিহাস খুঁজুন",
  "Add own notes and documents": "নিজের নোট ও নথি যোগ করুন",
  "Write outpatient encounters": "বহির্বিভাগীয় সাক্ষাতের তথ্য লিখুন",
  "Reading and AI clinical memory are selected by default. Write permissions stay off until you choose them.":
    "নথি দেখা ও এআই দিয়ে ইতিহাস খোঁজা ডিফল্টভাবে নির্বাচিত। আপনি বেছে না নেওয়া পর্যন্ত লেখার অনুমতি বন্ধ থাকবে।",
  "Approve": "অনুমোদন",
  "Reject": "প্রত্যাখ্যান",
  "Total users": "মোট ব্যবহারকারী",
  "Patients": "রোগী",
  "Doctors": "চিকিৎসক",
  "Pending review": "পর্যালোচনার অপেক্ষায়",
  "Operations at a glance": "কার্যক্রম এক নজরে",
  "Document storage:": "নথি সংরক্ষণ:",
  "Failed processing jobs:": "ব্যর্থ প্রক্রিয়াকরণ কাজ:",
  "Review doctor registrations": "চিকিৎসকের নিবন্ধন পর্যালোচনা",
  "Registered accounts": "নিবন্ধিত অ্যাকাউন্ট",
  "Name": "নাম",
  "ShebaMed ID": "ShebaMed ID",
  "Role": "ভূমিকা",
  "Status": "অবস্থা",
  "Action": "কাজ",
  "Suspend": "স্থগিত করুন",
  "Activate": "সক্রিয় করুন",
  "Review credentials manually. Approval means admin-reviewed, not official regulatory verification.":
    "যোগ্যতার তথ্য হাতে পর্যালোচনা করুন। অনুমোদন মানে প্রশাসনিক পর্যালোচনা; এটি সরকারি নিয়ন্ত্রক সংস্থার যাচাই নয়।",
  "Registration": "নিবন্ধন",
  "Credentials": "যোগ্যতার তথ্য",
  "Organization name": "প্রতিষ্ঠানের নাম",
  "Organization address": "প্রতিষ্ঠানের ঠিকানা",
  "Address": "ঠিকানা",
  "Add organization": "প্রতিষ্ঠান যোগ করুন",
  "Access & activity events": "প্রবেশাধিকার ও কার্যক্রম",
  "Event": "ঘটনা",
  "Actor": "কর্তা",
  "Target": "লক্ষ্য",
  "Date": "তারিখ",
  "Database:": "ডেটাবেস:",
  "Reserved file storage:": "সংরক্ষিত ফাইলের জায়গা:",
  "Processing jobs": "প্রক্রিয়াকরণ কাজ",
  "Attempts:": "চেষ্টা:",
  "Saved successfully": "সফলভাবে সংরক্ষণ হয়েছে",
  "Signed out": "সাইন আউট করা হয়েছে",
  "Queued for processing": "প্রক্রিয়াকরণের সারিতে যোগ হয়েছে",
  "All records": "সব নথি",
  "Original report": "মূল রিপোর্ট",
  "Retry processing": "আবার প্রক্রিয়াকরণ করুন",
  "This report is queued or processing. The processing worker extracts text and structured medical details. Refresh to check progress.":
    "এই রিপোর্টটি সারিতে আছে বা প্রক্রিয়াধীন। কর্মী লেখা ও চিকিৎসা-তথ্য শনাক্ত করছে। অগ্রগতি দেখতে রিফ্রেশ করুন।",
  "Extraction finished. Review the detected fields below and confirm or correct them before they become part of your medical history.":
    "তথ্য শনাক্তকরণ শেষ। নিচের তথ্য যাচাই করে নিশ্চিত বা সংশোধন করুন; এরপরই তা আপনার চিকিৎসা-ইতিহাসে যুক্ত হবে।",
  "This document was classified as non-medical. It is excluded from clinical retrieval by default. You can reclassify it below.":
    "এই নথিকে চিকিৎসা-সংক্রান্ত নয় বলে শ্রেণিবদ্ধ করা হয়েছে। ডিফল্টভাবে এটি চিকিৎসা-অনুসন্ধানে অন্তর্ভুক্ত নয়। নিচে শ্রেণি বদলাতে পারেন।",
  "Original document": "মূল নথি",
  "Open": "খুলুন",
  "This is a clinician-authored note with no original file.": "এটি চিকিৎসকের লেখা নোট; এর কোনো মূল ফাইল নেই।",
  "Extracted information": "শনাক্ত করা তথ্য",
  "OCR text": "OCR-এর লেখা",
  "Details": "বিবরণ",
  "No extraction is available yet. The worker has not finished reading this document.":
    "এখনও কোনো শনাক্ত করা তথ্য পাওয়া যায়নি। কর্মী এই নথি পড়া শেষ করেনি।",
  "Document type": "নথির ধরন",
  "Report date": "রিপোর্টের তারিখ",
  "Laboratory": "পরীক্ষাগার",
  "Hospital": "হাসপাতাল",
  "Test": "পরীক্ষা",
  "Result": "ফলাফল",
  "Unit": "একক",
  "Reference range": "স্বাভাবিক সীমা",
  "Page": "পৃষ্ঠা",
  "Medications documented": "নথিভুক্ত ওষুধ",
  "Diagnoses documented": "নথিভুক্ত রোগ-নির্ণয়",
  "Verification level:": "যাচাইয়ের স্তর:",
  ". AI extraction is never clinician verification.": "। এআই দিয়ে তথ্য শনাক্তকরণ কখনো চিকিৎসকের যাচাইয়ের বিকল্প নয়।",
  "Pages processed:": "প্রক্রিয়াকৃত পৃষ্ঠা:",
  ". Extraction methods:": "। তথ্য শনাক্তকরণের পদ্ধতি:",
  "Uploaded": "আপলোড হয়েছে",
  "Processing status": "প্রক্রিয়াকরণের অবস্থা",
  "Extraction status": "তথ্য শনাক্তকরণের অবস্থা",
  "Verification": "যাচাই",
  "Review extracted information": "শনাক্ত করা তথ্য যাচাই করুন",
  "Compare these details with the original. Patient confirmation is not clinician verification. The original extracted text is preserved alongside your corrections.":
    "এই তথ্যগুলো মূল নথির সঙ্গে মিলিয়ে দেখুন। রোগীর নিশ্চিতকরণ চিকিৎসকের যাচাই নয়। আপনার সংশোধনের পাশাপাশি শনাক্ত করা মূল লেখাও সংরক্ষিত থাকবে।",
  "Report title": "রিপোর্টের শিরোনাম",
  "Category": "ধরন",
  "Finding": "পর্যবেক্ষণ",
  "Recorded medications (one per line)": "নথিভুক্ত ওষুধ (প্রতি লাইনে একটি)",
  "Documented diagnoses (one per line)": "নথিভুক্ত রোগ-নির্ণয় (প্রতি লাইনে একটি)",
  "Confirm reviewed details": "যাচাই করা তথ্য নিশ্চিত করুন",
  "Failed": "ব্যর্থ",
  "Date not recorded": "তারিখ নথিভুক্ত নেই",
  "Report date not available": "রিপোর্টের তারিখ পাওয়া যায়নি",
  "Report date not available — review required": "রিপোর্টের তারিখ পাওয়া যায়নি — যাচাই প্রয়োজন",
  "Not recorded": "নথিভুক্ত নেই",
  "No readable text on this page.": "এই পৃষ্ঠায় পাঠযোগ্য লেখা নেই।",
  "OCR text becomes available once the worker finishes extracting this document.":
    "কর্মী এই নথি থেকে তথ্য শনাক্ত করা শেষ করলে OCR-এর লেখা দেখা যাবে।",
  "Classification reason": "শ্রেণিবিভাগের কারণ",
  "Your history has answers.": "আপনার ইতিহাসেই আছে উত্তর।",
  "Ask about a previous report. Answers are grounded in the records you can access, and every clinical claim cites its source document and page.":
    "আগের রিপোর্ট নিয়ে প্রশ্ন করুন। উত্তর আপনার প্রবেশযোগ্য নথির ভিত্তিতে দেওয়া হয় এবং চিকিৎসা-সংক্রান্ত প্রতিটি তথ্যের সঙ্গে নথি ও পৃষ্ঠার সূত্র থাকে।",
  "AI clinical memory is not part of your current permission for this patient. Ask the patient to approve the “query medical history” capability when they approve your access.":
    "এই রোগীর জন্য আপনার বর্তমান অনুমতিতে এআই চিকিৎসা-ইতিহাস অনুসন্ধান অন্তর্ভুক্ত নেই। রোগীকে প্রবেশাধিকার অনুমোদনের সময় “চিকিৎসার ইতিহাস অনুসন্ধান” সুবিধাটিও অনুমোদন করতে বলুন।",
  "Start with a question about your records": "আপনার নথি নিয়ে একটি প্রশ্ন দিয়ে শুরু করুন",
  "Greetings and questions about how ShebaMed works are answered instantly, without searching your medical history.":
    "ShebaMed কীভাবে কাজ করে—এমন শুভেচ্ছা ও প্রশ্নের উত্তর আপনার চিকিৎসা-ইতিহাস না খুঁজেই সঙ্গে সঙ্গে দেওয়া হয়।",
  "Have I done an HbA1c test before?": "আমি কি আগে HbA1c পরীক্ষা করিয়েছি?",
  "Which medical tests did I perform in 2026?": "২০২৬ সালে আমি কোন কোন পরীক্ষা করিয়েছি?",
  "What was my previous CBC result?": "আমার আগের CBC পরীক্ষার ফল কী ছিল?",
  "Show me the original report.": "আমাকে মূল রিপোর্টটি দেখান।",
  "Request failed": "অনুরোধ ব্যর্থ হয়েছে",
  "is": "হয়েছে",
  "s are": "হয়েছে",
  "still": "এখনও",
  "processing, so this history may be incomplete.": "প্রক্রিয়াধীন, তাই এই ইতিহাস অসম্পূর্ণ হতে পারে।",
  "Open original report": "মূল রিপোর্ট খুলুন",
  "Searching authorized evidence…": "অনুমোদিত তথ্যসূত্র খোঁজা হচ্ছে…",
  "The last question could not be completed.": "শেষ প্রশ্নটির উত্তর দেওয়া যায়নি।",
  "Retry": "আবার চেষ্টা করুন",
  "Send question": "প্রশ্ন পাঠান",
  "Ask a question about your medical history": "আপনার চিকিৎসা-ইতিহাস নিয়ে প্রশ্ন করুন",
  "Ask about your medical history…": "আপনার চিকিৎসা-ইতিহাস নিয়ে প্রশ্ন করুন…",
  "Answer language": "উত্তরের ভাষা",
  "History retrieval, not diagnosis or treatment advice. Verify against original reports. Patient confirmations are not clinician verification.":
    "এটি ইতিহাস অনুসন্ধানের জন্য, রোগ নির্ণয় বা চিকিৎসা-পরামর্শ নয়। মূল রিপোর্টের সঙ্গে মিলিয়ে নিন। রোগীর নিশ্চিতকরণ চিকিৎসকের যাচাই নয়।",
  "Document": "নথি",
  "Processing": "প্রক্রিয়াকরণ",
  "Extraction": "তথ্য শনাক্তকরণ",
  "Review": "পর্যালোচনা",
  "Actions": "কাজ",
  "Retry processing ": "আবার প্রক্রিয়াকরণ করুন ",
  "Download ": "ডাউনলোড ",
  "Open ": "খুলুন ",
  "This report is being read now. Text and medical details appear here automatically when it finishes.":
    "এই রিপোর্টটি এখন পড়া হচ্ছে। শেষ হলে লেখা ও চিকিৎসা-তথ্য এখানে নিজে থেকেই দেখা যাবে।",
  "This report is queued. It will be read automatically and this page updates on its own.":
    "এই রিপোর্টটি সারিতে আছে। এটি স্বয়ংক্রিয়ভাবে পড়া হবে এবং এই পাতা নিজে থেকেই হালনাগাদ হবে।",
  "Document processing is not running, so this report cannot be read yet. Your file is saved and will be processed automatically once processing starts again. On a local installation, start it with npm run dev or npm run worker.":
    "নথি প্রক্রিয়াকরণ চালু নেই, তাই এই রিপোর্টটি এখনও পড়া যায়নি। আপনার ফাইল সংরক্ষিত আছে এবং প্রক্রিয়াকরণ আবার চালু হলে স্বয়ংক্রিয়ভাবে পড়া হবে। নিজের কম্পিউটারে চালালে npm run dev অথবা npm run worker দিয়ে চালু করুন।",
  "This document was read from handwriting by an AI model. Handwriting is often misread, so every medicine below is marked as needing review.":
    "এই নথির হাতের লেখা একটি এআই মডেল পড়েছে। হাতের লেখা প্রায়ই ভুল পড়া হয়, তাই নিচের প্রতিটি ওষুধ যাচাই প্রয়োজন হিসেবে চিহ্নিত।",
  "The text in this document could not be read reliably.":
    "এই নথির লেখা নির্ভরযোগ্যভাবে পড়া যায়নি।",
  "OCR confidence:":
    "ওসিআর নির্ভরযোগ্যতা:",
  "Compare everything with the original before you confirm it, and add or correct medicines yourself in the review form.":
    "নিশ্চিত করার আগে সবকিছু মূল নথির সঙ্গে মিলিয়ে নিন, এবং পর্যালোচনা ফর্মে ওষুধ নিজে যোগ বা সংশোধন করুন।",
  "Read this document again":
    "নথিটি আবার পড়ুন",
  "An earlier attempt did not finish, so this report is being read again.":
    "আগের চেষ্টা শেষ হয়নি, তাই রিপোর্টটি আবার পড়া হচ্ছে।",
  "Prescribed medicines":
    "প্রেসক্রিপশনে লেখা ওষুধ",
  "Prescribed by:":
    "প্রেসক্রিপশন দিয়েছেন:",
  "Medicine":
    "ওষুধ",
  "Strength":
    "মাত্রা (শক্তি)",
  "Dose":
    "ডোজ",
  "Frequency":
    "কতবার",
  "Not found":
    "পাওয়া যায়নি",
  "Read from document":
    "নথি থেকে পড়া",
  "Needs review":
    "যাচাই প্রয়োজন",
  "Entered by patient":
    "রোগীর লেখা",
  "No medicine name could be read from this document. Nothing has been guessed.":
    "এই নথি থেকে কোনো ওষুধের নাম পড়া যায়নি। কোনো কিছু অনুমান করা হয়নি।",
  "Lines that looked like medicines but could not be read, and were left out:":
    "ওষুধ বলে মনে হওয়া কিন্তু পড়া যায়নি এমন লাইন, যা বাদ দেওয়া হয়েছে:",
  "These are medicines written on this document (prescribed). It does not show whether they were dispensed or taken.":
    "এগুলো এই নথিতে লেখা (প্রেসক্রাইব করা) ওষুধ। ওষুধগুলো দেওয়া বা সেবন করা হয়েছে কি না, তা এখানে বোঝায় না।",
  "Type each medicine exactly as written on the original. Leave a box empty if you cannot read it.":
    "প্রতিটি ওষুধ মূল নথিতে যেভাবে লেখা ঠিক সেভাবে লিখুন। পড়তে না পারলে ঘরটি ফাঁকা রাখুন।",
  "Add a medicine":
    "ওষুধ যোগ করুন",
  "Please sign in": "অনুগ্রহ করে সাইন ইন করুন",
  "Your session has expired": "আপনার সেশনের মেয়াদ শেষ হয়েছে",
  "Invalid mobile number or password": "মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়",
  "Mobile number required": "মোবাইল নম্বর দিতে হবে",
  "Request body too large": "অনুরোধের তথ্য নির্ধারিত সীমার চেয়ে বড়",
  "Upload too large": "আপলোডের ফাইলটি নির্ধারিত সীমার চেয়ে বড়",
  "Upload failed": "আপলোড ব্যর্থ হয়েছে",
  "Upload interrupted. Try again.": "আপলোডে বাধা এসেছে। আবার চেষ্টা করুন।",
  "Invalid source page": "সূত্রের পৃষ্ঠা সঠিক নয়",
  "Invalid input": "প্রদত্ত তথ্য সঠিক নয়",
  "The original report could not be loaded.": "মূল রিপোর্টটি লোড করা যায়নি।",
  "Please choose a language.": "অনুগ্রহ করে একটি ভাষা বেছে নিন।",
  "Switch language to Bangla": "ভাষা বাংলায় পরিবর্তন করুন",
  "Switch language to English": "ভাষা ইংরেজিতে পরিবর্তন করুন",
  "Could not save your language preference.": "ভাষার পছন্দ সংরক্ষণ করা যায়নি।",
  "Page not found.": "পৃষ্ঠাটি পাওয়া যায়নি।",
  "This page is not part of your medical history.": "এই পৃষ্ঠাটি আপনার চিকিৎসা-ইতিহাসের অংশ নয়।",
  "Return home": "মূল পাতায় ফিরুন",
  "Reports from different providers often stay disconnected. Patients and doctors lose context when previous records are hard to retrieve.":
    "বিভিন্ন সেবাদাতার রিপোর্ট প্রায়ই বিচ্ছিন্ন থাকে। আগের নথি সহজে খুঁজে না পেলে রোগী ও চিকিৎসক প্রয়োজনীয় প্রেক্ষাপট হারান।",
  "Keep original documents, review extracted information, explore a chronological timeline and share records with specific doctors by permission.":
    "মূল নথি রাখুন, শনাক্ত করা তথ্য যাচাই করুন, সময়ানুক্রমিক ইতিহাস দেখুন এবং অনুমতি দিয়ে নির্দিষ্ট চিকিৎসকের সঙ্গে নথি শেয়ার করুন।",
  "A controlled, synthetic-data MVP. It is not a certified clinical system, emergency service or replacement for professional care.":
    "কৃত্রিম তথ্য দিয়ে তৈরি নিয়ন্ত্রিত প্রাথমিক সংস্করণ। এটি অনুমোদিত চিকিৎসা-ব্যবস্থা বা জরুরি সেবা নয়, পেশাদার চিকিৎসার বিকল্পও নয়।",
  "Use a Bangladeshi mobile number and a password. Download the recovery codes shown once. Your number is not ownership-verified.":
    "বাংলাদেশি মোবাইল নম্বর ও পাসওয়ার্ড ব্যবহার করুন। একবার দেখানো পুনরুদ্ধার কোড ডাউনলোড করুন। নম্বরের মালিকানা যাচাই করা হয় না।",
  "Upload a PDF or image. A local worker performs OCR and Groq extracts structured information. Review mistakes before confirming the report.":
    "পিডিএফ বা ছবি আপলোড করুন। স্থানীয় কর্মী OCR চালায় এবং Groq কাঠামোবদ্ধ তথ্য শনাক্ত করে। রিপোর্ট নিশ্চিত করার আগে ভুলগুলো যাচাই করুন।",
  "Search your timeline or ask questions in English or Bangla. Evidence-linked answers include report sources.":
    "সময়রেখায় খুঁজুন অথবা বাংলা বা ইংরেজিতে প্রশ্ন করুন। তথ্যসূত্রসহ উত্তরে রিপোর্টের উৎসও থাকে।",
  "Create a single-use code. A reviewed doctor requests access. Select records and capabilities for 30 or 60 minutes, then revoke anytime.":
    "একবার-ব্যবহারযোগ্য কোড তৈরি করুন। পর্যালোচিত চিকিৎসক প্রবেশাধিকারের অনুরোধ করবেন। ৩০ বা ৬০ মিনিটের জন্য নথি ও অনুমতি বেছে নিন; যেকোনো সময় বাতিল করুন।",
  "Private GridFS originals, file validation, processing status, original downloads and manual extraction review.":
    "ব্যক্তিগত GridFS-এ মূল নথি, ফাইল যাচাই, প্রক্রিয়াকরণের অবস্থা, মূল নথি ডাউনলোড এবং হাতে তথ্য যাচাই।",
  "Chronological records sorted by report date, with unknown dates labeled separately.":
    "রিপোর্টের তারিখ অনুযায়ী সাজানো সময়ানুক্রমিক নথি; অজানা তারিখ আলাদাভাবে চিহ্নিত।",
  "Authorized text retrieval and Groq answers with validated source references. AI output may be wrong; consult original reports.":
    "অনুমোদিত লেখা অনুসন্ধান ও যাচাইকৃত সূত্রসহ Groq-এর উত্তর। এআইয়ের উত্তর ভুল হতে পারে; মূল রিপোর্ট দেখুন।",
  "Short-lived requests, scoped grants, separate read and write permissions, expiration and revocation.":
    "স্বল্পমেয়াদি অনুরোধ, নির্দিষ্ট পরিধির অনুমতি, পড়া ও লেখার পৃথক অনুমতি, মেয়াদ শেষ এবং বাতিলের ব্যবস্থা।",
  "Provide registration number, specialization, workplace and credential details. An admin manually reviews these; this is not official regulatory verification.":
    "নিবন্ধন নম্বর, বিশেষজ্ঞতার ক্ষেত্র, কর্মস্থল ও যোগ্যতার তথ্য দিন। প্রশাসক এগুলো হাতে পর্যালোচনা করেন; এটি সরকারি নিয়ন্ত্রক সংস্থার যাচাই নয়।",
  "Enter the patient’s sharing code and wait for approval. Only approved records and capabilities are available.":
    "রোগীর শেয়ারিং কোড লিখে অনুমোদনের অপেক্ষা করুন। শুধু অনুমোদিত নথি ও সুবিধাগুলোই ব্যবহার করা যাবে।",
  "With separate permission, upload documents or create outpatient encounters. Clinical entries identify their author.":
    "পৃথক অনুমতি নিয়ে নথি আপলোড করুন বা বহির্বিভাগীয় সাক্ষাতের তথ্য যোগ করুন। চিকিৎসা-তথ্যে লেখকের পরিচয় থাকে।",
  "Argon2id password hashing, HTTP-only sessions, origin checks, rate limits and one-time recovery codes. Mobile numbers remain unverified.":
    "Argon2id দিয়ে পাসওয়ার্ড হ্যাশ, HTTP-only সেশন, উৎস যাচাই, অনুরোধ-সীমা এবং একবার-ব্যবহারযোগ্য পুনরুদ্ধার কোড। মোবাইল নম্বর যাচাই করা হয় না।",
  "Private GridFS storage. No public report URLs. Admins do not automatically receive clinical access.":
    "ব্যক্তিগত GridFS সংরক্ষণ। রিপোর্টের কোনো উন্মুক্ত URL নেই। প্রশাসকরা স্বয়ংক্রিয়ভাবে চিকিৎসা-তথ্যে প্রবেশাধিকার পান না।",
  "Doctor requests do not grant access. Patient approval defines scope and permissions. Every new request checks expiration and revocation. Previously downloaded copies cannot be recalled.":
    "চিকিৎসকের অনুরোধে প্রবেশাধিকার পাওয়া যায় না। রোগীর অনুমোদনেই পরিধি ও অনুমতি নির্ধারিত হয়। প্রতিটি অনুরোধে মেয়াদ ও বাতিলের অবস্থা যাচাই করা হয়। আগে ডাউনলোড করা কপি ফিরিয়ে নেওয়া যায় না।",
  "This MVP has not undergone an independent security audit or clinical validation. Use synthetic data. Backups, malware scanning, verified identity and operational monitoring need assessment before public use.":
    "এই প্রাথমিক সংস্করণের স্বাধীন নিরাপত্তা নিরীক্ষা বা চিকিৎসাগত যাচাই হয়নি। কৃত্রিম তথ্য ব্যবহার করুন। জনসাধারণের ব্যবহারের আগে ব্যাকআপ, ম্যালওয়্যার পরীক্ষা, পরিচয় যাচাই ও কার্যক্রম পর্যবেক্ষণ মূল্যায়ন করতে হবে।",
  "Account and professional profile details, password hashes, recovery-code hashes, medical files, extracted text, corrections, consent and access events are stored in the configured MongoDB database.":
    "অ্যাকাউন্ট ও পেশাগত প্রোফাইলের তথ্য, পাসওয়ার্ড ও পুনরুদ্ধার-কোডের হ্যাশ, চিকিৎসা-ফাইল, শনাক্ত করা লেখা, সংশোধন, সম্মতি এবং প্রবেশের ঘটনা নির্ধারিত MongoDB ডেটাবেসে সংরক্ষিত হয়।",
  "Uploading a record queues local OCR and sends extracted text to Groq for structured analysis. Asking a question sends relevant authorized passages. Do not upload real patient information to this demo.":
    "নথি আপলোড করলে স্থানীয় OCR-এর কাজ সারিতে যায় এবং কাঠামোবদ্ধ বিশ্লেষণের জন্য শনাক্ত করা লেখা Groq-এ পাঠানো হয়। প্রশ্ন করলে প্রাসঙ্গিক অনুমোদিত অংশ পাঠানো হয়। এই ডেমোতে বাস্তব রোগীর তথ্য আপলোড করবেন না।",
  "Patients access their own records. Reviewed doctors require an active scoped grant. Admins review operational and account metadata without browsing clinical records.":
    "রোগীরা নিজেদের নথিতে প্রবেশ করেন। পর্যালোচিত চিকিৎসকের জন্য নির্দিষ্ট পরিধির কার্যকর অনুমতি প্রয়োজন। প্রশাসকরা চিকিৎসা-নথি না দেখেই কার্যক্রম ও অ্যাকাউন্টের মেটাডেটা পর্যালোচনা করেন।",
  "Revocation prevents future server requests but cannot erase copies already downloaded. This MVP does not provide automated account deletion or an established production retention schedule. The operator must define these before deployment.":
    "অনুমতি বাতিল করলে ভবিষ্যৎ সার্ভার অনুরোধ বন্ধ হয়, তবে আগে ডাউনলোড করা কপি মুছে যায় না। এই সংস্করণে স্বয়ংক্রিয় অ্যাকাউন্ট মুছে ফেলা বা নির্ধারিত উৎপাদন-পর্যায়ের সংরক্ষণনীতি নেই। চালুর আগে পরিচালনাকারীকে এসব নির্ধারণ করতে হবে।",
  "AI summaries retrieve and explain recorded information. They do not diagnose, prescribe, or determine whether treatment or tests are needed.":
    "এআই সারাংশ নথিভুক্ত তথ্য খুঁজে ব্যাখ্যা করে। এটি রোগ নির্ণয়, ওষুধ নির্ধারণ বা চিকিৎসা কিংবা পরীক্ষা প্রয়োজন কি না তা ঠিক করে না।",
  "Protect your password and recovery codes. Review extracted values against originals. Upload only records you are authorized to use.":
    "আপনার পাসওয়ার্ড ও পুনরুদ্ধার কোড সুরক্ষিত রাখুন। শনাক্ত করা তথ্য মূল নথির সঙ্গে মিলিয়ে দেখুন। ব্যবহারের অনুমতি আছে এমন নথিই আপলোড করুন।",
  "Availability depends on your local server, MongoDB, OCR resources and Groq account limits. The application provides no clinical or regulatory certification.":
    "সেবা চালু থাকা স্থানীয় সার্ভার, MongoDB, OCR উপকরণ ও Groq অ্যাকাউন্টের সীমার ওপর নির্ভর করে। অ্যাপ্লিকেশনটি চিকিৎসাগত বা নিয়ন্ত্রক সনদপ্রাপ্ত নয়।",
  "Current password is incorrect": "বর্তমান পাসওয়ার্ডটি সঠিক নয়",
  "Administrator required": "প্রশাসকের অ্যাকাউন্ট প্রয়োজন",
  "Cannot suspend your own account": "নিজের অ্যাকাউন্ট স্থগিত করা যাবে না",
  "Patient required": "রোগীর অ্যাকাউন্ট প্রয়োজন",
  "Grant not found": "অনুমতিটি পাওয়া যায়নি",
  "Select a file": "একটি ফাইল নির্বাচন করুন",
  "Record not found": "নথিটি পাওয়া যায়নি",
  "Doctor account required": "চিকিৎসকের অ্যাকাউন্ট প্রয়োজন",
  "Endpoint not found": "এন্ডপয়েন্টটি পাওয়া যায়নি",
  "Enter a valid Bangladeshi mobile number": "একটি সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন",
  "Invalid identifier": "পরিচিতিটি সঠিক নয়",
  "Too many attempts. Please try again later.": "অনেকবার চেষ্টা করা হয়েছে। পরে আবার চেষ্টা করুন।",
  "Request origin is not allowed": "এই অনুরোধের উৎস অনুমোদিত নয়",
  "An admin-reviewed doctor account is required": "প্রশাসক-পর্যালোচিত চিকিৎসক অ্যাকাউন্ট প্রয়োজন",
  "No active permission": "কোনো কার্যকর অনুমতি নেই",
  "Passwords do not match": "পাসওয়ার্ড দুটি মেলেনি",
  "Complete all professional details": "পেশাগত সব তথ্য পূরণ করুন",
  "Invalid recovery details": "পুনরুদ্ধারের তথ্য সঠিক নয়",
  "Patient account required": "রোগীর অ্যাকাউন্ট প্রয়োজন",
  "Select at least one document": "অন্তত একটি নথি নির্বাচন করুন",
  "Invalid document selection": "নথি নির্বাচন সঠিক নয়",
  "Pending request not found": "অপেক্ষমাণ অনুরোধটি পাওয়া যায়নি",
  "Medical document storage limit reached": "চিকিৎসা-নথি সংরক্ষণের সীমা পূর্ণ হয়েছে",
  "The uploaded file is empty": "আপলোড করা ফাইলটি খালি",
  "File exceeds configured size limit": "ফাইলটি নির্ধারিত আকারের সীমা ছাড়িয়েছে",
  "Processing is already queued": "প্রক্রিয়াকরণের কাজটি আগে থেকেই সারিতে আছে",
  "AI answer was not valid. Please retry.": "এআইয়ের উত্তরটি সঠিক ছিল না। আবার চেষ্টা করুন।",
  "AI citation validation failed. Please retry.": "এআইয়ের সূত্র যাচাই করা যায়নি। আবার চেষ্টা করুন।",
  "Please fill out this field.": "অনুগ্রহ করে এই ঘরটি পূরণ করুন।",
  "Please check this field.": "অনুগ্রহ করে এই তথ্যটি যাচাই করুন।",
  "PATIENT WORKSPACE": "রোগীর ওয়ার্কস্পেস",
  "DOCTOR WORKSPACE": "চিকিৎসকের ওয়ার্কস্পেস",
  "ADMIN WORKSPACE": "প্রশাসকের ওয়ার্কস্পেস",
  "PATIENT": "রোগী",
  "DOCTOR": "চিকিৎসক",
  "ADMIN": "প্রশাসক",
  "Welcome back,": "আবার স্বাগতম,",
  "there": "আপনি",
  "LAB": "ল্যাব",
  "LAB_REPORT": "ল্যাব রিপোর্ট",
  "PRESCRIPTION": "প্রেসক্রিপশন",
  "CLINICAL_NOTE": "চিকিৎসা-নোট",
  "DIAGNOSTIC_REPORT": "পরীক্ষা-নিরীক্ষার রিপোর্ট",
  "DISCHARGE_SUMMARY": "হাসপাতাল থেকে ছাড়পত্রের সারাংশ",
  "OTHER_MEDICAL": "অন্যান্য চিকিৎসা-নথি",
  "NON_MEDICAL": "চিকিৎসা-সংক্রান্ত নয়",
  "UNKNOWN": "অজানা",
  "ALL": "সব",
  "SELECTED": "নির্বাচিত",
  "UPLOADED": "আপলোড হয়েছে",
  "QUEUED": "সারিতে আছে",
  "PROCESSING": "প্রক্রিয়াধীন",
  "NEEDS_REVIEW": "পর্যালোচনা প্রয়োজন",
  "COMPLETED": "সম্পন্ন",
  "FAILED": "ব্যর্থ",
  "PATIENT_CONFIRMED": "রোগী নিশ্চিত করেছেন",
  "CLINICIAN_VERIFIED": "চিকিৎসক যাচাই করেছেন",
  "CLINICIAN_AUTHORED": "চিকিৎসকের লেখা",
  "UNREVIEWED": "পর্যালোচনা হয়নি",
  "ACTIVE": "সক্রিয়",
  "SUSPENDED": "স্থগিত",
  "APPROVED": "অনুমোদিত",
  "REJECTED": "প্রত্যাখ্যাত",
  "PENDING": "অপেক্ষমাণ",
  "READ_RECORDS": "নথি দেখা",
  "QUERY_MEDICAL_HISTORY": "চিকিৎসার ইতিহাস অনুসন্ধান",
  "ADD_CLINICAL_DOCUMENT": "চিকিৎসা-নথি যোগ",
  "CREATE_OUTPATIENT_ENCOUNTER": "বহির্বিভাগীয় সাক্ষাতের তথ্য তৈরি",
  "LOW": "কম",
  "NORMAL": "স্বাভাবিক",
  "HIGH": "বেশি",
  "You decide who gets access.": "কারা প্রবেশাধিকার পাবেন, তা আপনিই ঠিক করেন।",
  "Request access to a patient.": "একজন রোগীর কাছে প্রবেশাধিকারের অনুরোধ করুন।",
  "Create a single-use code, valid for 10 minutes. A code only starts a request.":
    "১০ মিনিটের জন্য বৈধ একবার-ব্যবহারযোগ্য কোড তৈরি করুন। কোডটি শুধু অনুরোধ শুরু করে।",
  "Ask the patient for a sharing code. They must approve your request.":
    "রোগীর কাছে শেয়ারিং কোড চান। আপনার অনুরোধটি রোগীকে অনুমোদন করতে হবে।",
  "Approval means admin-reviewed, not official regulatory verification.":
    "অনুমোদন মানে প্রশাসনিক পর্যালোচনা; সরকারি নিয়ন্ত্রক সংস্থার যাচাই নয়।",
  "This report was queued or processing.": "এই রিপোর্টটি সারিতে আছে বা প্রক্রিয়াধীন।",
  "The processing worker extracts text and structured medical details. Refresh to check progress.":
    "প্রক্রিয়াকরণ কর্মী লেখা ও চিকিৎসা-তথ্য শনাক্ত করে। অগ্রগতি দেখতে রিফ্রেশ করুন।",
  "Patient access is available only after admin approval.":
    "প্রশাসকের অনুমোদনের পরই রোগীর নথিতে প্রবেশ করা যাবে।",
  "Has a valid code": "বৈধ কোড আছে",
  "Checking…": "যাচাই হচ্ছে…",
  "Encounters": "সাক্ষাৎ",
  "Chief complaint": "প্রধান সমস্যা",
  "Relevant history": "প্রাসঙ্গিক ইতিহাস",
  "Doctor-recorded diagnosis": "চিকিৎসকের নথিভুক্ত রোগ-নির্ণয়",
  "Test orders": "পরীক্ষার নির্দেশ",
  "Follow-up instructions": "পরবর্তী করণীয়",
  "Encounter date": "সাক্ষাতের তারিখ",
  "Organization": "প্রতিষ্ঠান",
  "Share with your doctor": "আপনার চিকিৎসকের সঙ্গে শেয়ার করুন",
  "Request patient permission": "রোগীর অনুমতি চান",
  "Referral": "রেফারেল",
  "There are no records to show.": "দেখানোর মতো কোনো নথি নেই।",
  "LAB REPORT": "ল্যাব রিপোর্ট",
  "DIAGNOSTIC": "পরীক্ষা-নিরীক্ষা",
  "OTHER": "অন্যান্য",
  "all": "সব",
  "selected": "নির্বাচিত",
  "lab": "ল্যাব",
  "prescription": "প্রেসক্রিপশন",
  "clinical note": "চিকিৎসা-নোট",
  "diagnostic": "পরীক্ষা-নিরীক্ষা",
  "other": "অন্যান্য",
  "unknown": "অজানা",
  "uploaded": "আপলোড হয়েছে",
  "queued": "সারিতে আছে",
  "processing": "প্রক্রিয়াধীন",
  "needs review": "পর্যালোচনা প্রয়োজন",
  "completed": "সম্পন্ন",
  "failed": "ব্যর্থ",
  "patient confirmed": "রোগী নিশ্চিত করেছেন",
  "clinician verified": "চিকিৎসক যাচাই করেছেন",
  "clinician authored": "চিকিৎসকের লেখা",
  "unreviewed": "পর্যালোচনা হয়নি",
  "active": "কার্যকর",
  "revoked": "বাতিল",
  "expired": "মেয়াদোত্তীর্ণ",
  "pending": "অপেক্ষমাণ",
  "approved": "অনুমোদিত",
  "rejected": "প্রত্যাখ্যাত",
  "all records": "সব নথি",
  "read records": "নথি দেখা",
  "query medical history": "চিকিৎসার ইতিহাস অনুসন্ধান",
  "add clinical document": "চিকিৎসা-নথি যোগ",
  "create outpatient encounter": "বহির্বিভাগীয় সাক্ষাতের তথ্য তৈরি",
  "uploaded and queued. Run the processing worker, then review extracted details.":
    "আপলোড করে সারিতে রাখা হয়েছে। প্রক্রিয়াকরণ কর্মী চালান, তারপর শনাক্ত করা তথ্য যাচাই করুন।",
  "Document not found": "নথিটি পাওয়া যায়নি",
  "has": "আছে",
  "Accounts": "অ্যাকাউন্ট",
  "Business": "প্রতিষ্ঠান",
  "Medical records are private.": "চিকিৎসা-নথি ব্যক্তিগত।",
  "Select an option": "একটি বিকল্প নির্বাচন করুন",
  "The selected file type is not supported.": "নির্বাচিত ফাইলের ধরনটি সমর্থিত নয়।",
  "No matching records": "মিল থাকা কোনো নথি নেই",
  "Could not load this page.": "এই পৃষ্ঠাটি লোড করা যায়নি।",
  "Account is unavailable": "অ্যাকাউন্টটি পাওয়া যাচ্ছে না",
  "Toggle menu": "মেনু খুলুন বা বন্ধ করুন",
  "Show password": "পাসওয়ার্ড দেখান",
  "Hide password": "পাসওয়ার্ড লুকান",
  "Sharing code": "শেয়ারিং কোড",
  "Original report preview": "মূল রিপোর্টের প্রিভিউ",
  "Download": "ডাউনলোড",
  "Remove": "সরান",
  "No access": "প্রবেশাধিকার নেই",
  "No original file": "কোনো মূল ফাইল নেই",
  "date": "তারিখ",
  "organization": "প্রতিষ্ঠান",
  "chiefComplaint": "প্রধান সমস্যা",
  "notes": "নোট",
  "history": "ইতিহাস",
  "diagnosis": "রোগ-নির্ণয়",
  "testOrders": "পরীক্ষার নির্দেশ",
  "followUp": "পরবর্তী করণীয়",
  "account created": "অ্যাকাউন্ট তৈরি",
  "password recovered": "পাসওয়ার্ড পুনরুদ্ধার",
  "password changed": "পাসওয়ার্ড পরিবর্তন",
  "doctor approved": "চিকিৎসক অনুমোদিত",
  "doctor rejected": "চিকিৎসক প্রত্যাখ্যাত",
  "account suspended": "অ্যাকাউন্ট স্থগিত",
  "account active": "অ্যাকাউন্ট সক্রিয়",
  "access revoked": "প্রবেশাধিকার বাতিল",
  "records viewed": "নথি দেখা হয়েছে",
  "documents requeued": "নথি আবার সারিতে দেওয়া হয়েছে",
  "document downloaded": "নথি ডাউনলোড",
  "extraction reviewed": "শনাক্ত করা তথ্য পর্যালোচনা",
  "encounter created": "সাক্ষাতের তথ্য তৈরি",
  "access requested": "প্রবেশাধিকারের অনুরোধ",
  "access approved": "প্রবেশাধিকার অনুমোদিত",
  "access rejected": "প্রবেশাধিকার প্রত্যাখ্যাত",
  "document uploaded": "নথি আপলোড",
  "document processed": "নথি প্রক্রিয়াকরণ",
  "history queried": "ইতিহাস অনুসন্ধান",
  "ocr extracted": "OCR থেকে তথ্য শনাক্ত",
  "ai extracted": "এআই থেকে তথ্য শনাক্ত",
  "text extracted": "লেখা শনাক্ত",
  "ocr completed": "OCR সম্পন্ন",
  "skipped non medical": "চিকিৎসা-সংক্রান্ত নয় বলে বাদ",
  "extracted": "শনাক্ত হয়েছে",
  "patient": "রোগী",
  "doctor": "চিকিৎসক",
  "admin": "প্রশাসক",
  "Configure AUTH_SECRET with at least 32 random characters":
    "কমপক্ষে ৩২টি এলোমেলো অক্ষরের AUTH_SECRET সেট করুন",
  "Admin review is required before requesting access":
    "প্রবেশাধিকারের অনুরোধের আগে প্রশাসকের পর্যালোচনা প্রয়োজন",
  "Sharing code is invalid, expired, or already used":
    "শেয়ারিং কোডটি সঠিক নয়, মেয়াদ শেষ হয়েছে, অথবা আগে ব্যবহার করা হয়েছে",
  "Access is missing, expired, revoked, or outside the approved scope":
    "প্রবেশাধিকার নেই, মেয়াদ শেষ, বাতিল, অথবা অনুমোদিত পরিধির বাইরে",
  "Only actual PDF, PNG, JPG and WEBP files are supported":
    "শুধু প্রকৃত PDF, PNG, JPG ও WEBP ফাইল সমর্থিত",
  "Unable to register these account details. Try signing in or recovery.":
    "এই অ্যাকাউন্টের তথ্য দিয়ে নিবন্ধন করা যায়নি। সাইন ইন বা অ্যাকাউন্ট পুনরুদ্ধারের চেষ্টা করুন।",
  "This is a clinical note; no original file exists":
    "এটি চিকিৎসা-নোট; এর কোনো মূল ফাইল নেই",
  "Only the patient can review or retry a report":
    "শুধু রোগীই রিপোর্ট যাচাই বা পুনরায় প্রক্রিয়াকরণ করতে পারেন",
  "Wait for extraction before reviewing this report":
    "এই রিপোর্ট যাচাইয়ের আগে তথ্য শনাক্তকরণ শেষ হওয়া পর্যন্ত অপেক্ষা করুন",
  "Service unavailable. The server hit an unexpected error while handling this request.":
    "সেবা পাওয়া যাচ্ছে না। অনুরোধটি পরিচালনার সময় সার্ভারে অপ্রত্যাশিত ত্রুটি হয়েছে।",
  "Uploading": "আপলোড হচ্ছে",
  "There is no original file": "কোনো মূল ফাইল নেই",
  "More context. A better-informed visit.": "আরও প্রাসঙ্গিক তথ্য। আরও তথ্যভিত্তিক সাক্ষাৎ।",
} satisfies Record<string, string>;

type TranslationKey = keyof typeof translations;

const messages: Record<Locale, Record<TranslationKey, string>> = {
  en: Object.fromEntries(
    Object.keys(translations).map((text) => [text, text]),
  ) as Record<TranslationKey, string>,
  bn: translations,
};

const context = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
} | null>(null);

function normalized(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function isTranslationKey(key: string): key is TranslationKey {
  return Object.prototype.hasOwnProperty.call(translations, key);
}

export function translate(text: string, locale: Locale) {
  const key = normalized(text);
  if (!key) return text;
  const translated = isTranslationKey(key) ? messages[locale][key] : text;
  if (translated === text) return text;
  const leading = text.match(/^\s*/)?.[0] ?? "";
  const trailing = text.match(/\s*$/)?.[0] ?? "";
  return leading + translated + trailing;
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setCurrentLocale] = useState(initialLocale);

  async function setLocale(nextLocale: Locale) {
    await saveLocale(nextLocale);
    setCurrentLocale(nextLocale);
    document.documentElement.lang = nextLocale === "bn" ? "bn" : "en";
  }

  return (
    <context.Provider value={{ locale, setLocale }}>
      {children}
    </context.Provider>
  );
}

export function useI18n() {
  const value = useContext(context);
  if (!value) throw new Error("useI18n must be used within LocaleProvider");
  return value;
}

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const [error, setError] = useState(false);
  const nextLocale = locale === "en" ? "bn" : "en";

  async function changeLocale() {
    setError(false);
    try {
      await setLocale(nextLocale);
    } catch {
      setError(true);
    }
  }

  return (
    <span className={"locale-switcher " + className}>
      <button
        type="button"
        className="language"
        aria-label={translate(
          locale === "en"
            ? "Switch language to Bangla"
            : "Switch language to English",
          locale,
        )}
        onClick={() => void changeLocale()}
      >
        {locale === "en" ? "বাংলা" : translate("English", locale)}
      </button>
      {error && (
        <span className="locale-error" role="alert">
          Could not save your language preference.
        </span>
      )}
    </span>
  );
}

const translatableAttributes = [
  "aria-label",
  "aria-description",
  "placeholder",
  "title",
  "alt",
  "data-label",
] as const;

function localizeNode(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === "string") return translate(node, locale);
  if (Array.isArray(node))
    return Children.map(node, (child) => localizeNode(child, locale));
  if (!isValidElement(node)) return node;

  const props = node.props as Record<string, unknown>;
  const className = typeof props.className === "string" ? props.className : "";
  if (
    props.translate === "no" ||
    /(^|\s)(medical-content|medical-value)(\s|$)/.test(className) ||
    ["CODE", "PRE", "SVG"].includes(
      typeof node.type === "string" ? node.type.toUpperCase() : "",
    )
  )
    return node;

  const localizedProps: Record<string, unknown> = {};
  for (const attribute of translatableAttributes) {
    const value = props[attribute];
    if (typeof value === "string")
      localizedProps[attribute] = translate(value, locale);
  }
  if ("children" in props)
    localizedProps.children = localizeNode(props.children as ReactNode, locale);
  if (
    typeof node.type === "string" &&
    ["INPUT", "SELECT", "TEXTAREA"].includes(node.type.toUpperCase())
  ) {
    const previousInvalid = props.onInvalid;
    const previousInput = props.onInput;
    localizedProps.onInvalid = (event: React.InvalidEvent<HTMLElement>) => {
      const control = event.currentTarget as HTMLInputElement;
      control.setCustomValidity(
        translate(
          control.validity.valueMissing
            ? "Please fill out this field."
            : "Please check this field.",
          locale,
        ),
      );
      if (typeof previousInvalid === "function") previousInvalid(event);
    };
    localizedProps.onInput = (event: React.FormEvent<HTMLElement>) => {
      (event.currentTarget as HTMLInputElement).setCustomValidity("");
      if (typeof previousInput === "function") previousInput(event);
    };
  }

  return cloneElement(
    node as React.ReactElement<Record<string, unknown>>,
    localizedProps,
  );
}

export function Localize({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  return <>{Children.map(children, (child) => localizeNode(child, locale))}</>;
}
