import oracledb from "oracledb";

const ORACLE_CLIENT_PATH = process.env.ORACLE_CLIENT_PATH;
const HYDRA_ORACLE_USER = process.env.HYDRA_ORACLE_USER;
const HYDRA_ORACLE_PASSWORD = process.env.HYDRA_ORACLE_PASSWORD;
const HYDRA_ORACLE_CONNECT_STRING = process.env.HYDRA_ORACLE_CONNECT_STRING;

oracledb.initOracleClient({ libDir: ORACLE_CLIENT_PATH });

export default async function getBalances(accountIds) {
  let connection;
  
  try {
    connection = await oracledb.getConnection({
      user: HYDRA_ORACLE_USER,
      password: HYDRA_ORACLE_PASSWORD,
      connectString: HYDRA_ORACLE_CONNECT_STRING,
    });
    
    const numberTableType = await connection.getDbObjectClass('NUMBER_TABLE');
    
    const oracleArray = new numberTableType();
    for (const id of accountIds) {
      if (!!id) {
        oracleArray.append(Number(id));
      }
    }
    
    
    const result = await connection.execute(
      `SELECT COLUMN_VALUE AS account_id,
              SI_USERS_PKG_S.GET_ACCOUNT_BALANCE_SUM(COLUMN_VALUE, NULL) AS balance
       FROM TABLE(:account_ids)`,
      {
        account_ids: {
          type: numberTableType,
          val: oracleArray
        }
      }
    );
    
    return result.rows;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}
