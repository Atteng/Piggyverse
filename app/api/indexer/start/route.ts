import { NextRequest, NextResponse } from 'next/server';
import { transactionIndexer } from '@/lib/indexer/transaction-indexer';

// POST /api/indexer/start - Start the transaction indexer (admin only)
export async function POST(request: NextRequest) {
    try {
        // TODO: Add admin authentication check

        await transactionIndexer.start();

        return NextResponse.json({
            success: true,
            message: 'Transaction indexer started'
        });
    } catch (error) {
        console.error('Error starting indexer:', error);
        return NextResponse.json(
            { error: 'Failed to start indexer' },
            { status: 500 }
        );
    }
}

// DELETE /api/indexer/start - Stop the transaction indexer (admin only)
export async function DELETE(request: NextRequest) {
    try {
        // TODO: Add admin authentication check

        transactionIndexer.stop();

        return NextResponse.json({
            success: true,
            message: 'Transaction indexer stopped'
        });
    } catch (error) {
        console.error('Error stopping indexer:', error);
        return NextResponse.json(
            { error: 'Failed to stop indexer' },
            { status: 500 }
        );
    }
}
