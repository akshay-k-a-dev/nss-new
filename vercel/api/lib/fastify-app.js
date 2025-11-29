import Fastify from 'fastify';
import cors from '@fastify/cors';
import prisma from './prisma.js';

// Create Fastify instance
const createApp = async () => {
  const app = Fastify({
    logger: true,
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Health check
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // ==================== PROGRAMS ====================
  app.get('/api/programs', async () => {
    const programs = await prisma.program.findMany({
      include: {
        participants: { select: { studentId: true } },
        coordinators: { select: { studentId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return programs.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      date: p.date,
      time: p.time,
      venue: p.venue,
      coordinator: p.coordinator,
      coordinatorIds: p.coordinators.map(c => c.studentId),
      participantIds: p.participants.map(pt => pt.studentId),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  });

  app.post('/api/programs', async (request, reply) => {
    const body = request.body;
    
    const program = await prisma.program.create({
      data: {
        title: body.title,
        description: body.description,
        date: body.date,
        time: body.time,
        venue: body.venue,
        coordinator: body.coordinator || '',
        participants: body.participantIds?.length ? {
          create: body.participantIds.map(id => ({ studentId: id })),
        } : undefined,
        coordinators: body.coordinatorIds?.length ? {
          create: body.coordinatorIds.map(id => ({ studentId: id })),
        } : undefined,
      },
      include: {
        participants: { select: { studentId: true } },
        coordinators: { select: { studentId: true } },
      },
    });

    reply.status(201);
    return {
      id: program.id,
      title: program.title,
      description: program.description,
      date: program.date,
      time: program.time,
      venue: program.venue,
      coordinator: program.coordinator,
      coordinatorIds: program.coordinators.map(c => c.studentId),
      participantIds: program.participants.map(pt => pt.studentId),
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    };
  });

  app.get('/api/programs/:id', async (request, reply) => {
    const { id } = request.params;
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        participants: { select: { studentId: true } },
        coordinators: { select: { studentId: true } },
      },
    });
    
    if (!program) {
      reply.status(404);
      return { error: 'Program not found' };
    }

    return {
      id: program.id,
      title: program.title,
      description: program.description,
      date: program.date,
      time: program.time,
      venue: program.venue,
      coordinator: program.coordinator,
      coordinatorIds: program.coordinators.map(c => c.studentId),
      participantIds: program.participants.map(pt => pt.studentId),
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    };
  });

  app.put('/api/programs/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    try {
      // Handle participant and coordinator updates
      if (body.participantIds !== undefined) {
        await prisma.programParticipant.deleteMany({ where: { programId: id } });
        if (body.participantIds.length > 0) {
          await prisma.programParticipant.createMany({
            data: body.participantIds.map(studentId => ({ programId: id, studentId })),
            skipDuplicates: true,
          });
        }
      }

      if (body.coordinatorIds !== undefined) {
        await prisma.programCoordinator.deleteMany({ where: { programId: id } });
        if (body.coordinatorIds.length > 0) {
          await prisma.programCoordinator.createMany({
            data: body.coordinatorIds.map(studentId => ({ programId: id, studentId })),
            skipDuplicates: true,
          });
        }
      }

      const updateData = {};
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.date !== undefined) updateData.date = body.date;
      if (body.time !== undefined) updateData.time = body.time;
      if (body.venue !== undefined) updateData.venue = body.venue;
      if (body.coordinator !== undefined) updateData.coordinator = body.coordinator;

      const program = await prisma.program.update({
        where: { id },
        data: updateData,
        include: {
          participants: { select: { studentId: true } },
          coordinators: { select: { studentId: true } },
        },
      });

      return {
        id: program.id,
        title: program.title,
        description: program.description,
        date: program.date,
        time: program.time,
        venue: program.venue,
        coordinator: program.coordinator,
        coordinatorIds: program.coordinators.map(c => c.studentId),
        participantIds: program.participants.map(pt => pt.studentId),
        createdAt: program.createdAt.toISOString(),
        updatedAt: program.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Program not found' };
      }
      throw error;
    }
  });

  app.delete('/api/programs/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.program.delete({ where: { id } });
      reply.status(204);
      return;
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Program not found' };
      }
      throw error;
    }
  });

  // ==================== STUDENTS ====================
  app.get('/api/students', async () => {
    const students = await prisma.student.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });

    return students.map(s => ({
      id: s.id,
      name: s.name,
      department: s.department.name,
      password: s.password || '',
      profileImageUrl: s.profileImageUrl,
      createdAt: s.createdAt.toISOString(),
    }));
  });

  app.post('/api/students', async (request, reply) => {
    const body = request.body;

    // Find or create department
    let department = await prisma.department.findFirst({
      where: { name: body.department },
    });

    if (!department) {
      department = await prisma.department.create({
        data: { name: body.department, isActive: true },
      });
    }

    const student = await prisma.student.create({
      data: {
        id: body.id,
        name: body.name,
        password: body.password || null,
        profileImageUrl: body.profileImageUrl || null,
        departmentId: department.id,
      },
      include: { department: true },
    });

    reply.status(201);
    return {
      id: student.id,
      name: student.name,
      department: student.department.name,
      password: student.password || '',
      profileImageUrl: student.profileImageUrl,
      createdAt: student.createdAt.toISOString(),
    };
  });

  app.get('/api/students/:id', async (request, reply) => {
    const { id } = request.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { department: true },
    });
    
    if (!student) {
      reply.status(404);
      return { error: 'Student not found' };
    }

    return {
      id: student.id,
      name: student.name,
      department: student.department.name,
      password: student.password || '',
      profileImageUrl: student.profileImageUrl,
      createdAt: student.createdAt.toISOString(),
    };
  });

  app.put('/api/students/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    try {
      const updateData = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.password !== undefined) updateData.password = body.password;
      if (body.profileImageUrl !== undefined) updateData.profileImageUrl = body.profileImageUrl;

      if (body.department !== undefined) {
        let department = await prisma.department.findFirst({
          where: { name: body.department },
        });
        if (!department) {
          department = await prisma.department.create({
            data: { name: body.department, isActive: true },
          });
        }
        updateData.departmentId = department.id;
      }

      const student = await prisma.student.update({
        where: { id },
        data: updateData,
        include: { department: true },
      });

      return {
        id: student.id,
        name: student.name,
        department: student.department.name,
        password: student.password || '',
        profileImageUrl: student.profileImageUrl,
        createdAt: student.createdAt.toISOString(),
      };
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Student not found' };
      }
      throw error;
    }
  });

  app.delete('/api/students/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.student.delete({ where: { id } });
      reply.status(204);
      return;
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Student not found' };
      }
      throw error;
    }
  });

  app.post('/api/students/login', async (request, reply) => {
    const { id, password } = request.body;
    const student = await prisma.student.findFirst({
      where: { id, password },
      include: { department: true },
    });
    
    if (!student) {
      reply.status(401);
      return { error: 'Invalid credentials' };
    }

    return {
      user: {
        id: student.id,
        name: student.name,
        department: student.department.name,
        password: student.password || '',
        profileImageUrl: student.profileImageUrl,
        createdAt: student.createdAt.toISOString(),
      },
      token: `student-token-${student.id}`,
    };
  });

  app.post('/api/students/set-password', async (request, reply) => {
    const { id, password } = request.body;
    try {
      await prisma.student.update({
        where: { id },
        data: { password },
      });
      return { message: 'Password set successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Student not found' };
      }
      throw error;
    }
  });

  app.post('/api/students/change-password', async (request, reply) => {
    const { id, oldPassword, newPassword } = request.body;
    const student = await prisma.student.findUnique({ where: { id } });
    
    if (!student) {
      reply.status(404);
      return { error: 'Student not found' };
    }
    
    if (student.password !== oldPassword) {
      reply.status(401);
      return { error: 'Invalid old password' };
    }

    await prisma.student.update({
      where: { id },
      data: { password: newPassword },
    });
    
    return { message: 'Password changed successfully' };
  });

  // ==================== COORDINATORS ====================
  app.get('/api/coordinators', async () => {
    const coordinators = await prisma.coordinator.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });

    return coordinators.map(c => ({
      id: c.id,
      name: c.name,
      department: c.department.name,
      password: c.password,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    }));
  });

  app.post('/api/coordinators', async (request, reply) => {
    const body = request.body;

    // Find or create department
    let department = await prisma.department.findFirst({
      where: { name: body.department },
    });

    if (!department) {
      department = await prisma.department.create({
        data: { name: body.department, isActive: true },
      });
    }

    const coordinator = await prisma.coordinator.create({
      data: {
        id: body.id || undefined,
        name: body.name,
        password: body.password,
        isActive: body.isActive !== false,
        departmentId: department.id,
      },
      include: { department: true },
    });

    reply.status(201);
    return {
      id: coordinator.id,
      name: coordinator.name,
      department: coordinator.department.name,
      password: coordinator.password,
      isActive: coordinator.isActive,
      createdAt: coordinator.createdAt.toISOString(),
    };
  });

  app.get('/api/coordinators/:id', async (request, reply) => {
    const { id } = request.params;
    const coordinator = await prisma.coordinator.findUnique({
      where: { id },
      include: { department: true },
    });
    
    if (!coordinator) {
      reply.status(404);
      return { error: 'Coordinator not found' };
    }

    return {
      id: coordinator.id,
      name: coordinator.name,
      department: coordinator.department.name,
      password: coordinator.password,
      isActive: coordinator.isActive,
      createdAt: coordinator.createdAt.toISOString(),
    };
  });

  app.put('/api/coordinators/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    try {
      const updateData = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.password !== undefined) updateData.password = body.password;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;

      if (body.department !== undefined) {
        let department = await prisma.department.findFirst({
          where: { name: body.department },
        });
        if (!department) {
          department = await prisma.department.create({
            data: { name: body.department, isActive: true },
          });
        }
        updateData.departmentId = department.id;
      }

      const coordinator = await prisma.coordinator.update({
        where: { id },
        data: updateData,
        include: { department: true },
      });

      return {
        id: coordinator.id,
        name: coordinator.name,
        department: coordinator.department.name,
        password: coordinator.password,
        isActive: coordinator.isActive,
        createdAt: coordinator.createdAt.toISOString(),
      };
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Coordinator not found' };
      }
      throw error;
    }
  });

  app.delete('/api/coordinators/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.coordinator.delete({ where: { id } });
      reply.status(204);
      return;
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Coordinator not found' };
      }
      throw error;
    }
  });

  // ==================== DEPARTMENTS ====================
  app.get('/api/departments', async () => {
    const departments = await prisma.department.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return departments.map(d => ({
      id: d.id,
      name: d.name,
      isActive: d.isActive,
      createdAt: d.createdAt.toISOString(),
    }));
  });

  app.post('/api/departments', async (request, reply) => {
    const body = request.body;
    
    const department = await prisma.department.create({
      data: {
        name: body.name,
        isActive: true,
      },
    });

    reply.status(201);
    return {
      id: department.id,
      name: department.name,
      isActive: department.isActive,
      createdAt: department.createdAt.toISOString(),
    };
  });

  app.get('/api/departments/:id', async (request, reply) => {
    const { id } = request.params;
    const department = await prisma.department.findUnique({ where: { id } });
    
    if (!department) {
      reply.status(404);
      return { error: 'Department not found' };
    }

    return {
      id: department.id,
      name: department.name,
      isActive: department.isActive,
      createdAt: department.createdAt.toISOString(),
    };
  });

  app.put('/api/departments/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    try {
      const department = await prisma.department.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          isActive: body.isActive !== undefined ? body.isActive : undefined,
        },
      });

      return {
        id: department.id,
        name: department.name,
        isActive: department.isActive,
        createdAt: department.createdAt.toISOString(),
      };
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Department not found' };
      }
      throw error;
    }
  });

  app.delete('/api/departments/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.department.delete({ where: { id } });
      reply.status(204);
      return;
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Department not found' };
      }
      throw error;
    }
  });

  // ==================== STUDENT REPORTS ====================
  app.get('/api/student-reports', async () => {
    const students = await prisma.student.findMany({
      include: {
        activities: true,
        coordinatedPrograms: {
          include: {
            program: true,
          },
        },
      },
    });

    return students.map(s => ({
      id: s.id,
      studentId: s.id,
      activities: s.activities.map(a => ({
        id: a.id,
        badge: a.badge,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt.toISOString(),
      })),
      coordinatedPrograms: s.coordinatedPrograms.map(cp => ({
        id: cp.program.id,
        title: cp.program.title,
        description: cp.program.description,
        date: cp.program.date,
        time: cp.program.time,
        venue: cp.program.venue,
        createdAt: cp.program.createdAt.toISOString(),
      })),
    }));
  });

  app.post('/api/student-reports', async (request, reply) => {
    const body = request.body;
    const { studentId, activities } = body;

    // Create activities for the student
    if (activities && activities.length > 0) {
      for (const activity of activities) {
        await prisma.studentActivity.create({
          data: {
            id: activity.id || undefined,
            badge: activity.badge,
            title: activity.title,
            content: activity.content,
            studentId: studentId,
          },
        });
      }
    }

    // Get updated student with activities
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        activities: true,
        coordinatedPrograms: {
          include: { program: true },
        },
      },
    });

    if (!student) {
      reply.status(404);
      return { error: 'Student not found' };
    }

    reply.status(201);
    return {
      id: student.id,
      studentId: student.id,
      activities: student.activities.map(a => ({
        id: a.id,
        badge: a.badge,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt.toISOString(),
      })),
      coordinatedPrograms: student.coordinatedPrograms.map(cp => ({
        id: cp.program.id,
        title: cp.program.title,
        description: cp.program.description,
        date: cp.program.date,
        time: cp.program.time,
        venue: cp.program.venue,
        createdAt: cp.program.createdAt.toISOString(),
      })),
    };
  });

  app.get('/api/student-reports/:id', async (request, reply) => {
    const { id } = request.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        activities: true,
        coordinatedPrograms: {
          include: { program: true },
        },
      },
    });
    
    if (!student) {
      reply.status(404);
      return { error: 'Report not found' };
    }

    return {
      id: student.id,
      studentId: student.id,
      activities: student.activities.map(a => ({
        id: a.id,
        badge: a.badge,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt.toISOString(),
      })),
      coordinatedPrograms: student.coordinatedPrograms.map(cp => ({
        id: cp.program.id,
        title: cp.program.title,
        description: cp.program.description,
        date: cp.program.date,
        time: cp.program.time,
        venue: cp.program.venue,
        createdAt: cp.program.createdAt.toISOString(),
      })),
    };
  });

  app.put('/api/student-reports/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    // Update activities if provided
    if (body.activities !== undefined) {
      // Delete existing activities
      await prisma.studentActivity.deleteMany({
        where: { studentId: id },
      });

      // Create new activities
      if (body.activities.length > 0) {
        await prisma.studentActivity.createMany({
          data: body.activities.map(a => ({
            id: a.id || undefined,
            badge: a.badge,
            title: a.title,
            content: a.content,
            studentId: id,
          })),
        });
      }
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        activities: true,
        coordinatedPrograms: {
          include: { program: true },
        },
      },
    });

    if (!student) {
      reply.status(404);
      return { error: 'Report not found' };
    }

    return {
      id: student.id,
      studentId: student.id,
      activities: student.activities.map(a => ({
        id: a.id,
        badge: a.badge,
        title: a.title,
        content: a.content,
        createdAt: a.createdAt.toISOString(),
      })),
      coordinatedPrograms: student.coordinatedPrograms.map(cp => ({
        id: cp.program.id,
        title: cp.program.title,
        description: cp.program.description,
        date: cp.program.date,
        time: cp.program.time,
        venue: cp.program.venue,
        createdAt: cp.program.createdAt.toISOString(),
      })),
    };
  });

  // ==================== OFFICERS ====================
  app.get('/api/officers/:id', async (request, reply) => {
    const { id } = request.params;
    const officer = await prisma.officer.findUnique({ where: { id } });
    
    if (!officer) {
      reply.status(404);
      return { error: 'Officer not found' };
    }

    return { id: officer.id, name: officer.name };
  });

  app.put('/api/officers/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    try {
      const updateData = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.password !== undefined) updateData.password = body.password;

      const officer = await prisma.officer.update({
        where: { id },
        data: updateData,
      });

      return { id: officer.id, name: officer.name };
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Officer not found' };
      }
      throw error;
    }
  });

  app.post('/api/officers/login', async (request, reply) => {
    const { id, password } = request.body;
    const officer = await prisma.officer.findFirst({
      where: { id, password },
    });
    
    if (!officer) {
      reply.status(401);
      return { error: 'Invalid credentials' };
    }

    return {
      user: { id: officer.id, name: officer.name },
      token: `officer-token-${officer.id}`,
    };
  });

  // ==================== HOMEPAGE IMAGES ====================
  app.get('/api/homepage-images', async () => {
    const images = await prisma.homepageImage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return images.map(img => ({
      id: img.id,
      url: img.url,
      title: img.title,
      description: img.description,
      createdAt: img.createdAt.toISOString(),
    }));
  });

  app.post('/api/homepage-images', async (request, reply) => {
    const body = request.body;
    
    const image = await prisma.homepageImage.create({
      data: {
        url: body.url,
        title: body.title || null,
        description: body.description || null,
      },
    });

    reply.status(201);
    return {
      id: image.id,
      url: image.url,
      title: image.title,
      description: image.description,
      createdAt: image.createdAt.toISOString(),
    };
  });

  app.get('/api/homepage-images/:id', async (request, reply) => {
    const { id } = request.params;
    const image = await prisma.homepageImage.findUnique({ where: { id } });
    
    if (!image) {
      reply.status(404);
      return { error: 'Image not found' };
    }

    return {
      id: image.id,
      url: image.url,
      title: image.title,
      description: image.description,
      createdAt: image.createdAt.toISOString(),
    };
  });

  app.put('/api/homepage-images/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body;

    try {
      const image = await prisma.homepageImage.update({
        where: { id },
        data: {
          url: body.url !== undefined ? body.url : undefined,
          title: body.title !== undefined ? body.title : undefined,
          description: body.description !== undefined ? body.description : undefined,
        },
      });

      return {
        id: image.id,
        url: image.url,
        title: image.title,
        description: image.description,
        createdAt: image.createdAt.toISOString(),
      };
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Image not found' };
      }
      throw error;
    }
  });

  app.delete('/api/homepage-images/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.homepageImage.delete({ where: { id } });
      reply.status(204);
      return;
    } catch (error) {
      if (error.code === 'P2025') {
        reply.status(404);
        return { error: 'Image not found' };
      }
      throw error;
    }
  });

  return app;
};

export default createApp;
