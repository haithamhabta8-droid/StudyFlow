import React, { useState } from 'react';
import { X, User, Upload, Trash2 } from 'lucide-react';
import { UserProfile } from '../../types/index.ts';
import { t } from '../../utils/translations.ts';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  lang: 'ar' | 'en';
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  lang,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(profile.name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [level, setLevel] = useState(profile.level || 'university');
  const [avatar, setAvatar] = useState(profile.avatar || '');

  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      ...profile,
      name: name.trim(),
      bio: bio.trim(),
      level: level as UserProfile['level'],
      avatar,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-[#12122a] border border-[#2a2a4a] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-[#e8e8f0]">
            {t('editProfile', lang)}
          </h3>
          <button onClick={onClose} className="text-[#8888a8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-2xl overflow-hidden border-2 border-[#2a2a4a] shadow-lg">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase() || <User className="w-8 h-8" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>{t('uploadPhoto', lang)}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
            </label>
            {avatar && (
              <button
                onClick={() => setAvatar('')}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-[#8888a8] block mb-1">
              {t('displayName', lang)}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alex Reed / أحمد خالد"
              className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#8888a8] block mb-1">
              {t('studyLevel', lang)}
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as UserProfile['level'])}
              className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500"
            >
              <option value="school">School</option>
              <option value="highschool">High School</option>
              <option value="university">University</option>
              <option value="grad">Graduate</option>
              <option value="self">Self-taught</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#8888a8] block mb-1">
              {t('bio', lang)}
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Computer science & cognitive psychology enthusiast..."
              className="w-full px-3 py-2 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs text-[#e8e8f0] focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {profile.email && (
            <div className="p-2.5 rounded-xl bg-[#1c1c3a] border border-[#2a2a4a] text-xs flex items-center justify-between">
              <span className="text-[#8888a8]">Google Account:</span>
              <span className="text-[#e8e8f0] font-mono text-[11px] truncate max-w-[200px]">{profile.email}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1c1c3a] text-xs font-bold text-[#8888a8] hover:text-[#e8e8f0]"
          >
            {t('cancel', lang)}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
          >
            {t('save', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
