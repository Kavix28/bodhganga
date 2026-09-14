import React, { useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const ExamTimer = ({ timeLeft, isUntimed = false, onTimeExpired }) => {
    useEffect(() => {
        if (!isUntimed && timeLeft === 0 && onTimeExpired) {
            onTimeExpired();
        }
    }, [timeLeft, isUntimed, onTimeExpired]);

    if (isUntimed) {
        return (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-xl text-slate-300 font-mono font-bold text-xs" title="Untimed Practice Session">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span>Untimed Practice</span>
            </div>
        );
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const isCritical = timeLeft < 60; // < 1 minute
    const isWarning = timeLeft <= 300 && !isCritical; // <= 5 minutes

    return (
        <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono font-bold text-sm sm:text-base border transition-all duration-300 ${
                isCritical
                    ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse shadow-lg shadow-rose-950/50'
                    : isWarning
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
            }`}
            role="timer"
            aria-live="polite"
            aria-label={`Time remaining: ${minutes} minutes and ${seconds} seconds`}
        >
            {isCritical ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            ) : (
                <Clock className={`w-4 h-4 ${isWarning ? 'text-amber-400' : 'text-emerald-400'}`} />
            )}
            <span>{formattedTime}</span>
        </div>
    );
};

export default ExamTimer;
