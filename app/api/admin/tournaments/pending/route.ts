import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/tournaments/pending - Get tournaments pending settlement
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // TODO: Add admin role check
        // For now, only tournament hosts can see their own tournaments

        const tournaments = await prisma.tournament.findMany({
            where: {
                status: 'COMPLETED',
                bettingMarkets: {
                    some: {
                        status: 'OPEN' // Market not yet settled
                    }
                }
            },
            include: {
                game: {
                    select: {
                        title: true
                    }
                },
                host: {
                    select: {
                        username: true
                    }
                },
                bettingMarkets: {
                    include: {
                        outcomes: true,
                        _count: {
                            select: {
                                bets: true
                            }
                        }
                    }
                },
                registrations: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        return NextResponse.json({ tournaments });
    } catch (error) {
        console.error('Error fetching pending settlements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tournaments' },
            { status: 500 }
        );
    }
}
