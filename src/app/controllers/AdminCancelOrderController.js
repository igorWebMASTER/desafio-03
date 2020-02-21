import * as Yup from 'yup';

import Deliveryman from '../models/Courier';
import Delivery from '../models/Order';
import Recipient from '../models/Recipient';
import File from '../models/File';
import DeliveryProblems from '../models/DeliveryProblems';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class AdminCancelOrderController {
  async update(req, res) {
    const schema = Yup.object().shape({
      problem_id: Yup.number(),
    });

    if (!(await schema.isValid(req.params))) {
      return res.status(400).json({ error: 'Validations fails' });
    }

    const { problem_id } = req.params;

    const deliveryProblem = await DeliveryProblems.findByPk(problem_id, {
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: [
            'id',
            'recipient_id',
            'deliveryman_id',
            'product',
            'canceled_at',
            'start_date',
            'end_date',
            'signature_id',
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
                  attributes: ['id', 'name', 'path', 'url'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!deliveryProblem) {
      return res.status(400).json({ error: 'Delivery not found' });
    }

    if (deliveryProblem.canceled_at) {
      return res
        .status(400)
        .json({ error: 'This delivery is already cancelled' });
    }

    const { id } = deliveryProblem.delivery;
    const delivery = await Delivery.findByPk(id, {
      attributes: [
        'id',
        'recipient_id',
        'deliveryman_id',
        'product',
        'canceled_at',
        'start_date',
        'end_date',
      ],
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url'],
            },
          ],
        },
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
      ],
    });
    const { canceled_at } = delivery;
    const date = new Date();

    await delivery.update({ canceled_at: date });

    await Queue.add(CancellationMail.key, {
      delivery,
    });

    return res.json(delivery);
  }
}

export default new AdminCancelOrderController();
