import * as Yup from 'yup';
import pt from 'date-fns/locale/pt';
import Delivery from '../models/Order';
import DeliveryProblems from '../models/DeliveryProblems';

class AdminCancelOrderController {
  async update(req, res) {
    const { problem_id } = req.params;

    const deliveryProblem = await DeliveryProblems.findByPk(problem_id, {
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: [
            'id',
            'product',
            'canceled_at',
            'start_date',
            'end_date',
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
    });

    const date = new Date();
    await delivery.update({ canceled_at: date });
    return res.json(delivery);
  }
}

export default new AdminCancelOrderController();
