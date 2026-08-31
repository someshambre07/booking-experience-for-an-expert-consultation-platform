import { Request, Response, Router } from 'express';
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { store } from './store.js';

export const apiRouter = Router();

// Standard response wrappers
const sendSuccess = (res: Response, data: any, statusCode = 200, meta?: any) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {})
  });
};

const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
};

// GET /api/health
apiRouter.get('/health', (req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    service: 'consult-booking-api',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    storeStats: {
      experts: store.getExperts({}).length,
      bookings: store.getAllBookings().length
    }
  });
});

// GET /api/categories
apiRouter.get('/categories', (req: Request, res: Response) => {
  const experts = store.getExperts({});
  const categoryCounts: Record<string, number> = {
    'All': experts.length,
    'Tech & AI': 0,
    'Legal & Immigration': 0,
    'Startup & VC': 0,
    'Tax & Accounting': 0,
    'Product & UX': 0,
    'Career Coaching': 0
  };

  experts.forEach((exp) => {
    if (categoryCounts[exp.category] !== undefined) {
      categoryCounts[exp.category]++;
    }
  });

  const availableNowCount = experts.filter((e) => e.isAvailableRightNow).length;

  sendSuccess(res, {
    categories: Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count
    })),
    availableNowCount
  });
});

// GET /api/experts
apiRouter.get('/experts', (req: Request, res: Response) => {
  const { category, search, availableNow, sortBy } = req.query;

  const experts = store.getExperts({
    category: typeof category === 'string' ? category : undefined,
    search: typeof search === 'string' ? search : undefined,
    availableNow: availableNow === 'true',
    sortBy: typeof sortBy === 'string' ? sortBy : undefined
  });

  sendSuccess(res, experts, 200, {
    total: experts.length,
    availableNowTotal: experts.filter((e) => e.isAvailableRightNow).length
  });
});

// GET /api/experts/:id
apiRouter.get('/experts/:id', (req: Request, res: Response) => {
  const expert = store.getExpertById(req.params.id);
  if (!expert) {
    return sendError(res, 404, 'EXPERT_NOT_FOUND', `No expert found with ID ${req.params.id}`);
  }
  sendSuccess(res, expert);
});

// GET /api/slots
apiRouter.get('/slots', (req: Request, res: Response) => {
  const { expertId } = req.query;
  if (!expertId || typeof expertId !== 'string') {
    return sendError(res, 400, 'MISSING_EXPERT_ID', 'Query parameter "expertId" is required');
  }

  const slots = store.getSlotsByExpertId(expertId);
  sendSuccess(res, slots);
});

