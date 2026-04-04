/**
 * Nivedan — i18n translation store
 * Supports: English, Hindi, Telugu, Tamil, Kannada, Malayalam
 * Same reactive pub/sub pattern as theme.ts — any component calling
 * useTranslation() re-renders automatically when language changes.
 */
import { useState, useEffect } from "react";
import { saveSecure, loadSecure } from "../utils/storage";

// ── Types ──────────────────────────────────────────────────────────────────────

export type LangCode = "en" | "hi" | "te" | "ta" | "kn" | "ml";

export interface Strings {
  // Navigation tabs
  tabHome: string;
  tabMyCases: string;
  tabProfile: string;

  // Home screen
  greeting: string;           // supports {{name}}
  tagline: string;
  newToFiling: string;
  letAiGuide: string;
  startComplaint: string;
  categories: string;
  viewAll: string;
  recentCasesTitle: string;
  noCasesYet: string;
  seeAllCases: string;

  // Dashboard
  myCasesHeader: string;
  fileFromHome: string;
  couldNotLoad: string;
  retry: string;
  deleteComplaintTitle: string;
  deleteConfirm: string;
  cancel: string;
  deleteBtn: string;
  couldNotDelete: string;
  errorTitle: string;

  // Profile
  accountInfo: string;
  languageLabel: string;
  accountId: string;
  appSection: string;
  appearance: string;
  darkMode: string;
  lightMode: string;
  versionLabel: string;
  aboutLabel: string;
  aboutValue: string;
  signOutBtn: string;
  signOutTitle: string;
  signOutConfirm: string;
  copyright: string;
  changeLanguage: string;
  selectLanguage: string;
  newComplaint: string;
  selectCategory: string;
  viewIntro: string;

  // Status labels
  statusPending: string;
  statusSubmitted: string;
  statusFiled: string;
  statusAcknowledged: string;
  statusUnderReview: string;
  statusInProgress: string;
  statusResolved: string;
  statusFailed: string;

  // Category labels (keyed by category ID)
  cat_labor_issues: string;
  cat_police_criminal: string;
  cat_consumer_complaint: string;
  cat_cyber_fraud: string;

  // Subcategory labels (keyed by subcategory ID)
  sub_salary_not_paid: string;
  sub_wrongful_termination: string;
  sub_workplace_harassment: string;
  sub_file_fir: string;
  sub_police_detention: string;
  sub_bail_process: string;
  sub_product_defect: string;
  sub_service_fraud: string;
  sub_refund_denied: string;
  sub_online_scam: string;
  sub_account_hack: string;
  sub_phishing: string;

  // Subcategory descriptions
  subdesc_salary_not_paid: string;
}

// ── Translation map ────────────────────────────────────────────────────────────

