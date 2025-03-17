export const ERROR_MESSAGES = {
  "SQLITE_CONSTRAINT: UNIQUE constraint failed: reasons.title": "Запись с таким значением уже сущесвует",
  "SQLITE_CONSTRAINT: FOREIGN KEY constraint failed": "Отсутсвует родительское значение"
}

export const initialGetCardsSql = `
  select
   C.id,
   C.ls_abon,
   C.created_at,
   C.spec_full_name,
   C.sip,
   C.full_name,
   C.phone_number,
   C.address,
   C.comment,
   R.title as reason, S.title as solution from cards as C
  left join reasons as R on R.id = C.reason_id
  left join solutions as S on S.id = C.solution_id
`;