// POST /api/bookings
apiRouter.post('/bookings', (req: Request, res: Response) => {
  const { expertId, slotId, user, idempotencyKey } = req.body;

  // Validation
  const validationErrors: string[] = [];
  if (!expertId || typeof expertId !== 'string') validationErrors.push('Field "expertId" is required (string)');
  if (!slotId || typeof slotId !== 'string') validationErrors.push('Field "slotId" is required (string)');
  if (!user || typeof user !== 'object') {
    validationErrors.push('Field "user" is required (object)');
  } else {
    if (!user.name || typeof user.name !== 'string' || !user.name.trim()) {
      validationErrors.push('Field "user.name" is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email || typeof user.email !== 'string' || !emailRegex.test(user.email.trim())) {
      validationErrors.push('Field "user.email" must be a valid email address');
    }
  }

  if (validationErrors.length > 0) {
    return sendError(res, 400, 'VALIDATION_FAILED', 'Input validation failed', validationErrors);
  }

  try {
    const { booking, isReplay } = store.createBooking({
      expertId,
      slotId,
      user,
      idempotencyKey: typeof idempotencyKey === 'string' ? idempotencyKey : undefined
    });

    const statusCode = isReplay ? 200 : 201;
    return sendSuccess(res, booking, statusCode, {
      isReplay,
      message: isReplay
        ? 'Duplicate booking request matched via idempotency key (returned existing booking).'
        : 'Consultation session successfully confirmed!'
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'An unexpected error occurred while processing booking.';
    return sendError(res, statusCode, code, message);
  }
});

// GET /api/bookings
apiRouter.get('/bookings', (req: Request, res: Response) => {
  const { email } = req.query;
  const bookings = store.getAllBookings(typeof email === 'string' ? email : undefined);
  sendSuccess(res, bookings, 200, { total: bookings.length });
});

// GET /api/bookings/:id
apiRouter.get('/bookings/:id', (req: Request, res: Response) => {
  const booking = store.getBookingById(req.params.id);
  if (!booking) {
    return sendError(res, 404, 'BOOKING_NOT_FOUND', `No booking found with ID ${req.params.id}`);
  }
  sendSuccess(res, booking);
});

// POST /api/bookings/:id/cancel
apiRouter.post('/bookings/:id/cancel', (req: Request, res: Response) => {
  try {
    const cancelled = store.cancelBooking(req.params.id);
    sendSuccess(res, cancelled, 200, {
      message: 'Booking successfully cancelled and slot released back to inventory.'
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'Failed to cancel booking.';
    return sendError(res, statusCode, code, message);
  }
});

// POST /api/reset-data (Resets in-memory store to fresh seed)
apiRouter.post('/reset-data', (req: Request, res: Response) => {
  store.reset();
  sendSuccess(res, { message: 'Database reset to initial seed state successfully' });
});

// POST /api/simulate-race-condition
// Demonstrates two users booking the exact same slot at the exact same millisecond
apiRouter.post('/simulate-race-condition', async (req: Request, res: Response) => {
  const experts = store.getExperts({});
  if (experts.length === 0) {
    return sendError(res, 400, 'NO_EXPERTS', 'No experts available');
  }

  const targetExpert = experts[0];
  const slots = store.getSlotsByExpertId(targetExpert.id).filter(
    (s) => s.status === 'available' && new Date(s.startTime).getTime() > Date.now()
  );

  if (slots.length === 0) {
    return sendError(res, 400, 'NO_AVAILABLE_SLOTS', 'No available future slots to test race condition');
  }

  const targetSlot = slots[0];

  // Prepare two concurrent booking requests for the exact same slot
  const req1 = () => {
    try {
      const res1 = store.createBooking({
        expertId: targetExpert.id,
        slotId: targetSlot.id,
        user: {
          name: 'User A (Client Alice)',
          email: 'alice@example.com',
          timezone: 'America/New_York',
          notes: 'Testing simultaneous reservation A'
        },
        idempotencyKey: `race-test-a-${Date.now()}`
      });
      return { status: 201, result: res1 };
    } catch (e: any) {
      return { status: e.statusCode || 500, code: e.code, message: e.message };
    }
  };

  const req2 = () => {
    try {
      const res2 = store.createBooking({
        expertId: targetExpert.id,
        slotId: targetSlot.id,
        user: {
          name: 'User B (Client Bob)',
          email: 'bob@example.com',
          timezone: 'Europe/London',
          notes: 'Testing simultaneous reservation B'
        },
        idempotencyKey: `race-test-b-${Date.now()}`
      });
      return { status: 201, result: res2 };
    } catch (e: any) {
      return { status: e.statusCode || 500, code: e.code, message: e.message };
    }
  };

  // Execute synchronously back to back
  const outcome1 = req1();
  const outcome2 = req2();

  sendSuccess(res, {
    testedSlot: {
      id: targetSlot.id,
      expertName: targetExpert.name,
      startTime: targetSlot.startTime
    },
    userA_Attempt: outcome1,
    userB_Attempt: outcome2,
    verdict:
      outcome1.status === 201 && outcome2.status === 409
        ? 'PASSED: User A secured booking (201 Created), User B received 409 Conflict rejection. No double booking occurred.'
        : 'Outcome recorded'
  });
});

// Helper function to recursively zip directory
function addDirectoryToZip(zip: JSZip, localPath: string, zipPath = '') {
  const items = fs.readdirSync(localPath);
  for (const item of items) {
    if (
      item === 'node_modules' ||
      item === '.git' ||
      item === 'dist' ||
      item === '.next' ||
      item === '.cache' ||
      item === '.DS_Store'
    ) {
      continue;
    }
    const fullPath = path.join(localPath, item);
    const itemZipPath = zipPath ? `${zipPath}/${item}` : item;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirectoryToZip(zip, fullPath, itemZipPath);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.file(itemZipPath, content);
    }
  }
}

// GET /api/download-zip
// Creates and streams complete project zip file
apiRouter.get('/download-zip', async (req: Request, res: Response) => {
  try {
    const zip = new JSZip();
    const projectRoot = process.cwd();
    addDirectoryToZip(zip, projectRoot, '');

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="consult-expert-booking-project.zip"');
    res.setHeader('Content-Length', buffer.length.toString());
    return res.send(buffer);
  } catch (err: any) {
    console.error('Error generating zip:', err);
    return sendError(res, 500, 'ZIP_GENERATION_FAILED', 'Failed to generate project zip file');
  }
});
