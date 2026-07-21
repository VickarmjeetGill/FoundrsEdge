'use server'

import { cookies } from 'next/headers';
import { decrypt } from '@/lib/tokens';
import { prisma } from '@/lib/prisma';

// Server Action to submit a scorecard
export async function submitScorecard(score: number, answers: any[], categories: Record<string, number>) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    const decodedSession = await decrypt(session);

    if (!decodedSession || !decodedSession.userId) {
      return { error: 'Unauthorized' };
    }

    const userId = decodedSession.userId as string;

    const submission = await prisma.scorecardSubmission.create({
      data: {
        userId,
        score,
        answers: answers as any,
        categories: categories as any,
      },
    });

    return { success: true, submission };
  } catch (error: any) {
    console.error('Error submitting scorecard:', error);
    return { error: error.message || 'Server error' };
  }
}

// Server Action to retrieve scorecard history
export async function getScorecardHistory() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    const decodedSession = await decrypt(session);

    if (!decodedSession || !decodedSession.userId) {
      return { error: 'Unauthorized' };
    }

    const userId = decodedSession.userId as string;

    const submissions = await prisma.scorecardSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, submissions };
  } catch (error: any) {
    console.error('Error fetching scorecard history:', error);
    return { error: error.message || 'Server error' };
  }
}

// Server Action to update goals on a specific scorecard submission
export async function updateScorecardGoals(submissionId: string, goals: Record<string, any>) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    const decodedSession = await decrypt(session);

    if (!decodedSession || !decodedSession.userId) {
      return { error: 'Unauthorized' };
    }

    const submission = await prisma.scorecardSubmission.update({
      where: { id: submissionId },
      data: {
        goals: goals as any
      }
    });

    return { success: true, submission };
  } catch (error: any) {
    console.error('Error updating scorecard goals:', error);
    return { error: error.message || 'Server error' };
  }
}
