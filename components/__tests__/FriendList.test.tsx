import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FriendList from '../FriendList';

describe('FriendList', () => {
  it('should render empty state when no friends provided', () => {
    render(<FriendList />);

    expect(screen.getByText('Aucun ami pour le moment')).toBeInTheDocument();
  });

  it('should render empty state when friends array is empty', () => {
    render(<FriendList friends={[]} />);

    expect(screen.getByText('Aucun ami pour le moment')).toBeInTheDocument();
  });

  it('should render list of friends with names and emails', () => {
    const friends = [
      { id: '1', name: 'Alice Dupont', email: 'alice@example.com' },
      { id: '2', name: 'Bob Martin', email: 'bob@example.com' },
      { id: '3', name: 'Claire Leblanc', email: 'claire@example.com' },
    ];

    render(<FriendList friends={friends} />);

    expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Martin')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('Claire Leblanc')).toBeInTheDocument();
    expect(screen.getByText('claire@example.com')).toBeInTheDocument();
  });
});
