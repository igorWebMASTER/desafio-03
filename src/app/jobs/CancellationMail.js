import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { delivery } = data;

    await Mail.sendMail({
      to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}`,
      subject: 'Entrega Cancelada',
      template: 'cancellation',
      context: {
        deliveryman: delivery.deliveryman.name,
        order: delivery.product,
        date: format(
          parseISO(delivery.canceled_at),
          "'dia' dd 'de' MMMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new CancellationMail();
