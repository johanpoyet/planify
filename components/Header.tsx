import React from 'react';
// Composant Header / Navigation
export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold text-primary-600">
              Planify
            </a>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <a href="/events" className="text-gray-700 hover:text-primary-600 transition">
              Événements
            </a>
            <a href="/friends" className="text-gray-700 hover:text-primary-600 transition">
              Amis
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="/auth/login"
              className="text-gray-700 hover:text-primary-600 transition"
            >
              Connexion
            </a>
            <a
              href="/auth/register"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              S'inscrire
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
