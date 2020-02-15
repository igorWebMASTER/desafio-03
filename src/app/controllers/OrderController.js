import * as Yup from 'yup';

import Deliveryman from '../models/Courier';
import File from '../models/File';
import Order from '../models/Order';
import Recipient from '../models/Recipient';

class OrderController {
  async index(req, res) {
    const deliveryman = await Order.findAll({
      attributes: ['id', 'product', 'signature_id', 'canceled_at', 'end_date'],
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
      ],
    });
    return res.json(deliveryman);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }
    const { product, deliveryman_id, recipient_id } = req.body;

    const orderExists = await Order.findOne({
      where: { product },
    });

    const recipientExists = await Recipient.findOne({
      where: { id: recipient_id },
    });

    const deliverymanExist = await Deliveryman.findOne({
      where: { id: deliveryman_id },
    });
    if (!deliverymanExist) {
      return res.status(400).json({ error: 'Deliveryman does not exist.' });
    }

    if (!recipientExists) {
      return res.status(400).json({ error: 'Recipient does not exist.' });
    }

    if (orderExists) {
      return res.status(400).json({ error: 'Order already exists' });
    }

    const delivery = await Order.create(req.body);

    return res.json({
      delivery,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      deliveryman_id: Yup.number()
        .integer()
        .required(),
      recipient_id: Yup.number()
        .integer()
        .required(),
      signature_id: Yup.number().integer(),
    });

    const { id } = req.params;

    const { product, deliveryman_id, recipient_id } = req.body;

    const delivery = await Order.findByPk(id);

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Check all the fields' });
    }

    if (recipient_id) {
      const recipient = await Recipient.findByPk(recipient_id);

      if (!recipient) {
        return res.status(400).json({ error: 'Recipient does not found.' });
      }
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(400).json({ error: "The ID doesn't exists" });
    }

    await delivery.update(req.body);

    return res.json({
      id,
      product,
      recipient_id,
      deliveryman_id,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const delivery = await Order.findByPk(id);

    if (!delivery) {
      return res.status(400).json({ error: "Delivery does'n found" });
    }

    if (delivery.start_date) {
      return res.status(400).json({
        error:
          'Cannot delete delivery because delivery has already been initiated',
      });
    }

    await delivery.destroy();

    return res.json({
      ok: 'The Delivery was deleted.',
    });
  }
}

export default new OrderController();
