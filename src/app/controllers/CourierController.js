import * as Yup from 'yup';
import Courier from '../models/Courier';

class CourierController {
  async index(req, res) {
    const couriers = await Courier.findAll();
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

    const courierExists = await Courier.findOne({
      where: { name: req.body.name },
    });

    if (courierExists) {
      return res.status(400).json({ error: 'Courier already exists' });
    }

    const { id, name, email } = await Courier.create(req.body);

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

    const courier = await Courier.findByPk(id);

    if (!courier) {
      return res.status(400).json({ error: 'The ID doesn not existis' });
    }

    const { name, email } = await courier.update(req.body);

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

    const courier = await Courier.findByPk(id);

    if (!courier) {
      return res.status(400).json({ error: 'The ID doesn not existis' });
    }

    await courier.destroy(req.body);

    return res.json({
      ok: 'The Delivery man was deleted.',
    });
  }
}

export default new CourierController();
