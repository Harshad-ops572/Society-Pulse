export interface ParsedWhatsAppMessage {
  timestamp: string;
  sender: string;
  text: string;
}

// System event patterns to ignore
const SYSTEM_PATTERNS = [
  /Messages and calls are end-to-end encrypted/i,
  /created group/i,
  /added you/i,
  /changed the subject/i,
  /changed the group/i,
  /left the group/i,
  /removed/i,
  /<Media omitted>/i,
  /image omitted/i,
  /audio omitted/i,
  /sticker omitted/i,
  /video omitted/i,
  /document omitted/i,
  /Contact card omitted/i,
  /security code changed/i,
  /This message was deleted/i,
  /You deleted this message/i,
];

// Mask phone numbers to preserve resident privacy
export function maskPhoneNumbers(rawText: string): string {
  return rawText
    .replace(/(\+91[\s-]?)?([6-9]\d{4})[\s-]?(\d{5})/g, '+91 $2 •••••')
    .replace(/\b(\d{5})[\s-](\d{5})\b/g, '$1 •••••');
}

/**
 * Parses raw WhatsApp exported text (supporting Android 12h/24h and iOS formats).
 * Merges multi-line messages and strips system announcements.
 */
export function parseWhatsAppExport(rawText: string): ParsedWhatsAppMessage[] {
  const sanitized = maskPhoneNumbers(rawText);
  const lines = sanitized.split(/\r?\n/);
  const messages: ParsedWhatsAppMessage[] = [];

  // Matchers:
  // Android: "29/09/26, 08:14 - Sender: Message" or "29/09/2026, 08:14 am - Sender: Message"
  const androidRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s+[ap]m)?)\s+-\s+([^:]+):\s*(.*)$/i;

  // iOS: "[29/09/26, 8:14:22 AM] Sender: Message"
  const iosRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s+[ap]m)?)\]\s+([^:]+):\s*(.*)$/i;

  let currentMsg: ParsedWhatsAppMessage | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const androidMatch = trimmed.match(androidRegex);
    const iosMatch = trimmed.match(iosRegex);
    const match = androidMatch || iosMatch;

    if (match) {
      if (currentMsg) {
        messages.push(currentMsg);
      }

      const [, timestamp, sender, text] = match;

      // Skip system notices
      const isSystem = SYSTEM_PATTERNS.some((pattern) => pattern.test(text) || pattern.test(sender));
      if (!isSystem && text.trim().length > 0) {
        currentMsg = {
          timestamp: timestamp.trim(),
          sender: sender.trim(),
          text: text.trim(),
        };
      } else {
        currentMsg = null;
      }
    } else if (currentMsg) {
      // Append multi-line message continuation
      currentMsg.text += ` ${trimmed}`;
    }
  }

  if (currentMsg) {
    messages.push(currentMsg);
  }

  // Cap at 500 messages
  return messages.slice(0, 500);
}

// Built-in realistic ~40-message Hinglish sample chat for the "Load Sample Chat" button
export const SAMPLE_WHATSAPP_CHAT = `29/09/2026, 08:00 - Greenwood Palms Official: Messages and calls are end-to-end encrypted.
29/09/2026, 08:05 - Sharmaji (B-402): Good morning everyone 🙏 Have a blessed Tuesday!
29/09/2026, 08:07 - Rajesh (A-102): Good morning
29/09/2026, 08:12 - Priya (B-301): Lift B firse band hai! Subah se 4th floor pe atki hui hai. Baccho ko school ke liye stair se jana pada.
29/09/2026, 08:14 - Amit (B-604): Yes Lift B is stuck again! 4th time this month. We need to call Johnson Lifts technician now.
29/09/2026, 08:15 - Pooja (B-202): Lift B me koyi fasa to nahi hai na? Please security check karo jaldi.
29/09/2026, 08:18 - Security Main Gate: Guard checked, nobody inside lift B. We turned off power.
29/09/2026, 08:22 - Uncleji (C-501): 🙏🙏 Radhe Radhe
29/09/2026, 08:30 - Sneha (A-302): Water supply in Wing A has completely stopped. Tanki me paani nahi hai kya?
29/09/2026, 08:32 - Rahul (A-404): Same here in A-404, taps are completely dry since 7 AM.
29/09/2026, 08:35 - Neha (A-201): Wing A paani kab aayega please koi batao, office jana hai.
29/09/2026, 08:40 - Secretary: Water pump motor tripped due to voltage drop. Plumber is restarting borehole pump.
29/09/2026, 08:45 - Vikram (C-101): Whose white Swift MH02-BK-4091 is parked in slot C-12? It is blocking my car from taking out.
29/09/2026, 08:48 - Anand (C-204): Ok sorry Vikram removing it in 5 mins.
29/09/2026, 08:55 - Anand (C-204): Removed car now.
29/09/2026, 09:05 - Rohit (B-101): Wing B 1st floor corridor me kisine kachra open phenk diya hai, bohot gandi badbu aa rahi hai.
29/09/2026, 09:07 - Meera (B-103): Agree Rohit, dogs are tearing the garbage bag. Housekeeping ko bolo sweep kare.
29/09/2026, 09:15 - Housekeeping Supervisor: Sweep staff dispatched to B-1 corridor.
29/09/2026, 09:30 - Gupta Uncle (A-501): Corridor tube light near flat A-502 is flickering and wire me sparking ho rahi hai. Fire hazard!
29/09/2026, 09:32 - Sanjay (A-503): Yes I saw the spark near meter box A-502. Very dangerous!
29/09/2026, 09:40 - Dr. Kapoor (C-302): Late night music was playing till 1:30 AM from C-304 yesterday. Patients and elderly cannot sleep.
29/09/2026, 09:42 - Dr. Kapoor (C-302): Please enforce society quiet hours strictly after 10 PM.
29/09/2026, 10:00 - Sangeeta (B-702): Swimming pool water is looking green and cloudy today. Filtration band hai kya?
29/09/2026, 10:15 - Security Guard: Gate 2 barrier sensor not working, visitor cars entering without entry slip.
29/09/2026, 10:30 - Sunita (A-101): Intercom dead since yesterday evening.
29/09/2026, 11:00 - Plumber: Wing A main overhead tank valve opened now. Water restored to all flats.
29/09/2026, 11:05 - Sneha (A-302): Thanks plumber ji, paani aa gaya A wing me.
29/09/2026, 11:20 - Vivek (C-201): Basement 1 parking ramp near exit is very slippery due to oil spill. Scooter skid ho sakti hai.
29/09/2026, 11:45 - Sharmaji (B-402): Anyone knows good AC technician?
29/09/2026, 12:00 - Ritu (B-501): Someone left stray dog feeding bowls on stairs.
29/09/2026, 12:15 - Manoj (C-402): Gym treadmill display is dead.
29/09/2026, 12:30 - Deepak (A-304): Courier guy left parcel at main gate without calling.`;
