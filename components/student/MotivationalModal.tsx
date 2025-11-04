import React from 'react';

interface MotivationalModalProps {
  studentName: string;
  coachName: string;
  message: string;
  onClose: () => void;
  isSelfCoach?: boolean;
}

const MotivationalModal: React.FC<MotivationalModalProps> = ({ studentName, coachName, message, onClose, isSelfCoach = false }) => {
  const formattedMessage = message.replace('{studentName}', studentName.split(' ')[0]); // Use first name

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[100] p-4 transition-opacity duration-300 animate-fade-in" onClick={onClose}>
      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl shadow-2xl p-8 w-full max-w-lg text-white border-2 border-white/30 transform transition-all duration-500 animate-slide-up relative" onClick={e => e.stopPropagation()}>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-sky-400 to-cyan-300 rounded-full flex items-center justify-center border-4 border-violet-500 shadow-lg">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
           </svg>
        </div>
        <div className="mt-10 text-center">
            <p className="text-lg leading-relaxed text-slate-100">
                "{formattedMessage}"
            </p>
            <p className="mt-6 font-semibold text-lg text-white">
                - Koçun, {coachName}
            </p>
        </div>
        <div className="mt-8 text-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm"
            >
              Harika, Başlayalım!
            </button>
        </div>
      </div>
    </div>
  );
};

export default MotivationalModal;