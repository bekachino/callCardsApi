import axios from "axios";
import { BITRIX_ADMIN_ID, BITRIX_INTEGRATOR_ID } from "../constants.js";
import { formatDate } from "./formatDate.js";

const BITRIX_WEBHOOK = 'https://bitrix24.snt.kg/rest/62808/zsqfw5ed1sbr3wbn/';

const get_bitrix_client = async (ls_abon) => {
  try {
    const req = await axios(`${BITRIX_WEBHOOK}/crm.item.list.json?entityTypeId=3&filter[ufCrm_1687325219482]=${ls_abon}`);
    const res = await req.data;
    return res?.result?.items?.[0];
  } catch (e) {
    console.log(e);
  }
};

const createContact = async (abon) => {
  try {
    const bitrix_client = await get_bitrix_client(abon?.ls_abon);
    
    if (!!bitrix_client) {
      return bitrix_client?.id;
    }
    
    const req = await axios.post(`${BITRIX_WEBHOOK}/crm.contact.add`, {
      fields: {
        NAME: abon?.full_name || '',
        ASSIGNED_BY_ID: BITRIX_ADMIN_ID,
        PHONE: (
          abon?.phone_number || []
        ).map(phone_number => (
          {
            "VALUE": phone_number || '',
            "VALUE_TYPE": "WORK"
          }
        )),
        UF_CRM_1687325219482: abon?.ls_abon || '',
        UF_CRM_1687325330978: abon?.address || '',
      }
    });
    return await req.data?.result;
  } catch (e) {
    return {
      success: false,
      error: 'Ошибка при создании контакта в Bitrix24'
    }
  }
};

export const createDeal = async (card) => {
  try {
    const bitrix_client_id = await createContact(card) || null;
    
    console.log(card?.comment);
    
    const dealData = {
      TITLE: `${card?.full_name} ${formatDate()}`,
      CATEGORY_ID: 61, // id тикета
      ASSIGNED_BY_ID: BITRIX_INTEGRATOR_ID, // ответственный
      CONTACT_IDS: [bitrix_client_id],
      UF_CRM_1674993837284: card?.address || '', // адрес
      UF_CRM_1673255771: card?.ls_abon || '',  // лицевой счёт
      UF_CRM_1727672797325: card?.comment, // комментарий
      UF_CRM_1702542393824: `${card?.reason || ''} / ${card?.solution || ''}. Комментарий: ${card?.comment}`, // комментарий
                                                                               // с
                                                                               // карточки
                                                                               // звонка
      UF_CRM_1676350807631: card?.spec_full_name || '', // фио
    };
    
    const response = await axios.post(`${BITRIX_WEBHOOK}/crm.deal.add`, {
      fields: dealData
    });
    
    if (response.data.result) {
      return {
        success: true,
        dealId: response.data.result
      }
    } else {
      return {
        success: false,
        error: response.data
      }
    }
    
  } catch (error) {
    console.error('Ошибка при создании сделки:', error.message);
    return {
      success: false,
      error: 'Ошибка при запросе к Bitrix24'
    }
  }
};
