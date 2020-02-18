import * as Yup from 'yup';
import {
  parseISO,
  getHours,
  startOfDay,
  startOfHour,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';

import Deliveryman from '../models/Courier';
import Delivery from '../models/Order';
import Recipient from '../models/Recipient';
import File from '../models/File';

class WithdrawDeliveryController {
  async update(req, res) {
    const schema = Yup.object().shape({
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Check the start date.' });
    }
    const { deliveryman_id, delivery_id } = req.params;

    const { start_date } = req.body;

    const delivery = await Delivery.findByPk(delivery_id, {
      attributes: [
        'id',
        'recipient_id',
        'deliveryman_id',
        'product',
        'start_date',
      ],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'complement',
            'state',
            'city',
            'cep',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
      ],
    });

    const deliverymanExist = await Deliveryman.findByPk(deliveryman_id);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found.' });
    }

    if (!deliverymanExist) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    if (deliveryman_id != delivery.deliveryman_id) {
      return res.status(401).json({
        error: `This delivery ${delivery_id} is not assigned to you  `,
      });
    }
    if (delivery.canceled_at) {
      return res
        .status(400)
        .json({ error: 'This delivery is already cancelled' });
    }
    if (delivery.end_date) {
      return res.status(400).json({ error: 'This delivery is already closed' });
    }
    if (delivery.start_date) {
      return res
        .status(400)
        .json({ error: 'This delivery has already withdrawn' });
    }

    const parsedDate = startOfHour(parseISO(start_date));
    const hour = getHours(parsedDate);

    if (hour < 8 || hour > 18) {
      return res
        .status(400)
        .json({ error: 'The start date must be between at 08:00 to 18:00' });
    }
    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id,
        start_date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
    });

    if (deliveries.length >= 5) {
      return res.status(401).json({
        error: 'Deliveryman already has withdraw 5 deliveries on the day',
      });
    }

    await delivery.update(start_date);

    return res.json({ delivery });
  }
}

export default new WithdrawDeliveryController();
