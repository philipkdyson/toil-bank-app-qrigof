import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/auth-schema.js';

interface RoleResponse {
  role: 'user' | 'manager';
}

interface UpdateRoleRequest {
  userId: string;
  role: 'user' | 'manager';
}

interface UpdateRoleResponse {
  success: boolean;
  userId: string;
  role: 'user' | 'manager';
}

interface PromoteUserRequest {
  email: string;
  role: 'user' | 'manager';
}

interface PromoteUserResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'manager';
  };
}

interface ToggleRoleResponse {
  success: boolean;
  role: 'user' | 'manager';
}

export function registerUserRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/user/role - Get current user's role
  app.fastify.get<{ Reply: RoleResponse }>(
    '/api/user/role',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching user role');

      try {
        const user = await app.db.query.user.findFirst({
          where: eq(authSchema.user.id, userId),
        });

        if (!user) {
          app.logger.warn({ userId }, 'User not found');
          return reply.code(404).send({ error: 'User not found' });
        }

        const response: RoleResponse = {
          role: user.role as 'user' | 'manager',
        };

        app.logger.info({ userId, role: user.role }, 'User role fetched');
        return response;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch user role');
        throw error;
      }
    }
  );

  // PUT /api/user/role - Update user role (manager only)
  app.fastify.put<{ Body: UpdateRoleRequest; Reply: UpdateRoleResponse }>(
    '/api/user/role',
    async (request: FastifyRequest<{ Body: UpdateRoleRequest }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const managerId = session.user.id;
      const { userId, role } = request.body as UpdateRoleRequest;

      app.logger.info(
        { managerId, targetUserId: userId, newRole: role },
        'Updating user role'
      );

      try {
        // Validate input
        if (!userId || !role) {
          app.logger.warn({ managerId }, 'Missing required fields: userId, role');
          return reply.code(400).send({
            error: 'Missing required fields: userId, role',
          });
        }

        if (role !== 'user' && role !== 'manager') {
          app.logger.warn({ managerId, role }, 'Invalid role value');
          return reply.code(400).send({ error: 'Role must be user or manager' });
        }

        // Check if requester is manager
        const manager = await app.db.query.user.findFirst({
          where: eq(authSchema.user.id, managerId),
        });

        if (!manager || manager.role !== 'manager') {
          app.logger.warn({ managerId }, 'Unauthorized: user is not a manager');
          return reply.code(403).send({ error: 'Only managers can update user roles' });
        }

        // Check if target user exists
        const targetUser = await app.db.query.user.findFirst({
          where: eq(authSchema.user.id, userId),
        });

        if (!targetUser) {
          app.logger.warn({ managerId, targetUserId: userId }, 'Target user not found');
          return reply.code(404).send({ error: 'User not found' });
        }

        // Update user role
        await app.db
          .update(authSchema.user)
          .set({ role })
          .where(eq(authSchema.user.id, userId));

        const response: UpdateRoleResponse = {
          success: true,
          userId,
          role: role as 'user' | 'manager',
        };

        app.logger.info(
          { managerId, targetUserId: userId, newRole: role },
          'User role updated successfully'
        );
        return response;
      } catch (error) {
        app.logger.error(
          { err: error, managerId, body: request.body },
          'Failed to update user role'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/promote-user - Promote user to manager role (admin endpoint)
  // TODO: In production, this endpoint should be protected by admin authentication
  app.fastify.put<{ Body: PromoteUserRequest; Reply: PromoteUserResponse }>(
    '/api/admin/promote-user',
    async (request: FastifyRequest<{ Body: PromoteUserRequest }>, reply: FastifyReply) => {
      const { email, role } = request.body as PromoteUserRequest;

      app.logger.info({ email, role }, 'Promoting user via admin endpoint');

      try {
        // Validate input
        if (!email || !role) {
          app.logger.warn({ body: request.body }, 'Missing required fields: email, role');
          return reply.code(400).send({
            error: 'Missing required fields: email, role',
          });
        }

        if (role !== 'user' && role !== 'manager') {
          app.logger.warn({ role }, 'Invalid role value');
          return reply.code(400).send({ error: 'Role must be user or manager' });
        }

        // Find user by email
        const user = await app.db.query.user.findFirst({
          where: eq(authSchema.user.email, email),
        });

        if (!user) {
          app.logger.warn({ email }, 'User not found');
          return reply.code(404).send({ error: 'User not found' });
        }

        // Update user role
        await app.db
          .update(authSchema.user)
          .set({ role })
          .where(eq(authSchema.user.email, email));

        const response: PromoteUserResponse = {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: role as 'user' | 'manager',
          },
        };

        app.logger.info(
          { email, userId: user.id, newRole: role },
          'User promoted successfully via admin endpoint'
        );
        return response;
      } catch (error) {
        app.logger.error(
          { err: error, body: request.body },
          'Failed to promote user'
        );
        throw error;
      }
    }
  );

  // PUT /api/user/toggle-role - Toggle current user's role between user and manager
  // Development/testing endpoint to allow users to toggle their own role
  app.fastify.put<{ Reply: ToggleRoleResponse }>(
    '/api/user/toggle-role',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Toggling user role');

      try {
        // Get current user
        const user = await app.db.query.user.findFirst({
          where: eq(authSchema.user.id, userId),
        });

        if (!user) {
          app.logger.warn({ userId }, 'User not found');
          return reply.code(404).send({ error: 'User not found' });
        }

        // Determine new role
        const newRole = user.role === 'manager' ? 'user' : 'manager';

        // Update user role
        await app.db
          .update(authSchema.user)
          .set({ role: newRole })
          .where(eq(authSchema.user.id, userId));

        const response: ToggleRoleResponse = {
          success: true,
          role: newRole as 'user' | 'manager',
        };

        app.logger.info(
          { userId, previousRole: user.role, newRole },
          'User role toggled successfully'
        );
        return response;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to toggle user role');
        throw error;
      }
    }
  );
}
