'use client';

import { useTheme } from '@/lib/themeContext';
import { themeColors, ThemeColor } from '@/lib/theme';

export default function ThemeSelector() {
  const { themeColor, setThemeColor } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Couleur du thème</h3>
          <p className="text-sm text-slate-400">Personnalisez la couleur de votre application</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Object.entries(themeColors).map(([colorKey, colorData]) => {
          const isSelected = themeColor === colorKey;
          return (
            <button
              key={colorKey}
              onClick={() => setThemeColor(colorKey as ThemeColor)}
              className={`
                relative flex flex-col items-center gap-2 p-4 rounded-2xl 
                transition-all border-2
                ${
                  isSelected
                    ? 'border-white bg-slate-800/50 scale-105'
                    : 'border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/30 hover:border-slate-600'
                }
              `}
            >
              {/* Cercle de couleur */}
              <div
                className="w-12 h-12 rounded-full shadow-xl"
                style={{ backgroundColor: colorData.primary }}
              />
              
              {/* Nom et emoji */}
              <div className="text-center">
                <div className="text-lg">{colorData.emoji}</div>
                <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {colorData.name}
                </div>
              </div>

              {/* Checkmark si sélectionné */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Aperçu supprimé — section retirée volontairement */}
    </div>
  );
}
