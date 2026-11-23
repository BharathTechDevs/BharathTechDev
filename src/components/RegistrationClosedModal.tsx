import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarX2, Clock, X, Calendar, AlertTriangle } from 'lucide-react';
import { RegistrationWindowEvaluation } from '../utils/registrationWindow';

interface RegistrationClosedModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: RegistrationWindowEvaluation | null;
}

export default function RegistrationClosedModal({
  isOpen,
  onClose,
  evaluation,
}: RegistrationClosedModalProps) {
  if (!evaluation) return null;

  const isNotStarted = evaluation.status === 'NOT_STARTED';
  const itemLabel = evaluation.section === 'workshop' ? 'Workshop' : 'Event';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl my-auto text-left border-2 ${
              isNotStarted
                ? 'bg-[#0B1220] border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.22)]'
                : 'bg-[#120E14] border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.28)]'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-5 pr-8">
              <div
                className={`p-3.5 rounded-2xl border shrink-0 ${
                  isNotStarted
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-red-500/15 border-red-500/40 text-red-400'
                }`}
              >
                {isNotStarted ? (
                  <Clock className="w-7 h-7" />
                ) : (
                  <CalendarX2 className="w-7 h-7" />
                )}
              </div>
              <div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest font-bold block mb-1 ${
                    isNotStarted ? 'text-amber-400' : 'text-red-400'
                  }`}
                >
                  S-CODERS {itemLabel} Registration Status
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">
                  {evaluation.headline}
                </h3>
                {evaluation.itemTitle && (
                  <p className="text-xs font-mono text-gray-300 mt-1 line-clamp-2">
                    {evaluation.itemTitle}
                  </p>
                )}
              </div>
            </div>

            {(evaluation.startDate || evaluation.endDate) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 bg-black/50 border border-white/10 rounded-2xl p-4 font-mono text-xs">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-brand-teal shrink-0" />
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase block">
                      Registration Start Date
                    </span>
                    <span className="text-white font-bold">
                      {evaluation.startDateDisplay}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${
                      isNotStarted ? 'text-amber-400' : 'text-red-400'
                    }`}
                  />
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase block">
                      Registration Closing Date
                    </span>
                    <span
                      className={`font-bold ${
                        isNotStarted ? 'text-amber-300' : 'text-red-300'
                      }`}
                    >
                      {evaluation.endDateDisplay}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`rounded-2xl p-4 sm:p-5 border text-xs sm:text-sm leading-relaxed mb-6 ${
                isNotStarted
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                  : 'bg-red-500/10 border-red-500/30 text-gray-100'
              }`}
            >
              {evaluation.message}
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-full py-3.5 px-5 rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                isNotStarted
                  ? 'bg-amber-500 hover:bg-amber-400 text-black'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              Understood • Explore Other {itemLabel}s
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
