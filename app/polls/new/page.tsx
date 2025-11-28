import PollCreator from '@/components/PollCreator';

export default function NewPollPage() {
  // Server component renders a styled shell and the client PollCreator inside
  return (
    <div className="min-h-screen bg-slate-950 pb-24 md:pb-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl" style={{ backgroundColor: '#2563eb' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h14zM9 4h6m-6 0a2 2 0 00-2 2v2m8-4a2 2 0 012 2v2" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Créer un sondage</h1>
              <p className="text-slate-400 text-sm">Propose une ou plusieurs options à tes amis — si tout le monde choisit la même option, un événement sera créé automatiquement.</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-8">
          {/* Client component */}
          <PollCreator />
        </div>
      </div>
    </div>
  );
}
