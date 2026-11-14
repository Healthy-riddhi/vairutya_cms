import { errors } from '@strapi/utils';
import { sendConsultationConfirmed } from '../../../../utils/consultation';

const UID = 'api::consultation-request.consultation-request';

export default {
  /** Refuse to confirm a slot that is already confirmed for someone else. */
  async beforeUpdate(event: any) {
    if (!event.params?.where) return;
    const cur: any = await strapi.db.query(UID).findOne({ where: event.params.where });
    if (!cur) return;
    const m = { ...cur, ...(event.params.data ?? {}) };
    if (m.requestStatus !== 'confirmed') return;

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(m.slot))) {
      throw new errors.ApplicationError(`The slot must be a 24-hour time like 14:30 (it is "${m.slot}").`);
    }
    const clash: any = await strapi.db.query(UID).findOne({
      where: { requestStatus: 'confirmed', date: m.date, slot: m.slot, id: { $ne: cur.id } },
    });
    if (clash) {
      throw new errors.ApplicationError(
        `${clash.reference} is already confirmed for ${String(m.date).slice(0, 10)} at ${m.slot}. Change the date or time first.`
      );
    }
  },

  /** Emails the customer once, when the status becomes "confirmed". */
  async afterUpdate(event: any) {
    const r = event.result;
    if (!r || r.requestStatus !== 'confirmed' || r.confirmationEmailSentAt || !r.email) return;
    await sendConsultationConfirmed(strapi, r);
  },
};
