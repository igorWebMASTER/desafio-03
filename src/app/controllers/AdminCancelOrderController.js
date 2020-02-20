import * as Yup from 'yup';

import pt from 'date-fns/locale/pt';
import { format } from 'date-fns';

import Deliveryman from '../models/Courier';
import Delivery from '../models/Order';
import Recipient from '../models/Recipient';
import File from '../models/File';
import DeliveryProblems from '../models/DeliveryProblems';

import Mail from '../../lib/Mail';

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

    await Mail.sendMail({
      to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}`,
      subject: 'Entrega Cancelada',
      template: 'cancellation',
      context: {
        deliveryman: delivery.deliveryman.name,
        order: delivery.recipient.product,
        date: format(
          delivery.canceled_at,
          "'dia' dd 'de' MMMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
    return res.json(delivery);
  }
}

export default new AdminCancelOrderController();
