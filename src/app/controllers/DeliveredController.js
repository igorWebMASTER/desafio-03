import * as Yup from 'yup';
import { parseISO, startOfHour, isBefore } from 'date-fns';

import Deliveryman from '../models/Courier';
import Delivery from '../models/Order';
import Recipient from '../models/Recipient';
import File from '../models/File';

class DeliveredController {
  async update(req, res) {
    const schema = Yup.object().shape({
      end_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Check the start date.' });
    }
    const { deliveryman_id, delivery_id } = req.params;

    const { end_date } = req.body;

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

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found' });
    }
    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman not found' });
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

    const parsedDate = startOfHour(parseISO(end_date));
    // const hour = getHours(parsedDate);

    if (isBefore(parsedDate, delivery.start_date)) {
      return res
        .status(400)
        .json({ error: 'The end date should be after the start date' });
    }

    // if (!req.file) {
    //   return res.status(400).json({
    //     error: 'The signature file from recipient should be attached',
    //   });
    // }

    // const { originalname: name, filename: path } = req.file;

    // const file = await File.create({
    //   name,
    //   path,
    // });

    await delivery.update({
      end_date,
      // signature_id: file.id,
    });

    await delivery.reload({
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
    });

    return res.json({ delivery });
  }
}

export default new DeliveredController();
