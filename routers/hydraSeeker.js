import express from "express";
import axios from 'axios';
import { authorize, token } from "../constants.js";

const hydraSeekerRouter = express();

const abonSeeker = async (query) => {
  try {
    const isPhoneNumber = query.startsWith('996');
    const abons_by_n_result_id = [];
    const search_by_ls = await axios(`https://hydra.snt.kg:8000/rest/v2/search?query=${query}`, {
      headers: {
        Authorization: `Token token=${token}`
      }
    });
    
    const abons_by_vc_section = search_by_ls.data?.search_results?.filter(abon => isPhoneNumber ? abon?.vc_result_subtype === 'SUBJ_TYPE_User' : abon?.vc_section === 'SEARCH_SECTION_Accounts');
    
    if (!abons_by_vc_section.length) return { message: 'Нет результатов' };
    
    if (!!abons_by_vc_section) {
      for (const abon of abons_by_vc_section) {
        const n_result_id = abon?.n_result_id;
        const abonRes = await axios(`https://hydra.snt.kg:8000/rest/v2/subjects/customers/${n_result_id}`, {
          headers: {
            Authorization: `Token token=${token}`
          }
        });
        const n_base_subject_id = abonRes.data.customer?.n_base_subject_id;
        
        const reqToLsAbon = await axios(`https://hydra.snt.kg:8000/rest/v2/subjects/customers/${n_result_id}/accounts/`, {
          headers: {
            Authorization: `Token token=${token}`
          }
        });
        const account_id = reqToLsAbon.data.accounts[0].n_account_id;
        
        const ls_abon = reqToLsAbon.data.accounts[0].vc_account;
        
        const reqToAbonAddress = await axios(`https://hydra.snt.kg:8000/rest/v2/subjects/persons/${n_base_subject_id}/addresses`, {
          headers: {
            Authorization: `Token token=${token}`
          }
        });
        const phone_number = reqToAbonAddress.data.addresses
        .filter(addr => addr.n_addr_type_id === 13006).map(addr => addr.vc_visual_code);
        const address = reqToAbonAddress.data.addresses
        .find(addr => addr.n_addr_type_id === 1006)?.vc_visual_code;
        
        const reqToEquipments = await axios(`https://hydra.snt.kg:8000/rest/v2/subjects/customers/${n_result_id}/equipment/`, {
          headers: {
            Authorization: `Token token=${token}`
          }
        });
        
        const full_name = abonRes.data.customer?.vc_base_subject_name || '-';
        const created_at = abonRes.data.customer?.d_created || '';
        
        if (!reqToEquipments.data.equipment?.length) return { message: 'Отсутсвует оборудрование' }
        
        const device_id = reqToEquipments.data.equipment[0]?.n_object_id;
        
        if (!device_id) return { message: 'Отсутсвует id device_id' }
        
        const get_device_n_object_id = await axios(`https://hydra.snt.kg:8000/rest/v2/objects/net_devices/${device_id}/entries/`, {
          headers: {
            Authorization: `Token token=${token}`
          }
        });
        const entry_id = get_device_n_object_id.data.entries[0]?.n_object_id;
        
        if (!entry_id) return { message: 'Отсутсвует id entry_id' }
        
        const getDeviceInfo = await axios(`https://hydra.snt.kg:8000/rest/v2/objects/net_devices/${device_id}/entries/${entry_id}/addresses/`, {
          headers: {
            Authorization: `Token token=${token}`
          }
        });
        const ip_address = getDeviceInfo.data.addresses[0].vc_code;
        const mac_address = getDeviceInfo.data.addresses[1].vc_code;
        abons_by_n_result_id.push({
          full_name,
          created_at,
          ip_address,
          mac_address,
          ls_abon,
          account_id,
          n_result_id,
          phone_number,
          address,
        });
      }
      return abons_by_n_result_id;
    }
  } catch (e) {
    return {
      message: e.message,
      url: e.config.url,
      status: 403
    };
  }
};

hydraSeekerRouter.get('/:ls_abon', async (req, res) => {
  try {
    const { ls_abon } = req.params;
    let foundAbon = await abonSeeker(ls_abon);
    
    if (foundAbon?.status === 403) {
      console.log("Срок действия токена истёк. Идёт переавторизация...");
      const token = await authorize();
      if (!token) {
        return res.status(500).send("Авторизация не удалась");
      }
      foundAbon = await abonSeeker(ls_abon);
    }
    
    res.status(200).send(foundAbon);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

export default hydraSeekerRouter;
