import React from 'react';
// Composant pour afficher la liste des amis
interface Friend {
  id: string;
  name: string;
  email: string;
}

interface FriendListProps {
  friends?: Friend[];
}

export default function FriendList({ friends = [] }: FriendListProps) {
  if (friends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Aucun ami pour le moment</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md divide-y">
      {friends.map((friend) => (
        <div key={friend.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{friend.name}</h3>
            <p className="text-sm text-gray-500">{friend.email}</p>
          </div>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Voir profil
          </button>
        </div>
      ))}
    </div>
  );
}