export const TRANSLATIONS: Record<LangCode, Strings> = {

  // ── English ────────────────────────────────────────────────────────────────
  en: {
    tabHome: "Home",
    tabMyCases: "My Cases",
    tabProfile: "Profile",
    greeting: "Hi {{name}}",
    tagline: "What issue can we help you with today?",
    newToFiling: "New to filing?",
    letAiGuide: "Let AI guide you",
    startComplaint: "Start your first complaint  →",
    categories: "Categories",
    viewAll: "View All",
    recentCasesTitle: "RECENT CASES",
    noCasesYet: "No cases yet",
    seeAllCases: "See all cases →",
    myCasesHeader: "My Cases",
    fileFromHome: "File a complaint from the Home tab",
    couldNotLoad: "Could not load cases.",
    retry: "Retry",
    deleteComplaintTitle: "Delete complaint",
    deleteConfirm: "This will permanently delete this pending complaint. Are you sure?",
    cancel: "Cancel",
    deleteBtn: "Delete",
    couldNotDelete: "Could not delete complaint.",
    errorTitle: "Error",
    accountInfo: "Account Info",
    languageLabel: "Language",
    accountId: "Account ID",
    appSection: "App",
    appearance: "Appearance",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    versionLabel: "Version",
    aboutLabel: "About",
    aboutValue: "AI-powered civic grievance platform",
    signOutBtn: "Sign out",
    signOutTitle: "Sign out",
    signOutConfirm: "Are you sure you want to sign out?",
    copyright: "© 2026 Nivedan. All rights reserved.",
    changeLanguage: "Change Language",
    selectLanguage: "Select Language",
    newComplaint: "New Complaint",
    selectCategory: "Select a category",
    viewIntro: "View intro",
    statusPending: "Pending",
    statusSubmitted: "Submitted",
    statusFiled: "Filed",
    statusAcknowledged: "Acknowledged",
    statusUnderReview: "Under Review",
    statusInProgress: "In Progress",
    statusResolved: "Resolved",
    statusFailed: "Failed",
    cat_labor_issues: "Labor Issues",
    cat_police_criminal: "Police & Criminal",
    cat_consumer_complaint: "Consumer Complaint",
    cat_cyber_fraud: "Cyber Fraud",
    sub_salary_not_paid: "Salary Not Paid",
    sub_wrongful_termination: "Wrongful Termination",
    sub_workplace_harassment: "Workplace Harassment",
    sub_file_fir: "File an FIR",
    sub_police_detention: "Wrongful Detention",
    sub_bail_process: "Bail Process",
    sub_product_defect: "Product Defect",
    sub_service_fraud: "Service Fraud",
    sub_refund_denied: "Refund Denied",
    sub_online_scam: "Online Scam / Fraud",
    sub_account_hack: "Account Hacked",
    sub_phishing: "Phishing Attack",
    subdesc_salary_not_paid: "Employer has not paid your salary",
  },

  // ── Hindi ──────────────────────────────────────────────────────────────────
  hi: {
    tabHome: "होम",
    tabMyCases: "मेरे केस",
    tabProfile: "प्रोफ़ाइल",
    greeting: "नमस्ते {{name}}",
    tagline: "आज आपकी किस समस्या में हम मदद कर सकते हैं?",
    newToFiling: "पहली बार शिकायत दर्ज कर रहे हैं?",
    letAiGuide: "AI आपकी मदद करेगी",
    startComplaint: "अपनी पहली शिकायत शुरू करें  →",
    categories: "श्रेणियाँ",
    viewAll: "सभी देखें",
    recentCasesTitle: "हाल के केस",
    noCasesYet: "अभी कोई केस नहीं",
    seeAllCases: "सभी केस देखें →",
    myCasesHeader: "मेरे केस",
    fileFromHome: "होम टैब से शिकायत दर्ज करें",
    couldNotLoad: "केस लोड नहीं हो सके।",
    retry: "पुनः प्रयास",
    deleteComplaintTitle: "शिकायत हटाएं",
    deleteConfirm: "क्या आप वाकई इस लंबित शिकायत को हटाना चाहते हैं?",
    cancel: "रद्द करें",
    deleteBtn: "हटाएं",
    couldNotDelete: "शिकायत नहीं हटा सकते।",
    errorTitle: "त्रुटि",
    accountInfo: "खाता जानकारी",
    languageLabel: "भाषा",
    accountId: "खाता आईडी",
    appSection: "ऐप",
    appearance: "दिखावट",
    darkMode: "डार्क मोड",
    lightMode: "लाइट मोड",
    versionLabel: "संस्करण",
    aboutLabel: "के बारे में",
    aboutValue: "AI-संचालित नागरिक शिकायत मंच",
    signOutBtn: "साइन आउट",
    signOutTitle: "साइन आउट",
    signOutConfirm: "क्या आप साइन आउट करना चाहते हैं?",
    copyright: "© 2026 निवेदन. सर्वाधिकार सुरक्षित।",
    changeLanguage: "भाषा बदलें",
    selectLanguage: "भाषा चुनें",
    newComplaint: "नई शिकायत",
    selectCategory: "श्रेणी चुनें",
    viewIntro: "परिचय देखें",
    statusPending: "लंबित",
    statusSubmitted: "जमा किया",
    statusFiled: "दाखिल",
    statusAcknowledged: "स्वीकृत",
    statusUnderReview: "समीक्षाधीन",
    statusInProgress: "प्रगति में",
    statusResolved: "हल हो गया",
    statusFailed: "विफल",
    cat_labor_issues: "श्रम मुद्दे",
    cat_police_criminal: "पुलिस और अपराध",
    cat_consumer_complaint: "उपभोक्ता शिकायत",
    cat_cyber_fraud: "साइबर धोखाधड़ी",
    sub_salary_not_paid: "वेतन नहीं मिला",
    sub_wrongful_termination: "अनुचित बर्खास्तगी",
    sub_workplace_harassment: "कार्यस्थल उत्पीड़न",
    sub_file_fir: "FIR दर्ज करें",
    sub_police_detention: "अनुचित हिरासत",
    sub_bail_process: "जमानत प्रक्रिया",
    sub_product_defect: "उत्पाद दोष",
    sub_service_fraud: "सेवा धोखाधड़ी",
    sub_refund_denied: "धनवापसी नहीं मिली",
    sub_online_scam: "ऑनलाइन धोखाधड़ी",
    sub_account_hack: "खाता हैक",
    sub_phishing: "फ़िशिंग हमला",
    subdesc_salary_not_paid: "नियोक्ता ने आपका वेतन नहीं दिया",
  },

  // ── Telugu ─────────────────────────────────────────────────────────────────
  te: {
    tabHome: "హోమ్",
    tabMyCases: "నా కేసులు",
    tabProfile: "ప్రొఫైల్",
    greeting: "నమస్కారం {{name}}",
    tagline: "ఈరోజు మీకు ఏ సమస్యలో సహాయం చేయాలి?",
    newToFiling: "మొదటిసారి దాఖలు చేస్తున్నారా?",
    letAiGuide: "AI మీకు మార్గదర్శనం చేస్తుంది",
    startComplaint: "మీ మొదటి ఫిర్యాదు ప్రారంభించండి  →",
    categories: "వర్గాలు",
    viewAll: "అన్నీ చూడండి",
    recentCasesTitle: "ఇటీవలి కేసులు",
    noCasesYet: "ఇంకా కేసులు లేవు",
    seeAllCases: "అన్ని కేసులు చూడండి →",
    myCasesHeader: "నా కేసులు",
    fileFromHome: "హోమ్ ట్యాబ్ నుండి ఫిర్యాదు దాఖలు చేయండి",
    couldNotLoad: "కేసులు లోడ్ చేయలేకపోయాం.",
    retry: "మళ్ళీ ప్రయత్నించండి",
    deleteComplaintTitle: "ఫిర్యాదు తొలగించండి",
    deleteConfirm: "ఈ పెండింగ్ ఫిర్యాదును శాశ్వతంగా తొలగించాలనుకుంటున్నారా?",
    cancel: "రద్దు చేయండి",
    deleteBtn: "తొలగించు",
    couldNotDelete: "ఫిర్యాదు తొలగించలేకపోయాం.",
    errorTitle: "లోపం",
    accountInfo: "ఖాతా సమాచారం",
    languageLabel: "భాష",
    accountId: "ఖాతా ID",
    appSection: "యాప్",
    appearance: "రూపం",
    darkMode: "డార్క్ మోడ్",
    lightMode: "లైట్ మోడ్",
    versionLabel: "వెర్షన్",
    aboutLabel: "గురించి",
    aboutValue: "AI-ఆధారిత పౌర ఫిర్యాదు వేదిక",
    signOutBtn: "సైన్ అవుట్",
    signOutTitle: "సైన్ అవుట్",
    signOutConfirm: "సైన్ అవుట్ చేయాలనుకుంటున్నారా?",
    copyright: "© 2026 నివేదన్. అన్ని హక్కులు పొందుపరచబడ్డాయి.",
    changeLanguage: "భాష మార్చండి",
    selectLanguage: "భాష ఎంచుకోండి",
    newComplaint: "నూతన ఫిర్యాదు",
    selectCategory: "వర్గం ఎంచుకోండి",
    viewIntro: "పరిచయం చూడండి",
    statusPending: "పెండింగ్",
    statusSubmitted: "సమర్పించారు",
    statusFiled: "దాఖలు",
    statusAcknowledged: "స్వీకరించారు",
    statusUnderReview: "సమీక్షలో",
    statusInProgress: "పురోగతిలో",
    statusResolved: "పరిష్కారమైంది",
    statusFailed: "విఫలమైంది",
    cat_labor_issues: "కార్మిక సమస్యలు",
    cat_police_criminal: "పోలీస్ మరియు నేర",
    cat_consumer_complaint: "వినియోగదారు ఫిర్యాదు",
    cat_cyber_fraud: "సైబర్ మోసం",
    sub_salary_not_paid: "జీతం చెల్లించలేదు",
    sub_wrongful_termination: "అన్యాయమైన తొలగింపు",
    sub_workplace_harassment: "కార్యాలయ వేధింపు",
    sub_file_fir: "FIR దాఖలు చేయండి",
    sub_police_detention: "అన్యాయమైన నిర్బంధం",
    sub_bail_process: "బెయిల్ ప్రక్రియ",
    sub_product_defect: "ఉత్పత్తి లోపం",
    sub_service_fraud: "సేవా మోసం",
    sub_refund_denied: "వాపసు తిరస్కరించారు",
    sub_online_scam: "ఆన్‌లైన్ మోసం",
    sub_account_hack: "ఖాతా హాక్",
    sub_phishing: "ఫిషింగ్ దాడి",
    subdesc_salary_not_paid: "యజమాని మీ జీతం చెల్లించలేదు",
  },

  // ── Tamil ──────────────────────────────────────────────────────────────────
  ta: {
    tabHome: "முகப்பு",
    tabMyCases: "என் வழக்குகள்",
    tabProfile: "சுயவிவரம்",
    greeting: "வணக்கம் {{name}}",
    tagline: "இன்று உங்களுக்கு என்ன பிரச்சனையில் உதவலாம்?",
    newToFiling: "முதல்முறை தாக்கல் செய்கிறீர்களா?",
    letAiGuide: "AI உங்களை வழிநடத்தும்",
    startComplaint: "உங்கள் முதல் புகாரை தொடங்குங்கள்  →",
    categories: "வகைகள்",
    viewAll: "அனைத்தும் காண்க",
    recentCasesTitle: "சமீபத்திய வழக்குகள்",
    noCasesYet: "இன்னும் வழக்குகள் இல்லை",
    seeAllCases: "அனைத்து வழக்குகளும் காண்க →",
    myCasesHeader: "என் வழக்குகள்",
    fileFromHome: "முகப்பு தாவலிலிருந்து புகார் தாக்கல் செய்யுங்கள்",
    couldNotLoad: "வழக்குகளை ஏற்ற முடியவில்லை.",
    retry: "மீண்டும் முயற்சி",
    deleteComplaintTitle: "புகாரை நீக்கு",
    deleteConfirm: "இந்த நிலுவை புகாரை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?",
    cancel: "ரத்து செய்",
    deleteBtn: "நீக்கு",
    couldNotDelete: "புகாரை நீக்க முடியவில்லை.",
    errorTitle: "பிழை",
    accountInfo: "கணக்கு தகவல்",
    languageLabel: "மொழி",
    accountId: "கணக்கு ID",
    appSection: "பயன்பாடு",
    appearance: "தோற்றம்",
    darkMode: "இருண்ட பயன்முறை",
    lightMode: "ஒளி பயன்முறை",
    versionLabel: "பதிப்பு",
    aboutLabel: "பற்றி",
    aboutValue: "AI-இயக்கப்படும் குடிமக்கள் புகார் தளம்",
    signOutBtn: "வெளியேறு",
    signOutTitle: "வெளியேறு",
    signOutConfirm: "வெளியேற விரும்புகிறீர்களா?",
    copyright: "© 2026 நிவேதன். அனைத்து உரிமைகளும் பாதுகாக்கப்படுகின்றன.",
    changeLanguage: "மொழியை மாற்று",
    selectLanguage: "மொழியை தேர்வு செய்யுங்கள்",
    newComplaint: "புதிய புகார்",
    selectCategory: "வகை தேர்ந்தெடு",
    viewIntro: "அறிமுகத்தை காண்க",
    statusPending: "நிலுவையில்",
    statusSubmitted: "சமர்ப்பிக்கப்பட்டது",
    statusFiled: "தாக்கல் செய்யப்பட்டது",
    statusAcknowledged: "ஏற்றுக்கொள்ளப்பட்டது",
    statusUnderReview: "மதிப்பீட்டில்",
    statusInProgress: "நடவடிக்கையில்",
    statusResolved: "தீர்க்கப்பட்டது",
    statusFailed: "தோல்வியுற்றது",
    cat_labor_issues: "தொழிலாளர் பிரச்சனைகள்",
    cat_police_criminal: "போலீஸ் மற்றும் குற்றம்",
    cat_consumer_complaint: "நுகர்வோர் புகார்",
    cat_cyber_fraud: "இணைய மோசடி",
    sub_salary_not_paid: "சம்பளம் கொடுக்கவில்லை",
    sub_wrongful_termination: "தவறான பணிநீக்கம்",
    sub_workplace_harassment: "பணியிட தொல்லை",
    sub_file_fir: "FIR தாக்கல் செய்யுங்கள்",
    sub_police_detention: "தவறான தடுப்புக்காவல்",
    sub_bail_process: "ஜாமீன் செயல்முறை",
    sub_product_defect: "பொருள் குறைபாடு",
    sub_service_fraud: "சேவை மோசடி",
    sub_refund_denied: "பணம் திரும்பப் பெறவில்லை",
    sub_online_scam: "ஆன்லைன் மோசடி",
    sub_account_hack: "கணக்கு ஹேக்",
    sub_phishing: "ஃபிஷிங் தாக்குதல்",
    subdesc_salary_not_paid: "முதலாளி உங்கள் சம்பளம் கொடுக்கவில்லை",
  },

  // ── Kannada ────────────────────────────────────────────────────────────────
  kn: {
    tabHome: "ಮನೆ",
    tabMyCases: "ನನ್ನ ಪ್ರಕರಣಗಳು",
    tabProfile: "ಪ್ರೊಫೈಲ್",
    greeting: "ನಮಸ್ಕಾರ {{name}}",
    tagline: "ಇಂದು ನಿಮಗೆ ಯಾವ ಸಮಸ್ಯೆಯಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಹುದು?",
    newToFiling: "ಮೊದಲ ಬಾರಿ ಸಲ್ಲಿಸುತ್ತಿದ್ದೀರಾ?",
    letAiGuide: "AI ನಿಮಗೆ ಮಾರ್ಗದರ್ಶನ ಮಾಡುತ್ತದೆ",
    startComplaint: "ನಿಮ್ಮ ಮೊದಲ ದೂರು ಪ್ರಾರಂಭಿಸಿ  →",
    categories: "ವರ್ಗಗಳು",
    viewAll: "ಎಲ್ಲವನ್ನೂ ನೋಡಿ",
    recentCasesTitle: "ಇತ್ತೀಚಿನ ಪ್ರಕರಣಗಳು",
    noCasesYet: "ಇನ್ನು ಯಾವುದೇ ಪ್ರಕರಣಗಳಿಲ್ಲ",
    seeAllCases: "ಎಲ್ಲಾ ಪ್ರಕರಣಗಳನ್ನು ನೋಡಿ →",
    myCasesHeader: "ನನ್ನ ಪ್ರಕರಣಗಳು",
    fileFromHome: "ಹೋಮ್ ಟ್ಯಾಬ್‌ನಿಂದ ದೂರು ಸಲ್ಲಿಸಿ",
    couldNotLoad: "ಪ್ರಕರಣಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    deleteComplaintTitle: "ದೂರು ಅಳಿಸಿ",
    deleteConfirm: "ಈ ಬಾಕಿ ಇರುವ ದೂರನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಬಯಸುತ್ತೀರಾ?",
    cancel: "ರದ್ದು ಮಾಡಿ",
    deleteBtn: "ಅಳಿಸಿ",
    couldNotDelete: "ದೂರು ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    errorTitle: "ದೋಷ",
    accountInfo: "ಖಾತೆ ಮಾಹಿತಿ",
    languageLabel: "ಭಾಷೆ",
    accountId: "ಖಾತೆ ID",
    appSection: "ಅಪ್ಲಿಕೇಶನ್",
    appearance: "ನೋಟ",
    darkMode: "ಡಾರ್ಕ್ ಮೋಡ್",
    lightMode: "ಲೈಟ್ ಮೋಡ್",
    versionLabel: "ಆವೃತ್ತಿ",
    aboutLabel: "ಬಗ್ಗೆ",
    aboutValue: "AI-ಚಾಲಿತ ನಾಗರಿಕ ದೂರು ವೇದಿಕೆ",
    signOutBtn: "ಸೈನ್ ಔಟ್",
    signOutTitle: "ಸೈನ್ ಔಟ್",
    signOutConfirm: "ನೀವು ಸೈನ್ ಔಟ್ ಮಾಡಲು ಬಯಸುತ್ತೀರಾ?",
    copyright: "© 2026 ನಿವೇದನ. ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.",
    changeLanguage: "ಭಾಷೆ ಬದಲಾಯಿಸಿ",
    selectLanguage: "ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ",
    newComplaint: "ಹೊಸ ದೂರು",
    selectCategory: "ವಿಭಾಗ ಆಯ್ಕೆ ಮಾಡಿ",
    viewIntro: "ಪರಿಚಯ ನೋಡಿ",
    statusPending: "ಬಾಕಿ",
    statusSubmitted: "ಸಲ್ಲಿಸಲಾಗಿದೆ",
    statusFiled: "ಸಲ್ಲಿಕೆ",
    statusAcknowledged: "ಸ್ವೀಕರಿಸಲಾಗಿದೆ",
    statusUnderReview: "ಪರಿಶೀಲನೆಯಲ್ಲಿ",
    statusInProgress: "ಪ್ರಗತಿಯಲ್ಲಿ",
    statusResolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    statusFailed: "ವಿಫಲವಾಗಿದೆ",
    cat_labor_issues: "ಕಾರ್ಮಿಕ ಸಮಸ್ಯೆಗಳು",
    cat_police_criminal: "ಪೊಲೀಸ್ ಮತ್ತು ಅಪರಾಧ",
    cat_consumer_complaint: "ಗ್ರಾಹಕ ದೂರು",
    cat_cyber_fraud: "ಸೈಬರ್ ವಂಚನೆ",
    sub_salary_not_paid: "ಸಂಬಳ ನೀಡಲಿಲ್ಲ",
    sub_wrongful_termination: "ಅನ್ಯಾಯದ ವಜಾ",
    sub_workplace_harassment: "ಕೆಲಸದ ಸ್ಥಳದ ಕಿರುಕುಳ",
    sub_file_fir: "FIR ಸಲ್ಲಿಸಿ",
    sub_police_detention: "ಅನ್ಯಾಯದ ಬಂಧನ",
    sub_bail_process: "ಜಾಮೀನು ಪ್ರಕ್ರಿಯೆ",
    sub_product_defect: "ಉತ್ಪನ್ನ ದೋಷ",
    sub_service_fraud: "ಸೇವಾ ವಂಚನೆ",
    sub_refund_denied: "ಹಣ ಮರಳಿಸಲಿಲ್ಲ",
    sub_online_scam: "ಆನ್‌ಲೈನ್ ವಂಚನೆ",
    sub_account_hack: "ಖಾತೆ ಹ್ಯಾಕ್",
    sub_phishing: "ಫಿಶಿಂಗ್ ದಾಳಿ",
    subdesc_salary_not_paid: "ಉದ್ಯೋಗದಾತರು ನಿಮ್ಮ ಸಂಬಳ ಕೊಟ್ಟಿಲ್ಲ",
  },

  // ── Malayalam ──────────────────────────────────────────────────────────────
  ml: {
    tabHome: "ഹോം",
    tabMyCases: "എന്റെ കേസുകൾ",
    tabProfile: "പ്രൊഫൈൽ",
    greeting: "നമസ്കാരം {{name}}",
    tagline: "ഇന്ന് നിങ്ങൾക്ക് ഏത് പ്രശ്നത്തിൽ സഹായിക്കാം?",
    newToFiling: "ആദ്യമായി ഫയൽ ചെയ്യുകയാണോ?",
    letAiGuide: "AI നിങ്ങളെ നയിക്കും",
    startComplaint: "നിങ്ങളുടെ ആദ്യ പരാതി ആരംഭിക്കുക  →",
    categories: "വിഭാഗങ്ങൾ",
    viewAll: "എല്ലാം കാണുക",
    recentCasesTitle: "സമീപകാല കേസുകൾ",
    noCasesYet: "ഇതുവരെ കേസുകൾ ഇല്ല",
    seeAllCases: "എല്ലാ കേസുകളും കാണുക →",
    myCasesHeader: "എന്റെ കേസുകൾ",
    fileFromHome: "ഹോം ടാബ് ഉപയോഗിച്ച് പരാതി ഫയൽ ചെയ്യുക",
    couldNotLoad: "കേസുകൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല.",
    retry: "വീണ്ടും ശ്രമിക്കുക",
    deleteComplaintTitle: "പരാതി ഇല്ലാതാക്കുക",
    deleteConfirm: "ഈ തീർപ്പാക്കാത്ത പരാതി സ്ഥിരമായി ഇല്ലാതാക്കണോ?",
    cancel: "റദ്ദാക്കുക",
    deleteBtn: "ഇല്ലാതാക്കുക",
    couldNotDelete: "പരാതി ഇല്ലാതാക്കാൻ കഴിഞ്ഞില്ല.",
    errorTitle: "പിശക്",
    accountInfo: "അക്കൗണ്ട് വിവരങ്ങൾ",
    languageLabel: "ഭാഷ",
    accountId: "അക്കൗണ്ട് ID",
    appSection: "ആപ്പ്",
    appearance: "രൂപം",
    darkMode: "ഡാർക്ക് മോഡ്",
    lightMode: "ലൈറ്റ് മോഡ്",
    versionLabel: "പതിപ്പ്",
    aboutLabel: "കുറിച്ച്",
    aboutValue: "AI-ശക്തിയുള്ള പൗര പരാതി പ്ലാറ്റ്‌ഫോം",
    signOutBtn: "സൈൻ ഔട്ട്",
    signOutTitle: "സൈൻ ഔട്ട്",
    signOutConfirm: "സൈൻ ഔട്ട് ചെയ്യണോ?",
    copyright: "© 2026 നിവേദൻ. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.",
    changeLanguage: "ഭാഷ മാറ്റുക",
    selectLanguage: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    newComplaint: "പുതിയ പരാതി",
    selectCategory: "വിഭാഗം തിരഞ്ഞെടുക്കുക",
    viewIntro: "ആമുഖം കാണുക",
    statusPending: "തീർപ്പാക്കാത്തത്",
    statusSubmitted: "സമർപ്പിച്ചു",
    statusFiled: "ഫയൽ ചെയ്തു",
    statusAcknowledged: "സ്വീകരിച്ചു",
    statusUnderReview: "പരിശോധനയിൽ",
    statusInProgress: "പുരോഗതിയിൽ",
    statusResolved: "പരിഹരിച്ചു",
    statusFailed: "പരാജയപ്പെട്ടു",
    cat_labor_issues: "തൊഴിൽ പ്രശ്നങ്ങൾ",
    cat_police_criminal: "പോലീസ് & കുറ്റകൃത്യം",
    cat_consumer_complaint: "ഉപഭോക്തൃ പരാതി",
    cat_cyber_fraud: "സൈബർ തട്ടിപ്പ്",
    sub_salary_not_paid: "ശമ്പളം കിട്ടിയില്ല",
    sub_wrongful_termination: "അന്യായമായ പിരിച്ചുവിടൽ",
    sub_workplace_harassment: "ജോലിസ്ഥലത്ത് ഉപദ്രവം",
    sub_file_fir: "FIR ഫയൽ ചെയ്യുക",
    sub_police_detention: "അന്യായ തടവ്",
    sub_bail_process: "ജാമ്യ നടപടിക്രമം",
    sub_product_defect: "ഉൽപ്പന്ന തകരാർ",
    sub_service_fraud: "സേവന തട്ടിപ്പ്",
    sub_refund_denied: "പണം തിരികെ നൽകിയില്ല",
    sub_online_scam: "ഓൺലൈൻ തട്ടിപ്പ്",
    sub_account_hack: "അക്കൗണ്ട് ഹാക്ക്",
    sub_phishing: "ഫിഷിംഗ് ആക്രമണം",
    subdesc_salary_not_paid: "തൊഴിലുടമ നിങ്ങളുടെ ശമ്പളം നൽകിയില്ല",
  },
};

