'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/tokens';

async function checkAdmin() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session')?.value;
        const decodedSession = await decrypt(session);

        if (!decodedSession || !decodedSession.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { id: decodedSession.userId as string },
            select: { role: true }
        });

        if (!user || user.role !== 'ADMIN') {
            return { success: false, error: 'Forbidden' };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Authentication failed' };
    }
}

// Get all steps for a track for the admin dashboard
export async function getAdminRoadmapSteps(track: string) {
    const adminCheck = await checkAdmin();
    if (!adminCheck.success) {
        return { error: adminCheck.error };
    }

    try {
        const steps = await prisma.roadmapStep.findMany({
            where: { track },
            orderBy: { order: 'asc' }
        });
        return { success: true, steps };
    } catch (error: any) {
        console.error('Error fetching admin roadmap steps:', error);
        return { error: error.message || 'Server error' };
    }
}

// Create a new step
export async function createRoadmapStep(data: {
    track: string;
    title: string;
    description: string;
    actionText: string;
    actionHref: string;
}) {
    const adminCheck = await checkAdmin();
    if (!adminCheck.success) {
        return { error: adminCheck.error };
    }

    try {
        // Find the current highest order/weekNumber for this track
        const lastStep = await prisma.roadmapStep.findFirst({
            where: { track: data.track },
            orderBy: { order: 'desc' }
        });

        const nextOrder = lastStep ? lastStep.order + 1 : 1;

        const newStep = await prisma.roadmapStep.create({
            data: {
                track: data.track,
                title: data.title,
                description: data.description,
                actionText: data.actionText,
                actionHref: data.actionHref,
                order: nextOrder,
                weekNumber: nextOrder
            }
        });

        return { success: true, step: newStep };
    } catch (error: any) {
        console.error('Error creating roadmap step:', error);
        return { error: error.message || 'Server error' };
    }
}

// Update a step
export async function updateRoadmapStep(
    id: string,
    data: {
        title: string;
        description: string;
        actionText: string;
        actionHref: string;
    }
) {
    const adminCheck = await checkAdmin();
    if (!adminCheck.success) {
        return { error: adminCheck.error };
    }

    try {
        const updatedStep = await prisma.roadmapStep.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                actionText: data.actionText,
                actionHref: data.actionHref
            }
        });
        return { success: true, step: updatedStep };
    } catch (error: any) {
        console.error('Error updating roadmap step:', error);
        return { error: error.message || 'Server error' };
    }
}

// Delete a step
export async function deleteRoadmapStep(id: string) {
    const adminCheck = await checkAdmin();
    if (!adminCheck.success) {
        return { error: adminCheck.error };
    }

    try {
        const deletedStep = await prisma.roadmapStep.delete({
            where: { id }
        });

        // Reorder remaining steps in this track to fill the gap
        const remainingSteps = await prisma.roadmapStep.findMany({
            where: { track: deletedStep.track },
            orderBy: { order: 'asc' }
        });

        await prisma.$transaction(
            remainingSteps.map((step, index) =>
                prisma.roadmapStep.update({
                    where: { id: step.id },
                    data: {
                        order: index + 1,
                        weekNumber: index + 1
                    }
                })
            )
        );

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting roadmap step:', error);
        return { error: error.message || 'Server error' };
    }
}

// Reorder steps list
export async function reorderRoadmapSteps(orderedIds: string[]) {
    const adminCheck = await checkAdmin();
    if (!adminCheck.success) {
        return { error: adminCheck.error };
    }

    try {
        await prisma.$transaction(
            orderedIds.map((id, index) =>
                prisma.roadmapStep.update({
                    where: { id },
                    data: {
                        order: index + 1,
                        weekNumber: index + 1
                    }
                })
            )
        );
        return { success: true };
    } catch (error: any) {
        console.error('Error reordering roadmap steps:', error);
        return { error: error.message || 'Server error' };
    }
}
