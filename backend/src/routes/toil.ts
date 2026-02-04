import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';

interface ToilEventInput {
  timestamp: string; // ISO 8601
  type: 'ADD' | 'TAKE';
  minutes: number;
  note?: string;
}

interface ToilEventResponse {
  id: string;
  timestamp: string;
  type: 'ADD' | 'TAKE';
  minutes: number;
  note: string | null;
  created_at: string;
}

interface BalanceResponse {
  balance: number;
  addMinutes: number;
  takeMinutes: number;
}

export function registerToilRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/toil/events - Get all TOIL events for authenticated user
  app.fastify.get<{ Reply: ToilEventResponse[] }>(
    '/api/toil/events',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching TOIL events');

      try {
        const events = await app.db
          .select()
          .from(schema.toilEvents)
          .where(eq(schema.toilEvents.userId, userId))
          .orderBy(desc(schema.toilEvents.timestamp));

        const formattedEvents: ToilEventResponse[] = events.map((event) => ({
          id: event.id,
          timestamp: event.timestamp.toISOString(),
          type: event.type as 'ADD' | 'TAKE',
          minutes: event.minutes,
          note: event.note,
          created_at: event.createdAt.toISOString(),
        }));

        app.logger.info({ userId, count: formattedEvents.length }, 'TOIL events fetched');
        return formattedEvents;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch TOIL events');
        throw error;
      }
    }
  );

  // POST /api/toil/events - Create a new TOIL event
  app.fastify.post<{ Body: ToilEventInput; Reply: ToilEventResponse }>(
    '/api/toil/events',
    async (request: FastifyRequest<{ Body: ToilEventInput }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { timestamp, type, minutes, note } = request.body as ToilEventInput;

      app.logger.info({ userId, timestamp, type, minutes, note }, 'Creating TOIL event');

      try {
        // Validate input
        if (!timestamp || !type || typeof minutes !== 'number') {
          app.logger.warn(
            { userId, body: request.body },
            'Invalid TOIL event creation request'
          );
          return reply.code(400).send({
            error: 'Missing required fields: timestamp, type, minutes',
          });
        }

        if (type !== 'ADD' && type !== 'TAKE') {
          app.logger.warn({ userId, type }, 'Invalid type value');
          return reply.code(400).send({ error: 'Type must be ADD or TAKE' });
        }

        if (minutes <= 0) {
          app.logger.warn({ userId, minutes }, 'Invalid minutes value');
          return reply.code(400).send({ error: 'Minutes must be positive' });
        }

        const eventTimestamp = new Date(timestamp);
        if (isNaN(eventTimestamp.getTime())) {
          app.logger.warn({ userId, timestamp }, 'Invalid timestamp format');
          return reply.code(400).send({ error: 'Invalid ISO 8601 timestamp' });
        }

        const [event] = await app.db
          .insert(schema.toilEvents)
          .values({
            timestamp: eventTimestamp,
            type,
            minutes,
            note: note || null,
            userId,
          })
          .returning();

        const response: ToilEventResponse = {
          id: event.id,
          timestamp: event.timestamp.toISOString(),
          type: event.type as 'ADD' | 'TAKE',
          minutes: event.minutes,
          note: event.note,
          created_at: event.createdAt.toISOString(),
        };

        app.logger.info(
          { userId, eventId: event.id, type, minutes },
          'TOIL event created successfully'
        );
        return response;
      } catch (error) {
        app.logger.error(
          { err: error, userId, body: request.body },
          'Failed to create TOIL event'
        );
        throw error;
      }
    }
  );

  // DELETE /api/toil/events/:id - Delete a TOIL event (undo functionality)
  app.fastify.delete<{ Params: { id: string }; Reply: { success: boolean } }>(
    '/api/toil/events/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params as { id: string };

      app.logger.info({ userId, eventId: id }, 'Deleting TOIL event');

      try {
        // Check if event exists and belongs to user
        const event = await app.db.query.toilEvents.findFirst({
          where: and(
            eq(schema.toilEvents.id, id),
            eq(schema.toilEvents.userId, userId)
          ),
        });

        if (!event) {
          app.logger.warn({ userId, eventId: id }, 'TOIL event not found or unauthorized');
          return reply.code(404).send({ error: 'TOIL event not found' });
        }

        await app.db
          .delete(schema.toilEvents)
          .where(
            and(
              eq(schema.toilEvents.id, id),
              eq(schema.toilEvents.userId, userId)
            )
          );

        app.logger.info({ userId, eventId: id }, 'TOIL event deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId, eventId: id },
          'Failed to delete TOIL event'
        );
        throw error;
      }
    }
  );

  // PUT /api/toil/events/:id - Update a TOIL event (only for today's entries)
  app.fastify.put<{
    Params: { id: string };
    Body: Partial<ToilEventInput>;
    Reply: ToilEventResponse;
  }>(
    '/api/toil/events/:id',
    async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<ToilEventInput> }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params as { id: string };
      const { timestamp, type, minutes, note } = request.body as Partial<ToilEventInput>;

      app.logger.info({ userId, eventId: id, body: request.body }, 'Updating TOIL event');

      try {
        // Check if event exists and belongs to user
        const event = await app.db.query.toilEvents.findFirst({
          where: and(
            eq(schema.toilEvents.id, id),
            eq(schema.toilEvents.userId, userId)
          ),
        });

        if (!event) {
          app.logger.warn({ userId, eventId: id }, 'TOIL event not found or unauthorized');
          return reply.code(404).send({ error: 'TOIL event not found' });
        }

        // Check if event was created today
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const eventDate = new Date(event.createdAt);
        eventDate.setUTCHours(0, 0, 0, 0);

        if (eventDate.getTime() !== today.getTime()) {
          app.logger.warn(
            { userId, eventId: id, createdAt: event.createdAt },
            'Cannot update event from previous day'
          );
          return reply.code(400).send({
            error: 'Can only update events created today',
          });
        }

        // Validate input fields if provided
        if (type && type !== 'ADD' && type !== 'TAKE') {
          app.logger.warn({ userId, type }, 'Invalid type value');
          return reply.code(400).send({ error: 'Type must be ADD or TAKE' });
        }

        if (minutes !== undefined && minutes <= 0) {
          app.logger.warn({ userId, minutes }, 'Invalid minutes value');
          return reply.code(400).send({ error: 'Minutes must be positive' });
        }

        if (timestamp) {
          const eventTimestamp = new Date(timestamp);
          if (isNaN(eventTimestamp.getTime())) {
            app.logger.warn({ userId, timestamp }, 'Invalid timestamp format');
            return reply.code(400).send({ error: 'Invalid ISO 8601 timestamp' });
          }
        }

        // Build update object with only provided fields
        const updateData: Record<string, any> = {};
        if (timestamp) updateData.timestamp = new Date(timestamp);
        if (type) updateData.type = type;
        if (minutes !== undefined) updateData.minutes = minutes;
        if (note !== undefined) updateData.note = note || null;

        const [updatedEvent] = await app.db
          .update(schema.toilEvents)
          .set(updateData)
          .where(
            and(
              eq(schema.toilEvents.id, id),
              eq(schema.toilEvents.userId, userId)
            )
          )
          .returning();

        const response: ToilEventResponse = {
          id: updatedEvent.id,
          timestamp: updatedEvent.timestamp.toISOString(),
          type: updatedEvent.type as 'ADD' | 'TAKE',
          minutes: updatedEvent.minutes,
          note: updatedEvent.note,
          created_at: updatedEvent.createdAt.toISOString(),
        };

        app.logger.info(
          { userId, eventId: id, type, minutes },
          'TOIL event updated successfully'
        );
        return response;
      } catch (error) {
        app.logger.error(
          { err: error, userId, eventId: id, body: request.body },
          'Failed to update TOIL event'
        );
        throw error;
      }
    }
  );

  // GET /api/toil/balance - Get calculated balance for authenticated user
  app.fastify.get<{ Reply: BalanceResponse }>(
    '/api/toil/balance',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Calculating TOIL balance');

      try {
        const events = await app.db
          .select()
          .from(schema.toilEvents)
          .where(eq(schema.toilEvents.userId, userId));

        let addMinutes = 0;
        let takeMinutes = 0;

        for (const event of events) {
          if (event.type === 'ADD') {
            addMinutes += event.minutes;
          } else if (event.type === 'TAKE') {
            takeMinutes += event.minutes;
          }
        }

        const balance = addMinutes - takeMinutes;

        const response: BalanceResponse = {
          balance,
          addMinutes,
          takeMinutes,
        };

        app.logger.info(
          { userId, balance, addMinutes, takeMinutes },
          'TOIL balance calculated'
        );
        return response;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to calculate TOIL balance');
        throw error;
      }
    }
  );
}
