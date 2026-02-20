import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('GET /api/polls/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const params = Promise.resolve({ id: TEST_IDS.poll1 });
    const response = await GET({} as any, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non authentifié');
  });

  it('devrait retourner 404 si sondage introuvable', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.poll.findUnique.mockResolvedValue(null);

    const params = Promise.resolve({ id: TEST_IDS.poll1 });
    const response = await GET({} as any, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Sondage introuvable');
  });

  it('devrait retourner le sondage avec ses options et votes', async () => {
    const mockPoll = { id: TEST_IDS.poll1, question: 'Question?', status: 'open' };
    const mockOptions = [
      { id: 'opt1', pollId: TEST_IDS.poll1, date: new Date(), location: 'Location 1' },
      { id: 'opt2', pollId: TEST_IDS.poll1, date: new Date(), location: 'Location 2' },
    ];
    const mockVotes = [
      { id: 'vote1', pollId: TEST_IDS.poll1, userId: TEST_IDS.user1, pollOptionId: 'opt1' },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.poll.findUnique.mockResolvedValue(mockPoll as any);
    prismaMock.pollOption.findMany.mockResolvedValue(mockOptions as any);
    prismaMock.pollVote.findMany.mockResolvedValue(mockVotes as any);

    const params = Promise.resolve({ id: TEST_IDS.poll1 });
    const response = await GET({} as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.poll).toEqual(mockPoll);
    expect(data.options).toHaveLength(2);
    expect(data.votes).toHaveLength(1);
  });
});
