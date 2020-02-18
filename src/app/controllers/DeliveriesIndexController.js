import Deliveryman from '../models/Courier';
import Delivery from '../models/Order';
import Recipient from '../models/Recipient';
import File from '../models/File';

class DeliveriesIndexController {
  async index(req, res) {
    const { id } = req.params;

    const deliverymanExist = await Deliveryman.findByPk(id);

    if (!deliverymanExist) {
      return res.status(400).json({ error: 'Deliveryman not found.' });
    }

    const deliveries = await Delivery.findAll({
      attributes: ['id', 'product', 'start_date', 'canceled_at', 'end_date'],
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
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
          model: File,
          as: 'signature',
          attributes: ['url', 'name', 'path'],
        },
      ],
      where: {
        deliveryman_id: id,
        canceled_at: null,
        end_date: null,
      },
      order: ['start_date', 'id'],
      limit: 20,
    });
    return res.json(deliveries);
  }
}
export default new DeliveriesIndexController();
