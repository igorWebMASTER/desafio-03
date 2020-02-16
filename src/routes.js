import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import DeliverymanController from './app/controllers/DeliverymanController';
import OrderController from './app/controllers/OrderController';
import DeliveriesIndexController from './app/controllers/DeliveriesIndexController';

import RecipientController from './app/controllers/RecipientController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.get('/delivery/:id/deliveries', DeliveriesIndexController.index);

routes.use(authMiddleware);

routes.get('/recipients', RecipientController.index);
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);

routes.put('/users', UserController.update);

routes.post('/files', upload.single('file'), FileController.store);

routes.get('/couriers', DeliverymanController.index);
routes.post('/courier', DeliverymanController.store);
routes.put('/courier/:id', DeliverymanController.update);
routes.delete('/courier/:id', DeliverymanController.delete);

routes.get('/delivery', OrderController.index);
routes.post('/delivery', OrderController.store);
routes.put('/delivery/:id', OrderController.update);
routes.delete('/delivery/:id', OrderController.delete);

export default routes;
