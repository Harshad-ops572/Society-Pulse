export type Language = 'en' | 'hi';

export const translations = {
  en: {
    appName: 'SocietyPulse',
    tagline: 'AI Complaint Triage for Housing Societies',
    subline: 'Report. Prioritise. Resolve.',
    hindiSubline: 'शिकायत दर्ज करें, समाधान पाएं',
    navReport: 'Report Issue',
    navTrack: 'Track Status',
    navDashboard: 'Dashboard',
    navLogin: 'Committee Login',
    navLogout: 'Sign Out',
    navAdmin: 'Settings',

    // Hero
    heroTitle: 'Quiet WhatsApp chaos. Resolve society issues 3x faster.',
    heroDescription:
      'Residents report in English, Hindi, or Hinglish via voice, photo, or text. AI categorises, detects duplicates, and alerts committee volunteers with a 5-minute daily digest.',
    heroReportCta: 'Report an Issue',
    heroTrackCta: 'Track a Complaint',
    heroDashboardCta: 'Committee Dashboard',

    // How it works
    howItWorksTitle: 'How SocietyPulse Works',
    howStep1Title: '1. Report Any Way',
    howStep1Desc: 'Speak in Hindi/Hinglish, type, or snap a photo. Takes under 30 seconds.',
    howStep2Title: '2. Instant AI Triage',
    howStep2Desc: 'Gemini AI classifies urgency, identifies duplicates, and flags safety risks instantly.',
    howStep3Title: '3. Fast Resolution',
    howStep3Desc: 'Volunteers act via a prioritized 5-minute digest, and residents get live status updates.',

    // Categories
    categoriesTitle: 'Common Issue Categories',
    catWater: 'Water Supply',
    catLift: 'Elevator / Lift',
    catParking: 'Parking & Vehicles',
    catNoise: 'Noise & Disturbance',
    catCleaning: 'Housekeeping & Waste',
    catElectrical: 'Electrical & Lighting',
    catSecurity: 'Security & Access',
    catOther: 'General Maintenance',

    // Stats
    statOpen: 'Active Issues',
    statResolved: 'Resolved This Month',
    statAvgTime: 'Avg Resolution Time',
    statSatisfaction: 'Resident Satisfaction',

    // Wizard
    wizardStep1: '1. What happened?',
    wizardStep2: '2. Where & who?',
    wizardStep3: '3. Review & submit',
    textPlaceholder: 'e.g., 3rd floor corridor light is sparking, or "Lift B band hai subah se"...',
    holdToRecord: 'Hold to record voice',
    recording: 'Listening... release to send',
    speechNotSupported: "Voice isn't supported on this browser, please type your complaint.",
    languageToggleLabel: 'Voice Language:',
    photoUploadTitle: 'Attach Photo (Optional)',
    photoUploadHint: 'Click to upload or drag & drop (Max 1MB, compressed automatically)',
    removePhoto: 'Remove photo',

    // Step 2
    wingLabel: 'Wing',
    flatLabel: 'Flat Number',
    commonAreaLabel: 'Common Area (If outside flat)',
    nameLabel: 'Your Name',
    namePlaceholder: 'e.g. Rahul Sharma',
    phoneLabel: 'Phone Number (Optional)',
    phonePlaceholder: 'e.g. 9876543210 (for SMS/WhatsApp update)',

    // Step 3
    aiPreviewTitle: 'AI Triage Preview',
    aiPreviewDesc: 'Our AI analysed your report. You can review or adjust before submitting.',
    detectedCategory: 'Detected Category',
    urgencyLevel: 'Assessed Urgency',
    safetyRiskNotice: 'Safety alert flagged: This complaint will be highlighted immediately for the team.',
    submitButton: 'Submit Complaint',
    submitting: 'Submitting & Triaging...',

    // Success
    complaintSubmitted: 'Complaint Registered Successfully!',
    yourComplaintId: 'Your Complaint ID',
    copyId: 'Copy ID',
    copied: 'Copied!',
    trackNow: 'Track Status Now',
    submitAnother: 'Submit Another Complaint',

    // Track
    trackTitle: 'Track Your Complaint',
    trackSubtitle: 'Enter your Complaint ID and Flat Number to view live progress.',
    trackIdLabel: 'Complaint ID',
    trackFlatLabel: 'Flat Number',
    trackButton: 'Search Complaint',
    tracking: 'Fetching details...',
    timelineTitle: 'Resolution Timeline',
    addCommentTitle: 'Add Resident Note / Follow-up',
    addCommentPlaceholder: 'Add any new updates or question for the committee...',
    sendComment: 'Post Comment',
    confirmResolution: 'Was this issue resolved to your satisfaction?',
    btnYesResolved: 'Yes, Issue Resolved',
    btnNotResolved: 'No, Reopen Issue',
    reopenedAlert: 'Complaint has been reopened. The committee has been notified.',
    resolvedThankYou: 'Thank you for confirming resolution!',

    // Common
    loading: 'Loading...',
    errorOccurred: 'An error occurred. Please try again.',
  },
  hi: {
    appName: 'सोसाइटी पल्स',
    tagline: 'हाउसिंग सोसाइटियों के लिए एआई शिकायत निवारण',
    subline: 'शिकायत दर्ज करें, प्राथमिकता तय करें, समाधान पाएं',
    hindiSubline: 'शिकायत दर्ज करें, समाधान पाएं',
    navReport: 'शिकायत दर्ज करें',
    navTrack: 'स्थिति ट्रैक करें',
    navDashboard: 'डैशबोर्ड',
    navLogin: 'कमेटी लॉगिन',
    navLogout: 'लॉगआउट',
    navAdmin: 'सेटिंग्स',

    // Hero
    heroTitle: 'व्हाट्सएप का झंझट खत्म। 3 गुना तेजी से सोसायटी की समस्याएं सुलझाएं।',
    heroDescription:
      'निवासी हिंदी, हिंग्लिश या अंग्रेजी में बोलकर, फोटो खींचकर या लिखकर रिपोर्ट करें। एआई तुरंत डुप्लीकेट पहचानता है और कमेटी को 5 मिनट की दैनिक सारांश देता है।',
    heroReportCta: 'शिकायत दर्ज करें',
    heroTrackCta: 'शिकायत ट्रैक करें',
    heroDashboardCta: 'कमेटी डैशबोर्ड',

    // How it works
    howItWorksTitle: 'सोसाइटी पल्स कैसे काम करता है',
    howStep1Title: '1. किसी भी तरह रिपोर्ट करें',
    howStep1Desc: 'हिंदी/हिंग्लिश में बोलें, टाइप करें या फोटो खींचें। 30 सेकंड से भी कम समय लगता है।',
    howStep2Title: '2. तुरंत एआई विश्लेषण',
    howStep2Desc: 'जेमिनी एआई प्राथमिकता तय करता है, डुप्लीकेट पकड़ता है और सुरक्षा जोखिमों को चिह्नित करता है।',
    howStep3Title: '3. त्वरित समाधान',
    howStep3Desc: 'कमेटी सदस्य 5 मिनट के दैनिक डाइजेस्ट से काम करते हैं, और निवासियों को लाइव अपडेट मिलते हैं।',

    // Categories
    categoriesTitle: 'समस्या श्रेणियां',
    catWater: 'पानी की आपूर्ति',
    catLift: 'लिफ्ट / एलिवेटर',
    catParking: 'पार्किंग और गाड़ियां',
    catNoise: 'शोर और अशांति',
    catCleaning: 'साफ-सफाई और कचरा',
    catElectrical: 'बिजली और लाइट',
    catSecurity: 'सुरक्षा और गार्ड',
    catOther: 'सामान्य रखरखाव',

    // Stats
    statOpen: 'सक्रिय शिकायतें',
    statResolved: 'इस महीने हल हुईं',
    statAvgTime: 'औसत समाधान समय',
    statSatisfaction: 'निवासी संतुष्टि',

    // Wizard
    wizardStep1: '1. क्या समस्या है?',
    wizardStep2: '2. स्थान और विवरण',
    wizardStep3: '3. समीक्षा और सबमिट',
    textPlaceholder: 'जैसे: तीसरी मंजिल पर लाइट में स्पार्किंग हो रही है, या "लिफ्ट बी सुबह से बंद है"...',
    holdToRecord: 'बोलने के लिए दबाकर रखें',
    recording: 'सुन रहे हैं... समाप्त करने के लिए छोड़ें',
    speechNotSupported: 'इस ब्राउज़र पर वॉइस समर्थित नहीं है, कृपया लिखकर शिकायत दर्ज करें।',
    languageToggleLabel: 'बोलने की भाषा:',
    photoUploadTitle: 'फोटो संलग्न करें (वैकल्पिक)',
    photoUploadHint: 'अपलोड करने के लिए क्लिक करें (अधिकतम 1MB, स्वतः संपीड़ित)',
    removePhoto: 'फोटो हटाएं',

    // Step 2
    wingLabel: 'विंग',
    flatLabel: 'फ्लैट नंबर',
    commonAreaLabel: 'कॉमन एरिया (यदि फ्लैट के बाहर है)',
    nameLabel: 'आपका नाम',
    namePlaceholder: 'जैसे: राहुल शर्मा',
    phoneLabel: 'फ़ोन नंबर (वैकल्पिक)',
    phonePlaceholder: 'जैसे: 9876543210 (एसएमएस/व्हाट्सएप अपडेट के लिए)',

    // Step 3
    aiPreviewTitle: 'एआई सारांश पूर्वावलोकन',
    aiPreviewDesc: 'हमारे एआई ने आपकी शिकायत का विश्लेषण किया है। सबमिट करने से पहले जांच लें।',
    detectedCategory: 'पहचानी गई श्रेणी',
    urgencyLevel: 'प्राथमिकता स्तर',
    safetyRiskNotice: 'सुरक्षा चेतावनी: इस शिकायत को कमेटी के सामने तुरंत हाइलाइट किया जाएगा।',
    submitButton: 'शिकायत सबमिट करें',
    submitting: 'सबमिट और विश्लेषण हो रहा है...',

    // Success
    complaintSubmitted: 'शिकायत सफलतापूर्वक दर्ज हो गई!',
    yourComplaintId: 'आपकी शिकायत आईडी',
    copyId: 'आईडी कॉपी करें',
    copied: 'कॉपी हो गया!',
    trackNow: 'स्थिति अभी ट्रैक करें',
    submitAnother: 'दूसरी शिकायत दर्ज करें',

    // Track
    trackTitle: 'अपनी शिकायत ट्रैक करें',
    trackSubtitle: 'लाइव प्रगति देखने के लिए अपनी शिकायत आईडी और फ्लैट नंबर दर्ज करें।',
    trackIdLabel: 'शिकायत आईडी',
    trackFlatLabel: 'फ्लैट नंबर',
    trackButton: 'शिकायत खोजें',
    tracking: 'खोज रहे हैं...',
    timelineTitle: 'समाधान टाइमलाइन',
    addCommentTitle: 'फॉलो-अप टिप्पणी जोड़ें',
    addCommentPlaceholder: 'कमेटी के लिए कोई नई जानकारी या प्रश्न जोड़ें...',
    sendComment: 'टिप्पणी भेजें',
    confirmResolution: 'क्या यह समस्या आपकी संतुष्टि के अनुसार हल हो गई है?',
    btnYesResolved: 'हाँ, समस्या हल हो गई',
    btnNotResolved: 'नहीं, दोबारा खोलें',
    reopenedAlert: 'शिकायत दोबारा खोल दी गई है। कमेटी को सूचित कर दिया गया है।',
    resolvedThankYou: 'समाधान की पुष्टि के लिए धन्यवाद!',

    // Common
    loading: 'लोड हो रहा है...',
    errorOccurred: 'एक त्रुटि हुई। कृपया पुन: प्रयास करें।',
  },
};
