import prisma from '../../config/db.js';
import bcrypt from 'bcrypt';

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, status, role } = req.query;

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status && status !== 'All') {
      where.status = status.toLowerCase();
    }
    
    if (role && role !== 'All') {
      where.role = role.toLowerCase();
    }

    const [users, total, stats] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      })
    ]);

    const statsObj = {
      total: await prisma.user.count(),
      active: stats.find(s => s.status === 'active')?._count._all || 0,
      inactive: stats.find(s => s.status === 'inactive')?._count._all || 0,
      ban: stats.find(s => s.status === 'ban')?._count._all || 0,
    };

    res.status(200).json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: statsObj
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword, 
        role,
        status: status || 'active'
      }
    });

    // Don't return the password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;
    
    const updateData = { name, email, role, status };
    
    // If password is provided, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const exportUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found to export' });
    }

    // Create CSV header
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined At'];
    const csvRows = [headers.join(',')];

    // Add user rows
    users.forEach(user => {
      const row = [
        user.id,
        `"${user.name}"`, // Quote strings to handle commas
        user.email,
        user.role,
        user.status,
        new Date(user.createdAt).toLocaleDateString()
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    res.status(200).send(csvString);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
