import { Router } from 'express';
import { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  exportUsers
} from './userController.js';

const router = Router();

router.get('/', getUsers);
router.get('/export', exportUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
