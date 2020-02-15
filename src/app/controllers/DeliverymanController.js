import * as Yup from 'yup';
import DeliveryMan from '../models/Courier';
import File from '../models/File';

class DeliverymanController {
  async index(req, res) {
    const couriers = await DeliveryMan.findAll({
      attributes: ['id', 'name', 'email', 'avatar_id'],
      includes: [File],
    });
    return res.json(couriers);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const courierExists = await DeliveryMan.findOne({
      where: { name: req.body.name },
    });

    if (courierExists) {
      return res.status(400).json({ error: 'Courier already exists' });
    }

    const { id, name, email } = await DeliveryMan.create(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Check all the fields' });
    }

    const { id } = req.params;

    const deliveryman = await DeliveryMan.findByPk(id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'The ID doesn not existis' });
    }

    const { name, email } = await deliveryman.update(req.body);

    return res.json({
      name,
      email,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    // const schema = Yup.object().shape({
    //   id: Yup.number()
    //     .required()
    //     .min(1),
    // });

    // if (!(await schema.isValid(req.body))) {
    //   return res.status(400).json({ error: 'Validation fails.' });
    // }

    const deliveryman = await DeliveryMan.findByPk(id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'The ID doesn not existis' });
    }

    await deliveryman.destroy(req.body);

    return res.json({
      ok: 'The Delivery man was deleted.',
    });
  }
}

export default new DeliverymanController();
