import * as Yup from 'yup';

import Deliveryman from '../models/Courier';
import Delivery from '../models/Order';
import Recipient from '../models/Recipient';
import File from '../models/File';
import DeliveryProblem from '../models/DeliveryProblems';

class DeliveryProblemController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const allProblems = await DeliveryProblem.findAll({
      limit: 10,
      offset: (page - 1) * 20,
      order: ['created_at', 'updated_at'],
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
    return res.json({ allProblems });
  }

  async show(req, res) {
    const { page = 1 } = req.query;
    const { deliveryId } = req.params;
    const problemById = await DeliveryProblem.findByPk(deliveryId, {
      limit: 10,
      offset: (page - 1) * 20,
      order: ['created_at', 'updated_at'],
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
    return res.json({ problemById });
  }

  async store(req, res) {
    // const schema = Yup.object().shape({
    //   description: Yup.string().required(),
    // });

    // if (!(await schema.isValid())) {
    //   return res.status(400).json({ error: 'Check the description' });
    // }

    const { delivery_id, deliveryman_id } = req.params;

    const { description } = req.body;

    const delivery = await Delivery.findByPk(delivery_id, {
      attributes: [
        'id',
        'product',
        'deliveryman_id',
        'canceled_at',
        'start_date',
        'end_date',
      ],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['id', 'name', 'street', 'complement', 'cep', 'city'],
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
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });
    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found' });
    }
    if (deliveryman_id != delivery.deliveryman_id) {
      return res
        .status(401)
        .json({ error: 'This delivery is not assigned to you' });
    }
    if (delivery.canceled_at) {
      return res
        .status(400)
        .json({ error: 'This delivery is already cancelled' });
    }
    if (delivery.end_date) {
      return res.status(400).json({ error: 'This delivery is already closed' });
    }
    if (!delivery.start_date) {
      return res
        .status(400)
        .json({ error: 'This delivery has not yet been withdrawn' });
    }

    const deliveryExists = await Recipient.findAll({
      where: { id: delivery_id },
    });

    // const deliverymanExist = await Deliveryman.create(delivery_id, description);

    if (!deliveryExists) {
      return res.status(400).json({ error: 'Delivery not found.' });
    }

    // if (deliveryman_id != delivery.deliveryman_id) {
    //   return res.status(401).json({
    //     error: `This delivery ${delivery_id} is not assigned to you  `,
    //   });
    // }
    if (deliveryExists.canceled_at) {
      return res.status(400).json({ error: 'This delivery is cancelled' });
    }

    await DeliveryProblem.create({
      delivery_id,
      description,
    });

    await Deliveryman.reload({
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['product', 'start_date', 'end_date', 'canceled_at'],
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                'name',
                'street',
                'number',
                'zip_code',
                'complement',
                'state',
                'city',
              ],
            },
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
              model: File,
              as: 'signature',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
      ],
    });
    return res.json(DeliveryProblem);
  }
}

export default new DeliveryProblemController();