// ── Module-level reactive store ────────────────────────────────────────────────

const STORAGE_KEY = "nivedan_language";
let _lang: LangCode = "en";
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((l) => l());
}

/** Switch language globally — persists to secure storage. */
export function setLanguage(lang: LangCode) {
  _lang = lang;
  _notify();
  saveSecure(STORAGE_KEY, lang).catch(() => {});
}

/** Returns current language code without subscribing. */
export function getLanguage(): LangCode {
  return _lang;
}

/** Load persisted preference at startup (call once in root layout). */
export async function loadPersistedLanguage() {
  const saved = await loadSecure(STORAGE_KEY);
  if (saved && saved in TRANSLATIONS) {
    _lang = saved as LangCode;
    _notify();
  }
}

// ── React hook ─────────────────────────────────────────────────────────────────

/** Returns t() translator + current lang. Re-renders when language changes. */
export function useTranslation() {
  const [lang, setLang] = useState<LangCode>(_lang);

  useEffect(() => {
    const listener = () => setLang(_lang);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  /** Translate a key, with optional {{var}} interpolation. */
  function t(key: keyof Strings, vars?: Record<string, string>): string {
    let str: string = (TRANSLATIONS[lang] as any)[key] ?? (TRANSLATIONS.en as any)[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, v);
      });
    }
    return str;
  }

  return { t, lang };
}

// ── Language metadata ──────────────────────────────────────────────────────────

/** Display name of each language in its own script. */
export const LANG_NAMES: Record<LangCode, string> = {
  en: "English",
  hi: "हिंदी",
  te: "తెలుగు",
  ta: "தமிழ்",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
};

export const ALL_LANGS: LangCode[] = ["en", "hi", "te", "ta", "kn", "ml"];
