import type { Contact } from '../types/fixa';

const CONTACTS_STORAGE_KEY = 'fixa_neural_contacts_v1';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    name: 'Dileep Kumar',
    phone: '+91 98765 43210',
    whatsapp: '919876543210',
    relationship: 'Self / Boss',
    avatarColor: 'from-cyan-500 to-blue-600',
    isFavorite: true,
  },
  {
    id: 'c-2',
    name: 'Papa',
    phone: '+91 98112 33445',
    whatsapp: '919811233445',
    relationship: 'Family',
    avatarColor: 'from-amber-500 to-orange-600',
    isFavorite: true,
  },
  {
    id: 'c-3',
    name: 'Mummy',
    phone: '+91 98112 33446',
    whatsapp: '919811233446',
    relationship: 'Family',
    avatarColor: 'from-pink-500 to-rose-600',
    isFavorite: true,
  },
  {
    id: 'c-4',
    name: 'Rahul Sharma',
    phone: '+91 98223 44556',
    whatsapp: '919822344556',
    relationship: 'Colleague',
    avatarColor: 'from-emerald-500 to-teal-600',
    isFavorite: true,
  },
  {
    id: 'c-5',
    name: 'Aman Verma',
    phone: '+91 98334 55667',
    whatsapp: '919833455667',
    relationship: 'Friend',
    avatarColor: 'from-indigo-500 to-purple-600',
    isFavorite: false,
  },
  {
    id: 'c-6',
    name: 'Priya Singh',
    phone: '+91 98445 66778',
    whatsapp: '919844566778',
    relationship: 'Project Partner',
    avatarColor: 'from-fuchsia-500 to-pink-600',
    isFavorite: false,
  },
  {
    id: 'c-7',
    name: 'Bhai',
    phone: '+91 98556 77889',
    whatsapp: '919855677889',
    relationship: 'Family',
    avatarColor: 'from-blue-500 to-cyan-600',
    isFavorite: true,
  },
];

export function getStoredContacts(): Contact[] {
  if (typeof window === 'undefined') return INITIAL_CONTACTS;
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(INITIAL_CONTACTS));
      return INITIAL_CONTACTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONTACTS;
  }
}

export function saveContacts(contacts: Contact[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.error('Failed to save contacts:', e);
  }
}

export function deleteContactById(id: string, contacts: Contact[]): Contact[] {
  const updated = contacts.filter((c) => c.id !== id);
  saveContacts(updated);
  return updated;
}

export function addCustomContact(
  contactData: { name: string; phone: string; relationship?: string },
  contacts: Contact[]
): Contact[] {
  const clean = cleanPhoneNumber(contactData.phone);
  const newContact: Contact = {
    id: `custom-${Date.now()}`,
    name: contactData.name.trim(),
    phone: contactData.phone.trim(),
    whatsapp: clean,
    relationship: contactData.relationship?.trim() || 'Custom Contact',
    avatarColor: 'from-cyan-500 to-blue-600',
    isFavorite: false,
  };
  const updated = [newContact, ...contacts];
  saveContacts(updated);
  return updated;
}

/**
 * Robust Dynamic Natural Language Parsers
 * Handles:
 * "______ ko call karo"
 * "______ ko massage kar do ki ______"
 * "______ ko whatsapp kar do ki ______"
 */
export function parseCallCommand(text: string): { targetName: string } | null {
  const clean = text.trim();

  // Pattern 1: "[NAME] ko call/phone karo/lagao/milao"
  const m1 = clean.match(/(?:hey fixa\s+)?(.+?)\s+ko\s+(?:call|phone)\s*(?:karo|lagao|milao|karna)/i);
  if (m1 && m1[1]) {
    return { targetName: m1[1].trim() };
  }

  // Pattern 2: "call [NAME]"
  const m2 = clean.match(/^call\s+(.+)$/i);
  if (m2 && m2[1] && !m2[1].includes('screen')) {
    return { targetName: m2[1].replace(/ko$/i, '').trim() };
  }

  // Pattern 3: "[NAME] ko phone lagao"
  const m3 = clean.match(/(.+?)\s+ko\s+phone\s*(?:lagao|karo|milao)/i);
  if (m3 && m3[1]) {
    return { targetName: m3[1].trim() };
  }

  return null;
}

export function parseWhatsAppCommand(text: string): { targetName: string; message: string } | null {
  const clean = text.trim();

  // Pattern 1: "[NAME] ko massage/message/whatsapp kar do ki [MESSAGE]"
  const m1 = clean.match(/(?:hey fixa\s+)?(.+?)\s+ko\s+(?:massage|message|msg|whatsapp|wattsapp)\s*(?:kar do|bhejo|karo|bhej do)\s*(?:ki|ke)\s*(.+)/i);
  if (m1 && m1[1] && m1[2]) {
    return { targetName: m1[1].trim(), message: m1[2].trim() };
  }

  // Pattern 2: "[NAME] ko massage/message [MESSAGE]" (e.g. "Rahul ko message bhejo main aa raha hoon")
  const m2 = clean.match(/(?:hey fixa\s+)?(.+?)\s+ko\s+(?:massage|message|msg|whatsapp|wattsapp)\s*(?:kar do|bhejo|karo|bhej do)\s*(.+)/i);
  if (m2 && m2[1] && m2[2]) {
    return { targetName: m2[1].trim(), message: m2[2].trim() };
  }

  // Pattern 3: "whatsapp par [NAME] ko message karo [MESSAGE]"
  const m3 = clean.match(/(?:whatsapp|wattsapp)\s*(?:par\s+)?(.+?)\s+ko\s+(?:massage|message|msg)?\s*(?:kar do|bhejo|karo|bhej do)\s*(?:ki\s+)?(.+)/i);
  if (m3 && m3[1] && m3[2]) {
    return { targetName: m3[1].trim(), message: m3[2].trim() };
  }

  return null;
}

export function matchContactByName(query: string, contacts: Contact[]): Contact | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // Direct exact match
  for (const c of contacts) {
    const nameLower = c.name.toLowerCase();
    const relLower = (c.relationship || '').toLowerCase();
    if (nameLower === q) return c;
    if (relLower === q) return c;
  }

  // Substring match
  for (const c of contacts) {
    const nameLower = c.name.toLowerCase();
    if (q.includes(nameLower) || nameLower.includes(q)) return c;
  }

  // First name match (e.g. "Rahul" in "Rahul Sharma")
  for (const c of contacts) {
    const firstName = c.name.toLowerCase().split(/\s+/)[0];
    if (firstName && (q === firstName || q.includes(firstName) || firstName.includes(q))) {
      return c;
    }
  }

  return null;
}

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = `91${digits.slice(1)}`;
  }
  return digits;
}

export function triggerDirectCall(contact: Contact | { phone: string }): void {
  const clean = cleanPhoneNumber(contact.phone);
  window.location.href = `tel:${clean || contact.phone}`;
}

export function triggerWhatsAppMessage(contact: Contact | { phone: string }, message = ''): void {
  const rawNum = (contact as any).whatsapp || contact.phone || '';
  const clean = cleanPhoneNumber(rawNum);
  const textToSend = message || 'Hello, FIXA AI Assistant ke through connect kar raha hoon.';
  const encodedText = encodeURIComponent(textToSend);

  // Auto-copy message to clipboard so user can paste instantly as fail-safe
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      navigator.clipboard.writeText(textToSend).catch(() => {});
    } catch {
      // ignore
    }
  }

  // Pre-fills and auto-types the message into the WhatsApp chat box
  const url = clean 
    ? `https://api.whatsapp.com/send?phone=${clean}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}
