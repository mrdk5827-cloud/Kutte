import React, { useState } from 'react';
import { 
  Users, 
  Phone, 
  MessageSquare, 
  UserPlus, 
  Search, 
  Star, 
  ExternalLink, 
  Send, 
  Trash2, 
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import type { Contact } from '../types/fixa';
import { 
  triggerDirectCall, 
  triggerWhatsAppMessage, 
  saveContacts,
  cleanPhoneNumber 
} from '../utils/contactService';
import { playCommandBlip, playJarvisChime } from '../utils/audioFX';

interface ContactsPanelProps {
  contacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
  onSpeak: (text: string) => void;
  onExecuteCommand: (cmd: string) => void;
}

export const ContactsPanel: React.FC<ContactsPanelProps> = ({
  contacts,
  onUpdateContacts,
  onSpeak,
  onExecuteCommand,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMessageContact, setActiveMessageContact] = useState<Contact | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  // Add contact form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRel, setNewRel] = useState('Friend');

  // Delete notification & Undo state
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [deletedBackup, setDeletedBackup] = useState<{ contact: Contact; index: number } | null>(null);

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.relationship || '').toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const handleCall = (contact: Contact) => {
    playJarvisChime();
    const spoken = `Ji Boss, ${contact.name} ko call mila rahi hoon.`;
    onSpeak(spoken);
    triggerDirectCall(contact);
  };

  const handleOpenWhatsAppModal = (contact: Contact) => {
    playCommandBlip();
    setActiveMessageContact(contact);
    setCustomMessage(`Hello ${contact.name}, FIXA AI Assistant ke madhyam se message bhej raha hoon.`);
  };

  const handleSendWhatsApp = () => {
    if (!activeMessageContact) return;
    playJarvisChime();
    const spoken = `Ji Boss, ${activeMessageContact.name} ke liye WhatsApp message bheja ja raha hai.`;
    onSpeak(spoken);
    triggerWhatsAppMessage(activeMessageContact, customMessage);
    setActiveMessageContact(null);
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    playCommandBlip();

    const newContact: Contact = {
      id: `c-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      whatsapp: cleanPhoneNumber(newPhone.trim()),
      relationship: newRel.trim(),
      avatarColor: 'from-cyan-500 to-blue-600',
      isFavorite: false,
    };

    const updated = [newContact, ...contacts];
    onUpdateContacts(updated);
    saveContacts(updated);

    onSpeak(`Naya contact ${newContact.name} phonebook mein save kar diya gaya hai, Boss.`);

    setNewName('');
    setNewPhone('');
    setShowAddModal(false);
  };

  const handleDeleteContact = (id: string, name: string) => {
    playCommandBlip();
    const idx = contacts.findIndex((c) => c.id === id);
    const toRemove = contacts.find((c) => c.id === id);
    if (toRemove) {
      setDeletedBackup({ contact: toRemove, index: idx });
    }
    const updated = contacts.filter((c) => c.id !== id);
    onUpdateContacts(updated);
    saveContacts(updated);
    setDeleteToast(`"${name}" successfully delete ho gaya.`);
    onSpeak(`${name} ko contacts se delete kar diya gaya hai, Boss.`);
    setTimeout(() => {
      setDeleteToast(null);
    }, 6000);
  };

  const handleUndoDelete = () => {
    if (!deletedBackup) return;
    playJarvisChime();
    const restored = [...contacts];
    restored.splice(deletedBackup.index, 0, deletedBackup.contact);
    onUpdateContacts(restored);
    saveContacts(restored);
    onSpeak(`${deletedBackup.contact.name} ko wapas restore kar diya gaya hai, Boss.`);
    setDeleteToast(null);
    setDeletedBackup(null);
  };

  const handleImportDeviceContacts = async () => {
    playCommandBlip();
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && (navigator as any).contacts?.select) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const selected = await (navigator as any).contacts.select(props, opts);
        if (selected && selected.length > 0) {
          const imported: Contact[] = selected.map((s: any, idx: number) => ({
            id: `dev-${Date.now()}-${idx}`,
            name: s.name?.[0] || 'Imported Contact',
            phone: s.tel?.[0] || '',
            whatsapp: cleanPhoneNumber(s.tel?.[0] || ''),
            relationship: 'Device Phonebook',
            avatarColor: 'from-emerald-500 to-teal-600',
            isFavorite: false,
          }));
          const updated = [...imported, ...contacts];
          onUpdateContacts(updated);
          saveContacts(updated);
          onSpeak(`${imported.length} contacts device se successfully import ho gaye hain, Boss.`);
          return;
        }
      } catch (err) {
        console.warn('Contacts picker error:', err);
      }
    } else {
      onSpeak("Device contacts API is browser mein direct supported nahi hai, aap 'Add Contact' button se naya contact jod sakte hain, Boss.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Voice Instruction Card */}
      <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cyber font-bold text-lg text-cyan-200">
                VOICE CONTACTS & WHATSAPP AUTOMATION
              </h3>
              <p className="text-xs text-slate-400 font-tech">
                Kisi ka bhi naam bol kar turant Call milayein ya WhatsApp message bhejein
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImportDeviceContacts}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-900 text-xs font-tech flex items-center gap-1.5 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import Device Contacts</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-tech font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Custom Number</span>
            </button>
          </div>
        </div>

        {/* Quick Voice Command Triggers */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-cyan-950 space-y-2">
          <div className="text-xs font-tech uppercase text-cyan-400 font-bold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>TEST VOICE CALL & WHATSAPP COMMANDS (CLICK TO TEST):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              onClick={() => onExecuteCommand("Rahul ko call karo")}
              className="p-2.5 rounded-xl bg-slate-900 border border-cyan-900/60 hover:border-cyan-400 hover:bg-cyan-950/40 text-left transition-all text-xs font-tech text-cyan-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>"Rahul ko call karo"</span>
              </div>
              <span className="text-[10px] text-slate-500">TEST</span>
            </button>

            <button
              onClick={() => onExecuteCommand("Papa ko phone lagao")}
              className="p-2.5 rounded-xl bg-slate-900 border border-cyan-900/60 hover:border-cyan-400 hover:bg-cyan-950/40 text-left transition-all text-xs font-tech text-cyan-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>"Papa ko phone lagao"</span>
              </div>
              <span className="text-[10px] text-slate-500">TEST</span>
            </button>

            <button
              onClick={() => onExecuteCommand("Dileep ko WhatsApp message karo 'Main 10 minute mein pahunchta hoon'")}
              className="p-2.5 rounded-xl bg-slate-900 border border-cyan-900/60 hover:border-cyan-400 hover:bg-cyan-950/40 text-left transition-all text-xs font-tech text-cyan-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                <span>"Dileep ko WhatsApp karo"</span>
              </div>
              <span className="text-[10px] text-slate-500">TEST</span>
            </button>

            <button
              onClick={() => onExecuteCommand("Aman ko WhatsApp message bhejo 'Subah call karna'")}
              className="p-2.5 rounded-xl bg-slate-900 border border-cyan-900/60 hover:border-cyan-400 hover:bg-cyan-950/40 text-left transition-all text-xs font-tech text-cyan-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                <span>"Aman ko WhatsApp message"</span>
              </div>
              <span className="text-[10px] text-slate-500">TEST</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name (e.g. Dileep, Papa, Rahul)..."
            className="w-full bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cyan-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Delete Notification Banner with Undo Option */}
        {deleteToast && (
          <div className="p-3 rounded-xl bg-red-950/90 border-2 border-red-500/70 text-xs text-red-200 flex items-center justify-between gap-3 animate-in fade-in shadow-[0_0_15px_rgba(239,68,68,0.25)]">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-tech font-bold">{deleteToast}</span>
            </div>
            {deletedBackup && (
              <button
                type="button"
                onClick={handleUndoDelete}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs shadow transition-colors shrink-0"
              >
                Undo / Wapas Layein
              </button>
            )}
          </div>
        )}

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 rounded-2xl bg-slate-900/70 border border-cyan-950 hover:border-cyan-700/60 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${contact.avatarColor || 'from-cyan-500 to-blue-600'} flex items-center justify-center text-white font-cyber font-bold text-sm shadow-md`}>
                    {contact.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-tech font-bold text-sm text-cyan-100 flex items-center gap-1.5">
                      <span>{contact.name}</span>
                      {contact.isFavorite && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono-code">
                      {contact.phone}
                    </div>
                    <div className="text-[10px] text-cyan-400/80 font-tech uppercase">
                      {contact.relationship}
                    </div>
                  </div>
                </div>

                {/* Permanently Visible Delete Icon / Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteContact(contact.id, contact.name);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 border-2 border-red-500/70 hover:bg-red-800 text-red-200 hover:text-white text-xs font-tech font-bold transition-all shadow-[0_0_12px_rgba(239,68,68,0.4)] shrink-0 active:scale-95 cursor-pointer z-10"
                  title={`Delete ${contact.name}`}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Delete</span>
                </button>
              </div>

              {/* Action Buttons: Direct Call & WhatsApp */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleCall(contact)}
                  className="py-2 px-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 hover:bg-emerald-900/80 text-emerald-300 font-tech font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </button>

                <button
                  onClick={() => handleOpenWhatsAppModal(contact)}
                  className="py-2 px-3 rounded-xl bg-green-950/70 border border-green-500/50 hover:bg-green-900/80 text-green-300 font-tech font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-950 border-2 border-cyan-500/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-cyan-900 pb-3">
              <h4 className="font-cyber font-bold text-base text-cyan-200">
                ADD NEW CONTACT
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-tech text-slate-300 uppercase">Contact Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dileep Kumar, Rohit Sharma..."
                  className="w-full mt-1 bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-tech text-slate-300 uppercase">Phone / Mobile Number:</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210..."
                  className="w-full mt-1 bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-tech text-slate-300 uppercase">Relationship / Tag:</label>
                <select
                  value={newRel}
                  onChange={(e) => setNewRel(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Family">Family (Papa, Mummy, Bhai, Sister)</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague / Office</option>
                  <option value="Important">Important / VIP</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-tech text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Composer Modal */}
      {activeMessageContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-950 border-2 border-green-500/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-green-900/60 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-400" />
                <h4 className="font-cyber font-bold text-base text-green-200">
                  WHATSAPP MESSAGE: {activeMessageContact.name}
                </h4>
              </div>
              <button
                onClick={() => setActiveMessageContact(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Sending to: <span className="font-bold text-green-400">{activeMessageContact.phone}</span>
            </p>

            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type message to send on WhatsApp..."
              className="w-full bg-slate-900 border border-green-900 focus:border-green-400 rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
              <button
                type="button"
                onClick={() => setActiveMessageContact(null)}
                className="px-4 py-2 rounded-xl text-xs font-tech text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-tech font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
