import { sendWorkshopPaid } from '../../../../utils/workshop';

export default {
  /** UPI: you set the payment to "paid" in Strapi, so the customer hears about it once. */
  async afterUpdate(event: any) {
    const r = event.result;
    if (!r || !r.email) return;
    if (r.paymentMethod === 'upi_manual' && r.paymentStatus === 'paid' && !r.paidEmailSentAt) {
      await sendWorkshopPaid(strapi, r);
    }
  },
};
